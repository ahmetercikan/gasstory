// Oyunun kendi simge seti: kalın koyu dış çizgi + düz çizgi film renkleri (karakterler ve sal ile aynı dil).
// Kullanım: ic('fart') → <svg>…</svg>. HTML'de <i data-ic="fart"></i> yazılır, hydrateIcons() doldurur.
const K = '#23324d';
const W = 'stroke="#fff" stroke-opacity=".85" fill="none"'; // parlama çizgisi

function starPts(cx, cy, R, r, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? r : R;
    p.push(`${(cx + Math.cos(a) * d).toFixed(2)},${(cy + Math.sin(a) * d).toFixed(2)}`);
  }
  return p.join(' ');
}
const medal = (fill, n) => `<path d="M9 3h5l4 9h-5z" fill="#ff5a5f"/><path d="M23 3h-5l-4 9h5z" fill="#3fa7ff"/>
  <circle cx="16" cy="20.5" r="8.5" fill="${fill}"/><circle cx="16" cy="20.5" r="5.6" fill="none" stroke-opacity=".35"/>
  <text x="16" y="24.3" text-anchor="middle" font-size="10.5" font-weight="800" fill="${K}" stroke="none" font-family="Baloo 2, sans-serif">${n}</text>`;
const can = (body, mark) => `<path d="M8.5 7.5c0-1.6 3.4-2.8 7.5-2.8s7.5 1.2 7.5 2.8v17c0 1.6-3.4 2.8-7.5 2.8s-7.5-1.2-7.5-2.8z" fill="${body}"/>
  <ellipse cx="16" cy="7.5" rx="7.5" ry="2.8" fill="#dfe6ee"/><path d="M8.5 12.5c2.5 1.2 12.5 1.2 15 0v8c-2.5 1.2-12.5 1.2-15 0z" fill="#fff"/>${mark}<path d="M11.2 9.8v14.4" ${W}/>`;

