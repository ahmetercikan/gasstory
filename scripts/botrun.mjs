// Her bölümü yalnızca botlarla oynatır ve sonuçları yazar: node scripts/botrun.mjs [deneme]
import { LEVELS, buildTrack } from '../src/track.js';
import { Sim } from '../src/sim.js';
const N = +process.argv[2] || 4;
for (let li = 0; li < LEVELS.length; li++) {
  const T = buildTrack(LEVELS[li]);
  for (const team of [[0, 'fart'], [0, 'fart', 1, 'burp', 2, 'fart'], [0, 'burp']]) {
    const res = [];
    for (let k = 0; k < N; k++) {
      const roster = [];
      for (let i = 0; i < team.length; i += 2) roster.push({ slot: roster.length, name: 'b' + i, char: team[i], power: team[i + 1], bot: true });
      const sim = new Sim(T, roster);
      let t = 0; const hits = {};
      while (sim.mode !== 'finished' && t < 400) {
        sim.step(1 / 60, {}); t += 1 / 60;
        for (const e of sim.events) hits[e.type] = (hits[e.type] || 0) + 1;
        sim.events.length = 0;
      }
      res.push({ fin: sim.mode === 'finished', time: sim.finishTime.toFixed(0), st: sim.stars + '/' + sim.totalStars, pop: sim.deaths, cap: sim.capsizes, fall: sim.falls, hit: hits.hit || 0, bump: hits.bump || 0 });
    }
    console.log(LEVELS[li].name, 'takım', roster2(team), JSON.stringify(res));
  }
}
function roster2(t) { const o = []; for (let i = 0; i < t.length; i += 2) o.push(t[i + 1]); return o.join('+'); }
