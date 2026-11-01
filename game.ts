// The tutorial game's data: the database and three maps of events, in RPG Maker MV's JSON
// shapes (build.ts writes them to www/data/). The story is short on purpose, and written in
// Japanese for players to translate: dialogue with faces, choices, an item from a
// chest, a shop, a key item, a battle with a level-up, the menus and the title.

import { MAPS, passability, H, W } from './layout.ts';

export const GAME_TITLE = 'ナインとことばの森';

// ── event commands ─────────────────────────────────────────────────────────────

interface Cmd {
  code: number;
  indent: number;
  parameters: unknown[];
}

/** A step of an event: a command, or a block of them, written at a nesting depth. */
type Step = (indent: number) => Cmd[];

const cmd = (code: number, ...parameters: unknown[]): Step => (indent) => [{ code, indent, parameters }];
const steps = (list: Step[], indent: number) => list.flatMap((s) => s(indent));
/** A block inside a branch ends with an empty command one level in. */
const block = (list: Step[], indent: number) => [...steps(list, indent + 1), { code: 0, indent: indent + 1, parameters: [] }];

/** The command list of an event page. */
const list = (...body: Step[]): Cmd[] => [...steps(body, 0), { code: 0, indent: 0, parameters: [] }];

interface Face {
  name: string;
  index: number;
}
const NINE = { name: 'Nine', index: 0 };
const NINE_HAPPY = { name: 'Nine', index: 1 };
const NINE_SURPRISED = { name: 'Nine', index: 2 };
const OWL = { name: 'Friends', index: 0 };
const MIKE = { name: 'Friends', index: 1 };
const SLIME = { name: 'Friends', index: 2 };
const SLIME_HAPPY = { name: 'Friends', index: 3 };

/** Show Text: a window of up to four lines. `background` 0 window, 1 dim; `position` 0 top, 1 middle, 2 bottom. */
const say = (face: Face | null, text: string, background = 0, position = 2): Step => (indent) => {
  const lines = text.split('\n');
  if (lines.length > 4) throw new Error(`more than four lines: ${text}`);
  return [
    { code: 101, indent, parameters: [face?.name ?? '', face?.index ?? 0, background, position] },
    ...lines.map((line) => ({ code: 401, indent, parameters: [line] })),
  ];
};

/** Show Choices, with what each one does; `cancel` is the choice that Escape picks. */
const choices = (options: [string, Step[]][], cancel: number): Step => (indent) => [
  { code: 102, indent, parameters: [options.map(([label]) => label), cancel, 0, 2, 0] },
  ...options.flatMap(([label, body], i) => [{ code: 402, indent, parameters: [i, label] }, ...block(body, indent)]),
  { code: 404, indent, parameters: [] },
];

const loop = (...body: Step[]): Step => (indent) => [{ code: 112, indent, parameters: [] }, ...block(body, indent), { code: 413, indent, parameters: [] }];
const breakLoop = cmd(113);
const selfSwitchOn = cmd(123, 'A', 0);
const switchOn = (id: number) => cmd(121, id, id, 0);
const addGold = (n: number) => cmd(125, 0, 0, n);
const addItem = (id: number, n: number) => cmd(126, id, 0, 0, n);
/** Variable `id` = the party's gold (Control Variables → Game Data → Other → Gold). */
const goldToVariable = (id: number) => cmd(122, id, id, 0, 3, 7, 2, 0);
/** Transfer Player; direction 2 down, 4 left, 6 right, 8 up. */
const transfer = (mapId: number, x: number, y: number, direction: number) => cmd(201, 0, mapId, x, y, direction, 0);
const battle = (troopId: number) => cmd(301, 0, troopId, false, false);
const balloonOnPlayer = (id: number) => cmd(213, -1, id, true);
const wait = (frames: number) => cmd(230, frames);
const fadeOut = cmd(221);
const toTitle = cmd(354);
const commonEvent = (id: number) => cmd(117, id);
/** The player takes one step: 1 down, 2 left, 3 right, 4 up. */
const playerStep = (code: number): Step => (indent) => {
  const route = { list: [{ code, indent: null }, { code: 0, parameters: [] }], repeat: false, skippable: true, wait: true };
  return [
    { code: 205, indent, parameters: [-1, route] },
    { code: 505, indent, parameters: [{ code, indent: null }] },
  ];
};
/** Shop Processing: [kind 0 item / 1 weapon / 2 armor, id] at their database price. */
const shop = (...goods: [number, number][]): Step => (indent) => [
  { code: 302, indent, parameters: [goods[0]![0], goods[0]![1], 0, 0, false] },
  ...goods.slice(1).map(([kind, id]) => ({ code: 605, indent, parameters: [kind, id, 0, 0] })),
];

