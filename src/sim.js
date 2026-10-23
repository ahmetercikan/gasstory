import { clamp, lerp, rot, angDiff } from './util.js';
import { locate, sampleAt } from './track.js';

export const RAFT_R = 2.2;      // salın dış yarıçapı (duvar çarpışması)
export const HIT_R = 1.75;       // dikenlere karşı bağışlayıcı yarıçap
export const DECK_R = 1.75;     // üstünde yürünebilen alan
export const RIM_R = 1.98;      // karakterlerin durduğu simit çemberi
const RAFT_MASS = 2.2, TILT_MASS = 1.25;
const FART_F = 11, DRAG = 0.9, TORQUE_K = 0.45;
const TURN_SPEED = 2.5;         // kenarda dönme hızı (rad/sn)
const MIN_GAP = 0.62;           // iki karakter arası en az açı
const SLIP_TILT = 0.8;          // sal bu kadar yatınca alçak taraftakiler kayar
const MAX_HP = 3;
// Yerel açı a: konum (cos a, sin a)·R. Yerel ileri (0,-1) → a = -π/2, arka (0,1) → a = π/2.
const BACK = Math.PI / 2;

export class Sim {
  constructor(T, roster) {
    this.T = T;
    this.time = 0;
    this.mode = 'countdown'; this.modeT = 3.5;
    this.events = [];
    this.collected = new Set();
    this.cp = -1; this.deaths = 0; this.capsizes = 0; this.stars = 0; this.finishTime = 0; this.falls = 0;
    this.totalStars = T.objs.filter((o) => o.t === 'star').length;
    this.cps = T.objs.filter((o) => o.t === 'cp').sort((a, b) => a.s - b.s);
    this.hints = T.objs.filter((o) => o.t === 'hint');
    this.hintDone = new Set();
    this.raft = { x: 0, z: 0, y: 0, vx: 0, vz: 0, a: 0, va: 0, tx: 0, tz: 0, tvx: 0, tvz: 0, hp: MAX_HP, inv: 0, flip: 0, hint: -1, s: 0, u: 0, h: 0, slope: 0, prevSlope: 0 };
    this.players = roster.map((r) => ({
      slot: r.slot, name: r.name, char: r.char, power: r.power, bot: !!r.bot,
      ang: BACK, av: 0, slip: 0, lx: 0, lz: 0, face: 0, turnDir: 0,
      onRaft: true, wx: 0, wz: 0, wvx: 0, wvz: 0, wT: 0,
      meter: 1, charge: 0, gasOn: false, burpT: 0, boost: 0, dizzy: 0, moving: false, stinkT: 0,
      stat: { gas: 0, falls: 0, annoy: 0 },
    }));
    this.placeAt(LEAD_START);
  }

  ev(type, data = {}) { this.events.push({ type, ...data }); }

  placeAt(s) {
    const r = this.raft, T = this.T;
    const p = sampleAt(T, s);
    r.x = p.x; r.z = p.z; r.y = p.y; r.a = p.h; r.va = 0;
    r.vx = Math.sin(p.h) * p.cur; r.vz = -Math.cos(p.h) * p.cur;
    r.tx = r.tz = r.tvx = r.tvz = 0; r.hint = -1; r.flip = 0;
    r.hp = MAX_HP; r.inv = 1.5;
    // Herkes salın arka tarafından başlayarak eşit aralıklarla kenara dizilir
    const n = this.players.length;
    this.players.forEach((pl, i) => {
      pl.ang = BACK + (n > 1 ? (i - (n - 1) / 2) * (Math.PI * 2 / n) : 0);
      pl.av = 0; pl.slip = 0; pl.onRaft = true; pl.charge = 0; pl.gasOn = false; pl.meter = 1; pl.dizzy = 0;
      this.placeOnRim(pl);
    });
  }

  placeOnRim(p) {
    p.lx = Math.cos(p.ang) * RIM_R; p.lz = Math.sin(p.ang) * RIM_R;
    // Osuran popoyu dışarı (yüzü merkeze), geğiren yüzü dışarı verir
    p.face = p.power === 'fart' ? Math.atan2(-Math.cos(p.ang), Math.sin(p.ang)) : Math.atan2(Math.cos(p.ang), -Math.sin(p.ang));
  }

