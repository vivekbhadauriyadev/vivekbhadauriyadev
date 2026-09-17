// Generates the animated SVGs used by README.md, one dark + one light copy each.
// Run: node scripts/build.mjs
//
// GitHub serves README images through its camo proxy as <img>, so every SVG has to
// be self-contained: no web fonts, no scripts. CSS keyframes + SMIL do animate.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { themes, SANS, BLACK, SERIF, MONO } from './theme.mjs'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')
mkdirSync(out, { recursive: true })

// Shared defs: signal gradient (animated like the portfolio's .text-signal),
// dot grid, edge stripes, glow filter.
const defs = (t, id) => `
  <defs>
    <linearGradient id="${id}-signal" x1="0" y1="0" x2="2" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="${t.amber}"/>
      <stop offset="0.25" stop-color="${t.green}"/>
      <stop offset="0.5" stop-color="${t.blue}"/>
      <stop offset="0.75" stop-color="${t.green}"/>
      <stop offset="1" stop-color="${t.amber}"/>
      <animateTransform attributeName="gradientTransform" type="translate"
        values="0 0; -0.5 0; 0 0" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="${id}-route" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.amber}"/>
      <stop offset="0.5" stop-color="${t.green}"/>
      <stop offset="1" stop-color="${t.blue}"/>
    </linearGradient>
    <pattern id="${id}-dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="${t.dot}"/>
    </pattern>
    <pattern id="${id}-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="4" height="10" fill="${t.stripe}"/>
    </pattern>
    <radialGradient id="${id}-fade" cx="0.5" cy="0.5" r="0.65">
      <stop offset="0.35" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-glowblue"><stop offset="0" stop-color="${t.blue}" stop-opacity="${t.glow * 0.3}"/><stop offset="1" stop-color="${t.blue}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-glowamber"><stop offset="0" stop-color="${t.amber}" stop-opacity="${t.glow * 0.2}"/><stop offset="1" stop-color="${t.amber}" stop-opacity="0"/></radialGradient>
    <mask id="${id}-fademask"><rect width="100%" height="100%" fill="url(#${id}-fade)"/></mask>
    <filter id="${id}-glow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`

const baseStyle = `
    .reveal { opacity: 0; animation: fade-up .9s cubic-bezier(.22,1,.36,1) forwards; }
    @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.4s cubic-bezier(.22,1,.36,1) .3s forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .road-dash { animation: dash 1.6s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -28; } }
    .ping { transform-box: fill-box; transform-origin: center; animation: ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
    @keyframes ping { 0% { transform: scale(1); opacity: .7; } 80%,100% { transform: scale(3); opacity: 0; } }
    .bob { animation: bob 4s ease-in-out infinite; }
    @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .blink { animation: blink 1.1s steps(1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; }
      .reveal { opacity: 1; }
      .draw { stroke-dashoffset: 0; }
    }`

// Bus marker that rides a path. SMIL animateMotion, rotates with the road.
const bus = (t, id, pathId, dur, begin = '0s') => `
    <g>
      <animateMotion dur="${dur}" begin="${begin}" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
        <mpath href="#${pathId}"/>
      </animateMotion>
      <circle r="16" fill="${t.green}" opacity="${t.glow * 0.5}" filter="url(#${id}-glow)"/>
      <rect x="-13" y="-8" width="26" height="16" rx="5" fill="${t.amber}"/>
      <rect x="4" y="-5.5" width="6" height="11" rx="1.5" fill="${t.bg}" opacity=".85"/>
      <rect x="-9" y="-5.5" width="10" height="4" rx="1" fill="${t.bg}" opacity=".55"/>
      <rect x="-9" y="1.5" width="10" height="4" rx="1" fill="${t.bg}" opacity=".55"/>
    </g>`