// ── event pages ───────────────────────────────────────────────────────────────

interface PageOptions {
  /** 0 action button, 1 player touch, 3 autorun. */
  trigger?: number;
  /** 0 below characters, 1 same as characters. */
  priority?: number;
  image?: { characterName: string; direction?: number; pattern?: number };
  selfSwitch?: boolean;
  switchId?: number;
  stepAnime?: boolean;
  directionFix?: boolean;
}

function page(o: PageOptions, commands: Cmd[]) {
  return {
    conditions: {
      actorId: 1,
      actorValid: false,
      itemId: 1,
      itemValid: false,
      selfSwitchCh: 'A',
      selfSwitchValid: !!o.selfSwitch,
      switch1Id: o.switchId ?? 1,
      switch1Valid: o.switchId !== undefined,
      switch2Id: 1,
      switch2Valid: false,
      variableId: 1,
      variableValid: false,
      variableValue: 0,
    },
    directionFix: !!o.directionFix,
    image: {
      tileId: 0,
      characterName: o.image?.characterName ?? '',
      direction: o.image?.direction ?? 2,
      pattern: o.image?.pattern ?? 1,
      characterIndex: 0,
    },
    list: commands,
    moveFrequency: 3,
    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
    moveSpeed: 3,
    moveType: 0,
    priorityType: o.priority ?? 1,
    stepAnime: !!o.stepAnime,
    through: false,
    trigger: o.trigger ?? 0,
    walkAnime: true,
  };
}

const event = (id: number, name: string, x: number, y: number, ...pages: ReturnType<typeof page>[]) => ({ id, name, note: '', pages, x, y });

/** A tile you walk onto to go somewhere. */
const exit = (id: number, name: string, x: number, y: number, to: [number, number, number, number]) =>
  event(id, name, x, y, page({ trigger: 1, priority: 0 }, list(transfer(...to))));

// ── the story ─────────────────────────────────────────────────────────────────

/** What the owl explains, again and again until Nine is ready to go. */
const owlTips = loop(
  say(OWL, 'ほかに聞きたいことはあるかな？'),
  choices(
    [
      ['メニューのこと', [say(OWL, '\\C[2]Esc キー\\C[0]か\\C[2]右クリック\\C[0]で\nメニューが開けるぞ。\nアイテムや装備を確かめなさい。')]],
      ['お店のこと', [goldToVariable(1), say(OWL, 'となりの雑貨屋では、\nゴールドで買い物ができる。\n今の持ち金は \\C[6]\\V[1]\\G\\C[0] じゃな。')]],
      ['もう大丈夫！', [say(OWL, 'うむ。では、いってらっしゃい。'), breakLoop]],
    ],
    2,
  ),
);

const house = [
  null,
  event(
    1,
    'はじまり',
    16,
    12,
    page(
      { trigger: 3, priority: 0 },
      list(
        say(NINE, 'ふあ～あ……。よく寝たなあ。'),
        say(NINE_HAPPY, 'そうだ！ 今日は森のスライムくんと\n遊ぶ約束をしてたんだ。'),
        say(NINE, 'でも最近、スライムくんの言葉が\nぜんぜん分からないんだよね……。'),
        say(NINE_HAPPY, 'まずは村のフクロウ先生に\n相談してみよう！'),
        selfSwitchOn,
      ),
    ),
    page({ trigger: 0, priority: 0, selfSwitch: true }, list()),
  ),
  event(
    2,
    '宝箱',
    9,
    3,
    page(
      { image: { characterName: '!$Chest', direction: 2 }, directionFix: true },
      list(addGold(50), addItem(1, 3), say(null, '宝箱を開けた！\n\\I[12]50\\G と \\I[1]王冠クッキー×3 を手に入れた！'), selfSwitchOn),
    ),
    page({ image: { characterName: '!$Chest', direction: 8 }, directionFix: true, selfSwitch: true }, list(say(null, '宝箱は からっぽだ。'))),
  ),
  event(3, '本棚', 4, 3, page({}, list(commonEvent(1)))),
  event(4, '本棚', 5, 3, page({}, list(commonEvent(1)))),
  event(5, 'ベッド', 11, 4, page({}, list(commonEvent(2)))),
  event(6, 'ベッド', 12, 4, page({}, list(commonEvent(2)))),
  exit(7, '出口', 8, 10, [2, 3, 5, 2]),
];

