// Clean, offline SVG illustrations for evidence presets and before/after comparisons

export const brokenRampSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="concreteGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="crackGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  
  <!-- Background Wall -->
  <rect width="800" height="500" fill="url(#skyGrad)"/>
  <rect x="0" y="240" width="800" height="260" fill="#1e293b"/>
  
  <!-- Brick Line Details on Wall -->
  <line x1="0" y1="80" x2="800" y2="80" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 6"/>
  <line x1="0" y1="160" x2="800" y2="160" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 6"/>
  
  <!-- Concrete Ramp Base -->
  <polygon points="60,440 740,440 680,220 180,220" fill="url(#concreteGrad)" stroke="#334155" stroke-width="3"/>
  
  <!-- Concrete Texture & Grid lines -->
  <line x1="220" y1="360" x2="580" y2="360" stroke="#334155" stroke-width="2"/>
  <line x1="260" y1="290" x2="540" y2="290" stroke="#334155" stroke-width="2"/>
  
  <!-- Accessibility Handrail (Bent/Tilted) -->
  <path d="M 120,410 L 220,180 L 620,180" fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
  <line x1="220" y1="180" x2="220" y2="270" stroke="#94a3b8" stroke-width="8"/>
  <line x1="420" y1="180" x2="420" y2="260" stroke="#94a3b8" stroke-width="8"/>
  <line x1="620" y1="180" x2="620" y2="250" stroke="#94a3b8" stroke-width="8"/>
  
  <!-- Handrail damage indication: loose mounting flange -->
  <circle cx="220" cy="270" r="10" fill="#ef4444"/>
  <line x1="210" y1="265" x2="230" y2="275" stroke="#fee2e2" stroke-width="3"/>
  
  <!-- Severe Concrete Fractures / Spalling -->
  <path d="M 280,440 L 320,380 L 290,340 L 360,300 L 340,260 L 390,220" fill="none" stroke="#090d16" stroke-width="7" stroke-linejoin="round"/>
  <path d="M 320,380 L 410,400 L 450,440" fill="none" stroke="#090d16" stroke-width="5" stroke-linejoin="round"/>
  <path d="M 290,340 L 240,320 L 200,350" fill="none" stroke="#090d16" stroke-width="4"/>
  
  <!-- Spalled Crater Zone -->
  <polygon points="310,390 350,370 380,410 330,425" fill="#090d16" opacity="0.8"/>
  
  <!-- Exposed rust rebar bits -->
  <line x1="325" y1="395" x2="355" y2="385" stroke="#b45309" stroke-width="4"/>
  <line x1="340" y1="375" x2="335" y2="415" stroke="#b45309" stroke-width="4"/>
  
  <!-- Caution Barrier / Hazard marker tape -->
  <polygon points="140,430 180,450 720,330 680,310" fill="#f59e0b" opacity="0.9"/>
  <path d="M 160,435 L 190,425 M 260,410 L 290,400 M 360,385 L 390,375 M 460,360 L 490,350 M 560,335 L 590,325 M 660,310 L 690,300" stroke="#090d16" stroke-width="12"/>
  
  <!-- Warning HUD Stamp -->
  <rect x="520" y="40" width="240" height="70" rx="8" fill="#111827" stroke="#ef4444" stroke-width="2"/>
  <circle cx="550" cy="75" r="14" fill="#ef4444"/>
  <text x="545" y="81" font-family="monospace" font-size="18" font-weight="bold" fill="#ffffff">!</text>
  <text x="575" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">ADA HAZARD: CRACKED</text>
  <text x="575" y="85" font-family="monospace" font-size="11" fill="#ef4444">SLOPE DISRUPTED &gt; 1:8</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="260" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">MAIN LIBRARY - WEST ACCESS</text>
</svg>
`)}`;