  // inputs: slot → { turn (-1..1: kenarda dönme), g (gaz basılı) }
  step(dt, inputs) {
    this.time += dt;
    const r = this.raft;
    if (this.mode === 'countdown') {
      const before = Math.ceil(this.modeT);
      this.modeT -= dt;
      if (Math.ceil(this.modeT) !== before && this.modeT > 0) this.ev('count', { n: Math.ceil(this.modeT) });
      if (this.modeT <= 0) { this.mode = 'play'; this.ev('go'); }
      this.updatePlayers(dt, inputs, false);
      this.updateTilt(dt);
      return;
    }
    if (this.mode === 'popped') {
      this.modeT -= dt;
      if (this.modeT <= 0) {
        this.deaths++;
        this.mode = 'play';
        this.placeAt(this.cp >= 0 ? this.cps[this.cp].s : LEAD_START);
        this.ev('respawn');
      }
      return;
    }
    if (this.mode === 'finished') {
      this.updatePlayers(dt, inputs, false);
      this.updateRaft(dt, 0, 0, 0, this.locate());
      this.updateTilt(dt);
      return;
    }
    // play
    r.inv = Math.max(0, r.inv - dt);
    r.flip = Math.max(0, r.flip - dt * 1.3);
    const loc = this.locate();
    const force = this.updatePlayers(dt, inputs, true);
    this.updateRaft(dt, force.fx, force.fz, force.tq, loc);
    this.collide(this.locate());
    this.updateTilt(dt);
    this.progress();
  }

  locate() {
    const r = this.raft;
    const loc = locate(this.T, r.x, r.z, r.hint);
    r.hint = loc.i; r.s = loc.s; r.u = loc.u; r.h = loc.h;
    return loc;
  }

  updatePlayers(dt, inputs, active) {
    const r = this.raft;
    let fx = 0, fz = 0;
    const on = this.players.filter((p) => p.onRaft);
    for (const p of this.players) {
      const inp = (p.bot ? this.botInput(p) : inputs[p.slot]) || { turn: 0, g: false };
      p.burpT = Math.max(0, p.burpT - dt);
      p.boost = Math.max(0, p.boost - dt);
      p.dizzy = Math.max(0, p.dizzy - dt);
      p.stinkT = Math.max(0, p.stinkT - dt);
      if (!p.onRaft) { this.swim(p, dt); continue; }

      // Kenar boyunca dönme
      let spd = TURN_SPEED;
      if (p.dizzy > 0) spd *= 0.5;
      if (p.charge > 0 || p.gasOn) spd *= 0.6;
      const turn = clamp(+inp.turn || 0, -1, 1);
      p.moving = Math.abs(turn) > 0.1;
      p.av *= Math.exp(-4 * dt);
      p.ang += (turn * spd + p.av) * dt;

      // Alçak taraftakiler kayar
      const toward = r.tx * Math.cos(p.ang) + r.tz * Math.sin(p.ang);
      p.slip = active && toward > SLIP_TILT ? p.slip + dt : Math.max(0, p.slip - dt * 2);
      if (p.slip > 0.35) { this.fallOff(p, 2.5); continue; }

      // Gaz: karakterin olduğu yerden salın merkezine doğru iter
      const [inx, inz] = rot(-Math.cos(p.ang), -Math.sin(p.ang), r.a);
      if (p.power === 'fart') {
        p.gasOn = active && inp.g && p.meter > 0.02;
        if (p.gasOn) {
          p.meter = Math.max(0, p.meter - dt * (p.boost > 0 ? 0.1 : 0.21));
          p.stat.gas += dt;
          const F = FART_F * (p.boost > 0 ? 1.6 : 1);
          fx += inx * F; fz += inz * F;
          // Yanındakileri koku çarpar
          for (const q of on) {
            if (q === p || Math.abs(angDiff(p.ang, q.ang)) > 0.95) continue;
            q.dizzy = Math.max(q.dizzy, 0.6);
            if (q.stinkT <= 0) { q.stinkT = 1.6; p.stat.annoy++; this.ev('stink', { slot: q.slot, by: p.slot }); }
          }
        } else p.meter = Math.min(1, p.meter + dt * 0.11);
      } else {
        p.gasOn = false;
        if (active && inp.g && (p.meter >= 0.12 || p.charge > 0)) {
          if (p.charge === 0) this.ev('charge', { slot: p.slot });
          p.charge = Math.min(1, p.charge + dt / 0.85);
        } else {
          if (p.charge > 0) {
            if (p.charge > 0.08 && active) {
              const c = p.charge, J = (5 + 11 * c) * (p.boost > 0 ? 1.5 : 1);
              const M = RAFT_MASS + on.length;
              r.vx += (inx * J) / M; r.vz += (inz * J) / M;
              // Geri tepme salı geğirenin tarafına sallar
              r.tvx += Math.cos(p.ang) * c * 1.6; r.tvz += Math.sin(p.ang) * c * 1.6;
              p.meter = Math.max(0, p.meter - (0.12 + 0.3 * c));
              p.burpT = 0.45; p.stat.gas += 1 + c * 2;
              // Yanındakileri kenar boyunca savurur
              for (const q of on) {
                const d = angDiff(p.ang, q.ang);
                if (q === p || Math.abs(d) > 1.1) continue;
                q.av += Math.sign(d || 1) * (2.5 + 4 * c); q.dizzy = 0.9;
                p.stat.annoy++;
                this.ev('blown', { slot: q.slot, by: p.slot });
              }
              this.ev('burp', { slot: p.slot, k: c });
            } else this.ev('burpCancel', { slot: p.slot });
            p.charge = 0;
          }
          p.meter = Math.min(1, p.meter + dt * 0.11);
        }
      }
    }
    // Kenarda birbirinin içinden geçmesinler
    const onNow = on.filter((p) => p.onRaft);
    for (let it = 0; it < 2; it++) for (let i = 0; i < onNow.length; i++) for (let j = i + 1; j < onNow.length; j++) {
      const a = onNow[i], b = onNow[j], d = angDiff(a.ang, b.ang);
      if (Math.abs(d) < MIN_GAP) {
        const push = (MIN_GAP - Math.abs(d)) / 2 * Math.sign(d || 1);
        a.ang -= push; b.ang += push;
      }
    }
    for (const p of onNow) this.placeOnRim(p);
    return { fx, fz, tq: 0 };
  }

