// Angles, vision cones and line of sight. Nothing here knows about the
// game; it only answers geometry questions for guards and cameras.

/** Smallest absolute angle between two headings, in radians. */
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when a point sits inside a cone of a given range and half-angle. */
export function pointInCone(px, py, ox, oy, facing, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 1) return true;
  return angleDifference(Math.atan2(dy, dx), facing) <= halfAngle;
}

/** Liang-Barsky clip test: does the segment cross the rectangle? */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let low = 0;
  let high = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  for (let edge = 0; edge < 4; edge += 1) {
    if (p[edge] === 0) {
      if (q[edge] < 0) return false;
    } else {
      const hit = q[edge] / p[edge];
      if (p[edge] < 0) {
        if (hit > high) return false;
        if (hit > low) low = hit;
      } else {
        if (hit < low) return false;
        if (hit < high) high = hit;
      }
    }
  }
  return true;
}

/** True when no blocker rectangle stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (let index = 0; index < blockers.length; index += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[index])) return false;
  }
  return true;
}

/** Distance from a point to a segment (for smoke blocking a sight line). */
export function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  let along = 0;
  if (lengthSquared > 0) {
    along = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    along = Math.max(0, Math.min(1, along));
  }
  const nearestX = x1 + along * dx;
  const nearestY = y1 + along * dy;
  return Math.hypot(px - nearestX, py - nearestY);
}
