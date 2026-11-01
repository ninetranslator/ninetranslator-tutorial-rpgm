// Every picture of the tutorial game, drawn on canvases in the Powder palette (the crowned cat's
// sky, crown pink and ink). Runs in a browser page: art/draw.ts loads it and saves what
// window.paintAll returns — { 'img/…/name.png': dataURL }.
/* eslint-disable */
(() => {
  const INK = '#16181D';
  const SKY = '#BAE6EF';
  const SKY_MID = '#7cc4d8';
  const SKY_DEEP = '#337f8f';
  const CROWN = '#F7B4C4';
  const CROWN_DEEP = '#e98aa3';
  const GOLD = '#FBD016';
  const GOLD_DEEP = '#d9a90c';
  const NIGHT = '#0f171a';
  const CREAM = '#fff8ee';

  const TILE = 48;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /** A seeded random, so every build draws the same grass. */
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ell(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
  }

  function fillStroke(ctx, fill, stroke, width) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  // ── characters ────────────────────────────────────────────────────────────────

  /** A crown: base centre (cx, by), width w, height h. */
  function crown(ctx, cx, by, w, h, line) {
    const l = cx - w / 2;
    poly(ctx, [
      [l + w * 0.04, by],
      [l, by - h * 0.72],
      [l + w * 0.27, by - h * 0.42],
      [cx, by - h],
      [l + w * 0.73, by - h * 0.42],
      [l + w, by - h * 0.72],
      [l + w * 0.96, by],
    ]);
    ctx.lineJoin = 'round';
    fillStroke(ctx, CROWN, INK, line);
    ctx.fillStyle = GOLD;
    for (const [x, y] of [[l, by - h * 0.72], [cx, by - h], [l + w, by - h * 0.72]]) {
      ell(ctx, x, y, line * 0.9, line * 0.9);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ell(ctx, cx, by - h * 0.32, line * 0.75, line * 0.75);
    ctx.fill();
  }

  /**
   * A cat shaped like a 9, as on the icon: a round head and a tail sweeping down to the ground.
   * Drawn in a 48 × 48 cell. dir 2 down, 4 left, 6 right, 8 up; pattern 0–2 is the hop.
   */
  function drawCat(ctx, dir, pattern, o) {
    const lift = pattern === 1 ? 0 : -2.5;
    const lean = pattern === 0 ? -3 : pattern === 2 ? 3 : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,26,0.18)';
    ell(ctx, 24, 44.5, lift ? 9 : 11, lift ? 2.6 : 3.3);
    ctx.fill();
    ctx.translate(24, 44);
    ctx.rotate((lean * Math.PI) / 180);
    ctx.translate(-24, -44 + lift);
    if (dir === 6) {
      ctx.translate(48, 0);
      ctx.scale(-1, 1);
    }
    const side = dir === 4 || dir === 6;
    const back = dir === 8;
    const head = () => ell(ctx, 24, 20, 13, 11.5);
    const earL = side ? [[11.5, 14], [12, 3.5], [19.5, 9]] : [[13, 14.5], [13.5, 3.5], [21, 9.5]];
    const earR = side ? [[31, 11.5], [30.5, 4.5], [25.5, 8.5]] : [[35, 14.5], [34.5, 3.5], [27, 9.5]];
    const tail = () => {
      ctx.beginPath();
      if (side) {
        // Facing left: the 9's stroke trails behind, down to the right.
        ctx.moveTo(25, 29);
        ctx.quadraticCurveTo(34, 32, 36, 44);
        ctx.lineTo(40.5, 43);
        ctx.quadraticCurveTo(40, 29, 33, 24.5);
      } else {
        ctx.moveTo(33, 22);
        ctx.quadraticCurveTo(35.5, 36, 21, 44.5);
        ctx.lineTo(16.5, 42.5);
        ctx.quadraticCurveTo(26.5, 35, 25, 28);
      }
      ctx.closePath();
    };
    const shapes = [tail, () => poly(ctx, earL), () => poly(ctx, earR), head];
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = o.line ?? 3;
    for (const s of shapes) {
      s();
      ctx.stroke();
    }
    ctx.fillStyle = o.fur;
    for (const s of shapes) {
      s();
      ctx.fill();
    }
    // Ears' insides.
    if (!back) {
      ctx.fillStyle = CROWN;
      const inner = (e) => {
        const cx = (e[0][0] + e[1][0] + e[2][0]) / 3;
        const cy = (e[0][1] + e[1][1] + e[2][1]) / 3;
        poly(ctx, e.map(([x, y]) => [cx + (x - cx) * 0.5, cy + (y - cy) * 0.5 + 0.6]));
        ctx.fill();
      };
      inner(earL);
      if (!side) inner(earR);
    }
    if (o.stripes) {
      ctx.strokeStyle = o.stripes;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (const dx of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(24 + dx + (side ? -2 : 0), 9.5);
        ctx.lineTo(24 + dx * 1.15 + (side ? -2 : 0), 13);
        ctx.stroke();
      }
    }
    if (!back) {
      const eyes = side ? [[16.5, 20, 1.9], [23, 20, 1.5]] : [[19.5, 20, 1.9], [28.5, 20, 1.9]];
      for (const [x, y, r] of eyes) {
        ctx.fillStyle = INK;
        ell(ctx, x, y, r, r * 1.2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ell(ctx, x - r * 0.3, y - r * 0.45, r * 0.38, r * 0.38);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(247,180,196,0.9)';
      const cheeks = side ? [[14, 23.6]] : [[16.3, 23.6], [31.7, 23.6]];
      for (const [x, y] of cheeks) {
        ell(ctx, x, y, 2, 1.2);
        ctx.fill();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      const mx = side ? 19.5 : 24;
      ctx.beginPath();
      ctx.arc(mx - 1.2, 23, 1.2, 0, Math.PI);
      ctx.arc(mx + 1.2, 23, 1.2, Math.PI, 0, true);
      ctx.stroke();
      const whisk = side ? [[10.5, 21, 6, 20.2], [10.5, 23, 6, 23.8]] : [[11.5, 21, 7, 20.2], [11.5, 23, 7, 23.8], [36.5, 21, 41, 20.2], [36.5, 23, 41, 23.8]];
      for (const [a, b, c, d] of whisk) {
        ctx.beginPath();
        ctx.moveTo(a, b);
        ctx.lineTo(c, d);
        ctx.stroke();
      }
    }
    if (o.kerchief) {
      ctx.fillStyle = o.kerchief;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      poly(ctx, side ? [[17, 30], [29, 30.5], [22, 35.5]] : [[17.5, 30.5], [30.5, 30.5], [24, 36]]);
      ctx.fill();
      ctx.stroke();
    }
    if (o.crown) crown(ctx, side ? 22.5 : 24, 9.2, 13, 8, 1.2);
    ctx.restore();
  }

  /** An owl in glasses: Professor Owl. */
  function drawOwl(ctx, dir, pattern) {
    const bob = pattern === 1 ? 0 : -1;
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,26,0.18)';
    ell(ctx, 24, 44.5, 11, 3.2);
    ctx.fill();
    ctx.translate(0, bob);
    if (dir === 6) {
      ctx.translate(48, 0);
      ctx.scale(-1, 1);
    }
    const side = dir === 4 || dir === 6;
    const back = dir === 8;
    const BROWN = '#c99a6e';
    const BELLY = '#f3e2c7';
    ctx.lineJoin = 'round';
    // Ear tufts, body.
    poly(ctx, [[13, 15], [14.5, 6], [20, 12]]);
    fillStroke(ctx, BROWN, INK, 2.4);
    poly(ctx, [[35, 15], [33.5, 6], [28, 12]]);
    fillStroke(ctx, BROWN, INK, 2.4);
    ell(ctx, 24, 28, 14, 16);
    fillStroke(ctx, BROWN, INK, 2.4);
    ell(ctx, 24, 28, 14, 16);
    ctx.fillStyle = BROWN;
    ctx.fill();
    if (!back) {
      ell(ctx, side ? 21 : 24, 33, 8.5, 9.5);
      ctx.fillStyle = BELLY;
      ctx.fill();
      ctx.strokeStyle = '#d8b48a';
      ctx.lineWidth = 1.1;
      for (const [x, y] of [[21, 31], [27, 31], [24, 35], [19.5, 36], [28.5, 36]]) {
        ctx.beginPath();
        ctx.arc(x + (side ? -3 : 0), y, 2, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      const eyes = side ? [[16, 21]] : [[18.5, 21], [29.5, 21]];
      for (const [x, y] of eyes) {
        ell(ctx, x, y, 5.2, 5.2);
        fillStroke(ctx, '#fff', INK, 1.6);
        ctx.fillStyle = INK;
        ell(ctx, x + (side ? -1 : 0), y + 0.5, 2.2, 2.4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ell(ctx, x - 1, y - 0.6, 0.8, 0.8);
        ctx.fill();
      }
      if (!side) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(23.4, 21);
        ctx.lineTo(24.6, 21);
        ctx.stroke();
      }
      poly(ctx, side ? [[11, 24], [14.5, 23], [14, 27]] : [[22, 24.5], [26, 24.5], [24, 28.5]]);
      fillStroke(ctx, '#f6b04a', INK, 1);
    } else {
      ctx.strokeStyle = '#a97a50';
      ctx.lineWidth = 1.2;
      for (const y of [22, 28, 34]) {
        ctx.beginPath();
        ctx.arc(24, y, 6, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
    }
    // Wings and feet.
    ctx.fillStyle = '#b5845a';
    for (const s of side ? [1] : [-1, 1]) {
      ell(ctx, 24 + s * 12.5, 30, 3.8, 9);
      fillStroke(ctx, '#b5845a', INK, 1.6);
    }
    ctx.fillStyle = '#f6b04a';
    for (const x of [19.5, 28.5]) {
      ell(ctx, x, 43.3, 2.6, 1.4);
      fillStroke(ctx, '#f6b04a', INK, 1);
    }
    ctx.restore();
  }

  /** The garbled-text slime: a soft blob covered in little empty boxes, the way broken text looks. */
  function drawSlime(ctx, dir, pattern, o = {}) {
    const sx = [1.08, 1, 0.94][pattern];
    const sy = [0.92, 1, 1.07][pattern];
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,26,0.18)';
    ell(ctx, 24, 44.3, 15 * sx, 3.3);
    ctx.fill();
    ctx.translate(24, 44);
    ctx.scale(sx * (o.scale ?? 1), sy * (o.scale ?? 1));
    ctx.translate(-24, -44);
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(7, 43);
      ctx.bezierCurveTo(4, 30, 13, 18, 24, 18);
      ctx.bezierCurveTo(35, 18, 44, 30, 41, 43);
      ctx.closePath();
    };
    body();
    ctx.lineJoin = 'round';
    fillStroke(ctx, o.happy ? '#cfe9f5' : '#cbc5ea', INK, 2.6);
    // Shine.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ell(ctx, 17, 25, 3.5, 2.2);
    ctx.fill();
    if (!o.happy) {
      // Boxes where letters should be.
      ctx.strokeStyle = '#6f66a8';
      ctx.lineWidth = 1.1;
      for (const [x, y] of [[12, 36], [30, 33], [34, 39], [20, 40]]) ctx.strokeRect(x, y, 3.6, 3.6);
    }
    if (dir !== 8) {
      const off = dir === 4 ? -4 : dir === 6 ? 4 : 0;
      if (o.happy) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        for (const x of [19, 29]) {
          ctx.beginPath();
          ctx.arc(x + off, 29, 2.2, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(24 + off, 31.5, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        // Dizzy swirl eyes and a wobbly mouth.
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.3;
        for (const x of [19, 29]) {
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 3.2; a += 0.3) {
            const r = 0.4 + a * 0.28;
            const px = x + off + Math.cos(a) * r;
            const py = 28.5 + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(19.5 + off, 34);
        for (let i = 1; i <= 6; i++) ctx.lineTo(19.5 + off + i * 1.5, 34 + (i % 2 ? -1.2 : 0.6));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** A wooden chest: row 0 shut, row 3 open (the event turns it to face up once opened). */
  function drawChest(ctx, row) {
    const open = row === 3;
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,26,0.18)';
    ell(ctx, 24, 43.5, 15, 3.2);
    ctx.fill();
    ctx.lineJoin = 'round';
    rr(ctx, 9, 24, 30, 18, 3);
    fillStroke(ctx, '#c98f5a', INK, 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(9.8, 31, 28.4, 3);
    if (open) {
      rr(ctx, 9, 11, 30, 11, 3);
      fillStroke(ctx, '#a8703f', INK, 2);
      ctx.fillStyle = '#fff1a8';
      rr(ctx, 11.5, 22, 25, 4, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(251,208,22,0.45)';
      ell(ctx, 24, 18, 13, 6);
      ctx.fill();
    } else {
      rr(ctx, 8, 15, 32, 11, 5);
      fillStroke(ctx, '#d9a06a', INK, 2);
      ctx.fillStyle = GOLD;
      rr(ctx, 21, 22, 6, 7, 1.5);
      fillStroke(ctx, GOLD, INK, 1.2);
    }
    ctx.restore();
  }

  /** A character sheet: one character, 3 patterns × 4 directions of 48 px ($ files). */
  function sheet(draw) {
    const c = canvas(144, 192);
    const ctx = c.getContext('2d');
    [2, 4, 6, 8].forEach((dir, row) => {
      for (let p = 0; p < 3; p++) {
        ctx.save();
        ctx.translate(p * 48, row * 48);
        draw(ctx, dir, p, row);
        ctx.restore();
      }
    });
    return c;
  }

  const NINE = { fur: '#ffffff', crown: true };
  const MIKE = { fur: '#f8d3a6', stripes: '#e3a066', kerchief: CROWN };

  // ── faces (144 × 144, four to a row) ──────────────────────────────────────────

  function faceFrame(ctx, x, y, bg, draw) {
    ctx.save();
    ctx.translate(x, y);
    ell(ctx, 72, 72, 66, 66);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    ell(ctx, 72, 72, 66, 66);
    ctx.clip();
    draw(ctx);
    ctx.restore();
    ell(ctx, 72, 72, 66, 66);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  /** The dark pixels inside a box of the logo: where an eye or the mouth is. */
  function darkBox(img, x0, y0, x1, y1) {
    const c = canvas(img.width, img.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let minX = 1e9;
    let minY = 1e9;
    let maxX = -1;
    let maxY = -1;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90 && d[i + 3] > 200) {
        const px = x0 + ((i / 4) % (x1 - x0));
        const py = y0 + Math.floor(i / 4 / (x1 - x0));
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
    }
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  function nineFaces(logo) {
    const c = canvas(576, 288);
    const ctx = c.getContext('2d');
    const eyeL = darkBox(logo, 150, 160, 215, 220);
    const eyeR = darkBox(logo, 265, 160, 330, 220);
    const mouth = darkBox(logo, 205, 196, 275, 232);
    const variants = [
      () => {},
      // Happy: eyes closed in a smile.
      (g) => {
        for (const e of [eyeL, eyeR]) {
          g.fillStyle = '#fff';
          ell(g, e.cx, e.cy, e.w * 0.62, e.h * 0.62);
          g.fill();
          g.strokeStyle = INK;
          g.lineWidth = 9;
          g.lineCap = 'round';
          g.beginPath();
          g.arc(e.cx, e.cy + e.h * 0.22, e.w * 0.42, Math.PI * 1.12, Math.PI * 1.88);
          g.stroke();
        }
      },
      // Surprised: a round mouth, eyes a little wider.
      (g) => {
        g.fillStyle = '#fff';
        ell(g, mouth.cx, mouth.cy, mouth.w * 0.62, mouth.h * 0.8);
        g.fill();
        g.fillStyle = INK;
        ell(g, mouth.cx, mouth.cy + 2, 9, 11);
        g.fill();
        g.fillStyle = CROWN_DEEP;
        ell(g, mouth.cx, mouth.cy + 6, 5.5, 4.5);
        g.fill();
        for (const e of [eyeL, eyeR]) {
          g.fillStyle = '#fff';
          ell(g, e.cx - e.w * 0.14, e.cy - e.h * 0.18, e.w * 0.17, e.w * 0.17);
          g.fill();
        }
      },
    ];
    variants.forEach((v, i) => {
      const g = canvas(480, 480);
      const gctx = g.getContext('2d');
      gctx.drawImage(logo, 0, 0, 480, 480);
      v(gctx);
      ctx.drawImage(g, (i % 4) * 144, Math.floor(i / 4) * 144, 144, 144);
    });
    return c;
  }

  function friendFaces() {
    const c = canvas(576, 288);
    const ctx = c.getContext('2d');
    // [background, drawing, zoom, the drawing's point that sits in the middle]
    const portraits = [
      [SKY, (g) => drawOwl(g, 2, 1), 3.2, 27],
      ['#fde3ea', (g) => drawCat(g, 2, 1, { ...MIKE, line: 2.4 }), 3.6, 22],
      ['#e2def5', (g) => drawSlime(g, 2, 1), 3.3, 33],
      ['#e0f3fa', (g) => drawSlime(g, 2, 1, { happy: true }), 3.3, 33],
    ];
    portraits.forEach(([bg, draw, zoom, cy], i) => {
      faceFrame(ctx, (i % 4) * 144, Math.floor(i / 4) * 144, bg, (g) => {
        g.translate(72 - 24 * zoom, 76 - cy * zoom);
        g.scale(zoom, zoom);
        draw(g);
      });
    });
    return c;
  }

  // ── maps ──────────────────────────────────────────────────────────────────────

  function terrainAt(m, x, y) {
    if (y < 0 || y >= m.terrain.length || x < 0 || x >= m.terrain[0].length) return null;
    return m.terrain[y][x];
  }

  function grass(ctx, m, r, base, dark, light) {
    for (let y = 0; y < m.terrain.length; y++) {
      for (let x = 0; x < m.terrain[0].length; x++) {
        ctx.fillStyle = base;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    // Soft patches and tufts.
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = r() < 0.5 ? light : dark;
      ctx.globalAlpha = 0.35;
      ell(ctx, r() * 816, r() * 624, 20 + r() * 40, 10 + r() * 18);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = r() * 816;
      const y = r() * 624;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y + 2);
      ctx.lineTo(x - 1, y - 2);
      ctx.moveTo(x + 2.5, y + 2);
      ctx.lineTo(x + 1, y - 2.5);
      ctx.stroke();
    }
  }

  /** Sandy path tiles, rounded where they end. */
  function paths(ctx, m, fill, edge) {
    const is = (x, y) => terrainAt(m, x, y) === 'p';
    for (const [col, inset] of [[edge, 0], [fill, 3]]) {
      ctx.fillStyle = col;
      for (let y = 0; y < m.terrain.length; y++) {
        for (let x = 0; x < m.terrain[0].length; x++) {
          if (!is(x, y)) continue;
          // A side with a path beyond it runs to the tile's edge; only the outer corners round.
          const L = is(x - 1, y);
          const R = is(x + 1, y);
          const T = is(x, y - 1);
          const B = is(x, y + 1);
          const l = L ? 0 : 6 + inset;
          const rr_ = R ? 0 : 6 + inset;
          const t = T ? 0 : 6 + inset;
          const b = B ? 0 : 6 + inset;
          const round = (a, c) => (a || c ? 0 : 12);
          rr(ctx, x * TILE + l, y * TILE + t, TILE - l - rr_, TILE - t - b, [round(T, L), round(T, R), round(B, R), round(B, L)]);
          ctx.fill();
        }
      }
    }
    const r = rng(77);
    ctx.fillStyle = edge;
    for (let y = 0; y < m.terrain.length; y++) {
      for (let x = 0; x < m.terrain[0].length; x++) {
        if (!is(x, y)) continue;
        for (let i = 0; i < 3; i++) {
          ell(ctx, x * TILE + 10 + r() * 28, y * TILE + 10 + r() * 28, 2 + r() * 2, 1.4 + r());
          ctx.fill();
        }
      }
    }
  }

  function water(ctx, m) {
    const cells = [];
    m.terrain.forEach((row, y) => [...row].forEach((c, x) => c === 'w' && cells.push([x, y])));
    if (!cells.length) return;
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const x0 = Math.min(...xs) * TILE;
    const y0 = Math.min(...ys) * TILE;
    const w = (Math.max(...xs) + 1) * TILE - x0;
    const h = (Math.max(...ys) + 1) * TILE - y0;
    rr(ctx, x0 - 4, y0 - 4, w + 8, h + 8, 30);
    fillStroke(ctx, '#e8d9b5', null, 0);
    rr(ctx, x0 + 2, y0 + 2, w - 4, h - 4, 26);
    fillStroke(ctx, '#9fd8e6', '#6fb7cb', 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const [dx, dy, len] of [[30, 26, 22], [90, 46, 30], [140, 24, 16], [60, 70, 26]]) {
      ctx.beginPath();
      ctx.moveTo(x0 + dx, y0 + dy);
      ctx.lineTo(x0 + dx + len, y0 + dy);
      ctx.stroke();
    }
    // A lily pad.
    ell(ctx, x0 + w - 40, y0 + h - 30, 11, 8);
    fillStroke(ctx, '#8fcf86', '#5f9d58', 1.5);
    ctx.fillStyle = CROWN;
    ell(ctx, x0 + w - 38, y0 + h - 33, 4, 3);
    ctx.fill();
  }

  /** One round tree: canopy of three blobs on a short trunk. */
  function tree(ctx, cx, by, s, c) {
    ctx.fillStyle = 'rgba(15,23,26,0.16)';
    ell(ctx, cx, by - 2, 20 * s, 6 * s);
    ctx.fill();
    rr(ctx, cx - 5 * s, by - 18 * s, 10 * s, 18 * s, 3);
    fillStroke(ctx, '#c4935f', '#8a6038', 2);
    const blobs = [[0, -38, 20], [-13, -28, 14], [13, -28, 14], [0, -24, 15]];
    for (const [dx, dy, r] of blobs) {
      ell(ctx, cx + dx * s, by + dy * s, r * s, r * s * 0.92);
      fillStroke(ctx, c.dark, c.dark, 4);
    }
    for (const [dx, dy, r] of blobs) {
      ell(ctx, cx + dx * s, by + dy * s, r * s - 1, r * s * 0.92 - 1);
      ctx.fillStyle = c.base;
      ctx.fill();
    }
    ctx.fillStyle = c.light;
    ell(ctx, cx - 6 * s, by - 44 * s, 7 * s, 5 * s);
    ctx.fill();
  }

  /** The tree walls around a map: every T tile gets trees, drawn top to bottom so they overlap. */
  function treeWall(ctx, m, r, c) {
    const spots = [];
    m.terrain.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== 'T') return;
      spots.push([x * TILE + 24 + (r() - 0.5) * 14, y * TILE + 44 + (r() - 0.5) * 8, 0.95 + r() * 0.3]);
    }));
    // Underbrush first, so no grass shows between the trunks.
    ctx.fillStyle = c.dark;
    for (const [x, y] of spots) {
      ell(ctx, x, y - 16, 28, 22);
      ctx.fill();
    }
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, s] of spots) tree(ctx, x, y, s, c);
  }

  function flowers(ctx, x, y, w, h, r) {
    const cols = [CROWN, '#fff', GOLD, SKY];
    for (let i = 0; i < w * h * 5; i++) {
      const fx = x * TILE + 6 + r() * (w * TILE - 12);
      const fy = y * TILE + 6 + r() * (h * TILE - 12);
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        ell(ctx, fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.2, 2.2);
        ctx.fill();
      }
      ctx.fillStyle = GOLD_DEEP;
      ell(ctx, fx, fy, 1.4, 1.4);
      ctx.fill();
    }
  }

  function decorPainter(ctx, d, r) {
    const X = d.x * TILE;
    const Y = d.y * TILE;
    const Wd = (d.w ?? 1) * TILE;
    const Hd = (d.h ?? 1) * TILE;
    switch (d.kind) {
      case 'window': {
        rr(ctx, X + 10, Y + 10, Wd - 20, Hd + 10, 8);
        fillStroke(ctx, '#ffffff', '#7fb6c4', 3);
        const g = ctx.createLinearGradient(0, Y + 14, 0, Y + Hd + 16);
        g.addColorStop(0, '#9fdcef');
        g.addColorStop(1, '#e3f6fb');
        rr(ctx, X + 15, Y + 15, Wd - 30, Hd, 5);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.fillStyle = '#fff';
        for (const [dx, dy, rx] of [[30, 30, 10], [42, 27, 8], [62, 36, 9]]) {
          ell(ctx, X + dx, Y + dy, rx, rx * 0.6);
          ctx.fill();
        }
        ctx.strokeStyle = '#7fb6c4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(X + Wd / 2, Y + 15);
        ctx.lineTo(X + Wd / 2, Y + Hd + 15);
        ctx.stroke();
        // Curtains.
        ctx.fillStyle = CROWN;
        for (const s of [0, 1]) {
          ctx.beginPath();
          const cx = s ? X + Wd - 12 : X + 12;
          ctx.moveTo(cx, Y + 6);
          ctx.quadraticCurveTo(cx + (s ? -14 : 14), Y + 30, cx + (s ? -4 : 4), Y + Hd + 18);
          ctx.lineTo(cx + (s ? 6 : -6), Y + Hd + 18);
          ctx.lineTo(cx + (s ? 6 : -6), Y + 6);
          ctx.closePath();
          fillStroke(ctx, CROWN, CROWN_DEEP, 1.5);
        }
        break;
      }
      case 'clock': {
        ell(ctx, X + 24, Y + 28, 13, 13);
        fillStroke(ctx, CREAM, '#8a6038', 3);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(X + 24, Y + 28);
        ctx.lineTo(X + 24, Y + 20);
        ctx.moveTo(X + 24, Y + 28);
        ctx.lineTo(X + 30, Y + 30);
        ctx.stroke();
        break;
      }
      case 'frame': {
        rr(ctx, X + 8, Y + 12, 32, 28, 3);
        fillStroke(ctx, '#fdf3d8', '#c4935f', 3);
        crown(ctx, X + 24, Y + 33, 16, 12, 1.2);
        break;
      }
      case 'bookshelf': {
        rr(ctx, X + 4, Y + 6, Wd - 8, Hd - 4, 4);
        fillStroke(ctx, '#c4935f', '#7d5531', 3);
        const shelves = 3;
        const inner = (Hd - 22) / shelves;
        const cols = [CROWN, SKY_MID, GOLD, '#a8e6a1', '#c9b8f0', '#f6b04a', SKY, '#fff'];
        for (let s = 0; s < shelves; s++) {
          const sy = Y + 12 + s * inner;
          ctx.fillStyle = '#8a6038';
          ctx.fillRect(X + 9, sy, Wd - 18, inner - 4);
          let bx = X + 11;
          while (bx < X + Wd - 16) {
            const bw = 5 + Math.floor(r() * 5);
            const bh = inner - 8 - Math.floor(r() * 7);
            ctx.fillStyle = cols[Math.floor(r() * cols.length)];
            ctx.fillRect(bx, sy + inner - 4 - bh, bw, bh);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(bx + bw - 1, sy + inner - 4 - bh, 1, bh);
            bx += bw + 1;
          }
          ctx.fillStyle = '#7d5531';
          ctx.fillRect(X + 7, sy + inner - 4, Wd - 14, 4);
        }
        break;
      }
      case 'plant': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + 24, Y + 42, 13, 4);
        ctx.fill();
        rr(ctx, X + 13, Y + 26, 22, 17, 5);
        fillStroke(ctx, CROWN, CROWN_DEEP, 2);
        for (const [dx, dy, a] of [[-8, -6, -0.6], [8, -6, 0.6], [0, -12, 0], [-4, -2, -0.3], [5, -1, 0.3]]) {
          ctx.save();
          ctx.translate(X + 24 + dx * 0.6, Y + 26 + dy * 0.6);
          ctx.rotate(a);
          ell(ctx, 0, -8, 5, 10);
          fillStroke(ctx, '#8fcf86', '#5f9d58', 1.6);
          ctx.restore();
        }
        break;
      }
      case 'bed': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + Wd / 2, Y + Hd - 6, Wd / 2 - 4, 10);
        ctx.fill();
        ell(ctx, X + Wd / 2, Y + Hd / 2 + 4, Wd / 2 - 6, Hd / 2 - 6);
        fillStroke(ctx, CROWN, CROWN_DEEP, 3);
        ell(ctx, X + Wd / 2, Y + Hd / 2 + 6, Wd / 2 - 18, Hd / 2 - 18);
        fillStroke(ctx, '#fde3ea', CROWN_DEEP, 2);
        // A blanket and a pillow.
        rr(ctx, X + 26, Y + 40, Wd - 52, 30, 10);
        fillStroke(ctx, SKY, SKY_MID, 2);
        ell(ctx, X + Wd / 2, Y + 30, 14, 8);
        fillStroke(ctx, '#fff', '#d9c7cc', 1.5);
        break;
      }
      case 'rug': {
        ell(ctx, X + Wd / 2, Y + Hd / 2, Wd / 2 - 6, Hd / 2 - 8);
        fillStroke(ctx, '#fde3ea', CROWN, 6);
        ell(ctx, X + Wd / 2, Y + Hd / 2, Wd / 2 - 26, Hd / 2 - 26);
        ctx.strokeStyle = CROWN;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
        crown(ctx, X + Wd / 2, Y + Hd / 2 + 9, 34, 22, 2);
        break;
      }
      case 'table': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + Wd / 2, Y + 44, Wd / 2 - 8, 6);
        ctx.fill();
        ell(ctx, X + Wd / 2, Y + 22, Wd / 2 - 8, 16);
        fillStroke(ctx, '#d9a06a', '#8a6038', 3);
        // A cookie jar.
        rr(ctx, X + Wd / 2 - 10, Y + 4, 20, 20, 6);
        fillStroke(ctx, 'rgba(230,248,252,0.95)', '#7fb6c4', 2);
        ctx.fillStyle = '#d9a06a';
        for (const [dx, dy] of [[-4, 17], [4, 15], [0, 11]]) {
          ell(ctx, X + Wd / 2 + dx, Y + dy, 4, 3);
          ctx.fill();
        }
        rr(ctx, X + Wd / 2 - 8, Y + 1, 16, 5, 2);
        fillStroke(ctx, CROWN, CROWN_DEEP, 1.5);
        // A cup.
        rr(ctx, X + 18, Y + 16, 10, 10, 3);
        fillStroke(ctx, '#fff', '#9cc9d4', 1.5);
        break;
      }
      case 'door-inside': {
        ctx.fillStyle = '#e9c99a';
        ctx.fillRect(X + 2, Y, TILE - 4, TILE);
        rr(ctx, X + 6, Y + 14, TILE - 12, 24, 6);
        fillStroke(ctx, CROWN, CROWN_DEEP, 2);
        ctx.fillStyle = 'rgba(15,23,26,0.25)';
        ctx.fillRect(X + 2, Y + TILE - 6, TILE - 4, 6);
        break;
      }
      case 'house': {
        // Walls, then a roof the colour of the sky, with the crown over the door.
        ctx.fillStyle = 'rgba(15,23,26,0.18)';
        rr(ctx, X + 4, Y + Hd - 12, Wd - 8, 16, 6);
        ctx.fill();
        rr(ctx, X + 8, Y + 58, Wd - 16, Hd - 62, 6);
        fillStroke(ctx, CREAM, '#c9b28f', 3);
        ctx.beginPath();
        ctx.moveTo(X - 2, Y + 70);
        ctx.lineTo(X + Wd / 2, Y + 4);
        ctx.lineTo(X + Wd + 2, Y + 70);
        ctx.closePath();
        fillStroke(ctx, SKY_MID, SKY_DEEP, 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 3;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(X + Wd / 2 - i * 26, Y + 4 + i * 17);
          ctx.lineTo(X + Wd / 2 + i * 26, Y + 4 + i * 17);
          ctx.stroke();
        }
        crown(ctx, X + Wd / 2, Y + 52, 30, 20, 2);
        // The door (tile 2 of the bottom row) and two windows.
        const dx = X + 2 * TILE;
        const dy = Y + 3 * TILE;
        rr(ctx, dx + 8, dy - 10, 32, 58, [14, 14, 0, 0]);
        fillStroke(ctx, '#c4935f', '#7d5531', 3);
        ell(ctx, dx + 33, dy + 22, 2.2, 2.2);
        ctx.fillStyle = GOLD;
        ctx.fill();
        for (const wx of [X + 18, X + Wd - 58]) {
          rr(ctx, wx, Y + 104, 40, 30, 6);
          fillStroke(ctx, '#bfe9f4', '#7fb6c4', 3);
          ctx.strokeStyle = '#7fb6c4';
          ctx.beginPath();
          ctx.moveTo(wx + 20, Y + 104);
          ctx.lineTo(wx + 20, Y + 134);
          ctx.stroke();
          ctx.fillStyle = CROWN;
          ctx.fillRect(wx - 2, Y + 134, 44, 6);
        }
        break;
      }
      case 'bigtree': {
        tree(ctx, X + Wd / 2, Y + Hd + 4, 1.9, { base: '#8fcf86', dark: '#6bb26a', light: '#b5e2a8' });
        break;
      }
      case 'stump': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + 24, Y + 42, 16, 5);
        ctx.fill();
        rr(ctx, X + 9, Y + 22, 30, 20, 6);
        fillStroke(ctx, '#c4935f', '#7d5531', 2.5);
        ell(ctx, X + 24, Y + 22, 15, 6);
        fillStroke(ctx, '#e8c48f', '#7d5531', 2.5);
        ctx.strokeStyle = '#c4935f';
        ctx.lineWidth = 1.2;
        ell(ctx, X + 24, Y + 22, 8, 3);
        ctx.stroke();
        break;
      }
      case 'stall': {
        // Posts, then a striped awning.
        ctx.fillStyle = '#a8703f';
        ctx.fillRect(X + 8, Y + 30, 6, Hd + 20);
        ctx.fillRect(X + Wd - 14, Y + 30, 6, Hd + 20);
        rr(ctx, X + 4, Y + 46, Wd - 8, Hd - 30, 6);
        fillStroke(ctx, '#f5e6cf', '#c9b28f', 2);
        // Shelves of goods behind the counter.
        for (const [gx, col] of [[24, GOLD], [40, CROWN], [130, SKY_MID], [150, '#a8e6a1'], [166, GOLD]]) {
          ell(ctx, X + gx, Y + 70, 6, 6);
          fillStroke(ctx, col, INK, 1.2);
        }
        ctx.beginPath();
        ctx.moveTo(X, Y + 12);
        ctx.lineTo(X + Wd, Y + 12);
        ctx.lineTo(X + Wd + 4, Y + 44);
        ctx.lineTo(X - 4, Y + 44);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = i % 2 ? '#ffffff' : CROWN;
          ctx.fillRect(X - 4 + i * 18, Y, 18, 50);
        }
        ctx.restore();
        ctx.strokeStyle = CROWN_DEEP;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Scalloped edge.
        for (let i = 0; i < 11; i++) {
          ctx.beginPath();
          ctx.arc(X + 4 + i * 18.4, Y + 44, 9, 0, Math.PI);
          fillStroke(ctx, i % 2 ? '#ffffff' : CROWN, CROWN_DEEP, 1.5);
        }
        break;
      }
      case 'counter': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        rr(ctx, X + 2, Y + 36, Wd - 4, 12, 6);
        ctx.fill();
        rr(ctx, X + 2, Y + 4, Wd - 4, 38, 6);
        fillStroke(ctx, '#d9a06a', '#8a6038', 3);
        rr(ctx, X + 2, Y + 4, Wd - 4, 10, [6, 6, 0, 0]);
        fillStroke(ctx, '#e8c48f', '#8a6038', 3);
        // A basket of cookies and a little sign of a coin.
        ell(ctx, X + 40, Y + 12, 14, 7);
        fillStroke(ctx, '#c4935f', '#7d5531', 2);
        ctx.fillStyle = '#e9b97a';
        for (const dx of [-6, 0, 6]) {
          ell(ctx, X + 40 + dx, Y + 9, 4, 3);
          ctx.fill();
        }
        ell(ctx, X + Wd - 40, Y + 26, 9, 9);
        fillStroke(ctx, GOLD, GOLD_DEEP, 2);
        crown(ctx, X + Wd - 40, Y + 29, 10, 7, 1);
        break;
      }
      case 'sign': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + 24, Y + 44, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#8a6038';
        ctx.fillRect(X + 21, Y + 22, 6, 22);
        rr(ctx, X + 4, Y + 6, 40, 22, 4);
        fillStroke(ctx, '#e8c48f', '#7d5531', 2.5);
        // An arrow to the forest — no words on it: everything to read is text the translator reaches.
        ctx.fillStyle = SKY_DEEP;
        poly(ctx, [[X + 12, Y + 14], [X + 28, Y + 14], [X + 28, Y + 10], [X + 37, Y + 17], [X + 28, Y + 24], [X + 28, Y + 20], [X + 12, Y + 20]]);
        ctx.fill();
        break;
      }
      case 'flowers':
        flowers(ctx, d.x, d.y, d.w ?? 1, d.h ?? 1, r);
        break;
      case 'fence': {
        ctx.strokeStyle = '#8a6038';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#e8c48f';
        for (let i = 0; i <= (d.w ?? 1) * 2; i++) {
          rr(ctx, X + i * 24 - 4, Y + 14, 8, 30, [4, 4, 1, 1]);
          fillStroke(ctx, '#e8c48f', '#8a6038', 2);
        }
        ctx.fillStyle = '#d9a06a';
        ctx.fillRect(X - 2, Y + 22, Wd + 4, 5);
        ctx.fillRect(X - 2, Y + 34, Wd + 4, 5);
        break;
      }
      case 'bush': {
        for (const [dx, dy, rad] of [[-9, 30, 11], [9, 30, 11], [0, 22, 13]]) {
          ell(ctx, X + 24 + dx, Y + dy, rad, rad * 0.85);
          fillStroke(ctx, '#7cc078', '#5f9d58', 2);
        }
        ctx.fillStyle = CROWN;
        for (const [dx, dy] of [[-6, 24], [7, 28], [1, 17]]) {
          ell(ctx, X + 24 + dx, Y + dy, 2.4, 2.4);
          ctx.fill();
        }
        break;
      }
      case 'lamp': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + 24, Y + 44, 8, 3);
        ctx.fill();
        ctx.fillStyle = SKY_DEEP;
        ctx.fillRect(X + 22, Y + 10, 4, 34);
        rr(ctx, X + 15, Y - 6, 18, 18, 5);
        fillStroke(ctx, '#fff6c8', SKY_DEEP, 2.5);
        crown(ctx, X + 24, Y - 6, 12, 8, 1);
        break;
      }
      case 'log': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + Wd / 2, Y + 40, Wd / 2 - 2, 7);
        ctx.fill();
        rr(ctx, X + 4, Y + 16, Wd - 8, 24, 12);
        fillStroke(ctx, '#b07a48', '#6e4a2a', 2.5);
        ell(ctx, X + Wd - 12, Y + 28, 8, 12);
        fillStroke(ctx, '#e8c48f', '#6e4a2a', 2.5);
        ctx.strokeStyle = '#8a6038';
        ctx.lineWidth = 1.5;
        for (const lx of [20, 40, 60]) {
          ctx.beginPath();
          ctx.moveTo(X + lx, Y + 22);
          ctx.lineTo(X + lx + 10, Y + 22);
          ctx.stroke();
        }
        ell(ctx, X + 30, Y + 16, 6, 3);
        fillStroke(ctx, '#8fcf86', '#5f9d58', 1);
        break;
      }
      case 'rock': {
        ctx.fillStyle = 'rgba(15,23,26,0.15)';
        ell(ctx, X + 24, Y + 41, 16, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(X + 8, Y + 40);
        ctx.quadraticCurveTo(X + 6, Y + 18, X + 24, Y + 14);
        ctx.quadraticCurveTo(X + 42, Y + 16, X + 40, Y + 40);
        ctx.closePath();
        fillStroke(ctx, '#c9d3d6', '#7d8c91', 2.5);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ell(ctx, X + 18, Y + 22, 5, 3);
        ctx.fill();
        break;
      }
      case 'mushrooms': {
        for (const [dx, dy, s] of [[16, 34, 1], [30, 38, 0.8], [26, 26, 0.6]]) {
          ctx.fillStyle = '#fff8ee';
          ctx.fillRect(X + dx - 2 * s, Y + dy - 6 * s, 4 * s, 8 * s);
          ctx.beginPath();
          ctx.arc(X + dx, Y + dy - 6 * s, 8 * s, Math.PI, 0);
          ctx.closePath();
          fillStroke(ctx, CROWN, CROWN_DEEP, 1.5);
          ctx.fillStyle = '#fff';
          ell(ctx, X + dx - 3 * s, Y + dy - 9 * s, 1.6 * s, 1.6 * s);
          ctx.fill();
        }
        break;
      }
      case 'sunbeam': {
        const g = ctx.createRadialGradient(X + Wd / 2, Y + Hd / 2, 10, X + Wd / 2, Y + Hd / 2, Wd * 0.7);
        g.addColorStop(0, 'rgba(255,250,215,0.38)');
        g.addColorStop(1, 'rgba(255,250,215,0)');
        ctx.fillStyle = g;
        ctx.fillRect(X - Wd, Y - Hd, Wd * 3, Hd * 3);
        break;
      }
      default:
        throw new Error('no painter for decor ' + d.kind);
    }
  }

  function paintHouse(m) {
    const c = canvas(816, 624);
    const ctx = c.getContext('2d');
    const r = rng(11);
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, 816, 624);
    // The room: x 2..14 (walls on the sides), y 1..10.
    const rx = 2 * TILE;
    const rw = 13 * TILE;
    ctx.fillStyle = '#b7dbe3';
    rr(ctx, rx - 6, TILE - 6, rw + 12, 10 * TILE + 12, 14);
    ctx.fill();
    // Floor planks.
    const fx = 3 * TILE;
    const fy = 3 * TILE;
    const fw = 11 * TILE;
    const fh = 8 * TILE;
    for (let y = 0; y < fh; y += 16) {
      ctx.fillStyle = (y / 16) % 2 ? '#e9c99a' : '#edd0a5';
      ctx.fillRect(fx, fy + y, fw, 16);
      ctx.fillStyle = '#d8b07a';
      ctx.fillRect(fx, fy + y + 15, fw, 1);
      let x = (y / 16) % 2 ? -40 : 0;
      while (x < fw) {
        x += 80 + Math.floor(r() * 40);
        if (x < fw) ctx.fillRect(fx + x, fy + y, 1.5, 15);
      }
    }
    // The back wall: sky wallpaper with little crowns, a darker skirting.
    const wy = TILE;
    const wh = 2 * TILE;
    ctx.fillStyle = '#d6eef3';
    ctx.fillRect(fx, wy, fw, wh);
    ctx.globalAlpha = 0.5;
    for (let y = wy + 18; y < wy + wh - 10; y += 30) {
      for (let x = fx + 20 + (((y - wy) / 30) % 2) * 22; x < fx + fw; x += 44) crown(ctx, x, y, 10, 7, 0.01);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#9cc9d4';
    ctx.fillRect(fx, wy + wh - 10, fw, 10);
    ctx.fillStyle = 'rgba(15,23,26,0.12)';
    ctx.fillRect(fx, wy + wh, fw, 6);
    // Side walls and the front wall are the tops of walls: a lighter strip with an edge.
    ctx.fillStyle = '#c9e6ed';
    ctx.fillRect(rx, wy, TILE, 10 * TILE);
    ctx.fillRect(rx + 12 * TILE, wy, TILE, 10 * TILE);
    ctx.fillRect(rx, 10 * TILE, 13 * TILE, TILE);
    ctx.fillStyle = '#9cc9d4';
    ctx.fillRect(rx + TILE - 4, fy, 4, fh);
    ctx.fillRect(rx + 12 * TILE, fy, 4, fh);
    ctx.fillRect(fx, 10 * TILE, fw, 4);
    for (const d of m.decor) decorPainter(ctx, d, r);
    return c;
  }

  function paintVillage(m) {
    const c = canvas(816, 624);
    const ctx = c.getContext('2d');
    const r = rng(23);
    grass(ctx, m, r, '#bfe3a5', '#9fcf86', '#d4efc0');
    water(ctx, m);
    paths(ctx, m, '#f3e6c9', '#e2cfa6');
    const order = [...m.decor].sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1)));
    for (const d of order) decorPainter(ctx, d, r);
    treeWall(ctx, m, rng(5), { base: '#8fcf86', dark: '#6bb26a', light: '#b5e2a8' });
    return c;
  }

  function paintForest(m) {
    const c = canvas(816, 624);
    const ctx = c.getContext('2d');
    const r = rng(41);
    grass(ctx, m, r, '#a9d68c', '#86bd70', '#c2e4a9');
    paths(ctx, m, '#eadbb8', '#d6c095');
    const order = [...m.decor].sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1)));
    for (const d of order) if (d.kind !== 'sunbeam') decorPainter(ctx, d, r);
    treeWall(ctx, m, rng(9), { base: '#6fb36a', dark: '#4f8f53', light: '#94cc87' });
    for (const d of m.decor) if (d.kind === 'sunbeam') decorPainter(ctx, d, r);
    return c;
  }

  // ── title, battle, game over ──────────────────────────────────────────────────

  function cloud(ctx, x, y, s) {
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, rad] of [[0, 0, 26], [-26, 8, 18], [26, 8, 18], [-12, -12, 18], [14, -10, 20]]) {
      ell(ctx, x + dx * s, y + dy * s, rad * s, rad * s * 0.85);
      ctx.fill();
    }
  }

  function sparkle(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fill();
  }

  function paintTitle(logo) {
    const c = canvas(816, 624);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 624);
    g.addColorStop(0, '#8fd3e6');
    g.addColorStop(0.6, '#d9f1f7');
    g.addColorStop(1, '#fdf1f4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 816, 624);
    cloud(ctx, 110, 470, 1.3);
    cloud(ctx, 700, 110, 1.1);
    cloud(ctx, 160, 90, 0.8);
    cloud(ctx, 480, 560, 1.5);
    // Rolling hills.
    ctx.fillStyle = '#c9ebb4';
    ctx.beginPath();
    ctx.moveTo(0, 560);
    ctx.quadraticCurveTo(220, 470, 450, 545);
    ctx.quadraticCurveTo(650, 600, 816, 520);
    ctx.lineTo(816, 624);
    ctx.lineTo(0, 624);
    ctx.fill();
    ctx.fillStyle = '#b3e09a';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.quadraticCurveTo(300, 540, 816, 610);
    ctx.lineTo(816, 624);
    ctx.lineTo(0, 624);
    ctx.fill();
    const r = rng(3);
    for (let i = 0; i < 26; i++) sparkle(ctx, r() * 816, r() * 330, 3 + r() * 6, r() < 0.5 ? '#ffffff' : CROWN);
    // The cat, waving in from the right.
    ctx.drawImage(logo, 560, 300, 230, 230);
    // A soft band where the game draws its title, so it reads on the clouds.
    const band = ctx.createLinearGradient(0, 100, 0, 220);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 100, 816, 120);
    return c;
  }

  function paintGameOver(logo) {
    const c = canvas(816, 624);
    const ctx = c.getContext('2d');
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, 816, 624);
    const r = rng(8);
    for (let i = 0; i < 60; i++) sparkle(ctx, r() * 816, r() * 624, 1 + r() * 3, 'rgba(186,230,239,0.6)');
    ctx.globalAlpha = 0.55;
    ctx.drawImage(logo, 288, 192, 240, 240);
    ctx.globalAlpha = 1;
    return c;
  }

  function paintBattlebacks() {
    const floor = canvas(1000, 740);
    let ctx = floor.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, 740);
    sky.addColorStop(0, '#9fdcef');
    sky.addColorStop(0.45, '#e3f6fb');
    sky.addColorStop(0.46, '#a9d68c');
    sky.addColorStop(1, '#86bd70');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1000, 740);
    const r = rng(17);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ell(ctx, 500, 520, 330, 70);
    ctx.fill();
    ctx.strokeStyle = '#7fb36f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 200; i++) {
      const x = r() * 1000;
      const y = 350 + r() * 390;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 3);
      ctx.lineTo(x - 1, y - 3);
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + 1, y - 3);
      ctx.stroke();
    }
    flowers(ctx, 1, 9, 3, 3, r);
    flowers(ctx, 15, 10, 4, 3, r);
    const walls = canvas(1000, 740);
    ctx = walls.getContext('2d');
    const t = rng(21);
    const spots = [];
    for (let x = -20; x < 1040; x += 70) spots.push([x + (t() - 0.5) * 30, 300 + t() * 40, 2.1 + t() * 0.6]);
    for (let x = 0; x < 1000; x += 160) spots.push([x + (t() - 0.5) * 40, 380 + t() * 30, 2.6]);
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, s] of spots) tree(ctx, x, y, s, { base: '#6fb36a', dark: '#4f8f53', light: '#94cc87' });
    return { floor, walls };
  }

  function paintEnemy() {
    const c = canvas(260, 220);
    const ctx = c.getContext('2d');
    ctx.translate(130 - 24 * 5, 214 - 44 * 5);
    ctx.scale(5, 5);
    drawSlime(ctx, 2, 1);
    return c;
  }

  // ── system pictures ───────────────────────────────────────────────────────────

  /** The window skin: night-sky panels, a sky frame, a crown-pink cursor and the text colours. */
  function paintWindow() {
    const c = canvas(192, 192);
    const ctx = c.getContext('2d');
    // Background (stretched) and its pattern (tiled).
    const g = ctx.createLinearGradient(0, 0, 0, 96);
    g.addColorStop(0, '#24414a');
    g.addColorStop(1, '#13232a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 96);
    ctx.fillStyle = 'rgba(186,230,239,0.05)';
    for (let y = 96; y < 192; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < 96; x += 12) ctx.fillRect(x, y, 2, 2);
    // Frame.
    rr(ctx, 96 + 3, 3, 90, 90, 14);
    ctx.strokeStyle = SKY;
    ctx.lineWidth = 3;
    ctx.stroke();
    rr(ctx, 96 + 7, 7, 82, 82, 11);
    ctx.strokeStyle = 'rgba(186,230,239,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Scroll arrows (the frame's middle).
    ctx.clearRect(120, 24, 48, 48);
    ctx.fillStyle = SKY;
    poly(ctx, [[144, 26], [154, 35], [134, 35]]);
    ctx.fill();
    poly(ctx, [[144, 70], [154, 61], [134, 61]]);
    ctx.fill();
    // Cursor.
    rr(ctx, 97, 97, 46, 46, 6);
    ctx.fillStyle = 'rgba(247,180,196,0.32)';
    ctx.fill();
    ctx.strokeStyle = CROWN;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pause sign: four frames of a crown bobbing.
    [[144, 96, 0], [168, 96, 1.5], [144, 120, 3], [168, 120, 1.5]].forEach(([x, y, d]) => {
      crown(ctx, x + 12, y + 18 - d, 14, 10, 1);
    });
    // Text colours, 8 × 4 swatches of 12 px.
    const colours = [
      '#ffffff', SKY, CROWN, '#a8e6a1', '#9fd8e6', '#c9b8f0', GOLD, '#c4d2d6',
      '#7d8c91', '#7cc4d8', '#f48fa6', '#7fd08a', '#5fb3cb', '#a58ee0', '#f6b04a', '#3a4b50',
      '#9fd8e6', '#f9d77e', '#f48fa6', '#0b1215', CROWN, '#fb8fae', SKY, '#6fc3d6',
      '#a8e6a1', '#f48fa6', '#a58ee0', '#c9b8f0', GOLD, '#f9a826', '#ffffff', '#ffffff',
    ];
    colours.forEach((col, n) => {
      ctx.fillStyle = col;
      ctx.fillRect(96 + (n % 8) * 12, 144 + Math.floor(n / 8) * 12, 12, 12);
    });
    return c;
  }

  function icon(ctx, i, draw) {
    ctx.save();
    ctx.translate((i % 16) * 32, Math.floor(i / 16) * 32);
    draw(ctx);
    ctx.restore();
  }

  function paintIcons(coin) {
    const c = canvas(512, 64);
    const ctx = c.getContext('2d');
    ctx.lineJoin = 'round';
    // 1 crown cookie
    icon(ctx, 1, (g) => {
      ell(g, 16, 17, 11, 10);
      fillStroke(g, '#e9b97a', '#8a6038', 2);
      crown(g, 16, 21, 12, 9, 1);
    });
    // 2 the map of words
    icon(ctx, 2, (g) => {
      rr(g, 5, 7, 22, 18, 3);
      fillStroke(g, '#fdf3d8', '#8a6038', 2);
      g.strokeStyle = SKY_DEEP;
      g.lineWidth = 1.6;
      g.setLineDash([2, 2]);
      g.beginPath();
      g.moveTo(9, 20);
      g.quadraticCurveTo(15, 10, 23, 13);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = CROWN_DEEP;
      ell(g, 23, 13, 2.2, 2.2);
      g.fill();
    });
    // 3 wooden sword
    icon(ctx, 3, (g) => {
      g.save();
      g.translate(16, 16);
      g.rotate(-Math.PI / 4);
      rr(g, -3, -14, 6, 20, 2);
      fillStroke(g, '#e8c48f', '#8a6038', 1.6);
      rr(g, -7, 5, 14, 3.5, 1.5);
      fillStroke(g, '#c4935f', '#7d5531', 1.4);
      rr(g, -2, 8, 4, 6, 1.5);
      fillStroke(g, '#a8703f', '#7d5531', 1.2);
      g.restore();
    });
    // 4 fluffy scarf
    icon(ctx, 4, (g) => {
      rr(g, 5, 9, 22, 8, 4);
      fillStroke(g, SKY, SKY_DEEP, 1.6);
      rr(g, 17, 14, 7, 13, 3);
      fillStroke(g, SKY, SKY_DEEP, 1.6);
      g.fillStyle = CROWN;
      for (const x of [9, 14, 19]) g.fillRect(x, 10.5, 2, 5);
    });
    // 5 paw (cat punch)
    icon(ctx, 5, (g) => {
      ell(g, 16, 20, 7, 6);
      fillStroke(g, CROWN, CROWN_DEEP, 1.6);
      for (const [x, y] of [[9, 12], [14, 9], [19, 9], [24, 12]]) {
        ell(g, x, y, 2.6, 3);
        fillStroke(g, CROWN, CROWN_DEEP, 1.2);
      }
    });
    // 6 crown beam
    icon(ctx, 6, (g) => {
      g.fillStyle = 'rgba(251,208,22,0.5)';
      poly(g, [[16, 18], [30, 6], [30, 30]]);
      g.fill();
      crown(g, 12, 22, 16, 12, 1.2);
    });
    // 7 tackle (slime drop)
    icon(ctx, 7, (g) => {
      g.beginPath();
      g.moveTo(16, 5);
      g.quadraticCurveTo(27, 18, 22, 25);
      g.quadraticCurveTo(16, 30, 10, 25);
      g.quadraticCurveTo(5, 18, 16, 5);
      fillStroke(g, '#cbc5ea', '#6f66a8', 1.8);
    });
    // 8 whisper of garbled words
    icon(ctx, 8, (g) => {
      rr(g, 4, 6, 24, 16, 6);
      fillStroke(g, '#fff', '#6f66a8', 1.8);
      poly(g, [[10, 21], [8, 27], [15, 21]]);
      fillStroke(g, '#fff', '#6f66a8', 1.4);
      g.strokeStyle = '#6f66a8';
      g.lineWidth = 1.2;
      for (const x of [8, 14, 20]) g.strokeRect(x, 11, 4, 4);
    });
    // 9 shield (guard)
    icon(ctx, 9, (g) => {
      g.beginPath();
      g.moveTo(16, 4);
      g.lineTo(27, 8);
      g.quadraticCurveTo(26, 22, 16, 28);
      g.quadraticCurveTo(6, 22, 5, 8);
      g.closePath();
      fillStroke(g, SKY, SKY_DEEP, 2);
      crown(g, 16, 18, 10, 7, 1);
    });
    // 10 attack (a claw swipe)
    icon(ctx, 10, (g) => {
      g.strokeStyle = SKY_DEEP;
      g.lineWidth = 2.6;
      g.lineCap = 'round';
      for (const d of [-6, 0, 6]) {
        g.beginPath();
        g.moveTo(9 + d, 6);
        g.quadraticCurveTo(14 + d, 16, 23 + d, 26);
        g.stroke();
      }
    });
    // 11 knocked out (a sleepy Z)
    icon(ctx, 11, (g) => {
      g.fillStyle = SKY_DEEP;
      g.font = '900 20px Nunito';
      g.textAlign = 'center';
      g.fillText('z', 12, 26);
      g.font = '900 14px Nunito';
      g.fillText('z', 22, 15);
    });
    // 12 the gold coin
    icon(ctx, 12, (g) => g.drawImage(coin, 2, 2, 28, 28));
    // 13 key item bag
    icon(ctx, 13, (g) => {
      rr(g, 6, 11, 20, 16, 6);
      fillStroke(g, CROWN, CROWN_DEEP, 1.8);
      rr(g, 11, 6, 10, 7, 3);
      fillStroke(g, CROWN, CROWN_DEEP, 1.6);
    });
    return c;
  }

  function paintBalloons() {
    const c = canvas(384, 720);
    const ctx = c.getContext('2d');
    const marks = [
      (g) => {
        g.fillStyle = CROWN_DEEP;
        rr(g, -2.5, -11, 5, 12, 2.5);
        g.fill();
        ell(g, 0, 5, 2.8, 2.8);
        g.fill();
      },
      (g) => {
        g.strokeStyle = SKY_DEEP;
        g.lineWidth = 3.2;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(0, -5, 5, Math.PI * 1.1, Math.PI * 2.35);
        g.lineTo(0, 1);
        g.stroke();
        g.fillStyle = SKY_DEEP;
        ell(g, 0, 6, 2.2, 2.2);
        g.fill();
      },
      (g) => {
        g.fillStyle = SKY_DEEP;
        ell(g, -3, 5, 3.5, 2.8);
        g.fill();
        g.fillRect(-0.2, -10, 2.2, 15);
        g.fillRect(-0.2, -10, 7, 3);
      },
      (g) => {
        g.fillStyle = CROWN_DEEP;
        g.beginPath();
        g.moveTo(0, 7);
        g.bezierCurveTo(-12, -2, -6, -12, 0, -5);
        g.bezierCurveTo(6, -12, 12, -2, 0, 7);
        g.fill();
      },
    ];
    marks.forEach((mark, row) => {
      for (let f = 0; f < 8; f++) {
        const s = f === 0 ? 0.45 : f === 1 ? 0.8 : f === 2 ? 1.08 : 1;
        ctx.save();
        ctx.translate(f * 48 + 24, row * 48 + 22);
        ctx.scale(s, s);
        rr(ctx, -15, -16, 30, 28, 12);
        fillStroke(ctx, '#ffffff', INK, 2);
        poly(ctx, [[-3, 11], [-6, 19], [4, 11]]);
        fillStroke(ctx, '#ffffff', INK, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, 8, 10, 4);
        ctx.translate(0, -2);
        mark(ctx);
        ctx.restore();
      }
    });
    return c;
  }

  function paintDamage() {
    const w = 32;
    const h = 40;
    const c = canvas(w * 10, h * 5);
    const ctx = c.getContext('2d');
    const rows = ['#ffffff', '#a8e6a1', CROWN, SKY];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = '900 34px Nunito';
    rows.forEach((col, row) => {
      for (let d = 0; d < 10; d++) {
        ctx.lineWidth = 6;
        ctx.strokeStyle = INK;
        ctx.strokeText(String(d), d * w + w / 2, row * h + h / 2 + 2);
        ctx.fillStyle = col;
        ctx.fillText(String(d), d * w + w / 2, row * h + h / 2 + 2);
      }
    });
    ctx.font = '900 30px Nunito';
    ctx.lineWidth = 6;
    ctx.strokeText('Miss', w * 2, h * 4 + h / 2 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Miss', w * 2, h * 4 + h / 2 + 2);
    return c;
  }

  function paintShadow(rx, ry) {
    const c = canvas(48, 48);
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(15,23,26,0.35)';
    ell(ctx, 24, 40, rx, ry);
    ctx.fill();
    return c;
  }

  function paintButtons() {
    const c = canvas(288, 96);
    const ctx = c.getContext('2d');
    const labels = ['«', '‹', '›', '»', 'OK'];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 22px Nunito';
    for (let row = 0; row < 2; row++) {
      labels.forEach((label, i) => {
        const x = i * 48;
        const w = i === 4 ? 96 : 48;
        rr(ctx, x + 3, row * 48 + 3, w - 6, 42, 10);
        fillStroke(ctx, row ? CROWN : '#24414a', SKY, 2);
        ctx.fillStyle = row ? INK : '#ffffff';
        ctx.fillText(label, x + w / 2, row * 48 + 25);
      });
    }
    return c;
  }

  function paintLoading(logo) {
    const c = canvas(240, 240);
    c.getContext('2d').drawImage(logo, 40, 40, 160, 160);
    return c;
  }

  window.paintAll = async ({ layouts, logo: logoUrl, coin: coinUrl }) => {
    const load = async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return img;
    };
    const logo = await load(logoUrl);
    const coin = await load(coinUrl);
    await document.fonts.load('900 30px Nunito');
    const out = {};
    const put = (path, c) => (out[path] = c.toDataURL('image/png'));

    // Nine is the icon, whichever way Nine walks: the front view on all four rows, only hopping.
    put('img/characters/$Nine.png', sheet((g, _dir, p) => drawCat(g, 2, p, NINE)));
    put('img/characters/$Mike.png', sheet((g, dir, p) => drawCat(g, dir, p, MIKE)));
    put('img/characters/$Owl.png', sheet((g, dir, p) => drawOwl(g, dir, p)));
    put('img/characters/$Slime.png', sheet((g, dir, p) => drawSlime(g, dir, p)));
    put('img/characters/$SlimeHappy.png', sheet((g, dir, p) => drawSlime(g, dir, p, { happy: true })));
    put('img/characters/!$Chest.png', sheet((g, _dir, _p, row) => drawChest(g, row)));
    put('img/faces/Nine.png', nineFaces(logo));
    put('img/faces/Friends.png', friendFaces());

    const byId = Object.fromEntries(layouts.map((m) => [m.id, m]));
    put(`img/parallaxes/${byId[1].parallax}.png`, paintHouse(byId[1]));
    put(`img/parallaxes/${byId[2].parallax}.png`, paintVillage(byId[2]));
    put(`img/parallaxes/${byId[3].parallax}.png`, paintForest(byId[3]));
    // The tileset is invisible: the maps are their pictures, the tiles only say where Nine can walk.
    put('img/tilesets/NineTiles.png', canvas(384, 768));

    put('img/titles1/NineTitle.png', paintTitle(logo));
    const bb = paintBattlebacks();
    put('img/battlebacks1/NineForest.png', bb.floor);
    put('img/battlebacks2/NineForest.png', bb.walls);
    put('img/enemies/MojibakeSlime.png', paintEnemy());

    put('img/system/Window.png', paintWindow());
    put('img/system/IconSet.png', paintIcons(coin));
    put('img/system/Balloon.png', paintBalloons());
    put('img/system/Damage.png', paintDamage());
    put('img/system/Shadow1.png', paintShadow(16, 6));
    put('img/system/Shadow2.png', paintShadow(12, 4.5));
    put('img/system/ButtonSet.png', paintButtons());
    put('img/system/GameOver.png', paintGameOver(logo));
    put('img/system/Loading.png', paintLoading(logo));
    // Side-view battle pictures: this game is front view, but the engine loads them at start.
    put('img/system/States.png', canvas(96, 96));
    for (const n of [1, 2, 3]) put(`img/system/Weapons${n}.png`, canvas(96, 64));
    const icon256 = canvas(256, 256);
    icon256.getContext('2d').drawImage(logo, 0, 0, 256, 256);
    put('icon/icon.png', icon256);
    return out;
  };
})();