function header(t, mode) {
  const id = `h${mode}`
  const W = 1280
  const H = 460
  const route = 'M -40 392 C 180 392 250 300 430 318 S 720 420 900 330 S 1130 170 1320 190'
  const stops = [
    [430, 318],
    [900, 330],
  ]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vivek Bhadauriya — Software Engineer, Mobile, Backend and AI">
  <title>Vivek Bhadauriya — Software Engineer · Mobile · Backend · AI</title>
  ${defs(t, id)}
  <style>${baseStyle}</style>

  <clipPath id="${id}-clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28"/></clipPath>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${t.bg}"/>

  <g clip-path="url(#${id}-clip)">
    <rect width="${W}" height="${H}" fill="url(#${id}-dots)" mask="url(#${id}-fademask)"/>
    <rect x="0" y="0" width="34" height="${H}" fill="url(#${id}-stripes)"/>
    <rect x="${W - 34}" y="0" width="34" height="${H}" fill="url(#${id}-stripes)"/>
    <line x1="34" y1="0" x2="34" y2="${H}" stroke="${t.line}"/>
    <line x1="${W - 34}" y1="0" x2="${W - 34}" y2="${H}" stroke="${t.line}"/>

    <ellipse cx="980" cy="130" rx="420" ry="220" fill="url(#${id}-glowblue)"/>
    <ellipse cx="250" cy="380" rx="380" ry="170" fill="url(#${id}-glowamber)"/>

    <!-- bus route motif -->
    <path id="${id}-road" d="${route}" fill="none"/>
    <path d="${route}" fill="none" stroke="${t.lineStrong}" stroke-width="26" stroke-linecap="round" opacity=".55"/>
    <path d="${route}" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="14 14" class="road-dash" opacity=".6"/>
    <path d="${route}" pathLength="1" fill="none" stroke="url(#${id}-route)" stroke-width="3" stroke-linecap="round" class="draw" opacity=".9"/>
    ${stops
      .map(
        ([x, y]) => `
    <circle cx="${x}" cy="${y}" r="7" fill="${t.green}" class="ping"/>
    <circle cx="${x}" cy="${y}" r="7" fill="${t.bg}" stroke="${t.green}" stroke-width="3"/>`,
      )
      .join('')}
    ${bus(t, id, `${id}-road`, '11s', '1.2s')}
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="none" stroke="${t.line}" stroke-width="1.5"/>

  <!-- top row -->
  <g class="reveal" style="animation-delay:.05s">
    <rect x="72" y="46" width="266" height="38" rx="19" fill="${t.card}" stroke="${t.line}"/>
    <circle cx="96" cy="65" r="5" fill="${t.green}" class="ping"/>
    <circle cx="96" cy="65" r="5" fill="${t.green}"/>
    <text x="112" y="70" font-family="${MONO}" font-size="13" letter-spacing="1.6" fill="${t.paper}">OPEN TO FREELANCE</text>
    <text x="${W - 72}" y="62" text-anchor="end" font-family="${MONO}" font-size="12.5" letter-spacing="2.4" fill="${t.muted}">SOFTWARE ENGINEER</text>
    <text x="${W - 72}" y="82" text-anchor="end" font-family="${MONO}" font-size="12.5" font-weight="700" letter-spacing="2.4" fill="${t.green}">MOBILE · BACKEND · AI</text>
  </g>

  <!-- name -->
  <g class="reveal" style="animation-delay:.2s">
    <text x="64" y="252" font-family="${BLACK}" font-weight="900" font-size="186" letter-spacing="-7" textLength="690" lengthAdjust="spacingAndGlyphs" fill="${t.paper}">VIVEK</text>
  </g>
  <g class="reveal" style="animation-delay:.45s">
    <text x="784" y="248" font-family="${SERIF}" font-style="italic" font-size="104" textLength="430" lengthAdjust="spacingAndGlyphs" fill="url(#${id}-signal)">Bhadauriya</text>
  </g>

  <!-- tagline -->
  <g class="reveal" style="animation-delay:.7s">
    <text x="70" y="298" font-family="${MONO}" font-size="15" letter-spacing="5.5" fill="${t.muted}">I SHIP SYSTEMS THAT RUN IN PRODUCTION —</text>
    <text x="70" y="342" font-family="${SERIF}" font-style="italic" font-size="38" fill="${t.paper}">not prototypes.</text>
  </g>

  <!-- corners -->
  <g class="reveal" style="animation-delay:.9s">
    <path d="M78 398 c0 -8 6 -14 14 -14 s14 6 14 14 c0 10 -14 22 -14 22 s-14 -12 -14 -22z" fill="none" stroke="${t.amber}" stroke-width="2.2"/>
    <circle cx="92" cy="398" r="4" fill="${t.amber}"/>
    <text x="120" y="400" font-family="${MONO}" font-size="12.5" font-weight="700" letter-spacing="2" fill="${t.paper}">MAINPURI, INDIA</text>
    <text x="120" y="419" font-family="${MONO}" font-size="12.5" letter-spacing="2" fill="${t.muted}">REMOTE · WORLDWIDE</text>

    <text x="${W - 72}" y="400" text-anchor="end" font-family="${MONO}" font-size="12.5" font-weight="700" letter-spacing="2" fill="${t.paper}">FOUNDER, CVIANT TECHNOLOGIES</text>
    <text x="${W - 72}" y="419" text-anchor="end" font-family="${MONO}" font-size="12.5" letter-spacing="2" fill="${t.muted}">BUILDING SCHOOLTRACIFY</text>
  </g>
</svg>
`
}

function featured(t, mode) {
  const id = `f${mode}`
  const W = 1280
  const H = 560

  const chips = ['Android · Java', 'Firebase', 'Cloud Functions', 'Next.js', 'Google Maps', 'Razorpay', 'RFID']
  let cx = 64
  let cy = 452
  const chipSvg = chips
    .map((c, i) => {
      const w = c.length * 8.4 + 30
      if (cx + w > 640) {
        cx = 64
        cy += 44
      }
      const g = `<g class="reveal" style="animation-delay:${0.9 + i * 0.06}s">
      <rect x="${cx}" y="${cy}" width="${w}" height="32" rx="16" fill="${t.raised}" stroke="${t.line}"/>
      <text x="${cx + w / 2}" y="${cy + 21}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${t.paper}">${c}</text></g>`
      cx += w + 10
      return g
    })
    .join('\n    ')

  const stats = [
    ['35+', 'paying institutions'],
    ['4', 'roles, one build'],
    ['0', 'GPS hardware per bus'],
  ]
  const statSvg = stats
    .map(
      ([n, l], i) => `<g class="reveal" style="animation-delay:${0.6 + i * 0.1}s">
      <rect x="${64 + i * 196}" y="318" width="182" height="104" rx="18" fill="${t.card}" stroke="${t.line}"/>
      <text x="${86 + i * 196}" y="374" font-family="${BLACK}" font-weight="900" font-size="44" letter-spacing="-1.5" fill="${i === 0 ? `url(#${id}-signal)` : t.paper}">${n}</text>
      <text x="${86 + i * 196}" y="402" font-family="${MONO}" font-size="12" fill="${t.muted}">${l}</text></g>`,
    )
    .join('\n    ')

  // Phone map (inside the right panel)
  const PX = 842
  const PY = 70
  const mapRoute = `M ${PX + 40} ${PY + 390} C ${PX + 40} ${PY + 320} ${PX + 190} ${PY + 330} ${PX + 190} ${PY + 260} S ${PX + 130} ${PY + 190} ${PX + 172} ${PY + 150}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="SchoolTracify — multi-tenant school platform, live in production">
  <title>SchoolTracify — live in production, 35+ paying institutions</title>
  ${defs(t, id)}
  <defs>
    <linearGradient id="${id}-panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFC53D"/>
      <stop offset="0.55" stop-color="#FF9A1F"/>
      <stop offset="1" stop-color="#E4570E"/>
    </linearGradient>
    <radialGradient id="${id}-blob" cx="0.2" cy="0.1" r="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}-pdots" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.3" fill="#fff" opacity=".22"/>
    </pattern>
    <clipPath id="${id}-panelclip"><rect x="704" y="32" width="544" height="496" rx="24"/></clipPath>
    <clipPath id="${id}-screen"><rect x="${PX + 10}" y="${PY + 10}" width="240" height="420" rx="30"/></clipPath>
  </defs>
  <style>${baseStyle}</style>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${t.bg}" stroke="${t.line}" stroke-width="1.5"/>

  <!-- copy -->
  <g class="reveal" style="animation-delay:.05s">
    <circle cx="72" cy="68" r="5" fill="${t.green}" class="ping"/>
    <circle cx="72" cy="68" r="5" fill="${t.green}"/>
    <text x="88" y="73" font-family="${MONO}" font-size="13" letter-spacing="2.6" fill="${t.muted}">FEATURED · LIVE IN PRODUCTION</text>
  </g>
  <g class="reveal" style="animation-delay:.15s">
    <text x="60" y="148" font-family="${BLACK}" font-weight="900" font-size="72" letter-spacing="-3" fill="${t.paper}">SchoolTracify</text>
  </g>
  <g class="reveal" style="animation-delay:.28s">
    <text x="64" y="200" font-family="${SERIF}" font-style="italic" font-size="44" fill="url(#${id}-signal)">school runs, stress-free.</text>
  </g>
  <g class="reveal" style="animation-delay:.4s" font-family="${SANS}" font-size="19" fill="${t.muted}">
    <text x="64" y="250">Multi-tenant school ERP with live bus tracking, fees,</text>
    <text x="64" y="276">RFID attendance and four role-based apps.</text>
    <text x="64" y="302" fill="${t.paper}">Built solo — every layer, app to infrastructure.</text>
  </g>
  ${statSvg}
  ${chipSvg}

  <!-- panel -->
  <g clip-path="url(#${id}-panelclip)">
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-panel)"/>
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-pdots)"/>
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-blob)"/>
    <circle cx="1210" cy="520" r="200" fill="#7a2300" opacity=".25"/>

    <!-- phone -->
    <g>
      <rect x="${PX}" y="${PY}" width="260" height="440" rx="38" fill="#0b0b0d"/>
      <rect x="${PX + 3}" y="${PY + 3}" width="254" height="434" rx="36" fill="none" stroke="#2a2a2e" stroke-width="2"/>
      <g clip-path="url(#${id}-screen)">
        <rect x="${PX + 10}" y="${PY + 10}" width="240" height="420" fill="#eef1ec"/>
        <!-- streets -->
        <g stroke="#fff" stroke-width="10" opacity=".95">
          <line x1="${PX}" y1="${PY + 120}" x2="${PX + 260}" y2="${PY + 150}"/>
          <line x1="${PX}" y1="${PY + 300}" x2="${PX + 260}" y2="${PY + 270}"/>
          <line x1="${PX + 120}" y1="${PY}" x2="${PX + 140}" y2="${PY + 440}"/>
          <line x1="${PX + 210}" y1="${PY}" x2="${PX + 200}" y2="${PY + 440}"/>
        </g>
        <rect x="${PX + 20}" y="${PY + 160}" width="80" height="60" rx="8" fill="#d6ead9"/>
        <rect x="${PX + 150}" y="${PY + 320}" width="44" height="70" rx="8" fill="#dfe6f0"/>
        <path id="${id}-map" d="${mapRoute}" fill="none"/>
        <path d="${mapRoute}" fill="none" stroke="#3DDC97" stroke-width="7" stroke-linecap="round" opacity=".35"/>
        <path d="${mapRoute}" pathLength="1" fill="none" stroke="#0ea86b" stroke-width="4" stroke-linecap="round" class="draw"/>
        <circle cx="${PX + 40}" cy="${PY + 390}" r="7" fill="#fff" stroke="#0ea86b" stroke-width="3"/>
        <circle cx="${PX + 190}" cy="${PY + 262}" r="7" fill="#fff" stroke="#0ea86b" stroke-width="3"/>
        <g transform="translate(${PX + 172} ${PY + 150})">
          <circle r="12" fill="#3DA9FC" class="ping"/>
          <circle r="11" fill="#fff" stroke="#3DA9FC" stroke-width="4"/>
        </g>
        <g>
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}-map"/></animateMotion>
          <circle r="15" fill="#FFC53D" opacity=".35"/>
          <rect x="-11" y="-7" width="22" height="14" rx="4" fill="#FF9A1F" stroke="#fff" stroke-width="2"/>
        </g>
        <!-- top bar -->
        <rect x="${PX + 10}" y="${PY + 10}" width="240" height="74" fill="#FFC53D"/>
        <text x="${PX + 28}" y="${PY + 44}" font-family="${SANS}" font-size="12" font-weight="600" fill="#5a3a00">Route 07 · Morning</text>
        <text x="${PX + 28}" y="${PY + 68}" font-family="${SANS}" font-size="19" font-weight="800" fill="#1a1200">Arriving in 4 min</text>
        <!-- driver sheet -->
        <rect x="${PX + 22}" y="${PY + 336}" width="116" height="80" rx="14" fill="#fff"/>
        <text x="${PX + 34}" y="${PY + 360}" font-family="${SANS}" font-size="10.5" fill="#6b6b70">Stop progress</text>
        <text x="${PX + 34}" y="${PY + 384}" font-family="${SANS}" font-size="18" font-weight="800" fill="#0b0b0d">3 / 8</text>
        <rect x="${PX + 34}" y="${PY + 396}" width="92" height="6" rx="3" fill="#e6e6e9"/>
        <rect x="${PX + 34}" y="${PY + 396}" width="35" height="6" rx="3" fill="#0ea86b"/>
      </g>
      <rect x="${PX + 100}" y="${PY + 18}" width="60" height="16" rx="8" fill="#0b0b0d"/>
    </g>

    <!-- floating notification cards -->
    <g class="bob">
      <rect x="724" y="206" width="232" height="70" rx="16" fill="#fff" opacity=".97"/>
      <rect x="738" y="220" width="42" height="42" rx="12" fill="#0ea86b"/>
      <path d="M750 241 l7 7 l13 -14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="792" y="237" font-family="${SANS}" font-size="13.5" font-weight="700" fill="#0b0b0d">Aarav boarded the bus</text>
      <text x="792" y="257" font-family="${SANS}" font-size="12" fill="#6b6b70">RFID · 7:42 AM</text>
    </g>
    <g class="bob" style="animation-delay:-2s">
      <rect x="1058" y="360" width="172" height="96" rx="16" fill="#0b0b0d" opacity=".92"/>
      <text x="1076" y="390" font-family="${MONO}" font-size="11" letter-spacing="1.2" fill="#8b8b92">FEES · THIS MONTH</text>
      <text x="1076" y="424" font-family="${BLACK}" font-weight="900" font-size="28" fill="#fff">92%</text>
      <text x="1150" y="424" font-family="${SANS}" font-size="12" fill="#3DDC97">collected</text>
      <rect x="1076" y="436" width="136" height="6" rx="3" fill="#2a2a2e"/>
      <rect x="1076" y="436" width="125" height="6" rx="3" fill="#3DDC97"/>
    </g>
  </g>
  <rect x="704" y="32" width="544" height="496" rx="24" fill="none" stroke="${t.line}"/>