const village = [
  null,
  exit(1, 'ナインのおうち', 3, 4, [1, 8, 9, 8]),
  event(
    2,
    'フクロウ先生',
    8,
    3,
    page(
      { image: { characterName: '$Owl' }, stepAnime: true },
      list(
        say(OWL, 'おや、\\N[1]じゃないか。\nおはよう。'),
        say(NINE, '先生、森のスライムくんの言葉が\n分からなくなっちゃったんです。'),
        say(OWL, 'ふむ……それはきっと\n『文字化け』じゃな。'),
        say(OWL, '言葉がぐちゃぐちゃになって、\n本当の意味が見えなくなる。\nこまったものじゃ。'),
        say(OWL, 'スライムを元気にしてあげれば、\nきっとまた話せるようになるぞ。\nこの地図を持っていきなさい。'),
        addItem(2, 1),
        say(null, '\\I[2]\\C[2]ことばの地図\\C[0]を受け取った！'),
        switchOn(1),
        owlTips,
      ),
    ),
    page({ image: { characterName: '$Owl' }, stepAnime: true, switchId: 1 }, list(say(OWL, '森は村の東じゃよ。\n気をつけて行くんじゃぞ。'), owlTips)),
  ),
  event(
    3,
    'ミケ',
    12,
    2,
    page(
      { image: { characterName: '$Mike' } },
      list(
        say(MIKE, 'いらっしゃい！\nねこの雑貨屋へようこそ。'),
        shop([0, 1], [1, 1], [2, 1]),
        say(MIKE, 'まいどあり！\n買ったものは、メニューの\n\\C[2]装備\\C[0]で身につけてね。'),
      ),
    ),
  ),
  event(4, '看板', 14, 6, page({}, list(say(null, '【 → ことばの森 】\nこの先、文字化けに注意！')))),
  event(
    5,
    '森へ',
    16,
    7,
    page({ trigger: 1, priority: 0 }, list(say(NINE, '先に、フクロウ先生に\n相談してみよう。'), playerStep(2))),
    page({ trigger: 1, priority: 0, switchId: 1 }, list(transfer(3, 1, 7, 6))),
  ),
];

const forest = [
  null,
  exit(1, '村へ', 0, 7, [2, 15, 7, 4]),
  event(
    2,
    'スライム',
    11,
    7,
    page(
      { trigger: 1, image: { characterName: '$Slime', direction: 4 }, stepAnime: true },
      list(
        balloonOnPlayer(1),
        say(SLIME, 'ギ……ギギ……\n縺薙ｓ縺ｫ縺｡縺ｯ……！'),
        say(NINE_SURPRISED, 'うわっ、本当に\n文字化けしてる！'),
        say(NINE, 'スライムくん、ちょっとだけ\nガマンしてね。\nいま元に戻してあげる！'),
        battle(1),
        selfSwitchOn,
      ),
    ),
    page(
      { trigger: 3, image: { characterName: '$SlimeHappy', direction: 4 }, stepAnime: true, selfSwitch: true },
      list(
        say(SLIME_HAPPY, 'あれ……？ ボク、\nちゃんと話せてる……！'),
        say(SLIME_HAPPY, 'ありがとう、\\N[1]！\nずっと言葉がぐちゃぐちゃで、\nさみしかったんだ。'),
        say(NINE_HAPPY, 'よかった！\nこれでまた、いっしょに遊べるね。'),
        fadeOut,
        wait(30),
        say(null, '――こうして、森に言葉がもどりました。', 1, 1),
        say(null, 'この文章が読めているなら、\n翻訳は大成功です！', 1, 1),
        say(null, '遊んでくれてありがとう。\n\\C[2]ninetranslator\\C[0] より', 1, 1),
        wait(30),
        toTitle,
      ),
    ),
  ),
];

