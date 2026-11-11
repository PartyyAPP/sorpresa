(() => {
  const B = window.BUSQUEDA;
  const app = document.getElementById('app');
  const total = B.pistas.length + 1;
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/ ]/g, '').replace(/\s+/g, ' ').trim();
  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const solved = () => { try { return JSON.parse(localStorage.getItem('busqueda-ok') || '[]'); } catch { return []; } };
  const markSolved = n => { try { const s = new Set(solved()); s.add(n); localStorage.setItem('busqueda-ok', JSON.stringify([...s])); } catch {} };

  function header(n) {
    return `<div class="top"><span>${n === total ? 'La última' : `Pista ${n}`}</span><span>💌</span></div>`;
  }
  function frame(n, p) {
    app.innerHTML = `${header(n)}<h1>${p.titulo}</h1>${p.texto ? `<p>${p.texto}</p>` : ''}<div id="body"></div><div id="after"></div>`;
    window.scrollTo(0, 0);
    return app.querySelector('#body');
  }
  function reveal(n, p) {
    markSolved(n); confetti();
    const s = p.siguiente || {};
    const box = el(`<div class="reveal"><span class="lbl">¡Conseguido! · siguiente escondite</span>
      <div class="txt">${s.texto || ''}</div>${s.foto ? `<img src="${s.foto}" alt="">` : ''}
      <p>Encuentra la tarjeta y escanea su código.</p></div>`);
    const after = app.querySelector('#after'); after.innerHTML = ''; after.appendChild(box);
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }
  function answerBox(body, p, n, extra) {
    const wrap = el(`<div style="display:flex;flex-direction:column;gap:10px">
      ${p.pregunta ? `<p style="color:var(--ink);font-weight:600;text-align:center">${p.pregunta}</p>` : ''}
      <input class="answer" placeholder="Escribe aquí" autocomplete="off" autocapitalize="off">
      <button class="btn">Comprobar</button><div class="feedback"></div></div>`);
    body.appendChild(wrap);
    const inp = wrap.querySelector('input'), fb = wrap.querySelector('.feedback');
    let fails = 0;
    const check = () => {
      const v = norm(inp.value);
      if ((p.respuestas || []).map(norm).includes(v)) { wrap.querySelector('button').disabled = true; fb.style.color = 'var(--ok)'; fb.textContent = '¡Eso es!'; reveal(n, p); }
      else { fails++; fb.textContent = fails >= 2 && p.pista ? `Pista: ${p.pista}` : ['Casi… prueba otra vez', 'Nop 🙈', 'Piénsalo bien…'][fails % 3]; }
    };
    wrap.querySelector('button').onclick = check;
    inp.onkeydown = e => { if (e.key === 'Enter') check(); };
    if (extra) extra(wrap);
  }

  // ---------- Mecánicas ----------
  const M = {};
  M.zoom = (n, p) => {
    const body = frame(n, p);
    const st = el(`<div class="stage"><img src="${p.foto}" alt=""></div>`); body.appendChild(st);
    const img = st.querySelector('img');
    const [fx, fy] = p.foco || [0.5, 0.5];
    img.style.transformOrigin = `${fx * 100}% ${fy * 100}%`;
    const t0 = performance.now(), D = 24000;
    let done = false;
    const tick = now => {
      if (done) return;
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 2.4);
      img.style.transform = `scale(${16 - 15 * e})`;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const b = el(`<button class="btn" style="margin-top:12px">¡Ya sé dónde es!</button>`); body.appendChild(b);
    b.onclick = () => { done = true; img.style.transition = 'transform .8s'; img.style.transform = 'scale(1)'; b.remove(); reveal(n, p); };
  };
  M.cancion = (n, p) => {
    const body = frame(n, p);
    const c = p.cancion;
    const v = el(`<div><div class="vinyl"></div><div class="songname">${c.titulo}<small>${c.artista}</small></div></div>`);
    body.appendChild(v);
    const go = el(`<a class="btn" style="display:block;text-align:center;text-decoration:none;margin-top:10px" target="_blank" rel="noopener" href="${c.enlace}">▶︎ Escuchar</a>`);
    body.appendChild(go);
    go.onclick = () => v.querySelector('.vinyl').classList.add('play');
    answerBox(body, p, n);
  };
  M.rasca = (n, p) => {
    const body = frame(n, p);
    const st = el(`<div class="stage"><img src="${p.foto}" alt=""><canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas></div>`);
    body.appendChild(st);
    const cv = st.querySelector('canvas'), ctx = cv.getContext('2d');
    const size = () => { const r = st.getBoundingClientRect(); cv.width = r.width * 2; cv.height = r.height * 2;
      const g = ctx.createLinearGradient(0, 0, cv.width, cv.height); g.addColorStop(0, '#c9a24f'); g.addColorStop(.5, '#f4dc9a'); g.addColorStop(1, '#b8892f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = 'rgba(60,40,0,.55)'; ctx.font = `800 ${cv.width / 9}px Manrope, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('RASCA AQUÍ', cv.width / 2, cv.height / 2);
      ctx.globalCompositeOperation = 'destination-out'; };
    requestAnimationFrame(size);
    let down = false, done = false, last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 2, (e.clientY - r.top) * 2]; };
    const scratch = e => {
      if (!down || done) return; const [x, y] = pt(e);
      ctx.lineWidth = cv.width / 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...(last || [x, y])); ctx.lineTo(x, y); ctx.stroke(); last = [x, y];
    };
    cv.addEventListener('pointerdown', e => { down = true; last = null; cv.setPointerCapture(e.pointerId); scratch(e); });
    cv.addEventListener('pointermove', scratch);
    cv.addEventListener('pointerup', () => {
      down = false; if (done) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > 0.5) { done = true; cv.style.transition = 'opacity .7s'; cv.style.opacity = 0; reveal(n, p); }
    });
  };
  M.test = (n, p) => {
    const body = frame(n, p);
    body.appendChild(el(`<p style="color:var(--ink);font-family:var(--serif);font-size:1.8rem;line-height:1.15;text-align:center">${p.pregunta}</p>`));
    const g = el(`<div class="opts">${p.opciones.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>`); body.appendChild(g);
    const fb = el(`<div class="feedback"></div>`); body.appendChild(fb);
    g.onclick = e => {
      const b = e.target.closest('.opt'); if (!b) return;
      if (+b.dataset.i === p.correcta) { b.classList.add('good'); fb.style.color = 'var(--ok)'; fb.textContent = p.dato || '¡Correcto!'; g.onclick = null; reveal(n, p); }
      else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); fb.textContent = 'Nooo, más… o menos 😜'; }
    };
  };
  M.puzle = (n, p) => {
    const body = frame(n, p);
    const g = el(`<div class="puzzle"></div>`); body.appendChild(g);
    let order = [...Array(9).keys()]; // 8 = hueco
    const solvable = a => { let inv = 0; const t = a.filter(x => x !== 8); for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) inv++; return inv % 2 === 0; };
    do { order.sort(() => Math.random() - 0.5); } while (!solvable(order) || order.every((v, i) => v === i));
    const draw = () => {
      g.innerHTML = '';
      order.forEach((v, i) => {
        const t = el(`<div class="tile ${v === 8 ? 'empty' : ''}"></div>`);
        if (v !== 8) { t.style.backgroundImage = `url(${p.foto})`; t.style.backgroundPosition = `${(v % 3) * 50}% ${Math.floor(v / 3) * 50}%`; }
        t.onclick = () => move(i); g.appendChild(t);
      });
    };
    const move = i => {
      const e = order.indexOf(8), r = Math.floor(i / 3), c = i % 3, er = Math.floor(e / 3), ec = e % 3;
      if (Math.abs(r - er) + Math.abs(c - ec) !== 1) return;
      [order[i], order[e]] = [order[e], order[i]]; draw();
      if (order.every((v, k) => v === k)) {
        const last = g.querySelector('.empty');
        last.classList.remove('empty'); last.style.backgroundImage = `url(${p.foto})`; last.style.backgroundPosition = '100% 100%';
        g.querySelectorAll('.tile').forEach(t => t.onclick = null); skip.remove(); reveal(n, p);
      }
    };
    draw();
    const skip = el(`<button class="btn ghost" style="margin-top:10px">Me rindo, ¡ayuda!</button>`); body.appendChild(skip);
    skip.onclick = () => { order = [...Array(9).keys()]; order[8] = 8; draw(); skip.remove(); reveal(n, p); };
  };
  M.linterna = (n, p) => {
    const body = frame(n, p);
    const [wx, wy] = p.palabraPos || [0.5, 0.7];
    const st = el(`<div class="stage"><img src="${p.foto}" alt="" style="filter:brightness(.55)">
      <div style="position:absolute;left:${wx * 100}%;top:${wy * 100}%;transform:translate(-50%,-50%) rotate(-8deg);font-family:var(--serif);font-size:2.4rem;color:#fff;letter-spacing:.2em;text-shadow:0 0 18px rgba(0,0,0,.9)">${p.palabra}</div>
      <div class="dark" style="position:absolute;inset:0;background:#000"></div></div>`);
    body.appendChild(st);
    const dark = st.querySelector('.dark');
    const setMask = (x, y) => { const m = `radial-gradient(circle 70px at ${x}px ${y}px, transparent 0 55%, #000 100%)`; dark.style.webkitMaskImage = m; dark.style.maskImage = m; };
    setMask(-200, -200);
    st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(); setMask(e.clientX - r.left, e.clientY - r.top); });
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); const r = st.getBoundingClientRect(); setMask(e.clientX - r.left, e.clientY - r.top); });
    st.addEventListener('pointerleave', () => setMask(-200, -200));
    answerBox(body, { ...p, pregunta: '¿Qué palabra has encontrado?' }, n);
  };
  M.memoria = (n, p) => {
    const body = frame(n, p);
    const cards = [...p.fotos, ...p.fotos].map((f, i) => ({ f, i })).sort(() => Math.random() - .5);
    const g = el(`<div class="mem">${cards.map((c, k) => `<div class="mcard" data-k="${k}"><div class="in"><div class="f">♡</div><div class="b" style="background-image:url(${c.f})"></div></div></div>`).join('')}</div>`);
    body.appendChild(g);
    let open = [], found = 0, lock = false;
    g.onclick = e => {
      const c = e.target.closest('.mcard'); if (!c || lock || c.classList.contains('flip')) return;
      c.classList.add('flip'); open.push(c);
      if (open.length === 2) {
        lock = true;
        const [a, b] = open;
        if (cards[a.dataset.k].f === cards[b.dataset.k].f) { a.classList.add('done'); b.classList.add('done'); open = []; lock = false; found++; if (found === p.fotos.length) reveal(n, p); }
        else setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); open = []; lock = false; }, 800);
      }
    };
  };
  M.emoji = (n, p) => {
    const body = frame(n, p);
    body.appendChild(el(`<div class="emojis">${p.emojis}</div>`));
    answerBox(body, { ...p, pregunta: '¿Dónde está la siguiente?' }, n);
  };
  M.final = (n, p) => {
    const body = frame(n, p);
    const lock = el(`<div class="lock">${[0, 0, 0, 0].map(() => '<div class="digit">?</div>').join('')}</div>`); body.appendChild(lock);
    const box = el(`<div style="display:flex;flex-direction:column;gap:10px"><p style="color:var(--ink);font-weight:600;text-align:center">${p.pregunta}</p>
      <input class="answer" inputmode="numeric" placeholder="dd/mm" maxlength="5"><button class="btn">Abrir</button><div class="feedback"></div></div>`);
    body.appendChild(box);
    const inp = box.querySelector('input'), fb = box.querySelector('.feedback');
    inp.oninput = () => { let v = inp.value.replace(/[^0-9]/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); inp.value = v; };
    box.querySelector('button').onclick = () => {
      if (inp.value !== p.respuesta) { fb.textContent = '¿Seguro? Ese día cambió todo…'; return; }
      box.remove();
      const ds = lock.querySelectorAll('.digit');
      [...p.codigo].forEach((d, i) => {
        let k = 0; const it = setInterval(() => { ds[i].textContent = Math.floor(Math.random() * 10); if (++k > 14 + i * 7) { clearInterval(it); ds[i].textContent = d; ds[i].style.borderColor = 'var(--gold)'; if (i === 3) done(); } }, 55);
      });
      const done = () => {
        markSolved(n); confetti(true);
        const after = app.querySelector('#after');
        after.appendChild(el(`<div class="reveal"><span class="lbl">Abre el candado · ${p.codigo}</span>${p.foto ? `<img src="${p.foto}" alt="">` : ''}<div class="letter">${p.carta}</div></div>`));
      };
    };
  };

  // ================= Juegos nuevos =================
  // --- Wordle: la palabra es el escondite ---
  M.wordle = (n, p) => {
    const body = frame(n, p);
    const W = norm(p.palabra).toUpperCase().replace(/ /g, ''), L = W.length, TRIES = 6;
    const grid = el(`<div style="display:grid;grid-template-rows:repeat(${TRIES},1fr);gap:6px;margin:4px auto;width:min(100%,${L * 58}px)"></div>`);
    const rows = [];
    for (let r = 0; r < TRIES; r++) {
      const row = el(`<div style="display:grid;grid-template-columns:repeat(${L},1fr);gap:6px"></div>`);
      for (let c = 0; c < L; c++) row.appendChild(el(`<div style="aspect-ratio:1;border:2px solid #3a3150;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:1.6rem;transition:background .3s"></div>`));
      rows.push(row); grid.appendChild(row);
    }
    body.appendChild(grid);
    const fb = el(`<div class="feedback"></div>`); body.appendChild(fb);
    const keys = ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫'];
    const kb = el(`<div style="display:flex;flex-direction:column;gap:6px">${keys.map(r => `<div style="display:flex;gap:4px;justify-content:center">${[...r].map(k => `<button data-k="${k}" style="font:inherit;font-weight:800;flex:${k === '↵' || k === '⌫' ? 1.6 : 1};min-width:0;padding:13px 0;border:0;border-radius:6px;background:#3a3150;color:var(--ink);cursor:pointer">${k}</button>`).join('')}</div>`).join('')}</div>`);
    body.appendChild(kb);
    let r = 0, cur = '', over = false;
    const paint = () => [...rows[r].children].forEach((d, i) => { d.textContent = cur[i] || ''; d.style.borderColor = cur[i] ? '#7a6d99' : '#3a3150'; });
    const keyEl = k => kb.querySelector(`[data-k="${k}"]`);
    const submit = () => {
      if (cur.length !== L) { fb.textContent = `Tienen que ser ${L} letras`; return; }
      fb.textContent = '';
      const res = Array(L).fill('x'), pool = [...W];
      [...cur].forEach((ch, i) => { if (ch === W[i]) { res[i] = 'g'; pool[i] = null; } });
      [...cur].forEach((ch, i) => { if (res[i] !== 'g') { const j = pool.indexOf(ch); if (j >= 0) { res[i] = 'y'; pool[j] = null; } } });
      [...rows[r].children].forEach((d, i) => setTimeout(() => {
        const col = res[i] === 'g' ? '#3f9d6a' : res[i] === 'y' ? '#c9a23f' : '#2a2340';
        d.style.background = col; d.style.borderColor = col;
        const k = keyEl(cur[i]); if (k && k.dataset.s !== 'g') { k.style.background = col; k.dataset.s = res[i]; }
      }, i * 160));
      const win = cur === W; r++;
      setTimeout(() => {
        if (win) { over = true; reveal(n, p); }
        else if (r >= TRIES) { fb.textContent = `Empieza por «${W[0]}»… ¡otra vez!`; rows.forEach(rw => [...rw.children].forEach(d => { d.textContent = ''; d.style.background = ''; d.style.borderColor = '#3a3150'; })); kb.querySelectorAll('button').forEach(b => { b.style.background = '#3a3150'; delete b.dataset.s; }); r = 0; }
        cur = '';
      }, L * 160 + 100);
    };
    kb.onclick = e => {
      const b = e.target.closest('button'); if (!b || over) return;
      const k = b.dataset.k;
      if (k === '↵') return submit();
      if (k === '⌫') cur = cur.slice(0, -1); else if (cur.length < L) cur += k;
      paint();
    };
  };

  // --- Atrapa los te quiero ---
  M.atrapa = (n, p) => {
    const body = frame(n, p);
    const st = el(`<div class="stage" style="background:linear-gradient(#1d1630,#2c2142)"><canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div style="position:absolute;top:10px;left:12px;font-weight:800;font-size:1.3rem" id="sc">0 / ${p.objetivo}</div>
      <button class="btn" id="go" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto">Empezar</button></div>`);
    body.appendChild(st);
    const cv = st.querySelector('canvas'), c = cv.getContext('2d'), sc = st.querySelector('#sc');
    let W = 0, H = 0, bx = 0.5, items = [], score = 0, run = false, last = 0, spawnT = 0, t = 0;
    const GOOD = ['te quiero', 'nene', 'miamor', 'te quiero', 'te amo'], BAD = ['joe', 'ein'];
    const size = () => { const r = st.getBoundingClientRect(); W = cv.width = r.width * 2; H = cv.height = r.height * 2; };
    st.addEventListener('pointermove', e => { const r = st.getBoundingClientRect(); bx = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)); });
    st.addEventListener('pointerdown', e => { const r = st.getBoundingClientRect(); bx = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)); });
    const loop = () => {
      if (!run) return;
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; t += dt;
      spawnT -= dt;
      if (spawnT <= 0) { const bad = Math.random() < 0.38; items.push({ x: 0.1 + Math.random() * 0.8, y: -0.05, v: 0.38 + Math.random() * 0.18 + t * 0.014, zz: Math.random() < 0.35 ? (0.18 + Math.random() * 0.2) : 0, ph: Math.random() * 6, txt: bad ? BAD[Math.random() * 2 | 0] : GOOD[Math.random() * GOOD.length | 0], bad }); spawnT = Math.max(0.26, 0.7 - t * 0.014); }
      c.clearRect(0, 0, W, H);
      const by = 0.9, bw = 0.2;
      items.forEach(it => { it.y += it.v * dt; if (it.zz) { it.ph += dt * 3; it.x = Math.max(0.08, Math.min(0.92, it.x + Math.cos(it.ph) * it.zz * dt)); } });
      items = items.filter(it => {
        if (it.y > by - 0.03 && it.y < by + 0.03 && Math.abs(it.x - bx) < bw / 2) { score = Math.max(0, score + (it.bad ? -3 : 1)); sc.textContent = `${score} / ${p.objetivo}`; if (navigator.vibrate) navigator.vibrate(it.bad ? 60 : 15); return false; }
        if (it.y >= 1.0 && !it.bad) { score = Math.max(0, score - 1); sc.textContent = `${score} / ${p.objetivo}`; return false; }
        return it.y < 1.05;
      });
      items.forEach(it => {
        c.font = `800 ${W * 0.045}px Manrope, sans-serif`; c.textAlign = 'center';
        const label = (it.bad ? '' : '♥ ') + it.txt;
        const tw = c.measureText(label).width + W * 0.07;
        const cx = Math.max(tw / 2 + 6, Math.min(W - tw / 2 - 6, it.x * W));
        c.fillStyle = it.bad ? '#5a5a66' : '#e9867d'; c.beginPath(); c.roundRect(cx - tw / 2, it.y * H - W * 0.04, tw, W * 0.075, W * 0.0375); c.fill();
        c.fillStyle = '#fff'; c.fillText(label, cx, it.y * H + W * 0.014);
      });
      c.fillStyle = '#e8b65c'; c.beginPath(); c.roundRect((bx - bw / 2) * W, by * H, bw * W, H * 0.05, 12); c.fill();
      c.fillStyle = '#2a1c00'; c.font = `800 ${W * 0.04}px Manrope`; c.fillText('🧺', bx * W, by * H + H * 0.038);
      if (score >= p.objetivo) { run = false; clearInterval(timer); items = []; c.clearRect(0, 0, W, H); reveal(n, p); }
    };
    let timer = null;
    st.querySelector('#go').onclick = e => { e.target.remove(); size(); run = true; last = performance.now(); timer = setInterval(loop, 16); };
  };

  // --- ¿Dónde estábamos? (outfits) ---
  M.outfits = (n, p) => {
    const body = frame(n, p);
    let i = 0, ok = 0;
    const box = el(`<div style="display:flex;flex-direction:column;gap:12px"></div>`); body.appendChild(box);
    const show = () => {
      if (i >= p.rondas.length) {
        if (ok >= p.minimo) { box.innerHTML = `<p style="text-align:center;color:var(--ok);font-weight:800">${ok} de ${p.rondas.length}. ¡Me conoces cada outfit!</p>`; reveal(n, p); }
        else { box.innerHTML = `<p style="text-align:center;color:var(--rose);font-weight:800">${ok} de ${p.rondas.length}… necesitas ${p.minimo}. ¡Otra vez!</p><button class="btn">Repetir</button>`; box.querySelector('button').onclick = () => { i = 0; ok = 0; show(); }; }
        return;
      }
      const rd = p.rondas[i], opts = [...rd.opciones].sort(() => Math.random() - 0.5);
      box.innerHTML = `<div class="top"><span>Outfit ${i + 1} de ${p.rondas.length}</span><span>${ok} aciertos</span></div>
        <div style="background:#fff;border-radius:20px;padding:10px;display:grid;place-items:center;aspect-ratio:3/4"><img src="${rd.foto}" alt="" style="max-width:100%;max-height:100%;object-fit:contain"></div>
        <div class="opts">${opts.map(o => `<button class="opt" style="font-size:1.05rem">${o}</button>`).join('')}</div><div class="feedback"></div>`;
      box.querySelector('.opts').onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return;
        box.querySelector('.opts').onclick = null;
        const right = b.textContent === rd.correcta;
        if (right) { ok++; b.classList.add('good'); box.querySelector('.feedback').style.color = 'var(--ok)'; box.querySelector('.feedback').textContent = '¡Eso es!'; }
        else { b.classList.add('bad'); [...box.querySelectorAll('.opt')].find(x => x.textContent === rd.correcta).classList.add('good'); box.querySelector('.feedback').textContent = `Era ${rd.correcta}`; }
        setTimeout(() => { i++; show(); }, 1300);
      };
    };
    show();
  };

  // --- Calculadora ---
  M.calculadora = (n, p) => {
    const body = frame(n, p);
    const wrap = el(`<div style="display:flex;flex-direction:column;gap:10px">
      <p style="color:var(--ink);font-family:var(--serif);font-size:1.8rem;line-height:1.15;text-align:center">${p.pregunta}</p>
      <input class="answer" inputmode="numeric" placeholder="0"><button class="btn">Comprobar</button><div class="feedback"></div></div>`);
    body.appendChild(wrap);
    const inp = wrap.querySelector('input'), fb = wrap.querySelector('.feedback');
    let fails = 0;
    const check = () => {
      const v = parseInt(inp.value.replace(/[^0-9]/g, ''), 10);
      if (v === p.respuesta) { wrap.querySelector('button').disabled = true; fb.style.color = 'var(--ok)'; fb.textContent = p.dato; reveal(n, p); }
      else { fails++; fb.textContent = fails === 1 ? 'Nop. Saca la calculadora 😜' : fails === 2 ? 'Primero calcula cuántos son tuyos…' : `Tuyos: 42.107 − 23.584. Y luego, la diferencia.`; }
    };
    wrap.querySelector('button').onclick = check; inp.onkeydown = e => { if (e.key === 'Enter') check(); };
  };

  // --- Agita el móvil ---
  M.agita = (n, p) => {
    const body = frame(n, p);
    const st = el(`<div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:10px 0">
      <div id="cap" style="font-size:8rem;line-height:1;transition:transform .08s">🥚</div>
      <div style="width:100%;height:14px;background:#2a2340;border-radius:99px;overflow:hidden"><div id="bar" style="height:100%;width:0;background:linear-gradient(90deg,var(--gold),var(--rose))"></div></div>
      <button class="btn" id="go">Empezar a agitar</button><p id="tip" style="text-align:center"></p></div>`);
    body.appendChild(st);
    const cap = st.querySelector('#cap'), bar = st.querySelector('#bar'), tip = st.querySelector('#tip');
    let energy = 0, done = false, lastA = null;
    const add = v => {
      if (done) return;
      energy = Math.min(100, energy + v); bar.style.width = energy + '%';
      cap.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg) scale(${1 + energy / 400})`;
      cap.textContent = energy < 35 ? '🥚' : energy < 70 ? '🐣' : '💥';
      if (energy >= 100) { done = true; cap.textContent = '💌'; cap.style.transform = 'scale(1.2)'; if (navigator.vibrate) navigator.vibrate([80, 40, 160]); reveal(n, p); }
    };
    const onMotion = e => {
      const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
      if (lastA) { const d = Math.abs(a.x - lastA.x) + Math.abs(a.y - lastA.y) + Math.abs(a.z - lastA.z); if (d > 18) add(d / 70); }
      lastA = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };
    };
    st.querySelector('#go').onclick = async e => {
      e.target.remove();
      try { if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission(); } catch {}
      addEventListener('devicemotion', onMotion);
      tip.textContent = '¡Agita! (si no se mueve, toca el huevo muy rápido)';
      cap.onclick = () => add(2.2);
      // Si deja de agitar, la cápsula se recompone poco a poco
      setInterval(() => { if (!done && energy > 0) { energy = Math.max(0, energy - 0.9); bar.style.width = energy + '%'; } }, 100);
    };
  };

  // --- Corazón en realidad aumentada ---
  M.ar = (n, p) => {
    const body = frame(n, p);
    const st = el(`<div class="stage" style="aspect-ratio:3/4;background:#000">
      <video playsinline muted autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
      <canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div id="arrow" style="position:absolute;bottom:14px;left:0;right:0;text-align:center;font-weight:800;text-shadow:0 2px 8px #000"></div>
      <button class="btn" id="go" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto">Abrir la cámara</button></div>`);
    body.appendChild(st);
    st.querySelector('#go').onclick = async e => {
      e.target.textContent = 'Cargando…';
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
      try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch {}
      try { const s = await Promise.race([navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]); st.querySelector('video').srcObject = s; } catch { st.style.background = 'radial-gradient(#2c2142,#0d0a14)'; }
      e.target.remove();
      const cv = st.querySelector('canvas'), r0 = st.getBoundingClientRect();
      const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
      renderer.setPixelRatio(devicePixelRatio); renderer.setSize(r0.width, r0.height, false);
      const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(62, r0.width / r0.height, 0.1, 50);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x442233, 1.6));
      const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 3, 2); scene.add(dl);
      const shape = new THREE.Shape(); shape.moveTo(0, 0.25); shape.bezierCurveTo(0, 0.5, 0.45, 0.55, 0.45, 0.2); shape.bezierCurveTo(0.45, -0.05, 0.1, -0.2, 0, -0.38); shape.bezierCurveTo(-0.1, -0.2, -0.45, -0.05, -0.45, 0.2); shape.bezierCurveTo(-0.45, 0.55, 0, 0.5, 0, 0.25);
      const heart = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 6 }), new THREE.MeshStandardMaterial({ color: 0xe9405f, metalness: 0.3, roughness: 0.35, emissive: 0x330010 }));
      const yaw = location.search.includes('demoar') ? 0.05 : Math.PI * (0.6 + Math.random() * 0.8); // detrás o a un lado (demoar: delante, solo para capturas)
      heart.position.set(Math.sin(yaw) * 3, 0.3, -Math.cos(yaw) * 3); scene.add(heart);
      // Orientación del móvil → cámara (o arrastrar con el dedo si no hay giroscopio)
      const q = new THREE.Quaternion(), euler = new THREE.Euler(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), zee = new THREE.Vector3(0, 0, 1);
      let gyro = false, dragYaw = 0, dragPitch = 0, base = null;
      addEventListener('deviceorientation', ev => {
        if (ev.alpha === null) return; gyro = true;
        const a = THREE.MathUtils.degToRad(ev.alpha), b = THREE.MathUtils.degToRad(ev.beta), g = THREE.MathUtils.degToRad(ev.gamma), orient = THREE.MathUtils.degToRad(screen.orientation ? screen.orientation.angle : 0);
        if (base === null) base = a;
        euler.set(b, a - base, -g, 'YXZ'); q.setFromEuler(euler); q.multiply(q1); q.multiply(new THREE.Quaternion().setFromAxisAngle(zee, -orient));
      });
      let px = null;
      st.addEventListener('pointerdown', ev => { px = [ev.clientX, ev.clientY]; st.setPointerCapture(ev.pointerId); });
      st.addEventListener('pointermove', ev => { if (!px || gyro) return; dragYaw += (ev.clientX - px[0]) * 0.006; dragPitch = Math.max(-1, Math.min(1, dragPitch + (ev.clientY - px[1]) * 0.004)); px = [ev.clientX, ev.clientY]; });
      st.addEventListener('pointerup', () => { px = null; });
      const arrow = st.querySelector('#arrow');
      let held = 0, found = false, last = performance.now();
      const v = new THREE.Vector3();
      const loop = now => {
        const dt = (now - last) / 1000; last = now;
        if (gyro) cam.quaternion.copy(q); else cam.quaternion.setFromEuler(new THREE.Euler(dragPitch, dragYaw, 0, 'YXZ'));
        heart.rotation.y += dt * 1.4; heart.position.y = 0.3 + Math.sin(now / 600) * 0.08;
        v.copy(heart.position).project(cam);
        const inView = v.z < 1 && Math.abs(v.x) < 0.35 && Math.abs(v.y) < 0.35;
        if (!found) {
          held = inView ? held + dt : Math.max(0, held - dt);
          arrow.textContent = inView ? '¡Ahí está! Mantenlo en el centro…' : v.z > 1 ? 'Date la vuelta…' : v.x < 0 ? '← más a la izquierda' : 'más a la derecha →';
          if (held > 1.2) { found = true; arrow.textContent = '💘 ¡Lo encontraste!'; heart.scale.setScalar(1.3); reveal(n, p); }
        }
        renderer.render(scene, cam); requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    };
  };

  // --- Playlist de iniciales ---
  M.playlist = (n, p) => {
    const body = frame(n, p);
    body.appendChild(el(`<div style="display:flex;flex-direction:column;gap:8px">${p.canciones.map((c, i) => `
      <a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(c.artista + ' ' + c.titulo)}" style="display:flex;gap:12px;align-items:center;background:var(--card);border-radius:14px;padding:12px 14px;color:var(--ink);text-decoration:none">
        <span style="font-family:var(--serif);font-size:1.6rem;color:var(--gold);width:24px">${i + 1}</span>
        <span style="flex:1"><b style="font-size:1.05rem">${c.titulo}</b><br><span style="color:var(--muted);font-size:.85rem">${c.artista}</span></span><span>▶︎</span></a>`).join('')}</div>`));
    answerBox(body, { ...p, pregunta: '¿Dónde está la siguiente pista?' }, n);
    const fb = body.querySelector('.feedback');
    setTimeout(() => { if (!fb.textContent) fb.innerHTML = `<span style="color:var(--muted)">Pista: ${p.pista}</span>`; }, 25000);
  };

  // --- Final: carrera de las mallas + candado ---
  const runnerSVG = `<svg viewBox="0 0 60 90" width="56" height="84" aria-hidden="true">
    <circle cx="30" cy="12" r="8" fill="#e2b08c"/><path d="M36 8 q12 4 8 18" stroke="#3b2418" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="22" y="21" width="16" height="22" rx="6" fill="#f6efe6"/>
    <g class="legA"><rect x="23" y="41" width="7" height="30" rx="3" fill="#15111f"/><rect x="21" y="69" width="11" height="6" rx="2" fill="#fff"/></g>
    <g class="legB"><rect x="31" y="41" width="7" height="30" rx="3" fill="#2a2340"/><rect x="29" y="69" width="11" height="6" rx="2" fill="#fff"/></g></svg>`;
  M.final = (n, p) => {
    const body = frame(n, p);
    const race = el(`<div style="display:flex;flex-direction:column;gap:12px">
      <div class="top"><span>Récord de Pablo: ${p.record.toFixed(1).replace('.', ',')} s</span><span id="tm">0,0 s</span></div>
      <div style="position:relative;height:120px;background:linear-gradient(#2a2340,#1c1729);border-radius:18px;overflow:hidden">
        <div style="position:absolute;left:0;right:0;bottom:22px;border-top:2px dashed #4a3f62"></div>
        <div style="position:absolute;right:16px;top:0;bottom:0;width:6px;background:repeating-linear-gradient(#fff 0 8px,#15111f 8px 16px)"></div>
        <div id="run" style="position:absolute;left:8px;bottom:18px;transition:left .08s">${runnerSVG}</div></div>
      <button class="btn" id="tap" style="padding:28px;font-size:1.3rem">¡TOCA! ¡TOCA! ¡TOCA!</button><div class="feedback"></div></div>`);
    body.appendChild(race);
    const run = race.querySelector('#run'), tm = race.querySelector('#tm'), fb = race.querySelector('.feedback'), tap = race.querySelector('#tap');
    let taps = 0, t0 = null, timer = null, finished = false;
    const track = () => race.querySelector('div[style*="height:120px"]').clientWidth - 80;
    tap.onpointerdown = e => {
      e.preventDefault(); if (finished) return;
      if (t0 === null) { t0 = performance.now(); timer = setInterval(() => { tm.textContent = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s'; }, 50); }
      taps++;
      run.style.left = (8 + track() * taps / p.toques) + 'px';
      const sw = taps % 2 ? 20 : -20; run.querySelector('.legA').setAttribute('transform', `rotate(${sw} 26 41)`); run.querySelector('.legB').setAttribute('transform', `rotate(${-sw} 34 41)`);
      if (taps >= p.toques) {
        finished = true; clearInterval(timer);
        const secs = (performance.now() - t0) / 1000; tm.textContent = secs.toFixed(2).replace('.', ',') + ' s';
        if (secs <= p.record) { fb.style.color = 'var(--ok)'; fb.textContent = `¡${secs.toFixed(2).replace('.', ',')} s! Récord batido 🏆`; confetti(); setTimeout(candado, 900); }
        else { fb.textContent = `${secs.toFixed(2).replace('.', ',')} s… ¡casi! Las mallas corren más, prueba otra vez`; tap.textContent = 'Otra vez'; tap.onpointerdown = null; tap.onclick = () => M.final(n, p); }
      }
    };
    const candado = () => {
      race.remove();
      body.appendChild(el(`<div class="reveal"><span class="lbl">Has llegado a la meta 🏁</span><div class="txt">Te queda lo último.</div></div>`));
      const lock = el(`<div class="lock" style="margin-top:6px">${[0, 0, 0, 0].map(() => '<div class="digit">?</div>').join('')}</div>`); body.appendChild(lock);
      const box = el(`<div style="display:flex;flex-direction:column;gap:10px"><p style="color:var(--ink);font-weight:600;text-align:center">${p.pregunta}</p>
        <input class="answer" inputmode="numeric" placeholder="dd/mm" maxlength="5"><button class="btn">Abrir</button><div class="feedback"></div></div>`);
      body.appendChild(box);
      const inp = box.querySelector('input'), f2 = box.querySelector('.feedback');
      inp.oninput = () => { let v = inp.value.replace(/[^0-9]/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); inp.value = v; };
      box.querySelector('button').onclick = () => {
        if (inp.value !== p.respuesta) { f2.textContent = '¿Seguro? Ese día cambió todo…'; return; }
        box.remove();
        const ds = lock.querySelectorAll('.digit');
        [...p.codigo].forEach((d, i) => { let k = 0; const it = setInterval(() => { ds[i].textContent = Math.floor(Math.random() * 10); if (++k > 14 + i * 7) { clearInterval(it); ds[i].textContent = d; ds[i].style.borderColor = 'var(--gold)'; if (i === 3) end(); } }, 55); });
        const end = () => { markSolved(n); confetti(true); app.querySelector('#after').appendChild(el(`<div class="reveal"><span class="lbl">Código del candado · ${p.codigo}</span><div class="txt">${p.regalo}</div>${p.foto ? `<img src="${p.foto}" alt="">` : ''}${p.carta ? `<div class="letter">${p.carta}</div>` : ''}</div>`)); };
      };
    };
  };

  // ---------- Confeti ----------
  function confetti(big) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.getElementById('confetti'), c = cv.getContext('2d');
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const cols = ['#e8b65c', '#e9867d', '#f6efe6', '#7fd1a8', '#b9a0e8'];
    const ps = Array.from({ length: big ? 220 : 90 }, () => ({ x: cv.width / 2, y: cv.height * .55, vx: (Math.random() - .5) * 26, vy: -Math.random() * 30 - 8, s: 6 + Math.random() * 8, c: cols[Math.random() * 5 | 0], r: Math.random() * 6 }));
    let f = 0;
    const loop = () => {
      c.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.vy += .9; p.x += p.vx; p.y += p.vy; p.r += .2; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); });
      if (++f < 120) requestAnimationFrame(loop); else c.clearRect(0, 0, cv.width, cv.height);
    };
    loop();
  }

  // ---------- Catálogo para Pablo ----------
  const MECH = [
    ['wordle', 'Wordle', 'La palabra secreta es el escondite.'],
    ['atrapa', 'Atrapa los te quiero', 'Cesta y corazones que caen; joe y ein restan.'],
    ['outfits', '¿Dónde estábamos?', 'Su ropa recortada sobre blanco; adivinar el viaje.'],
    ['calculadora', 'Saca la calculadora', 'Cuántos te quiero más le has dicho tú (5.061).'],
    ['agita', 'Agita el móvil', 'Un huevo que se rompe al agitar el móvil.'],
    ['ar', 'Corazón en realidad aumentada', 'Con la cámara, un corazón flotando en la habitación.'],
    ['playlist', 'Playlist de iniciales', 'Las iniciales de las canciones forman el escondite.'],
    ['final', 'Carrera de las mallas + candado', 'Batir tu récord tocando la pantalla y abrir el 1508.'],
    ['zoom', 'Foto en zoom extremo', 'Empieza en un detalle enorme y se va alejando hasta que se ve el sitio.'],
    ['cancion', 'Canción', 'Un vinilo gira y abre la canción; el título o la letra dicen el escondite.'],
    ['rasca', 'Rasca y gana', 'Rasca con el dedo la capa dorada para descubrir la foto.'],
    ['test', 'Pregunta de vosotros', 'Un dato real de vuestro chat o vuestra historia, con 4 opciones.'],
    ['puzle', 'Puzle deslizante', 'Ordena una foto vuestra en 9 piezas.'],
    ['linterna', 'A oscuras', 'Pantalla negra; con el dedo hace de linterna y encuentra una palabra escondida.'],
    ['memoria', 'Parejas', 'Juego de memoria con vuestras fotos.'],
    ['emoji', 'Emojis', 'Un acertijo escrito con emojis.'],
  ];
  const SONGS = [
    ['Ducha / baño', 'Shower', 'Becky G'], ['Espejo', 'Mirrors', 'Justin Timberlake'], ['Almohada / cama', 'Pillowtalk', 'Zayn (de One Direction)'],
    ['Cama / mesa', 'Cama y mesa', 'Roberto Carlos'], ['Nevera', 'Refrigerator Door', 'Luke Combs'], ['Lavadora', 'Washing Machine Heart', 'Mitski'],
    ['Zapatero / zapatillas', "These Boots Are Made for Walkin'", 'Nancy Sinatra'], ['Bote del azúcar (cocina)', 'Sugar', 'Maroon 5'],
    ['Coche', 'Fast Car', 'Tracy Chapman'], ['Joyero / cajón pequeño', 'Little Things', 'One Direction'], ['Final, el regalo', 'Love On The Brain', 'Rihanna (vuestra canción)'],
  ];
  function catalogo() {
    const used = B.pistas.map(p => p.tipo);
    app.innerHTML = `<div class="top"><span>Solo para ti, Pablo</span><span></span></div><h1>Catálogo de <em>pistas</em></h1>
      <p>Prueba cada mecánica. Luego me dices qué quieres en cada escondite y cambio fotos y textos.</p>
      <h2>En tu búsqueda</h2>
      <div class="cat">${MECH.filter(([t]) => t === 'final' || used.includes(t)).map(([t, name, d]) => { const i = t === 'final' ? total : used.indexOf(t) + 1; return `<a href="#${i}"><span class="n">${i}</span><div><b>${name}</b><span>${d}</span></div></a>`; }).join('')}</div>
      <h2>Otras que tienes de reserva</h2>
      <div class="cat">${MECH.filter(([t]) => t !== 'final' && !used.includes(t)).map(([t, name, d]) => `<a href="#demo-${t}"><span class="n">·</span><div><b>${name}</b><span>${d}</span></div></a>`).join('')}</div>
      <h2>Canciones para escondites</h2><p>El enlace abre la búsqueda; cuando elijas, te busco el vídeo y el segundo exacto.</p>
      <table><tr><th>Escondite</th><th>Canción</th></tr>${SONGS.map(([s, t, a]) => `<tr><td>${s}</td><td><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(a.split(' (')[0] + ' ' + t)}">${t}</a><br><span style="color:var(--muted)">${a}</span></td></tr>`).join('')}</table>
      <a class="btn ghost" style="text-align:center;text-decoration:none;display:block" href="tarjetas.html">Ver las tarjetas para imprimir</a>
      <button class="btn ghost" id="reset">Reiniciar progreso</button>`;
    app.querySelector('#reset').onclick = () => { try { localStorage.removeItem('busqueda-ok'); } catch {} alert('Listo'); };
  }
  function portada() {
    app.innerHTML = `<div class="top"><span>Para ${B.para}</span><span></span></div><h1>Tienes una <em>búsqueda</em> por delante</h1>
      <p>Hay tarjetas escondidas por la casa. Cada una tiene un código: escanéalo con la cámara, supera el reto y te dirá dónde está la siguiente. Al final te espera una sorpresa.</p>
      <a class="btn" style="text-align:center;text-decoration:none;display:block" href="#1">Empezar</a>`;
  }

  // Ejemplos de las mecánicas de reserva (no forman parte de la búsqueda)
  const DEMOS = {
    zoom: { titulo: 'Mira de cerca', texto: 'Algo visto como nunca lo has mirado.', foto: 'fotos/japon.jpg', foco: [0.55, 0.42], siguiente: { texto: 'Ejemplo de escondite.' } },
    cancion: { titulo: 'Dale al play', texto: 'El sitio está en el título.', cancion: { titulo: 'Shower', artista: 'Becky G', enlace: 'https://www.youtube.com/results?search_query=Becky+G+Shower' }, pregunta: '¿Dónde está la siguiente pista?', respuestas: ['ducha', 'la ducha'], siguiente: { texto: 'En la ducha.' } },
    rasca: { titulo: 'Rasca y gana', texto: 'Rasca con el dedo.', foto: 'fotos/outfits/nuevayork.jpg', siguiente: { texto: 'Ejemplo de escondite.' } },
    test: { titulo: 'Solo tú lo sabes', texto: 'Por WhatsApp, en siete años…', pregunta: '¿Cuántos «te quiero» te he escrito?', opciones: ['4.210', '18.523', '42.107', '100.000'], correcta: 2, dato: '42.107', siguiente: { texto: 'Ejemplo de escondite.' } },
    puzle: { titulo: 'Pieza a pieza', texto: 'Ordena la foto.', foto: 'fotos/aurora.jpg', siguiente: { texto: 'Ejemplo de escondite.' } },
    linterna: { titulo: 'A oscuras', texto: 'Pasa el dedo para iluminar.', foto: 'fotos/campnou.jpg', palabra: 'NEVERA', palabraPos: [0.3, 0.72], respuestas: ['nevera'], siguiente: { texto: 'En la nevera.' } },
    memoria: { titulo: 'Nuestras parejas', texto: 'Encuentra las parejas.', fotos: ['fotos/paris.jpg', 'fotos/madrid.jpg', 'fotos/playa.jpg', 'fotos/brooklyn.jpg'], siguiente: { texto: 'Ejemplo de escondite.' } },
    emoji: { titulo: 'Habla en emojis', texto: 'Tradúceme esto:', emojis: '🛋️ ➕ 🍿 ➕ 🎬 ➕ 1️⃣5️⃣', respuestas: ['sofa', 'el sofa'], pista: 'Lo que hacemos cada día 15…', siguiente: { texto: 'En el sofá.' } },
  };
  function route() {
    const h = location.hash.replace('#', '');
    
    
    const n = parseInt(h, 10);
    if (!n) return portada();
    if (n === total) return M.final(n, B.final);
    const p = B.pistas[n - 1];
    if (!p) return portada();
    (M[p.tipo] || M.emoji)(n, p);
  }
  addEventListener('hashchange', route);
  route();
})();
