'use strict';

// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const W       = canvas.width;   // 480
const H       = canvas.height;  // 520

// ─── UI elements ─────────────────────────────────────────────────────────────
const scoreEl   = document.getElementById('score');
const levelEl   = document.getElementById('level');
const livesEl   = document.getElementById('lives');
const overlay   = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-msg');
const overlayBtn   = document.getElementById('overlay-btn');

// ─── Game constants ───────────────────────────────────────────────────────────
const PADDLE_W      = 80;
const PADDLE_H      = 12;
const PADDLE_Y      = H - 36;
const PADDLE_SPEED  = 7;

const BALL_R        = 7;
const BASE_SPEED    = 4;

const BRICK_COLS    = 10;
const BRICK_ROWS    = 6;
const BRICK_GAP     = 4;
const BRICK_TOP     = 60;

// brick width derived from canvas width
const BRICK_W = (W - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
const BRICK_H = 18;

// Colour palette per row (top → bottom)
const ROW_COLORS = [
  '#ff4466', // red
  '#ff7733', // orange
  '#ffcc00', // yellow
  '#33cc44', // green
  '#3399ff', // blue
  '#aa44ff', // purple
];

// Points per row
const ROW_POINTS = [7, 5, 4, 3, 2, 1];

// ─── State ────────────────────────────────────────────────────────────────────
let state      = 'idle';   // 'idle' | 'playing' | 'paused' | 'dead' | 'win' | 'gameover'
let score      = 0;
let lives      = 3;
let level      = 1;
let animId     = null;

let paddle, ball, bricks;
const keys = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function showOverlay(title, msg, btnLabel) {
  overlayTitle.textContent = title;
  overlayMsg.innerHTML     = msg;
  overlayBtn.textContent   = btnLabel;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.innerHTML   = '&#9679;'.repeat(lives);
}

// ─── Brick factory ────────────────────────────────────────────────────────────

function makeBricks() {
  const list = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const x = BRICK_GAP + c * (BRICK_W + BRICK_GAP);
      const y = BRICK_TOP + r * (BRICK_H + BRICK_GAP);
      // Higher levels add extra hit points to some bricks
      const maxHp = (level >= 3 && r < 2) ? 2 : 1;
      list.push({ x, y, w: BRICK_W, h: BRICK_H, hp: maxHp, maxHp, row: r, col: c, alive: true });
    }
  }
  return list;
}

// ─── Init / reset ─────────────────────────────────────────────────────────────

function initLevel() {
  paddle = {
    x: W / 2 - PADDLE_W / 2,
    y: PADDLE_Y,
    w: PADDLE_W,
    h: PADDLE_H,
  };

  const angle   = (Math.random() * 60 + 30) * (Math.PI / 180); // 30°–90°
  const speedUp = 1 + (level - 1) * 0.12;
  const sp      = BASE_SPEED * speedUp;

  ball = {
    x:  W / 2,
    y:  PADDLE_Y - BALL_R - 2,
    r:  BALL_R,
    vx: sp * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1),
    vy: -sp * Math.sin(angle),
    stuck: true,          // sits on paddle until Space is pressed
  };

  bricks = makeBricks();
}

function startGame() {
  score  = 0;
  lives  = 3;
  level  = 1;
  initLevel();
  updateHUD();
  hideOverlay();
  state  = 'playing';
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function nextLevel() {
  level++;
  initLevel();
  updateHUD();
  showOverlay(`LEVEL ${level}`, 'Get ready…', 'CONTINUE');
  state = 'idle';
}

function loseLife() {
  lives--;
  updateHUD();
  if (lives <= 0) {
    state = 'gameover';
    showOverlay('GAME OVER', `Final score: <strong>${score}</strong>`, 'PLAY AGAIN');
  } else {
    // Reset ball/paddle only
    ball = {
      x:  W / 2,
      y:  PADDLE_Y - BALL_R - 2,
      r:  BALL_R,
      vx: BASE_SPEED * (Math.random() < 0.5 ? 1 : -1),
      vy: -BASE_SPEED,
      stuck: true,
    };
    paddle.x = W / 2 - PADDLE_W / 2;
  }
}

// ─── Physics ──────────────────────────────────────────────────────────────────

function movePaddle() {
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) paddle.x -= PADDLE_SPEED;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) paddle.x += PADDLE_SPEED;
  paddle.x = clamp(paddle.x, 0, W - paddle.w);

  if (ball.stuck) {
    ball.x = paddle.x + paddle.w / 2;
  }
}

function launchBall() {
  if (!ball.stuck) return;
  ball.stuck = false;
}

