// Drawing only: the museum, its people, the cones, the HUD and the panels.
// The 1280x800 field is scaled to fit the window and centred.
import { CAMERA, FIELD, FONT, GUARD, HUD_HEIGHT, LIVES, PALETTE, THIEF } from './tuning.js';

export const SC_TITLE = 'title';
export const SC_PLAY = 'play';
export const SC_PAUSED = 'paused';
export const SC_CAUGHT = 'caught';
export const SC_OVER = 'over';
export const SC_WIN = 'win';

const PANEL = { width: 680, top: 120, line: 32, bottom: 76 };

const TITLE_LINES = [
  'Malam ini, Galeri Aruna lengang. Sura si pencuri menyelinap masuk.',
  'Curi keempat rampasan — lalu kabur lewat pintu KELUAR sebelum alarm penuh.',
  'WASD / panah bergerak · Shift mengendap · E mengambil rampasan',
  '1 bom asap (−20) · 2 EMP kamera (−30) · Klik lempar koin pengalih (−10)',
  'Jangan sampai terlihat: kerucut kuning penjaga dan kamera menaikkan alarm.',
];

export function createPainter(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = `${weight || '400'}:${size}`;
    if (!fonts.has(key)) fonts.set(key, weight ? `${weight} ${size}px ${FONT}` : `${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function drawFloor(state) {
    const museum = state.museum;
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Faint floor tiles.
    context.strokeStyle = PALETTE.floorTile;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 96; x < FIELD.width; x += 80) {
      context.moveTo(x, HUD_HEIGHT);
      context.lineTo(x, FIELD.height);
    }
    for (let y = HUD_HEIGHT + 80; y < FIELD.height; y += 80) {
      context.moveTo(0, y);
      context.lineTo(FIELD.width, y);
    }
    context.stroke();
    // Carpet runner along the bottom corridor.
    context.fillStyle = PALETTE.carpet;
    context.fillRect(16, 556, 1248, 148);
    context.strokeStyle = 'rgba(217, 164, 65, 0.35)';
    context.strokeRect(24, 564, 1232, 132);
    // Faint patrol routes, so the guard rounds are readable at a glance.
    context.strokeStyle = 'rgba(229, 83, 75, 0.22)';
    context.lineWidth = 2;
    context.setLineDash([6, 8]);
    for (const guard of museum.guards) {
      context.beginPath();
      guard.waypoints.forEach(([wx, wy], index) => {
        if (index === 0) context.moveTo(wx, wy);
        else context.lineTo(wx, wy);
      });
      context.stroke();
    }
    context.setLineDash([]);
    // Vault alcove tint, top right.
    context.fillStyle = 'rgba(255, 211, 77, 0.07)';
    context.fillRect(1076, 92, 172, 134);
    text('BRANKAS', 1162, 112, 12, PALETTE.muted, 'center', '700');
    // Walls.
    for (const wall of museum.walls) {
      context.fillStyle = PALETTE.wall;
      context.fillRect(wall.x, wall.y, wall.w, wall.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(wall.x, wall.y, wall.w, 3);
    }
    // Display cases: teal glass with a gold trim.
    for (const box of museum.cases) {
      context.fillStyle = PALETTE.displayCase;
      context.fillRect(box.x, box.y, box.w, box.h);
      context.strokeStyle = PALETTE.caseTrim;
      context.lineWidth = 2;
      context.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
      context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(box.x + 6, box.y + box.h - 6);
      context.lineTo(box.x + box.w - 6, box.y + 6);
      context.stroke();
    }
    // Exit door, bottom left.
    const exit = museum.exit;
    context.fillStyle = '#123524';
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    context.strokeStyle = PALETTE.exit;
    context.lineWidth = 3;
    context.strokeRect(exit.x, exit.y, exit.w, exit.h);
    text('KELUAR', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5, 15, PALETTE.exit, 'center', '700');
    context.lineWidth = 1;
  }

  function drawCone(x, y, angle, range, half, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, range, angle - half, angle + half);
    context.closePath();
    context.fill();
  }

  function drawCones(state) {
    for (const guard of state.guards) {
      const fill = guard.state === 'alert' ? PALETTE.coneAlert : guard.suspicion > 0.25 ? PALETTE.coneWary : PALETTE.coneCalm;
      drawCone(guard.x, guard.y, guard.dir, GUARD.coneRange, GUARD.coneHalfAngle, fill);
    }
    for (const camera of state.cameras) {
      if (camera.disabledLeft > 0) continue;
      drawCone(camera.x, camera.y, camera.angle, CAMERA.range, CAMERA.halfAngle, PALETTE.coneCamera);
    }
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      context.fillStyle = '#2a2f42';
      context.fillRect(item.x - 16, item.y - 10, 32, 20);
      if (item.taken) continue;
      context.fillStyle = 'rgba(255, 211, 77, 0.16)';
      context.beginPath();
      context.arc(item.x, item.y, 26, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.loot;
      context.beginPath();
      context.moveTo(item.x, item.y - 13);
      context.lineTo(item.x + 10, item.y);
      context.lineTo(item.x, item.y + 13);
      context.lineTo(item.x - 10, item.y);
      context.closePath();
      context.fill();
      context.fillStyle = PALETTE.lootGlow;
      context.beginPath();
      context.moveTo(item.x, item.y - 13);
      context.lineTo(item.x + 10, item.y);
      context.lineTo(item.x, item.y);
      context.closePath();
      context.fill();
      text(item.name, item.x, item.y + 32, 12, PALETTE.muted, 'center');
      text(`+${item.value}`, item.x, item.y + 47, 11, PALETTE.gold, 'center');
    }
  }

  function drawActors(state) {
    for (const smoke of state.toolbox.smokes) {
      context.fillStyle = PALETTE.smoke;
      context.beginPath();
      context.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(220, 224, 236, 0.5)';
      context.beginPath();
      context.arc(smoke.x - 18, smoke.y - 10, smoke.radius * 0.45, 0, Math.PI * 2);
      context.fill();
    }
    for (const coin of state.toolbox.coins) {
      context.fillStyle = PALETTE.gold;
      context.beginPath();
      context.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(242, 201, 76, 0.5)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(coin.x, coin.y, 12, 0, Math.PI * 2);
      context.stroke();
    }
    for (const camera of state.cameras) {
      const disabled = camera.disabledLeft > 0;
      context.fillStyle = disabled ? '#555a6a' : PALETTE.camera;
      context.fillRect(camera.x - 9, camera.y - 9, 18, 18);
      context.fillStyle = '#0d0f16';
      context.beginPath();
      context.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
      context.fill();
      if (disabled) text('×', camera.x, camera.y + 16, 12, PALETTE.guard, 'center', '700');
    }
    for (const guard of state.guards) {
      context.fillStyle = PALETTE.guardBody;
      context.beginPath();
      context.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = PALETTE.guard;
      context.lineWidth = 3;
      context.stroke();
      context.lineWidth = 1;
      context.fillStyle = PALETTE.guard;
      context.beginPath();
      context.moveTo(guard.x + Math.cos(guard.dir) * GUARD.radius, guard.y + Math.sin(guard.dir) * GUARD.radius);
      context.arc(guard.x, guard.y, 6, guard.dir - 0.5, guard.dir + 0.5);
      context.closePath();
      context.fill();
      text(guard.name, guard.x, guard.y - GUARD.radius - 8, 11, PALETTE.muted, 'center');
      if (guard.state === 'alert') text('!', guard.x, guard.y - GUARD.radius - 22, 18, PALETTE.guard, 'center', '700');
      else if (guard.suspicion > 0.25) text('?', guard.x, guard.y - GUARD.radius - 22, 16, PALETTE.gold, 'center', '700');
    }
    const thief = state.thief;
    const glowRadius = thief.sneak ? 52 : 78;
    const glow = context.createRadialGradient(thief.x, thief.y, 6, thief.x, thief.y, glowRadius);
    glow.addColorStop(0, 'rgba(255, 207, 110, 0.30)');
    glow.addColorStop(1, 'rgba(255, 207, 110, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(thief.x, thief.y, glowRadius, 0, Math.PI * 2);
    context.fill();
    const blink = thief.invulnerable > 0 && Math.floor(thief.invulnerable * 10) % 2 === 0;
    if (!blink) {
      context.fillStyle = PALETTE.thief;
      context.beginPath();
      context.arc(thief.x, thief.y, THIEF.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.thiefDark;
      context.beginPath();
      context.moveTo(thief.x + Math.cos(thief.dir) * THIEF.radius, thief.y + Math.sin(thief.dir) * THIEF.radius);
      context.arc(thief.x, thief.y, 7, thief.dir - 0.6, thief.dir + 0.6);
      context.closePath();
      context.fill();
      context.fillStyle = PALETTE.lantern;
      context.beginPath();
      context.arc(thief.x + Math.cos(thief.dir) * 10, thief.y + Math.sin(thief.dir) * 10, 3.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function alarmColor(alarm) {
    if (alarm < 40) return '#58c98a';
    if (alarm < 70) return PALETTE.gold;
    return PALETTE.guard;
  }

  function drawHud(state) {
    context.fillStyle = 'rgba(13, 15, 22, 0.92)';
    context.fillRect(0, 0, FIELD.width, HUD_HEIGHT);
    context.fillStyle = PALETTE.caseTrim;
    context.fillRect(0, HUD_HEIGHT - 2, FIELD.width, 2);
    text('OPERASI LENTERA', 24, 26, 20, PALETTE.gold, 'left', '700');
    text(`Rampasan ${state.lootTaken}/4  ·  Haul ${state.haul}  ·  Biaya alat ${state.spent}`, 24, 50, 14, PALETTE.text, 'left');
    const barX = 500;
    const barY = 30;
    const barW = 280;
    const barH = 18;
    text('ALARM', barX, 22, 13, PALETTE.muted, 'left', '700');
    context.fillStyle = '#10131d';
    context.fillRect(barX, barY, barW, barH);
    context.fillStyle = alarmColor(state.alarm);
    context.fillRect(barX, barY, Math.max(0, Math.min(1, state.alarm / 100)) * barW, barH);
    context.strokeStyle = PALETTE.muted;
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barW, barH);
    text(`${Math.floor(state.alarm)}`, barX + barW + 10, barY + 15, 15, alarmColor(state.alarm), 'left', '700');
    const minutes = Math.floor(state.time / 60);
    const seconds = Math.floor(state.time % 60);
    const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    text(clock, FIELD.width - 24, 26, 20, PALETTE.text, 'right', '700');
    let livesText = '';
    for (let life = 0; life < LIVES; life += 1) livesText += life < state.lives ? '● ' : '○ ';
    text(`Kesempatan ${livesText}`, FIELD.width - 24, 50, 14, PALETTE.text, 'right');
  }

  function drawPrompts(state) {
    if (state.status !== 'play') return;
    let prompt = 'WASD bergerak · Shift mengendap · E ambil · 1 Asap · 2 EMP · Klik lempar koin · P jeda';
    let color = PALETTE.muted;
    if (state.nearLoot) {
      prompt = `Tekan E — ambil ${state.nearLoot.name} (+${state.nearLoot.value})`;
      color = PALETTE.gold;
    } else if (state.lootTaken === 4) {
      prompt = 'Semua rampasan didapat — kabur ke pintu KELUAR!';
      color = PALETTE.gold;
    } else if (state.alarm >= 70) {
      prompt = 'Alarm hampir penuh — bersembunyi dari kerucut!';
      color = PALETTE.guard;
    }
    text(prompt, FIELD.width / 2, FIELD.height - 44, 15, color, 'center', '700');
  }

  function drawPanel(title, lines, prompt) {
    context.fillStyle = 'rgba(13, 15, 22, 0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.caseTrim;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.lineWidth = 1;
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.text, 'center', '700');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.gold, 'center');
  }

  /** Paint one frame: the museum, then the HUD or a panel for the screen. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor(state);
    drawCones(state);
    drawLoot(state);
    drawActors(state);
    if (screen === SC_TITLE) {
      const lines = TITLE_LINES.slice();
      lines.push(`Skor terbaik: ${best}`);
      drawPanel('OPERASI LENTERA', lines, 'Tekan Spasi atau klik untuk mulai');
      return;
    }
    drawHud(state);
    drawPrompts(state);
    if (screen === SC_PAUSED) drawPanel('Jeda', ['Penjaga menunggumu.'], 'Tekan P untuk lanjut');
    else if (screen === SC_CAUGHT) {
      drawPanel('TERTANGKAP!', [`Penjaga menemukan Sura. ${state.lives} kesempatan tersisa.`, 'Alarm turun, tapi penjaga kembali berpatroli.'], 'Tekan Spasi untuk lanjut');
    } else if (screen === SC_OVER) {
      drawPanel('Penjaga Menang', [`Skor ${state.score} · Terbaik ${best}`, 'Galeri Aruna tetap terkunci rapat malam ini.'], 'Tekan Spasi untuk mencoba lagi');
    } else if (screen === SC_WIN) {
      drawPanel('KABUR!', [`Semua rampasan dibawa pulang. Skor ${state.score} · Terbaik ${best}`, 'Sura menghilang ke dalam malam — tanpa jejak.'], 'Tekan Spasi untuk bermain lagi');
    }
  }

  /** A pointer position in page pixels, as a point on the 1280x800 field. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    return { x: (px - view.x) / view.scale, y: (py - view.y) / view.scale };
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField };
}
