// Keyboard and pointer input. Held keys give a movement vector and a sneak
// flag; one-shot presses (start, pause, grab, tools) are queued as bit flags
// and taken once by the loop, so a press between two frames is never lost
// and never counted twice. A pointer press also drops a coin target.

export const ACT_CONFIRM = 1;
export const ACT_PAUSE = 2;
export const ACT_INTERACT = 4;
export const ACT_SMOKE = 8;
export const ACT_EMP = 16;

const KEY_UP = new Set(['ArrowUp', 'KeyW']);
const KEY_DOWN = new Set(['ArrowDown', 'KeyS']);
const KEY_LEFT = new Set(['ArrowLeft', 'KeyA']);
const KEY_RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createControls(canvas, toField) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (KEY_UP.has(event.code)) up = true;
    else if (KEY_DOWN.has(event.code)) down = true;
    else if (KEY_LEFT.has(event.code)) left = true;
    else if (KEY_RIGHT.has(event.code)) right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACT_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACT_PAUSE;
    } else if (event.code === 'KeyE') {
      if (!event.repeat) actions |= ACT_INTERACT;
    } else if (event.code === 'Digit1') {
      if (!event.repeat) actions |= ACT_SMOKE;
    } else if (event.code === 'Digit2') {
      if (!event.repeat) actions |= ACT_EMP;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (KEY_UP.has(event.code)) up = false;
    else if (KEY_DOWN.has(event.code)) down = false;
    else if (KEY_LEFT.has(event.code)) left = false;
    else if (KEY_RIGHT.has(event.code)) right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    sneak = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    actions |= ACT_CONFIRM;
    click = toField(event.clientX, event.clientY);
  });

  return {
    /** Movement vector (-1..1 each way) plus whether sneak is held. */
    moveVector() {
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0), sneak };
    },
    /** The one-shot presses since the last call, as ACT_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last pointer press as a field point, or null when there was none. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