  fallOff(p, v) {
    const r = this.raft;
    p.onRaft = false; p.gasOn = false; p.charge = 0; p.slip = 0;
    const [wx, wz] = rot(Math.cos(p.ang), Math.sin(p.ang), r.a);
    p.wx = r.x + wx * (RAFT_R + 0.5); p.wz = r.z + wz * (RAFT_R + 0.5);
    p.wvx = r.vx + wx * v; p.wvz = r.vz + wz * v;
    p.wT = 5;
    this.falls++; p.stat.falls++;
    this.ev('fall', { slot: p.slot });
  }

  // Suya düşen sala doğru yüzer; değince ya da 5 sn sonra kenara tırmanır.
  swim(p, dt) {
    const r = this.raft;
    const loc = locate(this.T, p.wx, p.wz, r.hint);
    const dx0 = r.x - p.wx, dz0 = r.z - p.wz, d0 = Math.hypot(dx0, dz0) || 1;
    const k = Math.min(1, dt * 2.5);
    p.wvx = lerp(p.wvx, loc.fx * loc.cur + (dx0 / d0) * 2.6, k);
    p.wvz = lerp(p.wvz, loc.fz * loc.cur + (dz0 / d0) * 2.6, k);
    p.wx += p.wvx * dt; p.wz += p.wvz * dt;
    p.moving = true;
    const lim = loc.w - 0.6;
    if (Math.abs(loc.u) > lim) { const o = (Math.abs(loc.u) - lim) * Math.sign(loc.u); p.wx -= loc.rx * o; p.wz -= loc.rz * o; }
    const [lfx, lfz] = rot(dx0, dz0, -r.a);
    p.face = Math.atan2(lfx, -lfz);
    p.wT -= dt;
    const dx = p.wx - r.x, dz = p.wz - r.z, d = Math.hypot(dx, dz);
    if (this.mode === 'play' && (d < RAFT_R + 0.45 || p.wT <= 0)) {
      p.onRaft = true; p.av = 0; p.slip = 0;
      const [lx, lz] = rot(dx, dz, -r.a);
      p.ang = Math.atan2(lz, lx);
      this.placeOnRim(p);
      this.ev(p.wT <= 0 ? 'rescue' : 'climb', { slot: p.slot });
    }
  }

