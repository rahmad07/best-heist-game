// Boot and the one loop: input is read every frame, the heist advances in
// fixed 1/60 s steps, and the painter paints what is there. Screens: title,
// play, paused, caught, game over and win.
//
// ?seed=N is accepted but the museum floor is fixed, so the seed changes
// nothing. ?shot=cover|patrol|chase|exit stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, STEP } from './tuning.js';
import { createHeist, EV_CAUGHT, EV_PICKUP, EV_SPOTTED, EV_TOOL, EV_WIN } from './heist.js';
import { ACT_CONFIRM, ACT_EMP, ACT_INTERACT, ACT_PAUSE, ACT_SMOKE, createControls } from './controls.js';
import { createPainter, SC_CAUGHT, SC_OVER, SC_PAUSED, SC_PLAY, SC_TITLE, SC_WIN } from './painter.js';
import { createSound } from './sound.js';
import { stageScene } from './staging.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const heist = createHeist();
const painter = createPainter(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts one visit.
  }
}

function runShot(name) {
  stageScene(name, heist);
  let painted = 0;
  function paint() {
    painter.draw(heist.state, SC_PLAY, readBest());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const controls = createControls(canvas, painter.toField);
  let screen = SC_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let wasSpotted = false;

  // Screen readers (and anyone watching the page's text) hear screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    heist.reset();
    controls.takeClick();
    accumulator = 0;
    screen = SC_PLAY;
    announce('Operasi Lentera dimulai. Curi keempat rampasan, lalu kabur ke pintu keluar.');
  }

  function finishWin() {
    screen = SC_WIN;
    if (heist.state.score > best) {
      best = heist.state.score;
      saveBest(best);
    }
    announce(`Kabur! Skor ${heist.state.score}. Terbaik ${best}.`);
  }

  function finishOver() {
    screen = SC_OVER;
    if (heist.state.score > best) {
      best = heist.state.score;
      saveBest(best);
    }
    announce(`Tertangkap. Skor ${heist.state.score}. Terbaik ${best}.`);
  }

  function stepOnce(actionFlags, click) {
    const move = controls.moveVector();
    const stepActions = {
      sneak: move.sneak,
      interact: !!(actionFlags & ACT_INTERACT),
      smoke: !!(actionFlags & ACT_SMOKE),
      emp: !!(actionFlags & ACT_EMP),
      coin: click,
    };
    const events = heist.step(STEP, { x: move.x, y: move.y }, stepActions);
    const spotted = !!(events & EV_SPOTTED);
    if (spotted && !wasSpotted) sound.spotted();
    wasSpotted = spotted;
    if (events & EV_PICKUP) {
      sound.pickup();
      announce(`Rampasan ${heist.state.lootTaken} dari 4 didapat.`);
    }
    if (events & EV_TOOL) sound.tool();
    if (events & EV_CAUGHT) {
      sound.caught();
      if (heist.state.status === 'over') finishOver();
      else {
        screen = SC_CAUGHT;
        announce(`Tertangkap! ${heist.state.lives} kesempatan tersisa.`);
      }
    }
    if (events & EV_WIN) {
      sound.win();
      finishWin();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = controls.takeActions();
    const click = controls.takeClick();
    if (actions & ACT_CONFIRM) {
      if (screen === SC_TITLE || screen === SC_OVER || screen === SC_WIN) startGame();
      else if (screen === SC_CAUGHT) {
        heist.resume();
        screen = SC_PLAY;
        announce('Lanjut. Jangan sampai ketahuan lagi.');
      } else if (screen === SC_PAUSED) {
        screen = SC_PLAY;
        announce('Lanjut.');
      }
    } else if ((actions & ACT_PAUSE) && screen === SC_PLAY) {
      screen = SC_PAUSED;
      announce('Jeda.');
    } else if ((actions & ACT_PAUSE) && screen === SC_PAUSED) {
      screen = SC_PLAY;
      announce('Lanjut.');
    }

    if (screen === SC_PLAY) {
      let firstStep = true;
      while (accumulator >= STEP) {
        stepOnce(firstStep ? actions : 0, firstStep ? click : null);
        firstStep = false;
        accumulator -= STEP;
        if (screen !== SC_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    painter.draw(heist.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the alarm rise unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SC_PLAY) {
      screen = SC_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Operasi Lentera. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