</svg>
`
}

function portfolio(t, mode) {
  const id = `pf${mode}`
  const W = 1280
  const H = 560

  const chips = ['Next.js 14', 'TypeScript', 'Framer Motion', 'WebGL · GLSL', 'Firebase Auth', 'Firestore', 'Realtime DB']
  let cx = 64
  let cy = 452
  const chipSvg = chips
    .map((c, i) => {
      const w = c.length * 8.4 + 30
      if (cx + w > 640) {
        cx = 64
        cy += 44
      }
      const g = `<g class="reveal" style="animation-delay:${0.9 + i * 0.06}s">
      <rect x="${cx}" y="${cy}" width="${w}" height="32" rx="16" fill="${t.raised}" stroke="${t.line}"/>
      <text x="${cx + w / 2}" y="${cy + 21}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${t.paper}">${c}</text></g>`
      cx += w + 10
      return g
    })
    .join('\n    ')

  const stats = [
    ['22', 'worlds drawn in GLSL'],
    ['2', 'themes, one token set'],
    ['live', 'visitor dashboard'],
  ]
  const statSvg = stats
    .map(
      ([n, l], i) => `<g class="reveal" style="animation-delay:${0.6 + i * 0.1}s">
      <rect x="${64 + i * 196}" y="318" width="182" height="104" rx="18" fill="${t.card}" stroke="${t.line}"/>
      <text x="${86 + i * 196}" y="374" font-family="${BLACK}" font-weight="900" font-size="44" letter-spacing="-1.5" fill="${i === 0 ? `url(#${id}-signal)` : t.paper}">${n}</text>
      <text x="${86 + i * 196}" y="402" font-family="${MONO}" font-size="12" fill="${t.muted}">${l}</text></g>`,
    )
    .join('\n    ')

  // Browser window inside the panel. Always dark: it shows the site's dark theme.
  const BX = 748
  const BY = 92
  const BW = 470
  const BH = 380
  const planets = [
    // x, r, colours, orbit bob delay
    [BX + 196, 7, '#b9b3ad', '#6f6a66', 0],
    [BX + 226, 10, '#f3d9a4', '#b98a4b', -0.6],
    [BX + 262, 11, '#5fb0ff', '#1f5fa8', -1.2],
    [BX + 294, 8, '#ff8a5c', '#a4381c', -1.8],
    [BX + 340, 22, '#f0c89a', '#9a6a3c', -2.4],
    [BX + 396, 18, '#f3dfae', '#a98a52', -3],
    [BX + 436, 12, '#9fe8ee', '#3f9aa6', -3.6],
  ]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Portfolio — Next.js site with a WebGL solar system, launching soon">
  <title>vivekbhadauriya.dev — personal portfolio, launching soon</title>
  ${defs(t, id)}
  <defs>
    <linearGradient id="${id}-panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8B7BFF"/>
      <stop offset="0.55" stop-color="#4F6BFF"/>
      <stop offset="1" stop-color="#1E3AD1"/>
    </linearGradient>
    <radialGradient id="${id}-blob" cx="0.2" cy="0.1" r="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}-pdots" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.3" fill="#fff" opacity=".2"/>
    </pattern>
    <radialGradient id="${id}-sun" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#fff6d6"/>
      <stop offset="0.35" stop-color="#FFC53D"/>
      <stop offset="1" stop-color="#E4570E"/>
    </radialGradient>
    <radialGradient id="${id}-sunglow">
      <stop offset="0.3" stop-color="#FFB02E" stop-opacity=".55"/>
      <stop offset="1" stop-color="#FFB02E" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-sig" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFC53D"/><stop offset="0.5" stop-color="#3DDC97"/><stop offset="1" stop-color="#3DA9FC"/>
    </linearGradient>
    ${planets
      .map(
        ([, , a, b], k) => `<radialGradient id="${id}-pl${k}" cx="0.3" cy="0.35" r="0.8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`,
      )
      .join('\n    ')}
    <clipPath id="${id}-panelclip"><rect x="704" y="32" width="544" height="496" rx="24"/></clipPath>
    <clipPath id="${id}-win"><rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="16"/></clipPath>
  </defs>
  <style>${baseStyle}
    .spin { transform-box: fill-box; transform-origin: center; animation: spin 20s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .orbit { animation: orbit 5s ease-in-out infinite; }
    @keyframes orbit { 0%,100% { transform: translateY(-5px); } 50% { transform: translateY(5px); } }
  </style>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${t.bg}" stroke="${t.line}" stroke-width="1.5"/>

  <!-- copy -->
  <g class="reveal" style="animation-delay:.05s">
    <circle cx="72" cy="68" r="5" fill="${t.amber}" class="ping"/>
    <circle cx="72" cy="68" r="5" fill="${t.amber}"/>
    <text x="88" y="73" font-family="${MONO}" font-size="13" letter-spacing="2.6" fill="${t.muted}">IN THE WORKS · LAUNCHING SOON</text>
  </g>
  <g class="reveal" style="animation-delay:.15s">
    <text x="60" y="148" font-family="${BLACK}" font-weight="900" font-size="72" letter-spacing="-3" fill="${t.paper}">Portfolio</text>
  </g>
  <g class="reveal" style="animation-delay:.28s">
    <text x="64" y="200" font-family="${SERIF}" font-style="italic" font-size="44" fill="url(#${id}-signal)">built like a product.</text>
  </g>
  <g class="reveal" style="animation-delay:.4s" font-family="${SANS}" font-size="19" fill="${t.muted}">
    <text x="64" y="250">A solar system rendered in shaders, a real guestbook</text>
    <text x="64" y="276">with Google sign-in, and a guard for AI scrapers.</text>
    <text x="64" y="302" fill="${t.paper}">Designed, coded and motion-tuned from scratch.</text>
  </g>
  ${statSvg}
  ${chipSvg}

  <!-- panel -->
  <g clip-path="url(#${id}-panelclip)">
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-panel)"/>
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-pdots)"/>
    <rect x="704" y="32" width="544" height="496" fill="url(#${id}-blob)"/>
    <circle cx="1220" cy="530" r="210" fill="#0b1466" opacity=".3"/>

    <!-- browser -->
    <rect x="${BX}" y="${BY + 10}" width="${BW}" height="${BH}" rx="16" fill="#0b1466" opacity=".35"/>
    <g clip-path="url(#${id}-win)">
      <rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" fill="#0a0a0a"/>
      <rect x="${BX}" y="${BY}" width="${BW}" height="40" fill="#141416"/>
      <circle cx="${BX + 22}" cy="${BY + 20}" r="5.5" fill="#ff5f57"/>
      <circle cx="${BX + 40}" cy="${BY + 20}" r="5.5" fill="#febc2e"/>
      <circle cx="${BX + 58}" cy="${BY + 20}" r="5.5" fill="#28c840"/>
      <rect x="${BX + 118}" y="${BY + 9}" width="180" height="22" rx="11" fill="#0a0a0a"/>
      <text x="${BX + 208}" y="${BY + 24}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="#8b8b92">vivekbhadauriya.dev</text>

      <!-- nav pill -->
      <rect x="${BX + 150}" y="${BY + 56}" width="170" height="24" rx="12" fill="#18181b"/>
      <rect x="${BX + 154}" y="${BY + 60}" width="40" height="16" rx="8" fill="#ededed"/>
      ${[0, 1, 2].map((k) => `<rect x="${BX + 206 + k * 36}" y="${BY + 66}" width="26" height="4" rx="2" fill="#55555c"/>`).join('')}

      <text x="${BX + 30}" y="${BY + 160}" font-family="${BLACK}" font-weight="900" font-size="68" letter-spacing="-3" textLength="232" lengthAdjust="spacingAndGlyphs" fill="#ededed">VIVEK</text>
      <text x="${BX + 276}" y="${BY + 156}" font-family="${SERIF}" font-style="italic" font-size="38" textLength="168" lengthAdjust="spacingAndGlyphs" fill="url(#${id}-sig)">Bhadauriya</text>
      <text x="${BX + 32}" y="${BY + 186}" font-family="${MONO}" font-size="9.5" letter-spacing="3" fill="#8b8b92">I SHIP SYSTEMS THAT RUN IN PRODUCTION</text>

      <!-- solar line-up -->
      <rect x="${BX + 16}" y="${BY + 214}" width="${BW - 32}" height="150" rx="14" fill="#050507" stroke="#1c1c1f"/>
      ${Array.from({ length: 34 }, (_, k) => {
        const sx = BX + 24 + ((k * 137) % (BW - 48))
        const sy = BY + 222 + ((k * 71) % 136)
        return `<circle cx="${sx}" cy="${sy}" r="${k % 5 === 0 ? 1.3 : 0.8}" fill="#fff" opacity="${k % 3 === 0 ? 0.7 : 0.35}"/>`
      }).join('')}
      <circle cx="${BX + 96}" cy="${BY + 289}" r="92" fill="url(#${id}-sunglow)"/>
      <circle cx="${BX + 96}" cy="${BY + 289}" r="52" fill="url(#${id}-sun)"/>
      <circle cx="${BX + 96}" cy="${BY + 289}" r="52" fill="none" stroke="#fff3c4" stroke-width="2" stroke-dasharray="3 9" opacity=".5" class="spin"/>
      <ellipse cx="${BX + 316}" cy="${BY + 289}" rx="146" ry="16" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
      ${planets
        .map(
          ([x, r], k) => `<g class="orbit" style="animation-delay:${planets[k][4]}s">
        ${k === 5 ? `<ellipse cx="${x}" cy="${BY + 289}" rx="${r * 1.9}" ry="${r * 0.5}" fill="none" stroke="#e9d4a4" stroke-width="3" opacity=".7" transform="rotate(-14 ${x} ${BY + 289})"/>` : ''}
        <circle cx="${x}" cy="${BY + 289}" r="${r}" fill="url(#${id}-pl${k})"/></g>`,
        )
        .join('\n      ')}
    </g>
    <rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="16" fill="none" stroke="#ffffff" stroke-opacity=".12"/>

    <!-- floating cards -->
    <g class="bob">
      <rect x="722" y="398" width="214" height="68" rx="16" fill="#fff" opacity=".97"/>
      <circle cx="756" cy="432" r="20" fill="#eef1ff"/>
      <text x="756" y="440" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="22" fill="#4F6BFF">G</text>
      <text x="786" y="428" font-family="${SANS}" font-size="13.5" font-weight="700" fill="#0b0b0d">Guestbook signed</text>
      <text x="786" y="448" font-family="${SANS}" font-size="12" fill="#6b6b70">verified on the server</text>
    </g>
    <g class="bob" style="animation-delay:-2s">
      <rect x="1068" y="48" width="162" height="62" rx="16" fill="#0b0b0d" opacity=".94"/>
      <text x="1086" y="74" font-family="${MONO}" font-size="11" letter-spacing="1.2" fill="#8b8b92">GPTBot · /work</text>
      <circle cx="1090" cy="91" r="4" fill="#ff5f57"/>
      <text x="1102" y="96" font-family="${MONO}" font-size="13" font-weight="700" fill="#ededed">403 blocked</text>
    </g>
  </g>
  <rect x="704" y="32" width="544" height="496" rx="24" fill="none" stroke="${t.line}"/>