  updateRaft(dt, fx, fz, tq, loc) {
    const r = this.raft;
    const n = this.players.filter((p) => p.onRaft).length;
    const M = RAFT_MASS + n, I = M * 1.6;
    let cx = loc.fx * loc.cur, cz = loc.fz * loc.cur;
    let spinTarget = null;
    for (const o of this.T.objs) {
      if (o.t === 'whirl') {
        const dx = r.x - o.x, dz = r.z - o.z, d = Math.hypot(dx, dz), R = o.r * 1.5;
        if (d < R && d > 0.01) {
          const f = 1 - d / R;
          // Teğet akıntı + merkeze çekim
          cx += (-dz / d) * 5.5 * f - (dx / d) * 3 * f;
          cz += (dx / d) * 5.5 * f - (dz / d) * 3 * f;
          spinTarget = 3.2 * f;
        }
      } else if (o.t === 'rapids' && r.s > o.s && r.s < o.e) {
        const w = Math.sin(this.time * 1.4 + r.s * 0.25) * o.amp * 7;
        cx += loc.rx * w; cz += loc.rz * w;
      }
    }
    r.vx += (DRAG * (cx - r.vx) + fx / M) * dt;
    r.vz += (DRAG * (cz - r.vz) + fz / M) * dt;
    r.x += r.vx * dt; r.z += r.vz * dt;
    r.va += ((TORQUE_K * tq) / I) * dt;
    if (spinTarget != null) r.va += (spinTarget - r.va) * dt * 1.2;
    r.va *= Math.exp(-1.4 * dt);
    r.a += r.va * dt;
    // Yükseklik + şelale inişi
    r.prevSlope = r.slope; r.slope = loc.slope;
    r.y = lerp(r.y, loc.y, Math.min(1, dt * 15));
    if (r.prevSlope < -0.3 && r.slope > -0.2 && this.mode === 'play') {
      this.ev('land');
      const a = Math.random() * Math.PI * 2;
      r.tvx += Math.cos(a) * 3.2; r.tvz += Math.sin(a) * 3.2;
      for (const p of this.players) if (p.onRaft) p.av += (Math.random() - 0.5) * 5;
    }
  }

  // Bir dünya kuvveti/darbesini yolculara ve eğime aktar
  jolt(wx, wz, k) {
    const r = this.raft;
    const [lx, lz] = rot(wx, wz, -r.a);
    r.tvx += lx * k * 0.9; r.tvz += lz * k * 0.9;
    // Sert darbede çarpma tarafındaki yolcular suya uçabilir
    for (const p of this.players) if (p.onRaft && k > 2.4 && (Math.cos(p.ang) * lx + Math.sin(p.ang) * lz) > 0.75 && Math.random() < 0.5) this.fallOff(p, 2);
  }