const commonEvents = [
  null,
  {
    id: 1,
    name: '本棚',
    switchId: 1,
    trigger: 0,
    list: list(
      say(null, '『はじめてのほんやく』という本だ。'),
      say(null, 'ゲームの言葉が読めなくても、\nあきらめないで。\nことばは、きっと\nあなたの言葉に変えられるから。'),
      say(NINE, '……なんだか、いい本だなあ。'),
    ),
  },
  {
    id: 2,
    name: 'ベッド',
    switchId: 1,
    trigger: 0,
    list: list(say(NINE, 'ふかふかのベッド。\nもう少しだけ寝ていたい……。'), say(NINE_HAPPY, '……いやいや、出かけなくちゃ！')),
  },
];

// ── maps ──────────────────────────────────────────────────────────────────────

const PASSABLE = 1536; // the first A5 tile
const WALL = 1537;
const COUNTER = 1538;
const SILENT = { name: '', pan: 0, pitch: 100, volume: 90 };

function mapFile(id: number, displayName: string, events: unknown[], battleback?: string) {
  const layout = MAPS.find((m) => m.id === id)!;
  const pass = passability(layout);
  const data = new Array<number>(W * H * 6).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[y * W + x] = [PASSABLE, WALL, COUNTER][pass[y]![x]!]!;
  return {
    autoplayBgm: false,
    autoplayBgs: false,
    battleback1Name: battleback ?? '',
    battleback2Name: battleback ?? '',
    bgm: SILENT,
    bgs: SILENT,
    disableDashing: false,
    displayName,
    encounterList: [],
    encounterStep: 30,
    height: H,
    note: '',
    parallaxLoopX: false,
    parallaxLoopY: false,
    parallaxName: layout.parallax,
    parallaxShow: true,
    parallaxSx: 0,
    parallaxSy: 0,
    scrollType: 0,
    specifyBattleback: !!battleback,
    tilesetId: 1,
    width: W,
    data,
    events,
  };
}

// ── the database ──────────────────────────────────────────────────────────────

/** Parameters by level (0–99): base at level 1, plus so much a level. */
const grow = (base: number, per: number) => Array.from({ length: 100 }, (_, lv) => Math.round(base + per * Math.max(lv - 1, 0)));

const damage = (type: number, formula: string, elementId = 0, critical = false) => ({ critical, elementId, formula, type, variance: 20 });
const NO_DAMAGE = damage(0, '0');

/** A skill. Its battle messages follow the user's name ("ナイン" + "の攻撃！"); %1 in them is the skill's name. */
function skill(id: number, o: Partial<Record<string, unknown>> & { name: string }) {
  return {
    id,
    animationId: 0,
    damage: NO_DAMAGE,
    description: '',
    effects: [],
    hitType: 0,
    iconIndex: 0,
    message1: '',
    message2: '',
    mpCost: 0,
    note: '',
    occasion: 1,
    repeats: 1,
    requiredWtypeId1: 0,
    requiredWtypeId2: 0,
    scope: 1,
    speed: 0,
    stypeId: 0,
    successRate: 100,
    tpCost: 0,
    tpGain: 0,
    ...o,
  };
}

const HIT = { code: 22, dataId: 0, value: 0.95 };
const EVA = { code: 22, dataId: 1, value: 0.05 };
const CRI = { code: 22, dataId: 2, value: 0.04 };
const PHYSICAL = { code: 31, dataId: 1, value: 0 };

const commonItem = { animationId: 0, consumable: true, damage: NO_DAMAGE, effects: [] as unknown[], hitType: 0, note: '', occasion: 0, repeats: 1, scope: 7, speed: 0, successRate: 100, tpGain: 0 };

const sound = SILENT;

