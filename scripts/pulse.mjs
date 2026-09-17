// Builds the "commit pulse" card from the GitHub contribution calendar.
// Replaces third-party streak/activity widgets, which rate-limit or go offline.
//
// Run: GH_TOKEN=... GH_USER=vivekbhadauriyadev node scripts/pulse.mjs [outDir]
// Private contributions only count if "Include private contributions" is on in profile settings.

import { writeFileSync, mkdirSync } from 'node:fs'
import { themes, BLACK, MONO } from './theme.mjs'

const token = process.env.GH_TOKEN
const login = process.env.GH_USER || 'vivekbhadauriyadev'
const outDir = process.argv[2] || 'dist'
if (!token) throw new Error('GH_TOKEN is required')

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-pulse' },
  body: JSON.stringify({ query, variables: { login } }),
})
const json = await res.json()
if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`)

const calendar = json.data.user.contributionsCollection.contributionCalendar
const weeks = calendar.weeks
const days = weeks.flatMap((w) => w.contributionDays)

// Streaks. Today may not have a commit yet, so the current streak can end yesterday.
let longest = 0
let run = 0
for (const d of days) {
  run = d.contributionCount > 0 ? run + 1 : 0
  longest = Math.max(longest, run)
}
let current = 0
let i = days.length - 1
if (days[i]?.contributionCount === 0) i--
for (; i >= 0 && days[i].contributionCount > 0; i--) current++

const best = days.reduce((a, d) => (d.contributionCount > a.contributionCount ? d : a), days[0])
const activeDays = days.filter((d) => d.contributionCount > 0).length

// Quartile levels over non-zero days, same idea as GitHub's own graph.
const counts = days.map((d) => d.contributionCount).filter(Boolean).sort((a, b) => a - b)
const q = (p) => counts[Math.floor((counts.length - 1) * p)] ?? 0
const cuts = [q(0.25), q(0.5), q(0.75)]
const level = (c) => (c === 0 ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4)

const fmt = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function card(t, mode) {
  const id = `p${mode}`
  const W = 1280
  const CELL = 17
  const GAP = 4.5
  const STEP = CELL + GAP
  const gridW = weeks.length * STEP - GAP
  const gx = Math.round((W - gridW) / 2)
  const gy = 250
  const H = Math.round(gy + 7 * STEP + 70)

  const levels = [t.raised, mix(t.green, 0.28, t), mix(t.green, 0.5, t), mix(t.green, 0.75, t), t.green]

  const stats = [
    [calendar.totalContributions.toLocaleString('en-US'), 'contributions · last year'],
    [`${current}d`, 'current streak'],
    [`${longest}d`, 'longest streak'],
    [String(activeDays), 'active days'],
  ]
  const boxW = (W - 128 - 3 * 16) / 4
  const statSvg = stats
    .map(([n, l], k) => {
      const x = 64 + k * (boxW + 16)
      return `<g class="reveal" style="animation-delay:${0.1 + k * 0.08}s">
    <rect x="${x}" y="96" width="${boxW}" height="116" rx="18" fill="${t.card}" stroke="${t.line}"/>
    <text x="${x + 24}" y="160" font-family="${BLACK}" font-weight="900" font-size="46" letter-spacing="-1.5" fill="${k === 0 ? `url(#${id}-signal)` : t.paper}">${n}</text>
    <text x="${x + 24}" y="190" font-family="${MONO}" font-size="12.5" letter-spacing="1" fill="${t.muted}">${l}</text></g>`
    })
    .join('\n  ')

  let monthLabels = ''
  let lastMonth = ''
  const cells = weeks
    .map((w, wi) =>
      w.contributionDays
        .map((d) => {
          const m = d.date.slice(0, 7)
          if (d.weekday === 0 && m !== lastMonth && wi < weeks.length - 2) {
            lastMonth = m
            const name = new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
            monthLabels += `<text x="${gx + wi * STEP}" y="${gy - 12}" font-family="${MONO}" font-size="11.5" fill="${t.faint}">${name}</text>`
          }
          const lv = level(d.contributionCount)
          return `<rect x="${gx + wi * STEP}" y="${gy + d.weekday * STEP}" width="${CELL}" height="${CELL}" rx="4.5" fill="${levels[lv]}"${lv ? ` class="cell" style="animation-delay:${(wi * 0.022).toFixed(3)}s"` : ''}><title>${d.contributionCount} on ${d.date}</title></rect>`
        })
        .join(''),
    )
    .join('\n    ')

  const legend = levels
    .map((c, k) => `<rect x="${W - 106 - (5 - k) * 22 + 7}" y="${H - 44}" width="15" height="15" rx="4" fill="${c}"/>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${calendar.totalContributions} contributions in the last year, current streak ${current} days, longest ${longest} days">
  <title>Commit pulse — ${calendar.totalContributions} contributions in the last year</title>
  <defs>
    <linearGradient id="${id}-signal" x1="0" y1="0" x2="2" y2="0">
      <stop offset="0" stop-color="${t.amber}"/><stop offset="0.25" stop-color="${t.green}"/>
      <stop offset="0.5" stop-color="${t.blue}"/><stop offset="0.75" stop-color="${t.green}"/>
      <stop offset="1" stop-color="${t.amber}"/>
      <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -0.5 0; 0 0" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <style>
    .reveal { opacity: 0; animation: fade-up .9s cubic-bezier(.22,1,.36,1) forwards; }
    @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .cell { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .5s cubic-bezier(.22,1,.36,1) forwards; }
    @keyframes pop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
    .ping { transform-box: fill-box; transform-origin: center; animation: ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
    @keyframes ping { 0% { transform: scale(1); opacity: .7; } 80%,100% { transform: scale(3); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } .reveal, .cell { opacity: 1; } }
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${t.bg}" stroke="${t.line}" stroke-width="1.5"/>

  <circle cx="72" cy="56" r="5" fill="${t.green}" class="ping"/>
  <circle cx="72" cy="56" r="5" fill="${t.green}"/>
  <text x="88" y="61" font-family="${MONO}" font-size="13" letter-spacing="2.6" fill="${t.muted}">COMMIT PULSE · @${login.toUpperCase()}</text>
  <text x="${W - 64}" y="61" text-anchor="end" font-family="${MONO}" font-size="12.5" letter-spacing="1" fill="${t.faint}">best day ${best.contributionCount} · ${fmt(best.date)}</text>

  ${statSvg}

  ${monthLabels}
    ${cells}

  <text x="64" y="${H - 32}" font-family="${MONO}" font-size="11.5" fill="${t.faint}">updated ${fmt(new Date().toISOString().slice(0, 10))} · refreshed every 12h</text>
  <text x="${W - 106 - 5 * 22 - 2}" y="${H - 32}" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.faint}">less</text>
  ${legend}
  <text x="${W - 64}" y="${H - 32}" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.faint}">more</text>
</svg>
`
}

// Blend a hex colour toward the card background, so the ramp works on both themes.
function mix(hex, amount, t) {
  const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
  const a = toRgb(hex)
  const b = toRgb(t.raised)
  return `#${a.map((v, k) => Math.round(b[k] + (v - b[k]) * amount).toString(16).padStart(2, '0')).join('')}`
}

mkdirSync(outDir, { recursive: true })
for (const [mode, t] of Object.entries(themes)) writeFileSync(`${outDir}/pulse-${mode}.svg`, card(t, mode))
console.log(`pulse: ${calendar.totalContributions} contributions, streak ${current}/${longest}, ${activeDays} active days`)