const P = {
  fart: `<path d="M8.5 24.5c-3 0-5.3-2.2-5.3-5 0-2.5 1.9-4.6 4.3-4.9.5-3.3 3.3-5.8 6.7-5.8 2.8 0 5.2 1.7 6.2 4.2a6 6 0 0 1 1.6-.2c3.3 0 5.9 2.6 5.9 5.8s-2.6 5.9-5.9 5.9z" fill="#a6e22e"/>
    <path d="M8.8 16.4c.7-2.1 2.5-3.6 4.8-3.8" ${W}/><path d="M13.5 20.3c1.7 1.1 3.9.7 4.8-1" fill="none"/>
    <circle cx="26.5" cy="6.8" r="2.4" fill="#c4ef4a"/><circle cx="21.6" cy="4.4" r="1.5" fill="#c4ef4a"/>`,
  burp: `<circle cx="13" cy="18.5" r="8.3" fill="#ffd84d"/><circle cx="24.2" cy="9.6" r="4.7" fill="#fff3b0"/><circle cx="24.8" cy="23" r="3.1" fill="#ffe27a"/>
    <path d="M8.3 15.6a5.6 5.6 0 0 1 3.6-3.4" ${W}/><path d="M22.1 7.6a2.6 2.6 0 0 1 1.8-1.2" ${W}/>`,
  buoy: `<path fill-rule="evenodd" d="M16 4.6a11.4 11.4 0 1 0 0 22.8 11.4 11.4 0 1 0 0-22.8zm0 6a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 1 1 0-10.8z" fill="#fff"/>
    <circle cx="16" cy="16" r="8.4" fill="none" stroke="#ff5a5f" stroke-width="5.4" stroke-dasharray="6.6 6.6" transform="rotate(-24 16 16)"/>
    <circle cx="16" cy="16" r="11.4" fill="none"/><circle cx="16" cy="16" r="5.4" fill="none"/>`,
  star: `<polygon points="${starPts(16, 17, 12.5, 5.6)}" fill="#ffd23f"/><path d="M11.2 14.6l2.2-.3" ${W}/>`,
  online: `<path d="M16 14.5l-5 13M16 14.5l5 13M12.4 23h7.2"/><circle cx="16" cy="12" r="2.8" fill="#3fa7ff"/>
    <path d="M9.6 5.6a9.2 9.2 0 0 0 0 12.8M22.4 5.6a9.2 9.2 0 0 1 0 12.8M12.6 8.4a5 5 0 0 0 0 7.2M19.4 8.4a5 5 0 0 1 0 7.2" fill="none"/>`,
  key: `<path d="M14.3 14.6l11.6 11.6-2.5 2.5-2-2-1.7 1.7-1.9-1.9 1.7-1.7-7.6-7.6z" fill="#ffc93c"/><circle cx="10.2" cy="11.2" r="6.6" fill="#ffc93c"/><circle cx="8.8" cy="9.8" r="2" fill="#fff"/>`,
  help: `<circle cx="16" cy="16" r="12.2" fill="#3fa7ff"/><path d="M12.4 12.6a3.7 3.7 0 1 1 5.3 3.3c-1.1.6-1.7 1.4-1.7 2.7v.5" stroke="#fff" stroke-width="3" fill="none"/><circle cx="16" cy="23.4" r="1.7" fill="#fff" stroke="none"/>`,
  sound: `<path d="M4.5 12.4h4.8L16 6.6v18.8l-6.7-5.8H4.5z" fill="#fff"/><path d="M20.2 12a5.4 5.4 0 0 1 0 8M23.6 8.6a10 10 0 0 1 0 14.8" fill="none" stroke-width="2.6"/>`,
  mute: `<path d="M4.5 12.4h4.8L16 6.6v18.8l-6.7-5.8H4.5z" fill="#fff"/><path d="M20.5 12.5l6.5 7M27 12.5l-6.5 7" stroke="#ff5a5f" stroke-width="3"/>`,
  music: `<path d="M12 23V9.2l12.4-3.4v14" fill="none" stroke-width="2.4"/><path d="M12 9.2l12.4-3.4v3.6L12 12.8z" fill="${K}"/>
    <ellipse cx="8.8" cy="23.2" rx="3.6" ry="3" fill="#b26bff"/><ellipse cx="21.2" cy="20" rx="3.6" ry="3" fill="#b26bff"/>`,
  pause: `<rect x="8.5" y="7" width="5.4" height="18" rx="1.8" fill="${K}"/><rect x="18.1" y="7" width="5.4" height="18" rx="1.8" fill="${K}"/>`,
  back: `<path d="M19.5 6.5L10 16l9.5 9.5" fill="none" stroke-width="3.6"/>`,
  next: `<path d="M6.5 16h17M17 9l7 7-7 7" fill="none" stroke-width="3.6"/>`,
  share: `<path d="M10 13.5H7.5v13h17v-13H22" fill="#fff"/><path d="M16 19.5V4.5M10.8 9.4L16 4.2l5.2 5.2" fill="none" stroke-width="2.8"/>`,
  bot: `<path d="M16 9.5V6" /><circle cx="16" cy="4.6" r="2" fill="#ff5a5f"/><rect x="6.5" y="9.5" width="19" height="15.5" rx="4.4" fill="#cfd8e3"/>
    <rect x="3.6" y="14.5" width="3" height="6" rx="1.2" fill="#9aa7b6"/><rect x="25.4" y="14.5" width="3" height="6" rx="1.2" fill="#9aa7b6"/>
    <circle cx="12.3" cy="16.4" r="2.2" fill="#3fa7ff"/><circle cx="19.7" cy="16.4" r="2.2" fill="#3fa7ff"/><path d="M12.5 21h7"/>`,
  close: `<path d="M10 10l12 12M22 10L10 22" stroke-width="3.6"/>`,
  rocket: `<path d="M10.2 17.6l-4.4 3.8 1 4.8 4.6-3.2zM21.8 17.6l4.4 3.8-1 4.8-4.6-3.2z" fill="#ff5a5f"/>
    <path d="M13.4 22.6c0 3 1.2 5 2.6 6.6 1.4-1.6 2.6-3.6 2.6-6.6" fill="#ffc93c"/>
    <path d="M16 2.8c5.2 3.6 7.2 9.4 6.1 15.4l-3 4.4h-6.2l-3-4.4C8.8 12.2 10.8 6.4 16 2.8z" fill="#fff"/><circle cx="16" cy="12" r="2.8" fill="#3fa7ff"/>`,
  trophy: `<path d="M10 7H6.6a3.6 3.6 0 0 0 4.2 5.4M22 7h3.4a3.6 3.6 0 0 1-4.2 5.4" fill="none"/>
    <path d="M9.6 4.5h12.8v6.6a6.4 6.4 0 0 1-12.8 0z" fill="#ffc93c"/><path d="M16 17.5v3.5"/>
    <rect x="10.6" y="21" width="10.8" height="3.8" rx="1.2" fill="#ffb020"/><rect x="8.6" y="24.8" width="14.8" height="3.2" rx="1" fill="#9a6240"/><path d="M12.6 7v4" ${W}/>`,
  gold: medal('#ffc93c', 1), silver: medal('#d6dde6', 2), bronze: medal('#e0915a', 3),
  timer: `<rect x="13.6" y="2.8" width="4.8" height="3.4" rx="1" fill="#ff5a5f"/><circle cx="16" cy="18" r="10.4" fill="#fff"/><path d="M16 18v-5.4M16 18l3.4 2.2" stroke-width="2.6"/><path d="M24.2 9.2l1.8-1.8"/>`,
  water: `<path d="M16 3.6c3.2 4.2 5.2 6.8 5.2 9.4a5.2 5.2 0 0 1-10.4 0c0-2.6 2-5.2 5.2-9.4z" fill="#6fd0ff"/>
    <path d="M3 22c3-3 5-3 8.3 0s5 3 8.4 0 5-3 8.3 0M3 27.5c3-3 5-3 8.3 0s5 3 8.4 0 5-3 8.3 0" stroke="#2b9bf0" stroke-width="2.8" fill="none"/>`,
  boom: `<polygon points="${starPts(16, 16, 13.5, 7.5, 9)}" fill="#ff8a3d"/><polygon points="${starPts(16, 16, 7.5, 4.2, 7)}" fill="#ffd23f"/>`,
  crown: `<path d="M5.5 22.5L4 10.5l6.5 5L16 6.5l5.5 9 6.5-5-1.5 12z" fill="#ffc93c"/><rect x="5.5" y="22.5" width="21" height="4.4" rx="1.2" fill="#ffb020"/>
    <circle cx="16" cy="24.7" r="1.4" fill="#ff5a5f"/><circle cx="10.5" cy="24.7" r="1.2" fill="#3fa7ff"/><circle cx="21.5" cy="24.7" r="1.2" fill="#3fa7ff"/>`,
  devil: `<path d="M9.6 12.2L7.4 3.6l6.4 5.6M22.4 12.2l2.2-8.6-6.4 5.6" fill="#ff5a5f"/><circle cx="16" cy="18.2" r="10" fill="#b26bff"/>
    <path d="M10.5 15.2l4 1.6M21.5 15.2l-4 1.6" stroke-width="2.6"/><path d="M11 21.2c2.6 3.2 7.4 3.2 10 0" fill="#fff"/>`,
  bolt: `<path d="M18.4 2.8L7 18.2h7.4l-2.2 11 11.6-15.6h-7.6z" fill="#ffd23f"/><path d="M15.6 7.8l-3.4 4.8" ${W}/>`,
  sick: `<circle cx="16" cy="16.5" r="11.6" fill="#b6e36a"/><path d="M9.6 12.4l3.4 3M13 12.4l-3.4 3M19 12.4l3.4 3M22.4 12.4l-3.4 3" stroke-width="2.2"/>
    <path d="M9.8 22c1.6-1.6 2.6-1.6 4.2 0s2.6 1.6 4.2 0 2.6-1.6 4 0" fill="none"/>`,
  people: `<circle cx="11.5" cy="10.5" r="4.4" fill="#ffc93c"/><path d="M3.8 26.5a7.7 7.7 0 0 1 15.4 0z" fill="#3fa7ff"/>
    <circle cx="22" cy="12" r="3.6" fill="#ffc93c"/><path d="M18.4 18.6a6.6 6.6 0 0 1 10.2 6v1.9H20" fill="#ff5a5f"/>`,
  leaf: `<path d="M5.5 26.5C5.5 13.5 13.5 5.6 27 5c0 13.4-8 21.5-21.5 21.5z" fill="#8ad94a"/><path d="M5.5 26.5L19.5 12.5M12 20h5.4M15.6 16.4V11" fill="none"/>`,
  canyon: `<path d="M2.5 28V14h3.8l2-5h5.2l1.2 5v14zM18.5 28V17.5l2.2-4.5h5l1.2 4.5h2.6V28z" fill="#f0a35b"/><path d="M8.6 9.5h4.4M21 13.5h4.2" ${W}/>
    <path d="M13 28c0-5.6 6-6.4 6-11.6" stroke="#2b9bf0" stroke-width="3.2" fill="none"/>`,
  waterfall: `<path d="M3 28V10.5l4.5-5h17l4.5 5V28z" fill="#c8667a"/><path d="M12.2 5.5h7.6V23h-7.6z" fill="#6fd0ff"/>
    <path d="M14.6 8v12M17.4 10v9" stroke="#fff" stroke-width="1.6"/><ellipse cx="16" cy="24.5" rx="9" ry="3.4" fill="#6fd0ff"/><path d="M11 23.6c1.6-.8 3-.8 4.4 0M17.6 25.2c1.4-.8 2.8-.8 4 0" stroke="#fff" stroke-width="1.4" fill="none"/>`,
  again: `<path d="M25.4 17a9.4 9.4 0 1 1-2.8-7.6" fill="none" stroke-width="3.2"/><path d="M23.6 3.6v6.6H17" fill="none" stroke-width="3.2"/>`,
  home: `<path d="M7 15v12h18V15" fill="#fff"/><path d="M3.8 16.4L16 5.2l12.2 11.2" fill="#ff5a5f"/><rect x="13" y="19" width="6" height="8" rx="1" fill="#9a6240"/>`,
  door: `<rect x="6.5" y="4" width="14.5" height="24" rx="1.6" fill="#c98a5a"/><circle cx="17.2" cy="16.5" r="1.4" fill="${K}" stroke="none"/><path d="M22 16h7.5M26 12.5l3.5 3.5-3.5 3.5" fill="none" stroke-width="2.6"/>`,
  check: `<circle cx="16" cy="16" r="12.2" fill="#4cd964"/><path d="M10 16.5l4 4 8-8.6" stroke="#fff" stroke-width="3.4" fill="none"/>`,
  flag: `<path d="M7.5 28.5V4"/><path d="M7.5 5h18v12h-18z" fill="#fff"/>
    <path d="M7.5 5h4.5v4H7.5zM16.5 5H21v4h-4.5zM12 9h4.5v4H12zM21 9h4.5v4H21zM7.5 13H12v4H7.5zM16.5 13H21v4h-4.5z" fill="${K}" stroke="none"/>`,
  joystick: `<ellipse cx="16" cy="24" rx="11" ry="4.6" fill="#cfd8e3"/><path d="M16 23V12" stroke-width="3.4"/><circle cx="16" cy="9" r="5.4" fill="#ff5a5f"/><path d="M13.6 7.4a2.6 2.6 0 0 1 2-1.6" ${W}/>`,
  spikes: `<path d="M5.4 12l1.8-5 1.8 5M11.2 12l1.8-5 1.8 5M17 12l1.8-5 1.8 5M22.8 12l1.8-5 1.8 5" fill="#fff7ea"/><rect x="3.5" y="12" width="25" height="9" rx="4.5" fill="#8e2b3a"/>
    <path d="M5.4 21l1.8 5 1.8-5M11.2 21l1.8 5 1.8-5M17 21l1.8 5 1.8-5M22.8 21l1.8 5 1.8-5" fill="#fff7ea"/>`,
  bean: can('#e8572a', `<path d="M13.2 15.4c1.6-1.6 4.4-1.2 5.4.6.8 1.6-.4 3.2-2.4 3-1.2-.1-1.6-1-3-.8-1 .1-1.2-1.6 0-2.8z" fill="#9a4a22" stroke-width="1.6"/>`),
  soda: can('#2fa8ff', `<circle cx="14.4" cy="17.6" r="1.7" fill="#9be22d" stroke-width="1.6"/><circle cx="18.2" cy="15.6" r="1.2" fill="#9be22d" stroke-width="1.6"/>`),
  balance: `<path d="M16 5.5v20M10 27h12"/><path d="M5 9.5h22" stroke-width="2.6"/><path d="M8.6 9.5L5 18h7.2zM23.4 9.5L19.8 18H27z" fill="#fff"/>
    <path d="M4.6 18a4 4 0 0 0 8 0zM19.4 18a4 4 0 0 0 8 0z" fill="#ffc93c"/><circle cx="16" cy="5" r="2" fill="#ff5a5f"/>`,
  toilet: `<path d="M8 4h16v10H8z" fill="#fff"/><path d="M5.5 14h21c0 5-3.6 8.6-8 9.4l1 4.6h-7.2l1-4.6c-4.4-.8-8-4.4-8-9.4z" fill="#fff"/><path d="M11 8h10" stroke-opacity=".4"/>`,
};

export function ic(name, cls = '') {
  const body = P[name];
  if (!body) return '';
  return `<svg class="ic ${cls}" viewBox="0 0 32 32" aria-hidden="true" stroke="${K}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-ic]').forEach((el) => { el.outerHTML = ic(el.dataset.ic, el.className); });
}