  collide(loc) {
    const r = this.raft;
    // Kıyı duvarları
    const lim = loc.w - RAFT_R;
    if (Math.abs(loc.u) > lim) {
      const sg = Math.sign(loc.u), o = Math.abs(loc.u) - lim;
      r.x -= loc.rx * o * sg; r.z -= loc.rz * o * sg;
      const vn = (r.vx * loc.rx + r.vz * loc.rz) * sg;
      if (vn > 0) {
        r.vx -= loc.rx * sg * vn * 1.35; r.vz -= loc.rz * sg * vn * 1.35;
        const along = r.vx * loc.fx + r.vz * loc.fz;
        r.va += -sg * along * 0.06;
        if (vn > 1.3) { this.ev('bump', { v: vn }); this.jolt(loc.rx * sg, loc.rz * sg, vn * 0.6); }
      }
    }
    for (const o of this.T.objs) {
      if (Math.abs(o.s - r.s) > 14) continue;
      if (o.t === 'rock') {
        const dx = r.x - o.x, dz = r.z - o.z, d = Math.hypot(dx, dz), m = RAFT_R + o.r * 0.85;
        if (d < m && d > 0.01) {
          let ux = dx / d, uz = dz / d;
          // Kaya ile kıyı arasında sıkışmasın: duvara doğru itecekse yanal bileşeni nehrin ortasına çevir
          const lat = ux * loc.rx + uz * loc.rz;
          if (Math.abs(loc.u) > loc.w - RAFT_R - 0.6 && Math.sign(lat) === Math.sign(loc.u)) {
            ux -= 2 * lat * loc.rx; uz -= 2 * lat * loc.rz;
          }
          r.x += ux * (m - d); r.z += uz * (m - d);
          const vn = -(r.vx * ux + r.vz * uz);
          if (vn > 0) {
            r.vx += ux * vn * 1.4; r.vz += uz * vn * 1.4;
            r.va += (Math.random() - 0.5) * vn * 0.4;
            if (vn > 1) { this.ev('bump', { v: vn }); this.jolt(-ux, -uz, vn * 0.6); }
          }
        }
      } else if (o.t === 'arc' || o.t === 'bar' || o.t === 'log') {
        const hit = spikeHit(o, r.x, r.z, this.time);
        if (hit && r.inv <= 0) this.spiked(hit[0], hit[1]);
      } else if ((o.t === 'star' || o.t === 'bean' || o.t === 'soda') && !this.collected.has(o.id)) {
        const d = Math.hypot(r.x - o.x, r.z - o.z);
        let got = d < RAFT_R + 0.5;
        if (!got) for (const p of this.players) if (!p.onRaft && Math.hypot(p.wx - o.x, p.wz - o.z) < 1.1) got = true;
        if (got) this.pickup(o);
      }
    }
  }

  spiked(nx, nz) {
    const r = this.raft;
    r.hp--; r.inv = 1.6;
    r.vx += nx * 5.5; r.vz += nz * 5.5;
    r.va += (Math.random() - 0.5) * 2.5;
    this.jolt(-nx, -nz, 3);
    if (r.hp <= 0) {
      this.mode = 'popped'; this.modeT = 2.6;
      for (const p of this.players) if (p.onRaft) {
        const [wx, wz] = rot(p.lx, p.lz, r.a);
        p.onRaft = false; p.wx = r.x + wx * 1.3; p.wz = r.z + wz * 1.3; p.wvx = r.vx + wx; p.wvz = r.vz + wz; p.wT = 99; p.gasOn = false; p.charge = 0;
      }
      this.ev('pop');
    } else this.ev('hit', { hp: r.hp });
  }

  pickup(o) {
    this.collected.add(o.id);
    if (o.t === 'star') { this.stars++; this.ev('star', { id: o.id }); return; }
    const pow = o.t === 'bean' ? 'fart' : 'burp';
    for (const p of this.players) { p.meter = 1; if (p.power === pow) p.boost = 5; }
    this.ev(o.t, { id: o.id });
  }

  updateTilt(dt) {
    const r = this.raft;
    let sx = 0, sz = 0, m = TILT_MASS;
    for (const p of this.players) if (p.onRaft) { sx += p.lx; sz += p.lz; m += 1; }
    let gx = sx / m / DECK_R, gz = sz / m / DECK_R;
    // Hafif dalga + akıntı bölgelerinde güçlü dalga
    let amp = 0.04;
    for (const o of this.T.objs) if (o.t === 'rapids' && r.s > o.s && r.s < o.e) amp = Math.max(amp, o.amp);
    if (r.slope < -0.3) amp = Math.max(amp, 0.25);
    gx += Math.sin(this.time * 2.7) * amp; gz += Math.cos(this.time * 2.1 + 1) * amp;
    r.tvx += ((gx - r.tx) * 40 - r.tvx * 7) * dt;
    r.tvz += ((gz - r.tz) * 40 - r.tvz * 7) * dt;
    r.tx += r.tvx * dt; r.tz += r.tvz * dt;
    if (this.mode === 'play' && Math.hypot(r.tx, r.tz) > 1) this.capsize();
  }

