import Peer from 'peerjs';

// WebRTC (PeerJS) ile eşler arası bağlantı. Oda kuran cihaz oyunu yönetir (host),
// diğerleri girişlerini gönderir ve durum anlık görüntülerini alır.
const PREFIX = 'gasstory-v1-';
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const net = {
  role: 'local', // 'local' | 'host' | 'client'
  peer: null, conns: new Map(), host: null, code: '', myId: 'host',
  onMsg: null, onJoin: null, onLeave: null, onClose: null,
};

const newCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');

function errText(err) {
  const t = err?.type || '';
  if (t === 'peer-unavailable') return 'Bu kodla bir oda bulunamadı.';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'Sunucuya bağlanılamadı. İnternetini kontrol et.';
  if (t === 'browser-incompatible') return 'Bu cihaz online oyunu desteklemiyor.';
  return 'Bağlantı hatası: ' + (t || err?.message || 'bilinmiyor');
}

export function hostRoom() {
  closeNet();
  return new Promise((resolve, reject) => {
    let tries = 0;
    const attempt = () => {
      const code = newCode();
      const peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on('open', () => {
        net.role = 'host'; net.peer = peer; net.code = code; net.myId = 'host';
        resolve(code);
      });
      peer.on('connection', (conn) => {
        conn.on('open', () => { net.conns.set(conn.peer, conn); });
        conn.on('data', (d) => {
          if (d?.t === 'hello') net.onJoin?.(conn.peer, d);
          else net.onMsg?.(d, conn.peer);
        });
        const gone = () => { if (net.conns.delete(conn.peer)) net.onLeave?.(conn.peer); };
        conn.on('close', gone);
        conn.on('error', gone);
      });
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && tries++ < 5) { peer.destroy(); attempt(); return; }
        if (net.peer === peer && net.role === 'host') net.onClose?.(errText(err));
        else { peer.destroy(); reject(new Error(errText(err))); }
      });
      peer.on('disconnected', () => { if (net.peer === peer && !peer.destroyed) peer.reconnect(); });
    };
    attempt();
  });
}

export function joinRoom(code, hello) {
  closeNet();
  code = code.trim().toUpperCase();
  return new Promise((resolve, reject) => {
    const peer = new Peer({ debug: 0 });
    let opened = false;
    const timer = setTimeout(() => { if (!opened) { peer.destroy(); reject(new Error('Oda yanıt vermedi. Kodu kontrol et.')); } }, 12000);
    peer.on('open', (id) => {
      const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      conn.on('open', () => {
        opened = true; clearTimeout(timer);
        net.role = 'client'; net.peer = peer; net.host = conn; net.code = code; net.myId = id;
        conn.send({ t: 'hello', ...hello });
        resolve(id);
      });
      conn.on('data', (d) => net.onMsg?.(d, 'host'));
      conn.on('close', () => { if (net.host === conn) net.onClose?.('Oda kapandı.'); });
      conn.on('error', () => { if (net.host === conn) net.onClose?.('Bağlantı koptu.'); });
    });
    peer.on('error', (err) => {
      if (!opened) { clearTimeout(timer); peer.destroy(); reject(new Error(errText(err))); }
      else if (net.peer === peer) net.onClose?.(errText(err));
    });
  });
}

export function broadcast(msg) { for (const c of net.conns.values()) if (c.open) c.send(msg); }
export function sendTo(id, msg) { const c = net.conns.get(id); if (c?.open) c.send(msg); }
export function sendToHost(msg) { if (net.host?.open) net.host.send(msg); }
export function kick(id, msg) { const c = net.conns.get(id); if (c) { if (msg) c.send(msg); setTimeout(() => c.close(), 300); net.conns.delete(id); } }

export function closeNet() {
  const p = net.peer;
  net.role = 'local'; net.peer = null; net.host = null; net.code = ''; net.myId = 'host';
  net.conns.clear();
  if (p && !p.destroyed) p.destroy();
}