export const exposedConduitSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="wallConduit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  
  <!-- Brick Background -->
  <rect width="800" height="500" fill="url(#wallConduit)"/>
  <g stroke="#374151" stroke-width="2" opacity="0.4">
    <line x1="0" y1="100" x2="800" y2="100"/>
    <line x1="0" y1="200" x2="800" y2="200"/>
    <line x1="0" y1="300" x2="800" y2="300"/>
    <line x1="0" y1="400" x2="800" y2="400"/>
  </g>
  
  <!-- Metal Conduit Pipe coming down -->
  <rect x="380" y="0" width="40" height="150" fill="#94a3b8" stroke="#475569" stroke-width="3"/>
  <rect x="375" y="140" width="50" height="15" rx="3" fill="#64748b"/>
  
  <!-- Open/Dangled Industrial Junction Box -->
  <rect x="320" y="155" width="160" height="200" rx="8" fill="#334155" stroke="#ef4444" stroke-width="3"/>
  <!-- Broken hanging door -->
  <polygon points="480,165 590,200 570,380 480,345" fill="#475569" stroke="#64748b" stroke-width="2" opacity="0.95"/>
  
  <!-- Exposed Wire Cluster -->
  <path d="M 370,170 C 350,220 310,260 330,320 C 340,350 310,410 290,440" fill="none" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
  <path d="M 390,170 C 410,210 430,270 410,330 C 400,370 420,420 440,460" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
  <path d="M 420,170 C 380,240 370,290 380,360 C 390,400 370,440 360,470" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>
  
  <!-- Copper bare tips -->
  <line x1="290" y1="440" x2="280" y2="455" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
  <line x1="440" y1="460" x2="450" y2="475" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
  
  <!-- High Voltage Arc Sparks -->
  <polygon points="340,300 360,285 350,305 375,295 355,320 345,310" fill="#fef08a" stroke="#f59e0b" stroke-width="1.5"/>
  <polygon points="400,360 415,345 410,365 430,355 415,375 405,370" fill="#fef08a" stroke="#f59e0b" stroke-width="1.5"/>
  
  <!-- Danger Notice Stamp -->
  <rect x="520" y="40" width="240" height="70" rx="8" fill="#111827" stroke="#ef4444" stroke-width="2"/>
  <polygon points="550,55 565,85 535,85" fill="#f59e0b"/>
  <text x="548" y="80" font-family="monospace" font-size="14" font-weight="bold" fill="#000000">!</text>
  <text x="575" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">ELECTRICAL SHOCK HAZARD</text>
  <text x="575" y="85" font-family="monospace" font-size="11" fill="#ef4444">480V FEED / UNSECURED</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="280" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">ENGINEERING WING - BAY 3</text>
</svg>
`)}`;

export const tactilePavingSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <!-- Ground Pedestrian Tiles -->
  <rect width="800" height="500" fill="#1e293b"/>
  
  <!-- Sidewalk Perspective -->
  <polygon points="0,500 800,500 550,150 250,150" fill="#334155" stroke="#475569" stroke-width="2"/>
  
  <!-- Yellow Tactile Truncated Dome Pathway -->
  <polygon points="260,500 540,500 450,150 350,150" fill="#f59e0b" stroke="#d97706" stroke-width="3"/>
  
  <!-- Truncated Domes (Dots) -->
  <g fill="#b45309">
    <circle cx="340" cy="460" r="10"/><circle cx="400" cy="460" r="10"/><circle cx="460" cy="460" r="10"/>
    <circle cx="350" cy="400" r="8"/><circle cx="400" cy="400" r="8"/><circle cx="450" cy="400" r="8"/>
    <circle cx="360" cy="340" r="7"/><circle cx="400" cy="340" r="7"/><circle cx="440" cy="340" r="7"/>
    <circle cx="370" cy="280" r="6"/><circle cx="400" cy="280" r="6"/><circle cx="430" cy="280" r="6"/>
    <circle cx="380" cy="220" r="5"/><circle cx="400" cy="220" r="5"/><circle cx="420" cy="220" r="5"/>
  </g>
  
  <!-- OBSTRUCTION: Construction Wooden Pallet Dumped on Pathway -->
  <polygon points="310,380 490,380 520,330 340,330" fill="#78350f" stroke="#451a03" stroke-width="2"/>
  <rect x="330" y="340" width="150" height="15" fill="#92400e"/>
  <rect x="325" y="365" width="160" height="15" fill="#92400e"/>
  
  <!-- Metal Barrier Construction Fence resting on top -->
  <line x1="280" y1="360" x2="520" y2="360" stroke="#f87171" stroke-width="6"/>
  <line x1="300" y1="310" x2="300" y2="400" stroke="#f87171" stroke-width="4"/>
  <line x1="500" y1="310" x2="500" y2="400" stroke="#f87171" stroke-width="4"/>
  
  <!-- Visually Impaired Guide Cane Blocked Graphic -->
  <line x1="220" y1="480" x2="320" y2="370" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
  <line x1="220" y1="480" x2="200" y2="495" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
  
  <!-- Alert Stamp -->
  <rect x="500" y="40" width="260" height="70" rx="8" fill="#111827" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="530" cy="75" r="14" fill="#f59e0b"/>
  <text x="525" y="81" font-family="monospace" font-size="16" font-weight="bold" fill="#000000">♿</text>
  <text x="555" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">TACTILE ROUTE BLOCKED</text>
  <text x="555" y="85" font-family="monospace" font-size="11" fill="#f59e0b">ADA TITLE III NON-COMPLIANT</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="260" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">STUDENT UNION - PLAZA CROSS</text>