export function database(): Record<string, unknown> {
  const files: Record<string, unknown> = {
    'Actors.json': [
      null,
      {
        id: 1,
        battlerName: '',
        characterIndex: 0,
        characterName: '$Nine',
        classId: 1,
        equips: [0, 0, 0, 0, 0],
        faceIndex: 0,
        faceName: 'Nine',
        traits: [],
        initialLevel: 1,
        maxLevel: 99,
        name: 'ナイン',
        nickname: '王冠のねこ',
        note: '',
        profile: '翻訳の村に住む、王冠をかぶったねこ。\nことばと、クッキーが大好き。',
      },
    ],
    'Classes.json': [
      null,
      {
        id: 1,
        expParams: [30, 20, 30, 30],
        traits: [
          { code: 23, dataId: 0, value: 1 },
          HIT,
          EVA,
          CRI,
          PHYSICAL,
          { code: 41, dataId: 1, value: 1 },
          { code: 51, dataId: 1, value: 1 },
          { code: 52, dataId: 1, value: 1 },
        ],
        learnings: [
          { level: 1, note: '', skillId: 3 },
          { level: 2, note: '', skillId: 4 },
        ],
        name: '翻訳ねこ',
        note: '',
        // max HP, max MP, attack, defence, magic attack, magic defence, agility, luck
        params: [grow(120, 25), grow(20, 5), grow(20, 3), grow(12, 2), grow(16, 3), grow(12, 2), grow(14, 2), grow(10, 1)],
      },
    ],
    'Skills.json': [
      null,
      skill(1, { name: '攻撃', iconIndex: 10, hitType: 1, damage: damage(1, 'a.atk * 4 - b.def * 2', -1, true), effects: [{ code: 21, dataId: 0, value1: 1, value2: 0 }], message1: 'の攻撃！', tpGain: 10 }),
      skill(2, { name: '防御', iconIndex: 9, scope: 11, speed: 2000, effects: [{ code: 21, dataId: 2, value1: 1, value2: 0 }], message1: 'は身を守っている。', tpGain: 10 }),
      skill(3, { name: 'ねこパンチ', iconIndex: 5, stypeId: 1, hitType: 1, damage: damage(1, 'a.atk * 4 - b.def * 2 + 10', 1), description: 'すばやいねこのパンチ。', message1: 'のねこパンチ！', tpGain: 5 }),
      skill(4, { name: '王冠ビーム', iconIndex: 6, stypeId: 1, mpCost: 5, hitType: 2, damage: damage(1, 'a.mat * 3 + 30', 0), description: '王冠から光をはなつ。MPを使う。', message1: 'は王冠ビームをはなった！' }),
      skill(5, { name: 'もじもじタックル', iconIndex: 7, hitType: 1, damage: damage(1, 'a.atk * 4 - b.def * 2 + 5', 1), message1: 'のもじもじタックル！' }),
      skill(6, { name: '□□□のささやき', iconIndex: 8, scope: 0, message1: 'は意味不明なことばをささやいた！', message2: '……しかし、何も起こらなかった。' }),
    ],
    'Items.json': [
      null,
      { id: 1, ...commonItem, effects: [{ code: 11, dataId: 0, value1: 0, value2: 50 }], description: '王冠の形をしたクッキー。\nHPを50回復する。', iconIndex: 1, itypeId: 1, name: '王冠クッキー', price: 10 },
      { id: 2, ...commonItem, consumable: false, occasion: 3, scope: 0, description: 'フクロウ先生にもらった地図。\nことばの森は村の東にある。', iconIndex: 2, itypeId: 2, name: 'ことばの地図', price: 0 },
    ],
    'Weapons.json': [
      null,
      { id: 1, animationId: 0, description: '木でできた、かるい剣。', etypeId: 1, traits: [PHYSICAL, { code: 22, dataId: 0, value: 0 }], iconIndex: 3, name: '木の剣', note: '', params: [0, 0, 5, 0, 0, 0, 0, 0], price: 30, wtypeId: 1 },
    ],
    'Armors.json': [
      null,
      { id: 1, atypeId: 1, description: 'あたたかいマフラー。\n防御力が少し上がる。', etypeId: 5, traits: [], iconIndex: 4, name: 'ふわふわマフラー', note: '', params: [0, 0, 0, 3, 0, 0, 0, 0], price: 20 },
    ],
    'Enemies.json': [
      null,
      {
        id: 1,
        actions: [
          { conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 5, skillId: 1 },
          { conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 5, skillId: 5 },
          { conditionParam1: 0, conditionParam2: 0, conditionType: 0, rating: 4, skillId: 6 },
        ],
        battlerHue: 0,
        battlerName: 'MojibakeSlime',
        dropItems: [
          { dataId: 1, denominator: 1, kind: 1 },
          { dataId: 1, denominator: 1, kind: 0 },
          { dataId: 1, denominator: 1, kind: 0 },
        ],
        exp: 50,
        traits: [HIT, EVA, PHYSICAL],
        gold: 30,
        name: '文字化けスライム',
        note: '',
        params: [90, 0, 12, 6, 10, 6, 8, 6],
      },
    ],
    'Troops.json': [
      null,
      {
        id: 1,
        members: [{ enemyId: 1, x: 408, y: 400, hidden: false }],
        name: '文字化けスライム',
        pages: [
          {
            conditions: { actorHp: 50, actorId: 1, actorValid: false, enemyHp: 50, enemyIndex: 0, enemyValid: false, switchId: 1, switchValid: false, turnA: 0, turnB: 0, turnEnding: false, turnValid: true },
            list: list(say(SLIME, 'ギギ……縺薙→縺ｰ……ガ……！')),
            span: 0,
          },
        ],
      },
    ],
    'States.json': [
      null,
      { id: 1, autoRemovalTiming: 0, chanceByDamage: 100, iconIndex: 11, maxTurns: 1, message1: 'は倒れた！', message2: 'を倒した！', message3: '', message4: 'は立ち上がった！', minTurns: 1, motion: 3, name: '戦闘不能', note: '', overlay: 0, priority: 100, removeAtBattleEnd: false, removeByDamage: false, removeByRestriction: false, removeByWalking: false, restriction: 4, stepsToRemove: 100, traits: [{ code: 23, dataId: 0, value: 0 }] },
      { id: 2, autoRemovalTiming: 2, chanceByDamage: 100, iconIndex: 0, maxTurns: 1, message1: '', message2: '', message3: '', message4: '', minTurns: 1, motion: 0, name: '防御', note: '', overlay: 0, priority: 0, removeAtBattleEnd: true, removeByDamage: false, removeByRestriction: true, removeByWalking: false, restriction: 0, stepsToRemove: 100, traits: [{ code: 62, dataId: 1, value: 0 }] },
    ],
    'Animations.json': [null],
    'Tilesets.json': [null, tileset()],
    'CommonEvents.json': commonEvents,
    'MapInfos.json': [
      null,
      { id: 1, expanded: false, name: 'ナインのおうち', order: 1, parentId: 0, scrollX: 0, scrollY: 0 },
      { id: 2, expanded: false, name: 'はじまりの村', order: 2, parentId: 0, scrollX: 0, scrollY: 0 },
      { id: 3, expanded: false, name: 'ことばの森', order: 3, parentId: 0, scrollX: 0, scrollY: 0 },
    ],
    'Map001.json': mapFile(1, 'ナインのおうち', house),
    'Map002.json': mapFile(2, 'はじまりの村', village),
    'Map003.json': mapFile(3, 'ことばの森', forest, 'NineForest'),
    'System.json': system(),
  };
  return files;
}

