// Every tuning number and colour for Operasi Lentera, in one place.
// The museum floor is a fixed 1280x800 logical area; the painter scales it
// to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800 };

/** Height of the HUD band at the top of the field; the museum starts below it. */
export const HUD_HEIGHT = 64;

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 14,
  walkSpeed: 190,
  sneakSpeed: 108,
  grabReach: 48,
  invulnerableAfterCaught: 2,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  alertSpeed: 138,
  coneRange: 205,
  coneHalfAngle: 0.56,
  catchRadius: 27,
  suspicionToAlert: 0.6,
  searchSeconds: 2.5,
};

export const CAMERA = {
  range: 245,
  halfAngle: 0.48,
};

export const ALARM = {
  riseGuardNear: 55,
  riseGuardFar: 30,
  riseCamera: 26,
  decayPerSecond: 9,
  caughtAt: 100,
  afterCaught: 35,
};

export const TOOLS = {
  smokeCost: 20,
  empCost: 30,
  coinCost: 10,
  smokeRadius: 95,
  smokeSeconds: 5,
  empSeconds: 6,
  empRadius: 280,
  coinThrowRadius: 260,
  coinLureRadius: 240,
};

export const LIVES = 3;
export const TIME_BONUS_START = 300;

export const PALETTE = {
  backdrop: '#0d0f16',
  floor: '#191c2b',
  floorTile: '#20243a',
  carpet: '#3a2b4d',
  wall: '#3c4258',
  wallTop: '#4a5168',
  displayCase: '#1f6f6b',
  caseTrim: '#d9a441',
  loot: '#ffd34d',
  lootGlow: '#ffe9a3',
  thief: '#9b7bea',
  thiefDark: '#6d4fc4',
  lantern: '#ffcf6e',
  guard: '#e5534b',
  guardBody: '#39415a',
  camera: '#59c2d6',
  coneCalm: 'rgba(242, 201, 76, 0.20)',
  coneWary: 'rgba(242, 140, 76, 0.30)',
  coneAlert: 'rgba(229, 83, 75, 0.34)',
  coneCamera: 'rgba(89, 194, 214, 0.20)',
  smoke: 'rgba(180, 184, 200, 0.55)',
  exit: '#58c98a',
  panel: '#232838',
  text: '#eef1f5',
  muted: '#9aa1b5',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'operasi-lentera.best';