</svg>
`)}`;

export const waterLeakSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <!-- Interior Corridor Corridor Background -->
  <rect width="800" height="500" fill="#0f172a"/>
  
  <!-- Ceiling Tile Grid -->
  <line x1="0" y1="80" x2="800" y2="80" stroke="#334155" stroke-width="2"/>
  <line x1="200" y1="0" x2="200" y2="80" stroke="#334155" stroke-width="2"/>
  <line x1="400" y1="0" x2="400" y2="80" stroke="#334155" stroke-width="2"/>
  <line x1="600" y1="0" x2="600" y2="80" stroke="#334155" stroke-width="2"/>
  
  <!-- Ruptured Ceiling Pipe with Gushing Water -->
  <rect x="250" y="50" width="300" height="24" rx="4" fill="#64748b" stroke="#475569" stroke-width="2"/>
  <ellipse cx="400" cy="74" rx="16" ry="6" fill="#0284c7"/>
  
  <!-- Water stream & droplets -->
  <path d="M 395,75 Q 380,180 390,340" fill="none" stroke="#38bdf8" stroke-width="5" stroke-dasharray="8 6"/>
  <path d="M 405,75 Q 420,180 410,340" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="12 8"/>
  <circle cx="395" cy="220" r="5" fill="#7dd3fc"/>
  <circle cx="410" cy="270" r="4" fill="#7dd3fc"/>
  
  <!-- Spreading Puddle on Walkway Floor -->
  <ellipse cx="400" cy="390" rx="220" ry="60" fill="#0369a1" opacity="0.6"/>
  <ellipse cx="400" cy="390" rx="170" ry="40" fill="#38bdf8" opacity="0.75"/>
  <ellipse cx="400" cy="390" rx="90" ry="20" fill="#bae6fd" opacity="0.9"/>
  
  <!-- Water Reflection / Ripples -->
  <ellipse cx="400" cy="390" rx="40" ry="10" fill="none" stroke="#ffffff" stroke-width="2"/>
  <ellipse cx="400" cy="390" rx="80" ry="18" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
  
  <!-- Yellow Slip Caution Sign floating/tipping -->
  <polygon points="560,330 590,410 530,410" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
  <text x="555" y="390" font-family="sans-serif" font-size="12" font-weight="bold" fill="#000000">SLIP</text>
  
  <!-- Alert Stamp -->
  <rect x="520" y="40" width="240" height="70" rx="8" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="550" cy="75" r="14" fill="#38bdf8"/>
  <text x="545" y="81" font-family="monospace" font-size="16" font-weight="bold" fill="#000000">💧</text>
  <text x="575" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">PLUMBING RUPTURE</text>
  <text x="575" y="85" font-family="monospace" font-size="11" fill="#38bdf8">PEDESTRIAN SLIP HAZARD</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="240" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">NORTH QUAD - CORRIDOR B</text>
</svg>
`)}`;