function tileset() {
  const flags = new Array<number>(8192).fill(0);
  flags[0] = 0x10; // an empty tile does not count for passage
  flags[PASSABLE] = 0;
  flags[WALL] = 0x0f;
  flags[COUNTER] = 0x0f | 0x80;
  return { id: 1, flags, mode: 1, name: 'ナインの世界', note: '', tilesetNames: ['', '', '', '', 'NineTiles', '', '', '', ''] };
}

function system() {
  const vehicle = { bgm: SILENT, characterIndex: 0, characterName: '', startMapId: 0, startX: 0, startY: 0 };
  return {
    airship: vehicle,
    armorTypes: ['', '一般防具'],
    attackMotions: [{ type: 0, weaponImageId: 0 }, { type: 1, weaponImageId: 2 }],
    battleBgm: SILENT,
    battleback1Name: '',
    battleback2Name: '',
    battlerHue: 0,
    battlerName: '',
    boat: vehicle,
    currencyUnit: 'G',
    defeatMe: SILENT,
    editMapId: 1,
    elements: ['', '物理'],
    equipTypes: ['', '武器', '盾', '頭', '身体', '装飾品'],
    gameTitle: GAME_TITLE,
    gameoverMe: SILENT,
    locale: 'ja_JP',
    magicSkills: [],
    menuCommands: [true, true, true, true, true, true],
    optDisplayTp: true,
    optDrawTitle: true,
    optExtraExp: false,
    optFloorDeath: false,
    optFollowers: true,
    optSideView: false,
    optSlipDeath: false,
    optTransparent: false,
    partyMembers: [1],
    ship: vehicle,
    skillTypes: ['', 'ねこ技'],
    sounds: Array.from({ length: 24 }, () => sound),
    startMapId: 1,
    startX: 11,
    startY: 5,
    switches: ['', 'フクロウ先生と話した'],
    terms: {
      basic: ['レベル', 'Lv', 'ＨＰ', 'HP', 'ＭＰ', 'MP', 'ＴＰ', 'TP', '経験値', 'EXP'],
      commands: [
        '戦う', '逃げる', '攻撃', '防御', 'アイテム', 'スキル', '装備', 'ステータス', '並び替え', 'セーブ',
        'ゲーム終了', 'オプション', '武器', '防具', '大事なもの', '装備', '最強装備', '全て外す', 'ニューゲーム', 'コンティニュー',
        null, 'タイトルへ', 'やめる', null, '購入する', '売却する',
      ],
      params: ['最大ＨＰ', '最大ＭＰ', '攻撃力', '防御力', '魔法力', '魔法防御', '敏捷性', '運', '命中率', '回避率'],
      messages: {
        actionFailure: '%1には効かなかった！',
        actorDamage: '%1は %2 のダメージを受けた！',
        actorDrain: '%1は%2を %3 奪われた！',
        actorGain: '%1の%2が %3 増えた！',
        actorLoss: '%1の%2が %3 減った！',
        actorNoDamage: '%1はダメージを受けていない！',
        actorNoHit: 'ミス！　%1はダメージを受けていない！',
        actorRecovery: '%1の%2が %3 回復した！',
        alwaysDash: '常時ダッシュ',
        bgmVolume: 'BGM 音量',
        bgsVolume: 'BGS 音量',
        buffAdd: '%1の%2が上がった！',
        buffRemove: '%1の%2が元に戻った！',
        commandRemember: 'コマンド記憶',
        counterAttack: '%1の反撃！',
        criticalToActor: '痛恨の一撃！！',
        criticalToEnemy: '会心の一撃！！',
        debuffAdd: '%1の%2が下がった！',
        defeat: '%1は戦いに敗れた。',
        emerge: '%1が出現！',
        enemyDamage: '%1に %2 のダメージを与えた！',
        enemyDrain: '%1の%2を %3 奪った！',
        enemyGain: '%1の%2が %3 増えた！',
        enemyLoss: '%1の%2が %3 減った！',
        enemyNoDamage: '%1にダメージを与えられない！',
        enemyNoHit: 'ミス！　%1にダメージを与えられない！',
        enemyRecovery: '%1の%2が %3 回復した！',
        escapeFailure: 'しかし逃げることはできなかった！',
        escapeStart: '%1は逃げ出した！',
        evasion: '%1は攻撃をかわした！',
        expNext: '次の%1まで',
        expTotal: '現在の%1',
        file: 'ファイル',
        levelUp: '%1は%2 %3 に上がった！',
        loadMessage: 'どのファイルをロードしますか？',
        magicEvasion: '%1は魔法を打ち消した！',
        magicReflection: '%1は魔法を跳ね返した！',
        meVolume: 'ME 音量',
        obtainExp: '%1 の%2を獲得！',
        obtainGold: 'お金を %1\\G 手に入れた！',
        obtainItem: '%1を手に入れた！',
        obtainSkill: '%1を覚えた！',
        partyName: '%1たち',
        possession: '持っている数',
        preemptive: '%1は先手を取った！',
        saveMessage: 'どのファイルにセーブしますか？',
        seVolume: 'SE 音量',
        substitute: '%1が%2をかばった！',
        surprise: '%1は不意をつかれた！',
        useItem: '%1は%2を使った！',
        victory: '%1の勝利！',
      },
    },
    testBattlers: [{ actorId: 1, equips: [0, 0, 0, 0, 0], level: 1 }],
    testTroopId: 1,
    title1Name: 'NineTitle',
    title2Name: '',
    titleBgm: SILENT,
    variables: ['', '持ち金'],
    versionId: 20261031,
    victoryMe: SILENT,
    weaponTypes: ['', '剣'],
    windowTone: [0, 0, 0, 0],
  };
}
