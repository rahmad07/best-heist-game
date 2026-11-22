// The thief's tools, each paid for from the haul: smoke pellets that blind
// sight lines, an EMP burst that freezes nearby cameras, and a thrown coin
// that pulls a patrolling guard over to look.
import { TOOLS } from './tuning.js';
import { distancePointToSegment } from './vision.js';

export function makeToolbox() {
  return { smokes: [], coins: [] };
}

/** A smoke pellet at the thief's feet; false when the haul cannot pay. */
export function trySmoke(toolbox, haul, x, y) {
  if (haul < TOOLS.smokeCost) return { ok: false, cost: 0 };
  toolbox.smokes.push({ x, y, radius: TOOLS.smokeRadius, left: TOOLS.smokeSeconds });
  return { ok: true, cost: TOOLS.smokeCost };
}

/** Freeze every camera in range; free when none is close enough. */
export function tryEmp(cameras, haul, x, y) {
  if (haul < TOOLS.empCost) return { ok: false, cost: 0 };
  let hitAny = false;
  for (const camera of cameras) {
    if (Math.hypot(camera.x - x, camera.y - y) <= TOOLS.empRadius) {
      camera.disabledLeft = TOOLS.empSeconds;
      hitAny = true;
    }
  }
  return { ok: hitAny, cost: hitAny ? TOOLS.empCost : 0 };
}

/** Toss a coin to a point; it keeps luring guards while it lies there. */
export function tryCoin(toolbox, haul, x, y) {
  if (haul < TOOLS.coinCost) return { ok: false, cost: 0 };
  toolbox.coins.push({ x, y, left: 6 });
  return { ok: true, cost: TOOLS.coinCost };
}

export function updateToolbox(toolbox, dt) {
  for (const smoke of toolbox.smokes) smoke.left -= dt;
  toolbox.smokes = toolbox.smokes.filter((smoke) => smoke.left > 0);
  for (const coin of toolbox.coins) coin.left -= dt;
  toolbox.coins = toolbox.coins.filter((coin) => coin.left > 0);
}

/** True when a smoke cloud sits on the sight line between two points. */
export function smokeBlocksSight(x1, y1, x2, y2, smokes) {
  for (const smoke of smokes) {
    if (distancePointToSegment(smoke.x, smoke.y, x1, y1, x2, y2) < smoke.radius * 0.8) return true;
  }
  return false;
}