export const repairedRampSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cleanSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="cleanConcrete" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
  </defs>
  
  <!-- Background Wall -->
  <rect width="800" height="500" fill="url(#cleanSky)"/>
  <rect x="0" y="240" width="800" height="260" fill="#1e293b"/>
  
  <!-- Brick Line Details on Wall (Clean, Painted) -->
  <line x1="0" y1="80" x2="800" y2="80" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 6"/>
  <line x1="0" y1="160" x2="800" y2="160" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 6"/>
  
  <!-- Perfectly Level, Newly Poured Concrete Ramp Base -->
  <polygon points="60,440 740,440 680,220 180,220" fill="url(#cleanConcrete)" stroke="#cbd5e1" stroke-width="3"/>
  
  <!-- Clean Expansion Joints -->
  <line x1="220" y1="360" x2="580" y2="360" stroke="#475569" stroke-width="2"/>
  <line x1="260" y1="290" x2="540" y2="290" stroke="#475569" stroke-width="2"/>
  
  <!-- ADA Tactile Warning Surface at Ramp Landing (Truncated Domes) -->
  <polygon points="120,440 380,440 350,380 150,380" fill="#facc15" stroke="#eab308" stroke-width="2"/>
  <g fill="#a16207">
    <circle cx="160" cy="425" r="4"/><circle cx="190" cy="425" r="4"/><circle cx="220" cy="425" r="4"/><circle cx="250" cy="425" r="4"/><circle cx="280" cy="425" r="4"/><circle cx="310" cy="425" r="4"/><circle cx="340" cy="425" r="4"/>
    <circle cx="170" cy="405" r="3.5"/><circle cx="200" cy="405" r="3.5"/><circle cx="230" cy="405" r="3.5"/><circle cx="260" cy="405" r="3.5"/><circle cx="290" cy="405" r="3.5"/><circle cx="320" cy="405" r="3.5"/>
  </g>
  
  <!-- Brand New Stainless Steel Handrail (Aligned & Firmly Anchored) -->
  <path d="M 120,410 L 220,180 L 620,180" fill="none" stroke="#f1f5f9" stroke-width="10" stroke-linecap="round"/>
  <line x1="220" y1="180" x2="220" y2="270" stroke="#f1f5f9" stroke-width="8"/>
  <line x1="420" y1="180" x2="420" y2="260" stroke="#f1f5f9" stroke-width="8"/>
  <line x1="620" y1="180" x2="620" y2="250" stroke="#f1f5f9" stroke-width="8"/>
  
  <!-- Secure Steel Anchor Flanges -->
  <rect x="210" y="265" width="20" height="10" rx="3" fill="#38bdf8"/>
  <rect x="410" y="255" width="20" height="10" rx="3" fill="#38bdf8"/>
  <rect x="610" y="245" width="20" height="10" rx="3" fill="#38bdf8"/>
  
  <!-- Verification Green Stamp -->
  <rect x="520" y="40" width="240" height="70" rx="8" fill="#111827" stroke="#10b981" stroke-width="2"/>
  <circle cx="550" cy="75" r="14" fill="#10b981"/>
  <text x="544" y="80" font-family="monospace" font-size="16" font-weight="bold" fill="#ffffff">✓</text>
  <text x="575" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">REPAIR EVIDENCE</text>
  <text x="575" y="85" font-family="monospace" font-size="11" fill="#10b981">CONCRETE RE-POURED &amp; LEVELED</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="260" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#10b981">MAIN LIBRARY - WORK COMPLETED</text>
</svg>
`)}`;

export const rampRebarSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <!-- Macro Close-up of concrete spalling with rebar -->
  <rect width="800" height="500" fill="#334155"/>
  
  <!-- Concrete Texture Background -->
  <polygon points="50,50 750,80 720,450 80,420" fill="#475569" stroke="#64748b" stroke-width="4"/>
  
  <!-- Deep Crater / Concrete Cavity -->
  <path d="M 220,180 Q 380,120 560,190 Q 620,320 480,390 Q 280,410 200,320 Z" fill="#0f172a" stroke="#090d16" stroke-width="6"/>
  
  <!-- Exposed Rebar Lattice (Rusty) -->
  <line x1="250" y1="220" x2="520" y2="250" stroke="#b45309" stroke-width="12" stroke-linecap="round"/>
  <line x1="240" y1="290" x2="530" y2="310" stroke="#b45309" stroke-width="12" stroke-linecap="round"/>
  <line x1="300" y1="160" x2="320" y2="380" stroke="#92400e" stroke-width="10" stroke-linecap="round"/>
  <line x1="400" y1="150" x2="410" y2="390" stroke="#92400e" stroke-width="10" stroke-linecap="round"/>
  <line x1="490" y1="170" x2="480" y2="370" stroke="#92400e" stroke-width="10" stroke-linecap="round"/>
  
  <!-- Rust Oxide Patches -->
  <ellipse cx="320" cy="225" rx="16" ry="10" fill="#d97706" opacity="0.8"/>
  <ellipse cx="405" cy="295" rx="20" ry="12" fill="#d97706" opacity="0.8"/>
  
  <!-- Severe Structural Warning Marker -->
  <rect x="490" y="40" width="270" height="70" rx="8" fill="#111827" stroke="#ef4444" stroke-width="2"/>
  <text x="510" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">STUDENT REPORTER 2 EVIDENCE</text>
  <text x="510" y="85" font-family="monospace" font-size="11" fill="#ef4444">EXPOSED REBAR GRID / SPALLING</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="280" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">MAIN LIBRARY - EAST RAMP ANGLE</text>
</svg>
`)}`;