  capsize() {
    const r = this.raft;
    const tm = Math.hypot(r.tx, r.tz), ux = r.tx / tm, uz = r.tz / tm;
    for (const p of this.players) if (p.onRaft) {
      const [wx, wz] = rot(ux, uz, r.a);
      p.onRaft = false; p.gasOn = false; p.charge = 0;
      const [ox, oz] = rot(p.lx, p.lz, r.a);
      p.wx = r.x + ox + wx * 1.6; p.wz = r.z + oz + wz * 1.6;
      p.wvx = r.vx + wx * 3; p.wvz = r.vz + wz * 3; p.wT = 4; p.stat.falls++;
    }
    r.tx = r.tz = r.tvx = r.tvz = 0; r.flip = 1;
    this.capsizes++;
    r.hp--; r.inv = 1.5;
    if (r.hp <= 0) { this.mode = 'popped'; this.modeT = 2.6; this.ev('pop'); }
    else this.ev('capsize', { hp: r.hp });
  }

  progress() {
    const r = this.raft;
    for (let i = this.cp + 1; i < this.cps.length; i++) if (r.s > this.cps[i].s) { this.cp = i; this.ev('cp', { i }); }
    for (const h of this.hints) if (!this.hintDone.has(h.id) && r.s > h.s) { this.hintDone.add(h.id); this.ev('hint', { text: h.text }); }
    if (r.s >= this.T.finishS) {
      this.mode = 'finished'; this.finishTime = this.time - 3.5; this.modeT = 0;
      for (const p of this.players) { p.gasOn = false; p.charge = 0; }
      this.ev('finish');
    }
  }

  // --- Botlar: kenarda dengeyi korur; itmek gerekirse biri itilecek yönün tam karşısına geçip gaz verir.
  botInput(p) {
    const r = this.raft, T = this.T;
    if (!p.onRaft) return { turn: 0, g: false };
    const loc = locate(T, r.x, r.z, r.hint);
    const { want } = this.botPlan(loc);
    const curLat = r.vx * loc.rx + r.vz * loc.rz;
    const need = want - curLat;
    p.botGas = Math.abs(need) > (p.botGas ? 0.35 : 0.8);
    const bots = this.players.filter((q) => q.bot && q.onRaft);
    // İtilecek yön (dünya) → itici o yönün tersinde, kenarda durmalı
    let pushAng = null;
    if (p.botGas) {
      const sg = Math.sign(need);
      const [lx, lz] = rot(-loc.rx * sg, -loc.rz * sg, -r.a);
      pushAng = Math.atan2(lz, lx);
    }
    let pusher = null;
    if (pushAng != null) {
      let best = Infinity;
      for (const q of bots) { const d = Math.abs(angDiff(q.ang, pushAng)); if (d < best) { best = d; pusher = q; } }
    }
    let target;
    if (p === pusher) target = pushAng;
    else {
      // Sabit ağırlıklar (insanlar + itici) dışındaki botlar dengeyi sağlayacak şekilde yayılır
      let sx = 0, sz = 0;
      for (const q of this.players) if (q.onRaft && (!q.bot || q === pusher)) { const a = q === pusher ? pushAng : q.ang; sx += Math.cos(a); sz += Math.sin(a); }
      const free = bots.filter((q) => q !== pusher), k = free.indexOf(p), nb = free.length;
      const base = Math.hypot(sx, sz) < 0.2 ? BACK + Math.PI / nb : Math.atan2(-sz, -sx);
      const spread = nb > 1 ? Math.min(1.4, (Math.PI * 1.6) / nb) : 0;
      target = base + (k - (nb - 1) / 2) * spread;
      if (Math.hypot(sx, sz) < 0.2 && nb > 1) target = BACK + (k / nb) * Math.PI * 2;
    }
    const diff = angDiff(p.ang, target);
    const turn = Math.abs(diff) < 0.08 ? 0 : clamp(diff * 2.2, -1, 1);
    // Gaz: bot itiş yönüne uygun yerdeyse
    let g = false;
    if (p.botGas && pushAng != null && Math.abs(angDiff(p.ang, pushAng)) < 0.45) {
      g = p.power === 'fart' ? p.meter > 0.15 : (p.charge < 0.7 && p.meter > 0.3);
    }
    return { turn, g };
  }

