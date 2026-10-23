// Simgeler: Çizio ile aynı dil — lucide'nin yuvarlak uçlu çizgi simgeleri; önemli yerlerde
// renkli, yumuşak köşeli karo içinde beyaz çizilir.
// ic('fart') → çizgi simge (rengi yazı renginden alır). tile('fart', 'green') → karolu simge.
// HTML'de <i data-ic="fart"></i> ya da <i data-ic="fart" class="tile green"></i>; hydrateIcons() doldurur.
import {
  Wind, Megaphone, LifeBuoy, Star, RadioTower, KeyRound, CircleHelp, Volume2, VolumeX, Music, Pause,
  ChevronLeft, ChevronRight, ArrowRight, Share2, Bot, X, Rocket, Trophy, Medal, Timer, Waves, Bomb, Crown,
  Angry, Zap, Annoyed, Users, Leaf, Mountain, Droplets, RotateCcw, House, LogOut, Check, Flag, MoveHorizontal,
  TriangleAlert, Bean, CupSoda, Scale, Globe, Send, UserPlus, Trash2, Mail, Play,
} from 'lucide';

const NODES = {
  fart: Wind, burp: Megaphone, buoy: LifeBuoy, star: Star, online: RadioTower, key: KeyRound, help: CircleHelp,
  sound: Volume2, mute: VolumeX, music: Music, pause: Pause, back: ChevronLeft, left: ChevronLeft, right: ChevronRight,
  next: ArrowRight, share: Share2, bot: Bot, close: X, rocket: Rocket, trophy: Trophy, medal: Medal,
  gold: Medal, silver: Medal, bronze: Medal, timer: Timer, water: Waves, boom: Bomb, crown: Crown, devil: Angry,
  bolt: Zap, sick: Annoyed, people: Users, leaf: Leaf, canyon: Mountain, waterfall: Droplets, again: RotateCcw,
  home: House, door: LogOut, check: Check, flag: Flag, joystick: MoveHorizontal, spikes: TriangleAlert,
  bean: Bean, soda: CupSoda, balance: Scale, globe: Globe, send: Send, addFriend: UserPlus, trash: Trash2,
  mail: Mail, play: Play,
};
// Karo renkleri (Çizio paleti)
export const TILE = {
  orange: '#ff7a45', green: '#22b573', blue: '#3d8bfd', purple: '#8b5cf6', yellow: '#f5b301',
  red: '#ef4444', teal: '#14b8a6', pink: '#ec4899', gold: '#f5b301', silver: '#94a3b8', bronze: '#c2703d',
};
// Simgenin doğal karo rengi (karo istenip renk verilmezse)
const DEFAULT_TILE = {
  fart: 'green', burp: 'yellow', buoy: 'orange', star: 'yellow', online: 'blue', key: 'purple', help: 'blue',
  gold: 'gold', silver: 'silver', bronze: 'bronze', trophy: 'yellow', crown: 'yellow', devil: 'purple', water: 'blue',
  boom: 'red', leaf: 'green', canyon: 'orange', waterfall: 'teal', globe: 'teal', people: 'pink', bot: 'blue',
  rocket: 'orange', bean: 'orange', soda: 'blue', balance: 'purple', spikes: 'red', joystick: 'blue', mail: 'blue',
};

const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');

export function ic(name, cls = '') {
  const node = NODES[name];
  if (!node) return '';
  const body = node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function tile(name, color, cls = '') {
  const c = TILE[color] || TILE[DEFAULT_TILE[name]] || TILE.blue;
  return `<span class="tile ${cls}" style="--tc:${c}">${ic(name)}</span>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-ic]').forEach((el) => {
    const cls = el.className.split(/\s+/).filter(Boolean);
    if (cls.includes('tile')) {
      const color = cls.find((c) => TILE[c]);
      el.outerHTML = tile(el.dataset.ic, color, cls.filter((c) => c !== 'tile' && c !== color).join(' '));
    } else el.outerHTML = ic(el.dataset.ic, el.className);
  });
}