export const rampRainSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <!-- Dark Storm Background -->
  <rect width="800" height="500" fill="#090d16"/>
  
  <!-- Wet Ramp Base -->
  <polygon points="60,440 740,440 680,220 180,220" fill="#1e293b" stroke="#334155" stroke-width="3"/>
  
  <!-- Deep Rain Puddle Submerging Crack -->
  <ellipse cx="380" cy="380" rx="190" ry="50" fill="#0284c7" opacity="0.55"/>
  <ellipse cx="380" cy="380" rx="140" ry="30" fill="#38bdf8" opacity="0.7"/>
  
  <!-- Rain Streaks -->
  <g stroke="#94a3b8" stroke-width="1.5" opacity="0.5">
    <line x1="100" y1="20" x2="70" y2="120"/>
    <line x1="240" y1="40" x2="210" y2="140"/>
    <line x1="380" y1="10" x2="350" y2="110"/>
    <line x1="520" y1="50" x2="490" y2="150"/>
    <line x1="680" y1="20" x2="650" y2="120"/>
    <line x1="160" y1="160" x2="130" y2="260"/>
    <line x1="320" y1="180" x2="290" y2="280"/>
    <line x1="480" y1="150" x2="450" y2="250"/>
    <line x1="620" y1="190" x2="590" y2="290"/>
  </g>
  
  <!-- Puddle Splash Circles -->
  <ellipse cx="330" cy="370" rx="20" ry="6" fill="none" stroke="#bae6fd" stroke-width="1.5"/>
  <ellipse cx="420" cy="390" rx="25" ry="8" fill="none" stroke="#bae6fd" stroke-width="1.5"/>
  
  <!-- Handrail dripping wet -->
  <path d="M 120,410 L 220,180 L 620,180" fill="none" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>
  
  <!-- Reporter 3 Stamp -->
  <rect x="490" y="40" width="270" height="70" rx="8" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
  <text x="510" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc">STUDENT REPORTER 3 EVIDENCE</text>
  <text x="510" y="85" font-family="monospace" font-size="11" fill="#38bdf8">PRECIPITATION / SEVERE PUDDLING</text>
  
  <!-- Location Label -->
  <rect x="40" y="40" width="280" height="42" rx="6" fill="#111827" stroke="#334155" stroke-width="1.5"/>
  <text x="55" y="66" font-family="monospace" font-size="13" fill="#38bdf8">MAIN LIBRARY - RAIN CONDITIONS</text>
</svg>
`)}`;

export interface EvidencePreset {
  id: string;
  title: string;
  category: 'Accessibility' | 'Electrical' | 'Plumbing' | 'Structural' | 'Pedestrian Safety';
  zone: 'Main Library' | 'North Quad' | 'Engineering Wing' | 'Student Union' | 'Athletics Complex' | 'West Residence Hall' | 'Central Plaza';
  landmark: string;
  description: string;
  imageUrl: string;
  reporterLabel: string;
}

export const EVIDENCE_PRESETS: EvidencePreset[] = [
  {
    id: 'preset-ramp-broken',
    title: 'Cracked Accessibility Ramp Concrete',
    category: 'Accessibility',
    zone: 'Main Library',
    landmark: 'West Entrance Ramp adjacent to main circulation desk',
    description: 'Deep transversal cracking across the primary accessibility ramp. Concrete spalling has created a 1.5-inch lip that blocks wheelchair access and poses a trip hazard.',
    imageUrl: brokenRampSvg,
    reporterLabel: 'Student Reporter 1 (Access Committee)',
  },
  {
    id: 'preset-conduit-exposed',
    title: 'Exposed High-Voltage Electrical Conduit',
    category: 'Electrical',
    zone: 'Engineering Wing',
    landmark: 'Bay 3 exterior pedestrian path near substation box',
    description: 'Weathered electrical junction box door is detached. Three unshielded conductors are exposed to rainwater and within arm reach of pedestrians.',
    imageUrl: exposedConduitSvg,
    reporterLabel: 'Campus Safety Monitor',
  },
  {
    id: 'preset-tactile-blocked',
    title: 'Blocked Tactile Warning Pathway',
    category: 'Accessibility',
    zone: 'Student Union',
    landmark: 'Plaza pedestrian crossing near North atrium entrance',
    description: 'Construction wooden pallet and temporary fencing dump placed directly over yellow truncated dome tactile paving, blocking orientation for visually impaired students.',
    imageUrl: tactilePavingSvg,
    reporterLabel: 'Accessibility Peer Advocate',
  },
  {
    id: 'preset-water-leak',
    title: 'Overhead Pipe Rupture & Graywater Pooling',
    category: 'Plumbing',
    zone: 'North Quad',
    landmark: 'Corridor B walkway under building connector bridge',
    description: 'Active overhead water pipe rupture causing continuous graywater dripping and spreading slippery surface across high-traffic pedestrian walkway.',
    imageUrl: waterLeakSvg,
    reporterLabel: 'Facilities Night Staff',
  },
];