  // Botların ortak rota planı: ileriye bakıp her engelin varış anındaki konumuna göre
  // kapalı şeritleri işaretler, en yakın boş şeridi seçer. Aynı karede bir kez hesaplanır.
  botPlan(loc) {
    if (this._plan && this._plan.t === this.time) return this._plan;
    const r = this.raft, T = this.T;
    const lim = loc.w - RAFT_R;
    const vAlong = Math.max(1.5, r.vx * loc.fx + r.vz * loc.fz);
    const M = HIT_R + 0.7;
    const cand = [];
    for (let u = -lim; u <= lim + 1e-6; u += 0.25) cand.push({ u, cost: Math.abs(u - loc.u) * 0.25 + Math.abs(u) * 0.05 });
    for (const o of T.objs) {
      const ds = o.s - r.s;
      if (ds < -3 || ds > 20) continue;
      const tA = this.time + Math.max(0, ds) / vAlong;
      const w = ds < 8 ? 60 : 30;
      let lo = null, hi = null;
      if (o.t === 'rock') { lo = o.u - o.r - RAFT_R + 0.3; hi = o.u + o.r + RAFT_R - 0.3; }
      else if (o.t === 'whirl') { lo = o.u - o.r * 1.1 - 1; hi = o.u + o.r * 1.1 + 1; }
      else if (o.t === 'arc') { lo = o.u - o.r - M; hi = o.u + o.r + M; }
      else if (o.t === 'bar') { const ext = Math.abs(Math.cos(o.spin * tA)) * o.len + 0.3; lo = o.u - ext - M; hi = o.u + ext + M; }
      else if (o.t === 'log') { const c = o.amp * Math.sin(o.speed * tA); lo = c - o.len / 2 - M; hi = c + o.len / 2 + M; }
      else if ((o.t === 'star' || o.t === 'bean' || o.t === 'soda') && !this.collected.has(o.id) && ds > 0 && ds < 14) {
        for (const c of cand) c.cost -= Math.max(0, 2 - Math.abs(c.u - o.u)) * (o.t === 'star' ? 1.2 : 0.8);
      }
      if (lo != null) for (const c of cand) if (c.u > lo && c.u < hi) c.cost += w * (1 - Math.max(0, ds) / 25);
    }
    let best = cand[0];
    for (const c of cand) if (c.cost < best.cost) best = c;
    const want = clamp((best.u - loc.u) * 1.4, -3.5, 3.5);
    this._plan = { t: this.time, want, target: best.u };
    return this._plan;
  }

  // --- Ağ: durum anlık görüntüsü
  snapshot() {
    const r = this.raft, f = (v) => Math.round(v * 1000) / 1000;
    return {
      t: f(this.time), m: this.mode, mt: f(this.modeT),
      r: [r.x, r.z, r.y, r.a, r.vx, r.vz, r.va, r.tx, r.tz, r.hp, r.inv, r.flip].map(f),
      p: this.players.map((p) => [p.ang, p.onRaft ? 1 : 0, p.wx, p.wz, p.meter, p.charge, p.gasOn ? 1 : 0, p.burpT, p.boost, p.dizzy, p.moving ? 1 : 0, p.face].map(f)),
      c: [...this.collected], cp: this.cp, st: this.stars, d: this.deaths, ft: f(this.finishTime), cz: this.capsizes, fl: this.falls,
    };
  }

  applySnapshot(S) {
    const r = this.raft;
    this.time = S.t; this.mode = S.m; this.modeT = S.mt;
    const R = S.r;
    r.tgt = R;
    r.vx = R[4]; r.vz = R[5]; r.va = R[6]; r.tx = R[7]; r.tz = R[8]; r.hp = R[9]; r.inv = R[10]; r.flip = R[11];
    if (r.first !== true) { r.x = R[0]; r.z = R[1]; r.y = R[2]; r.a = R[3]; r.first = true; }
    (S.p || []).forEach((a, i) => {
      const p = this.players[i]; if (!p) return;
      p.tgt = a;
      const wasOn = p.onRaft;
      p.onRaft = !!a[1]; p.meter = a[4]; p.charge = a[5]; p.gasOn = !!a[6]; p.burpT = a[7]; p.boost = a[8]; p.dizzy = a[9]; p.moving = !!a[10];
      if (wasOn !== p.onRaft || p.first !== true) { p.ang = a[0]; p.wx = a[2]; p.wz = a[3]; p.first = true; }
    });
    this.collected = new Set(S.c || []); this.cp = S.cp; this.stars = S.st; this.deaths = S.d; this.finishTime = S.ft; this.capsizes = S.cz; this.falls = S.fl;
  }

