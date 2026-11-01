// The three maps of the tutorial game, shared by the painter (what is drawn where) and the data
// (where Nine can walk). Each map is one screen: 17 × 13 tiles of 48 px, drawn as one picture (a
// parallax) over an invisible tileset that only says passable / wall / counter.

export const W = 17;
export const H = 13;
export const TILE = 48;

/** Terrain letters: what the ground is. Upper case blocks, lower case is walkable. */
export type Terrain =
  | 'v' // nothing (outside the house) — blocks
  | 'W' // wall — blocks
  | 'f' // wooden floor
  | 'T' // trees — block
  | 'g' // grass
  | 'p' // path
  | 'w'; // water — blocks

/** Something drawn on the ground; `block` makes its tiles walls, `counter` a shop counter. */
export interface Decor {
  kind: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Tiles it stops Nine on: all of it (true), none (false), or these offsets. */
  block?: boolean | [number, number][];
  counter?: boolean;
}

export interface MapLayout {
  id: number;
  /** The picture under the map: img/parallaxes/<parallax>.png */
  parallax: string;
  terrain: string[];
  decor: Decor[];
}

const house: MapLayout = {
  id: 1,
  parallax: 'NineHouse',
  terrain: [
    'vvvvvvvvvvvvvvvvv',
    'vvWWWWWWWWWWWWWvv',
    'vvWWWWWWWWWWWWWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWfffffffffffWvv',
    'vvWWWWWWfWWWWWWvv',
    'vvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvv',
  ],
  decor: [
    { kind: 'window', x: 8, y: 1, w: 2, h: 1, block: false },
    { kind: 'clock', x: 6, y: 1, block: false },
    { kind: 'frame', x: 12, y: 1, block: false },
    { kind: 'bookshelf', x: 4, y: 2, w: 2, h: 2 },
    { kind: 'plant', x: 3, y: 3 },
    { kind: 'bed', x: 11, y: 3, w: 2, h: 2 },
    { kind: 'rug', x: 6, y: 5, w: 5, h: 3, block: false },
    { kind: 'table', x: 11, y: 7, w: 2, h: 1 },
    { kind: 'plant', x: 13, y: 9 },
    { kind: 'door-inside', x: 8, y: 10, block: false },
  ],
};

const village: MapLayout = {
  id: 2,
  parallax: 'NineVillage',
  terrain: [
    'TTTTTTTTTTTTTTTTT',
    'TgggggggggggggggT',
    'TgggggggggggggggT',
    'TgggggggggggggggT',
    'TgggggggpgggpgggT',
    'TggpggggpgggpgggT',
    'TggpggggpgggpgggT',
    'Tggpppppppppppppp',
    'TgggggggggggggggT',
    'TgwwwwggggggggggT',
    'TgwwwwggggggggggT',
    'TgggggggggggggggT',
    'TTTTTTTTTTTTTTTTT',
  ],
  decor: [
    // Nine's house: every tile but its door.
    { kind: 'house', x: 1, y: 1, w: 5, h: 4, block: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [3, 3], [4, 3]] },
    { kind: 'bigtree', x: 7, y: 1, w: 3, h: 2 },
    { kind: 'stump', x: 8, y: 3 },
    // The shop: an awning over a counter; Mike stands behind it at (12, 2).
    { kind: 'stall', x: 11, y: 1, w: 4, h: 2, block: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1], [3, 1]] },
    { kind: 'counter', x: 11, y: 3, w: 4, h: 1, counter: true },
    { kind: 'sign', x: 14, y: 6 },
    { kind: 'flowers', x: 1, y: 5, w: 2, h: 2, block: false },
    { kind: 'flowers', x: 9, y: 9, w: 3, h: 1, block: false },
    { kind: 'flowers', x: 14, y: 10, w: 2, h: 1, block: false },
    { kind: 'fence', x: 6, y: 9, w: 3, h: 1 },
    { kind: 'bush', x: 13, y: 5 },
    { kind: 'bush', x: 5, y: 5 },
    { kind: 'lamp', x: 10, y: 6 },
  ],
};

const forest: MapLayout = {
  id: 3,
  parallax: 'NineForest',
  terrain: [
    'TTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTT',
    'TTTTgggggggggTTTT',
    'TTTgggggggggggTTT',
    'TTggggggggggggTTT',
    'TTgggggggggggggTT',
    'TTgggggggggggggTT',
    'pppppppppggggggTT',
    'TTgggggggggggggTT',
    'TTTgggggggggggTTT',
    'TTTTgggggggggTTTT',
    'TTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTT',
  ],
  decor: [
    { kind: 'log', x: 4, y: 4, w: 2, h: 1 },
    { kind: 'rock', x: 13, y: 9 },
    { kind: 'rock', x: 3, y: 9 },
    { kind: 'mushrooms', x: 6, y: 9, block: false },
    { kind: 'mushrooms', x: 12, y: 3, block: false },
    { kind: 'mushrooms', x: 14, y: 6, block: false },
    { kind: 'flowers', x: 8, y: 3, w: 2, h: 1, block: false },
    { kind: 'flowers', x: 9, y: 9, w: 2, h: 1, block: false },
    { kind: 'sunbeam', x: 9, y: 4, w: 4, h: 5, block: false },
  ],
};

export const MAPS: MapLayout[] = [house, village, forest];

/** Walkable (0), wall (1) or counter (2), per tile: terrain first, then what stands on it. */
export function passability(m: MapLayout): number[][] {
  if (m.terrain.length !== H || m.terrain.some((r) => r.length !== W)) {
    throw new Error(`map ${m.id}: terrain must be ${W} × ${H}`);
  }
  const grid: number[][] = m.terrain.map((row) => [...row].map((c) => (c === c.toUpperCase() ? 1 : 0)));
  for (const d of m.decor) {
    const w = d.w ?? 1;
    const h = d.h ?? 1;
    const cells: [number, number][] = Array.isArray(d.block)
      ? d.block
      : d.block === false
        ? []
        : Array.from({ length: w * h }, (_, i) => [i % w, Math.floor(i / w)] as [number, number]);
    for (const [dx, dy] of cells) grid[d.y + dy]![d.x + dx] = d.counter ? 2 : 1;
  }
  return grid;
}