</svg>
`
}

function footer(t, mode) {
  const id = `ft${mode}`
  const W = 1280
  const H = 220
  const road = `M -40 150 C 240 150 360 90 640 90 S 1040 150 1320 150`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Thanks for stopping by">
  <title>Thanks for stopping by — next stop: something real.</title>
  ${defs(t, id)}
  <style>${baseStyle}</style>
  <clipPath id="${id}-clip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28"/></clipPath>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${t.bg}"/>
  <g clip-path="url(#${id}-clip)">
    <rect width="${W}" height="${H}" fill="url(#${id}-dots)" mask="url(#${id}-fademask)"/>
    <path id="${id}-road" d="${road}" fill="none"/>
    <path d="${road}" fill="none" stroke="${t.lineStrong}" stroke-width="22" stroke-linecap="round" opacity=".5"/>
    <path d="${road}" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="14 14" class="road-dash" opacity=".55"/>
    ${bus(t, id, `${id}-road`, '9s')}
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="640" y="58" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="4" fill="${t.muted}">THANKS FOR STOPPING BY</text>
  <text x="640" y="200" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="30" fill="url(#${id}-signal)">next stop: something real.</text>
</svg>
`
}

for (const [mode, t] of Object.entries(themes)) {
  writeFileSync(join(out, `header-${mode}.svg`), header(t, mode))
  writeFileSync(join(out, `featured-${mode}.svg`), featured(t, mode))
  writeFileSync(join(out, `portfolio-${mode}.svg`), portfolio(t, mode))
  writeFileSync(join(out, `footer-${mode}.svg`), footer(t, mode))
}
console.log('built', out)
