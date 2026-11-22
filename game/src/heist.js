// The heist itself: rules and state, with no drawing and no browser in it.
// One fixed step moves the thief, spends tools, moves the guards and the
// cameras, grows the alarm when the thief is seen, and settles a catch,
// a getaway or a game over.
import { ALARM, CAMERA, FIELD, GUARD, LIVES, THIEF, TIME_BONUS_START, TOOLS } from './tuning.js';
import { buildMuseum } from './museum.js';
import { makeCamera, makeGuard, makeThief, resetGuard, updateCameraLens, updateGuardPatrol, walkToward } from './actors.js';
import { makeToolbox, smokeBlocksSight, tryCoin, tryEmp, trySmoke, updateToolbox } from './tools.js';
import { hasLineOfSight, pointInCone } from './vision.js';

export const EV_PICKUP = 1;
export const EV_CAUGHT = 2;
export const EV_WIN = 4;
export const EV_TOOL = 16;
export const EV_SPOTTED = 32;

function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function freshState() {
  const museum = buildMuseum();
  return {
    museum,
    solids: museum.walls.concat(museum.cases),
    thief: makeThief(museum.entry),
    guards: museum.guards.map((def) => makeGuard(def)),
    cameras: museum.cameras.map((def) => makeCamera(def)),
    loot: museum.lootSpots.map((spot) => ({ ...spot, taken: false })),
    toolbox: makeToolbox(),
    alarm: 0,
    lives: LIVES,
    haul: 0,
    spent: 0,
    lootTaken: 0,
    time: 0,
    timeBonus: 0,
    score: 0,
    status: 'play',
    nearLoot: null,
  };
}