  // İstemcide anlık görüntüler arasında yumuşatma
  clientUpdate(dt) {
    const r = this.raft;
    this.time += dt;
    if (this.mode === 'countdown') this.modeT -= dt;
    if (!r.tgt) return;
    const k = Math.min(1, dt * 10), R = r.tgt;
    R[0] += r.vx * dt; R[1] += r.vz * dt; R[3] += r.va * dt;
    r.x = lerp(r.x, R[0], k); r.z = lerp(r.z, R[1], k); r.y = lerp(r.y, R[2], k);
    r.a += angDiff(r.a, R[3]) * k;
    const loc = locate(this.T, r.x, r.z, r.hint); r.hint = loc.i; r.s = loc.s; r.u = loc.u; r.h = loc.h;
    for (const p of this.players) {
      if (!p.tgt) continue;
      const a = p.tgt;
      p.ang += angDiff(p.ang, a[0]) * Math.min(1, k * 1.6);
      p.wx = lerp(p.wx, a[2], k); p.wz = lerp(p.wz, a[3], k);
      if (p.onRaft) this.placeOnRim(p); else p.face = a[11];
    }
  }

  // Yerel oyuncunun kendi dönüşünü beklemeden göstermek için (istemci tahmini)
  predictTurn(slot, turn, dt) {
    const p = this.players.find((q) => q.slot === slot);
    if (!p || !p.onRaft || !p.tgt) return;
    p.tgt[0] += clamp(turn, -1, 1) * TURN_SPEED * (p.dizzy > 0 ? 0.5 : 1) * dt;
  }
}

export const LEAD_START = 6;

// Dikenli engel çarpışması: [nx, nz] (salı iten yön) ya da null.
export function spikeHit(o, x, z, t) {
  const fx = Math.sin(o.h), fz = -Math.cos(o.h), rx = Math.cos(o.h), rz = Math.sin(o.h);
  if (o.t === 'arc') {
    const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz);
    if (Math.abs(d - o.r) > HIT_R + 0.3 || d < 0.01) return null;
    const phi = Math.atan2(dx * fx + dz * fz, dx * rx + dz * rz);
    const a0 = ((o.rot * Math.PI) / 180) + (o.spin || 0) * t;
    const span = (o.span * Math.PI) / 180;
    let rel = (((phi - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const margin = Math.asin(Math.min(1, (HIT_R * 0.6) / Math.max(d, HIT_R)));
    if (rel > span + margin && rel < Math.PI * 2 - margin) return null;
    const sg = d > o.r ? 1 : -1;
    return [(dx / d) * sg, (dz / d) * sg];
  }
  let ax, az, bx, bz;
  if (o.t === 'bar') {
    const a = o.spin * t;
    const cx = Math.cos(a) * rx + Math.sin(a) * fx, cz = Math.cos(a) * rz + Math.sin(a) * fz;
    ax = o.x - cx * o.len; az = o.z - cz * o.len; bx = o.x + cx * o.len; bz = o.z + cz * o.len;
  } else {
    const u = o.amp * Math.sin(o.speed * t);
    const cx = o.x + rx * u, cz = o.z + rz * u;
    ax = cx - rx * o.len / 2; az = cz - rz * o.len / 2; bx = cx + rx * o.len / 2; bz = cz + rz * o.len / 2;
  }
  const ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez;
  const tt = clamp(((x - ax) * ex + (z - az) * ez) / L2, 0, 1);
  const px = ax + ex * tt, pz = az + ez * tt, dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
  if (d > HIT_R + 0.3 || d < 0.001) return null;
  return [dx / d, dz / d];
}

// Engelin anlık konumu (görsel için de aynı formül)
export function logOffset(o, t) { return o.amp * Math.sin(o.speed * t); }
