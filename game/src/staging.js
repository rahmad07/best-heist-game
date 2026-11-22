// Deterministic screenshot scenes behind ?shot=cover|patrol|chase|exit.
// Each one places the real actors and the real alarm, loot and tool state by
// hand, so the frame is exactly what a played game looks like at that
// moment, and the same query always gives the same frame.

function placeGuard(guard, x, y, dir, state, suspicion) {
  guard.x = x;
  guard.y = y;
  guard.dir = dir;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.lastSeenX = x;
  guard.lastSeenY = y;
}

export function stageScene(name, heist) {
  const state = heist.state;
  heist.reset();
  const thief = state.thief;
  if (name === 'patrol') {
    state.time = 12;
    state.alarm = 6;
    thief.x = 200;
    thief.y = 720;
    thief.dir = -Math.PI / 2;
    thief.sneak = true;
    placeGuard(state.guards[0], 620, 300, 0, 'patrol', 0);
    placeGuard(state.guards[1], 1180, 500, Math.PI / 2, 'patrol', 0);
    placeGuard(state.guards[2], 500, 640, Math.PI, 'patrol', 0);
    state.cameras[0].fixedAngle = Math.PI / 2 + 0.4;
    state.cameras[1].fixedAngle = -Math.PI * 0.75 + 0.3;
  } else if (name === 'chase') {
    state.time = 140;
    state.alarm = 78;
    state.lives = 2;
    state.haul = 220;
    state.lootTaken = 2;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    thief.x = 850;
    thief.y = 300;
    thief.dir = Math.PI;
    thief.sneak = false;
    state.toolbox.smokes.push({ x: 800, y: 340, radius: 95, left: 3 });
    placeGuard(state.guards[0], 700, 300, 0, 'alert', 0.9);
    placeGuard(state.guards[1], 1180, 420, -Math.PI / 2, 'alert', 0.7);
    placeGuard(state.guards[2], 500, 640, 0, 'patrol', 0.2);
    state.cameras[0].fixedAngle = Math.PI / 2 - 0.5;
    state.cameras[1].fixedAngle = -Math.PI * 0.75 - 0.2;
  } else if (name === 'exit') {
    state.time = 210;
    state.alarm = 52;
    state.haul = 670;
    state.lootTaken = 4;
    for (const item of state.loot) item.taken = true;
    thief.x = 90;
    thief.y = 730;
    thief.dir = Math.PI / 2;
    thief.sneak = false;
    placeGuard(state.guards[0], 300, 640, Math.PI, 'alert', 0.85);
    placeGuard(state.guards[1], 1180, 600, -Math.PI / 2, 'alert', 0.6);
    placeGuard(state.guards[2], 700, 640, Math.PI, 'patrol', 0.3);
    state.cameras[0].fixedAngle = Math.PI / 2 + 0.6;
    state.cameras[1].fixedAngle = -Math.PI * 0.75 + 0.5;
  } else {
    // Cover: the full heist in one frame — the thief mid-room, guards with
    // cones, both cameras sweeping, loot on its pedestals, alarm meter up.
    state.time = 74;
    state.alarm = 38;
    state.haul = 100;
    state.lootTaken = 1;
    state.loot[0].taken = true;
    thief.x = 640;
    thief.y = 450;
    thief.dir = -Math.PI / 2;
    thief.sneak = true;
    placeGuard(state.guards[0], 480, 350, 0.5, 'alert', 0.75);
    placeGuard(state.guards[1], 1180, 480, Math.PI / 2, 'patrol', 0.15);
    placeGuard(state.guards[2], 820, 640, -Math.PI / 2, 'patrol', 0.1);
    state.cameras[0].fixedAngle = Math.PI / 2 + 0.35;
    state.cameras[1].fixedAngle = -Math.PI * 0.75 + 0.25;
  }
}