export function createHeist() {
  const state = freshState();

  function reset() {
    const next = freshState();
    for (const key of Object.keys(next)) state[key] = next[key];
  }

  function resume() {
    if (state.status === 'caught') state.status = 'play';
  }

  function tryMove(dx, dy) {
    const thief = state.thief;
    const nextX = thief.x + dx;
    if (!state.solids.some((rect) => circleHitsRect(nextX, thief.y, THIEF.radius, rect))) thief.x = nextX;
    const nextY = thief.y + dy;
    if (!state.solids.some((rect) => circleHitsRect(thief.x, nextY, THIEF.radius, rect))) thief.y = nextY;
    thief.x = Math.max(THIEF.radius, Math.min(FIELD.width - THIEF.radius, thief.x));
    thief.y = Math.max(THIEF.radius, Math.min(FIELD.height - THIEF.radius, thief.y));
  }

  function watcherSees(x, y, facing, range, halfAngle) {
    const thief = state.thief;
    if (thief.invulnerable > 0) return false;
    if (!pointInCone(thief.x, thief.y, x, y, facing, range, halfAngle)) return false;
    if (!hasLineOfSight(x, y, thief.x, thief.y, state.solids)) return false;
    if (smokeBlocksSight(x, y, thief.x, thief.y, state.toolbox.smokes)) return false;
    return true;
  }

  function handleCaught() {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.status = 'over';
      return;
    }
    state.status = 'caught';
    state.thief.x = state.museum.entry.x;
    state.thief.y = state.museum.entry.y;
    state.thief.invulnerable = THIEF.invulnerableAfterCaught;
    state.alarm = ALARM.afterCaught;
    for (const guard of state.guards) resetGuard(guard);
    state.toolbox.smokes = [];
    state.toolbox.coins = [];
  }

  function step(dt, move, actions) {
    let events = 0;
    if (state.status !== 'play') return events;
    state.time += dt;
    const thief = state.thief;
    thief.sneak = !!actions.sneak;

    const magnitude = Math.hypot(move.x, move.y);
    if (magnitude > 0.01) {
      const speed = thief.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
      const dx = (move.x / magnitude) * speed * dt;
      const dy = (move.y / magnitude) * speed * dt;
      thief.dir = Math.atan2(dy, dx);
      thief.moving = true;
      tryMove(dx, dy);
    } else {
      thief.moving = false;
    }
    if (thief.invulnerable > 0) thief.invulnerable = Math.max(0, thief.invulnerable - dt);

    // Tools, paid from the haul.
    if (actions.smoke) {
      const result = trySmoke(state.toolbox, state.haul, thief.x, thief.y);
      if (result.ok) {
        state.haul -= result.cost;
        state.spent += result.cost;
        events |= EV_TOOL;
      }
    }
    if (actions.emp) {
      const result = tryEmp(state.cameras, state.haul, thief.x, thief.y);
      if (result.ok) {
        state.haul -= result.cost;
        state.spent += result.cost;
        events |= EV_TOOL;
      }
    }
    if (actions.coin) {
      let targetX = actions.coin.x;
      let targetY = actions.coin.y;
      const dx = targetX - thief.x;
      const dy = targetY - thief.y;
      const distance = Math.hypot(dx, dy);
      if (distance > TOOLS.coinThrowRadius) {
        targetX = thief.x + (dx / distance) * TOOLS.coinThrowRadius;
        targetY = thief.y + (dy / distance) * TOOLS.coinThrowRadius;
      }
      const result = tryCoin(state.toolbox, state.haul, targetX, targetY);
      if (result.ok) {
        state.haul -= result.cost;
        state.spent += result.cost;
        events |= EV_TOOL;
      }
    }
    updateToolbox(state.toolbox, dt);

    // Loot within reach, taken with E.
    state.nearLoot = null;
    for (const item of state.loot) {
      if (!item.taken && Math.hypot(item.x - thief.x, item.y - thief.y) <= THIEF.grabReach) {
        state.nearLoot = item;
        break;
      }
    }
    if (actions.interact && state.nearLoot) {
      const item = state.nearLoot;
      item.taken = true;
      state.lootTaken += 1;
      state.haul += item.value;
      state.nearLoot = null;
      events |= EV_PICKUP;
    }

    // A thrown coin pulls the nearest patrolling guard over to look.
    for (const coin of state.toolbox.coins) {
      for (const guard of state.guards) {
        if (guard.state === 'patrol' && Math.hypot(guard.x - coin.x, guard.y - coin.y) <= TOOLS.coinLureRadius) {
          guard.state = 'alert';
          guard.lastSeenX = coin.x;
          guard.lastSeenY = coin.y;
        }
      }
    }

    // Guards: patrol, chase what they saw, search, then walk back.
    let spotted = false;
    let alarmRate = 0;
    for (const guard of state.guards) {
      const sees = watcherSees(guard.x, guard.y, guard.dir, GUARD.coneRange, GUARD.coneHalfAngle);
      if (sees) {
        const distance = Math.hypot(thief.x - guard.x, thief.y - guard.y);
        spotted = true;
        alarmRate = Math.max(alarmRate, distance < 120 ? ALARM.riseGuardNear : ALARM.riseGuardFar);
        guard.suspicion = Math.min(1, guard.suspicion + dt * (thief.sneak ? 0.7 : 1.4));
        guard.lastSeenX = thief.x;
        guard.lastSeenY = thief.y;
        if (guard.suspicion >= GUARD.suspicionToAlert) guard.state = 'alert';
      } else {
        guard.suspicion = Math.max(0, guard.suspicion - dt * 0.5);
      }
      if (guard.state === 'patrol') updateGuardPatrol(guard, dt);
      else if (guard.state === 'alert') {
        if (walkToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.alertSpeed, dt)) {
          guard.state = 'search';
          guard.searchLeft = GUARD.searchSeconds;
        }
      } else if (guard.state === 'search') {
        guard.searchLeft -= dt;
        guard.dir += dt * 1.8;
        if (guard.searchLeft <= 0) guard.state = 'return';
      } else if (guard.state === 'return') {
        let nearest = guard.waypoints[0];
        let nearestDistance = Infinity;
        for (const point of guard.waypoints) {
          const distance = Math.hypot(point[0] - guard.x, point[1] - guard.y);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = point;
          }
        }
        if (walkToward(guard, nearest[0], nearest[1], GUARD.patrolSpeed, dt)) {
          guard.leg = guard.waypoints.indexOf(nearest);
          guard.forward = guard.leg < guard.waypoints.length - 1;
          guard.state = 'patrol';
        }
      }
      if (thief.invulnerable <= 0 && Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRadius) {
        handleCaught();
        events |= EV_CAUGHT;
        state.score = state.haul;
        return events;
      }
    }

    // Cameras sweep unless an EMP froze them.
    for (const camera of state.cameras) {
      if (camera.disabledLeft > 0) camera.disabledLeft = Math.max(0, camera.disabledLeft - dt);
      updateCameraLens(camera, state.time);
      if (camera.disabledLeft <= 0 && watcherSees(camera.x, camera.y, camera.angle, CAMERA.range, CAMERA.halfAngle)) {
        spotted = true;
        alarmRate = Math.max(alarmRate, ALARM.riseCamera);
      }
    }

    if (spotted) {
      state.alarm = Math.min(ALARM.caughtAt, state.alarm + alarmRate * (thief.sneak ? 0.55 : 1) * dt);
      events |= EV_SPOTTED;
    } else {
      // Cooling down is quicker while sneaking: holding still in the dark pays.
      const coolDown = ALARM.decayPerSecond * (thief.sneak ? 1.5 : 1);
      state.alarm = Math.max(0, state.alarm - coolDown * dt);
    }
    if (state.alarm >= ALARM.caughtAt) {
      handleCaught();
      events |= EV_CAUGHT;
      state.score = state.haul;
      return events;
    }

    // Getaway: every loot taken and the thief inside the exit door.
    if (state.lootTaken === state.loot.length && circleHitsRect(thief.x, thief.y, THIEF.radius, state.museum.exit)) {
      state.status = 'win';
      state.timeBonus = Math.max(0, TIME_BONUS_START - Math.floor(state.time));
      state.score = state.haul + state.timeBonus;
      events |= EV_WIN;
      return events;
    }

    state.score = state.haul;
    return events;
  }

  return { state, reset, resume, step };
}