function moveBall() {
  if (ball.stuck) return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions
  if (ball.x - ball.r < 0) {
    ball.x  = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > W) {
    ball.x  = W - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r < 0) {
    ball.y  = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  // Fell below paddle
  if (ball.y - ball.r > H) {
    loseLife();
    return;
  }

  // Paddle collision
  if (
    ball.vy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x - ball.r &&
    ball.x <= paddle.x + paddle.w + ball.r
  ) {
    // Angle depends on hit position relative to paddle centre
    const rel    = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1..1
    const maxAng = 70 * (Math.PI / 180);
    const ang    = rel * maxAng;
    const sp     = Math.hypot(ball.vx, ball.vy);
    ball.vy = -Math.abs(sp * Math.cos(ang));
    ball.vx = sp * Math.sin(ang);
    ball.y  = paddle.y - ball.r - 1;
  }

  // Brick collisions
  for (const b of bricks) {
    if (!b.alive) continue;

    const nearX = clamp(ball.x, b.x, b.x + b.w);
    const nearY = clamp(ball.y, b.y, b.y + b.h);
    const dx    = ball.x - nearX;
    const dy    = ball.y - nearY;

    if (dx * dx + dy * dy < ball.r * ball.r) {
      b.hp--;
      if (b.hp <= 0) {
        b.alive = false;
        score  += ROW_POINTS[b.row];
        updateHUD();
      }

      // Reflect ball
      const overlapX = ball.r - Math.abs(dx);
      const overlapY = ball.r - Math.abs(dy);
      if (overlapX < overlapY) {
        ball.vx = dx < 0 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
      } else {
        ball.vy = dy < 0 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
      }
      break; // one brick per frame
    }
  }

  // Win condition
  if (bricks.every(b => !b.alive)) {
    state = 'win';
    showOverlay(`LEVEL ${level} CLEAR!`, `Score: <strong>${score}</strong>`, level < 5 ? 'NEXT LEVEL' : 'PLAY AGAIN');
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawBackground() {
  ctx.fillStyle = '#0d0d22';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(40,40,80,0.35)';
  ctx.lineWidth   = 0.5;
  const step = 40;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawBricks() {
  for (const b of bricks) {
    if (!b.alive) continue;

    const color = ROW_COLORS[b.row];

    // Damaged bricks are darker
    const alpha = b.maxHp > 1 && b.hp < b.maxHp ? 0.55 : 1;
    ctx.globalAlpha = alpha;

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Shine
    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    grad.addColorStop(0, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    ctx.shadowBlur  = 0;

    ctx.globalAlpha = 1;
  }
}

function drawPaddle() {
  const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
  grad.addColorStop(0, '#8899ff');
  grad.addColorStop(1, '#3344cc');

  ctx.shadowColor = '#6677ff';
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = grad;

  // Rounded rect
  const r = paddle.h / 2;
  ctx.beginPath();
  ctx.moveTo(paddle.x + r, paddle.y);
  ctx.lineTo(paddle.x + paddle.w - r, paddle.y);
  ctx.arcTo(paddle.x + paddle.w, paddle.y, paddle.x + paddle.w, paddle.y + paddle.h, r);
  ctx.lineTo(paddle.x + r, paddle.y + paddle.h);
  ctx.arcTo(paddle.x, paddle.y + paddle.h, paddle.x, paddle.y, r);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur  = 0;
}

function drawBall() {
  // Outer glow
  const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.r * 2.5);
  glow.addColorStop(0, 'rgba(200,220,255,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  const grad = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.1, ball.x, ball.y, ball.r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#8899ff');
  ctx.shadowColor = '#aabbff';
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur  = 0;

  // "Stuck" hint
  if (ball.stuck) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE to launch', W / 2, paddle.y - 20);
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────

function loop() {
  if (state !== 'playing') return;

  movePaddle();
  moveBall();

  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();

  animId = requestAnimationFrame(loop);
}

// ─── Input ────────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    if (state === 'playing') launchBall();
  }
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// Touch / mouse controls
let touchActive = false;
canvas.addEventListener('mousemove', e => {
  if (state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  paddle.x   = clamp(mx - paddle.w / 2, 0, W - paddle.w);
  if (ball.stuck) ball.x = paddle.x + paddle.w / 2;
});

canvas.addEventListener('click', () => {
  if (state === 'playing') launchBall();
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const tx   = e.touches[0].clientX - rect.left;
  paddle.x   = clamp(tx - paddle.w / 2, 0, W - paddle.w);
  if (ball.stuck) ball.x = paddle.x + paddle.w / 2;
}, { passive: false });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'playing') launchBall();
}, { passive: false });

// Overlay button
overlayBtn.addEventListener('click', () => {
  if (state === 'idle') {
    // First start
    hideOverlay();
    state = 'playing';
    loop();
  } else if (state === 'win') {
    if (level < 5) {
      nextLevel();
    } else {
      startGame();
    }
  } else {
    // game over or any other state
    startGame();
  }
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

// Draw a static frame while on the start screen
function drawIdle() {
  drawBackground();
  if (bricks) drawBricks();
  if (paddle)  drawPaddle();
  if (ball)    drawBall();
}

initLevel();
drawIdle();
showOverlay('BREAKOUT', 'Use <strong>← →</strong> or <strong>A / D</strong> to move the paddle.<br>Press <strong>Space</strong> or tap to launch the ball.', 'START GAME');
updateHUD();
