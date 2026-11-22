// The people and the cameras: where they stand, how guards walk their
// patrols, and how a camera sweeps its cone. No rules live here, only motion.
import { GUARD } from './tuning.js';

export function makeThief(entry) {
  return { x: entry.x, y: entry.y, dir: -Math.PI / 2, sneak: false, moving: false, invulnerable: 0 };
}

export function makeGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints,
    leg: 0,
    forward: true,
    waitLeft: 0,
    x: start[0],
    y: start[1],
    dir: 0,
    state: 'patrol',
    suspicion: 0,
    lastSeenX: start[0],
    lastSeenY: start[1],
    searchLeft: 0,
  };
}

export function resetGuard(guard) {
  const start = guard.waypoints[0];
  guard.x = start[0];
  guard.y = start[1];
  guard.dir = 0;
  guard.leg = 0;
  guard.forward = true;
  guard.waitLeft = 0;
  guard.state = 'patrol';
  guard.suspicion = 0;
  guard.lastSeenX = start[0];
  guard.lastSeenY = start[1];
  guard.searchLeft = 0;
}

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.base,
    sweep: def.sweep,
    speed: def.speed,
    phase: def.phase,
    angle: def.base,
    disabledLeft: 0,
    fixedAngle: null,
  };
}

/** Walk toward a point at a speed; true when the guard arrives this step. */
export function walkToward(guard, targetX, targetY, speed, dt) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) return true;
  const step = Math.min(distance, speed * dt);
  guard.x += (dx / distance) * step;
  guard.y += (dy / distance) * step;
  guard.dir = Math.atan2(dy, dx);
  return distance - step < 2;
}

/** One patrol step: walk the waypoints back and forth, pausing at each end. */
export function updateGuardPatrol(guard, dt) {
  if (guard.waitLeft > 0) {
    guard.waitLeft -= dt;
    guard.dir += dt * 0.6;
    return;
  }
  const target = guard.waypoints[guard.leg];
  if (walkToward(guard, target[0], target[1], GUARD.patrolSpeed, dt)) {
    guard.waitLeft = 0.8;
    if (guard.forward) {
      guard.leg += 1;
      if (guard.leg >= guard.waypoints.length) {
        guard.leg = guard.waypoints.length - 2;
        guard.forward = false;
      }
    } else {
      guard.leg -= 1;
      if (guard.leg < 0) {
        guard.leg = 1;
        guard.forward = true;
      }
    }
  }
}

/** Sweep the camera's cone, unless a staged scene pinned its angle. */
export function updateCameraLens(camera, time) {
  if (camera.fixedAngle !== null) {
    camera.angle = camera.fixedAngle;
    return;
  }
  if (camera.disabledLeft > 0) return;
  camera.angle = camera.baseAngle + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}
