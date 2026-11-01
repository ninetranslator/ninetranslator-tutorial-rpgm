/**
 * The tutorial game's data: every picture it names exists, its events are well formed, Nine can
 * reach everything, and no line of Japanese runs out of its message window.
 */

import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { database } from '../game.ts';
import { H, MAPS, passability, W } from '../layout.ts';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'img');
const db = database() as Record<string, any>;
const maps = [1, 2, 3].map((id) => ({ id, file: db[`Map00${id}.json`], pass: passability(MAPS.find((m) => m.id === id)!) }));

/** Every event command list in the game: map pages, common events, troop pages. */
function lists(): { where: string; list: any[] }[] {
  const out: { where: string; list: any[] }[] = [];
  for (const m of maps) {
    for (const e of m.file.events.filter(Boolean)) e.pages.forEach((p: any, i: number) => out.push({ where: `map ${m.id} ${e.name} page ${i + 1}`, list: p.list }));
  }
  for (const c of db['CommonEvents.json'].filter(Boolean)) out.push({ where: `common event ${c.name}`, list: c.list });
  for (const t of db['Troops.json'].filter(Boolean)) t.pages.forEach((p: any) => out.push({ where: `troop ${t.name}`, list: p.list }));
  return out;
}

test('every picture the game names is drawn', () => {
  const need = new Set<string>();
  const add = (folder: string, name: string) => name && need.add(`${folder}/${name}.png`);
  for (const a of db['Actors.json'].filter(Boolean)) {
    add('characters', a.characterName);
    add('faces', a.faceName);
  }
  for (const e of db['Enemies.json'].filter(Boolean)) add('enemies', e.battlerName);
  for (const t of db['Tilesets.json'].filter(Boolean)) for (const n of t.tilesetNames) add('tilesets', n);
  add('titles1', db['System.json'].title1Name);
  for (const m of maps) {
    add('parallaxes', m.file.parallaxName);
    add('battlebacks1', m.file.battleback1Name);
    add('battlebacks2', m.file.battleback2Name);
    for (const e of m.file.events.filter(Boolean)) for (const p of e.pages) add('characters', p.image.characterName);
  }
  for (const { list } of lists()) for (const c of list) if (c.code === 101) add('faces', c.parameters[0]);
  // What the engine itself loads at start.
  for (const n of ['Window', 'IconSet', 'Balloon', 'Shadow1', 'Shadow2', 'Damage', 'States', 'Weapons1', 'Weapons2', 'Weapons3', 'ButtonSet', 'Loading', 'GameOver']) add('system', n);
  const missing = [...need].filter((p) => !existsSync(join(ASSETS, p)));
  assert.deepEqual(missing, []);
});

test('event lists are well formed: they end, and every branch closes at its own depth', () => {
  for (const { where, list } of lists()) {
    assert.deepEqual(list.at(-1), { code: 0, indent: 0, parameters: [] }, `${where}: must end with an empty command`);
    const open: { code: number; indent: number }[] = [];
    for (const c of list) {
      assert.ok(c.indent >= 0, where);
      if (c.code === 102 || c.code === 112) open.push(c);
      if (c.code === 404) assert.equal(open.pop()?.code, 102, `${where}: a choice ends without one opening`);
      if (c.code === 413) assert.equal(open.pop()?.code, 112, `${where}: a loop ends without one opening`);
    }
    assert.deepEqual(open, [], `${where}: a branch is left open`);
  }
});

test('Nine starts on floor, every way out is walkable, and everyone can be talked to', () => {
  const sys = db['System.json'];
  const start = maps.find((m) => m.id === sys.startMapId)!;
  assert.equal(start.pass[sys.startY][sys.startX], 0, 'the start tile is walkable');
  const walkable = (m: (typeof maps)[number], x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && m.pass[y]![x] === 0;
  for (const m of maps) {
    assert.equal(m.file.data.length, W * H * 6, `map ${m.id}: six layers`);
    for (const e of m.file.events.filter(Boolean)) {
      for (const p of e.pages) {
        if (p.trigger === 1) assert.ok(walkable(m, e.x, e.y), `map ${m.id}: ${e.name} is stepped on, so it must be walkable`);
        if (p.trigger === 0 && p.list.length > 1) {
          // Talked to from a walkable neighbour — or across a counter.
          const across = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) =>
            walkable(m, e.x + dx!, e.y + dy!) || (m.pass[e.y + dy!]?.[e.x + dx!] === 2 && walkable(m, e.x + 2 * dx!, e.y + 2 * dy!)));
          assert.ok(across, `map ${m.id}: nobody can reach ${e.name}`);
        }
      }
    }
  }
});

test('every line of text fits its message window', () => {
  // The game font draws a full-width character 28 px wide and a half-width one 14; a window's
  // text area is 780 px, or 612 beside a face. Codes draw as: an icon ~32 px, \N[1] the name.
  const actor = db['Actors.json'][1].name as string;
  const width = (line: string) => {
    const shown = line
      .replace(/\\I\[\d+\]/g, '　')
      .replace(/\\N\[1\]/g, actor)
      .replace(/\\V\[\d+\]/g, '9999')
      .replace(/\\G/g, db['System.json'].currencyUnit)
      .replace(/\\[A-Z]+\[\d+\]/gi, '');
    return [...shown].reduce((w, ch) => w + (/[ -~｡-ﾟ]/.test(ch) ? 14 : 28), 0);
  };
  for (const { where, list } of lists()) {
    let face = false;
    for (const c of list) {
      if (c.code === 101) face = c.parameters[0] !== '';
      if (c.code === 401) assert.ok(width(c.parameters[0]) <= (face ? 612 : 780), `${where}: too long for its window — ${c.parameters[0]}`);
    }
  }
});
