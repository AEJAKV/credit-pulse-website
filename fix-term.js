const fs = require('fs');
const file = 'c:/Users/ASUS TUF/OneDrive/Documents/CreditPulse/index.html';
let c = fs.readFileSync(file, 'utf8');

// Replace Instant Cash Side Hustle in pkg-features (15px icon) only — not in co-sum-features (13px)
const oldSpan = '</svg><span>Instant Cash Side Hustle</span></li>';
const newSpan = '</svg><span>Instant Cash Side Hustle<span class="pkg-feature-desc">Proven ways to make money as fast as today with zero startup costs</span></span></li>';

// Only target the 15px icon variant used in pkg-features
const anchor15 = 'stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg><span>Instant Cash Side Hustle</span></li>';
const anchor15new = 'stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg><span>Instant Cash Side Hustle<span class="pkg-feature-desc">Proven ways to make money as fast as today with zero startup costs</span></span></li>';

const before = (c.split(anchor15)).length - 1;
c = c.split(anchor15).join(anchor15new);
fs.writeFileSync(file, c, 'utf8');
console.log('Done. Replaced', before, 'Instant Cash Side Hustle instances.');
