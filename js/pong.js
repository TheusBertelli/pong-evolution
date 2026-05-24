// CAPTURA DO DOM
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const pauseBtn = document.getElementById('pauseBtn');
const modeSelect = document.getElementById('modeSelect');
const styleSelect = document.getElementById('styleSelect'); 
const themeSelect = document.getElementById('themeSelect'); 
const maxScoreInput = document.getElementById('maxScoreInput');
const gameActions = document.getElementById('gameActions');

const howToPlayBtn = document.getElementById('howToPlayBtn');
const instructions = document.getElementById('instructions');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const modeDescription = document.getElementById('modeDescription'); 
const hud = document.getElementById('hud');
const mobileControls = document.getElementById('mobileControls');
const p2MobileControls = document.getElementById('p2MobileControls');

const p1TeleportCD = document.getElementById('p1TeleportCD');
const p1FreezeCD = document.getElementById('p1FreezeCD');
const p2PowerHUD = document.getElementById('p2PowerHUD');
const p2TeleportCD = document.getElementById('p2TeleportCD');
const p2FreezeCD = document.getElementById('p2FreezeCD');

const checkPoderes = document.getElementById('checkPoderes');
const checkSons = document.getElementById('checkSons');
const checkBloom = document.getElementById('checkBloom');
const checkAnimas = document.getElementById('checkAnimas');

// ESTADOS E VARIÁVEIS GLOBAIS
let gameMode = 'medio', gameStyle = 'classic';
let poderesAtivos = true, sonsAtivos = true, bloomAtivo = true, animasAtivas = true;
let running = false, isPaused = false, gameEnded = false, maxScore = 5;       

const paddleWidth = 10, defaultPaddleHeight = 85;
let leftY = (canvas.height - defaultPaddleHeight) / 2;
let rightY = (canvas.height - defaultPaddleHeight) / 2;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballVX = 4, ballVY = 3;
let keys = {};
let scoreLeft = 0, scoreRight = 0;

// GERENCIADOR DE TEMAS
let colorFg = "#ffffff", colorGelo = "rgba(0, 220, 255, 0.35)", colorBordaGelo = "#a5f3fc";
function atualizarCores() {
    document.body.className = `theme-${themeSelect.value}`;
    if (themeSelect.value === 'dark') { colorFg = "#ffffff"; colorGelo = "rgba(0, 220, 255, 0.35)"; colorBordaGelo = "#a5f3fc"; } 
    else if (themeSelect.value === 'light') { colorFg = "#1f2937"; colorGelo = "rgba(2, 132, 199, 0.3)"; colorBordaGelo = "#0284c7"; } 
    else if (themeSelect.value === 'retro') { colorFg = "#33ff33"; colorGelo = "rgba(51, 255, 51, 0.3)"; colorBordaGelo = "#33ff33"; }
}
themeSelect.addEventListener('change', atualizarCores);

// Atualização dinâmica da descrição no menu
styleSelect.addEventListener('change', () => {
    if(styleSelect.value === 'classic') modeDescription.innerHTML = "<strong>🟢 MODO CLÁSSICO:</strong><br>O bom e velho Pong de sempre. Use suas habilidades no tempo certo para enganar o adversário.";
    else if(styleSelect.value === 'chaos') modeDescription.innerHTML = "<strong>🔥 ORBES DE CAOS:</strong><br>Bata nas esferas flutuantes no meio da arena para ativar Surtos de Energia, Overclock de velocidade ou infectar o oponente com Nanovírus!";
    else if(styleSelect.value === 'collapse') modeDescription.innerHTML = "<strong>☣️ ZONA DE COLAPSO:</strong><br>As bordas do cenário vão se fechando progressivamente. Rebotes serão extremamente rápidos e mortais.";
    else if(styleSelect.value === 'trench') modeDescription.innerHTML = "<strong>🧱 TRINCHEIRA TÁTICA:</strong><br>Cada jogador possui uma parede de escudos. Mire nos blocos para abrir um buraco na defesa inimiga e marque o gol!";
});

// SISTEMA DE PARTÍCULAS E ALERTAS
let ballHistory = [], particles = [], uiAlerts = [];    
let shakeDuration = 0, shakeIntensity = 0;

function dispararScreenShake(duracao, intensidade) {
    if (!animasAtivas) return;
    shakeDuration = duracao; shakeIntensity = intensidade;
}

function criarParticulasHit(x, y, cor) {
    if (!animasAtivas) return;
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6 + (ballVX > 0 ? 2 : -2), vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 2.5 + 1, alpha: 1, color: cor
        });
    }
}

function criarAlertaHUD(texto, x, y, cor, duration = 120) {
    uiAlerts.push({ text: texto, x: x, y: y, color: cor, alpha: 1, timer: duration, maxTimer: duration });
}

function injetarGlow(cor, blurValue = 18) {
    if (bloomAtivo && themeSelect.value === 'dark') { ctx.shadowBlur = blurValue; ctx.shadowColor = cor; } else ctx.shadowBlur = 0;
}
function cortarGlow() { ctx.shadowBlur = 0; }

// MECÂNICAS BASE E PODERES
const cooldownTeleporte = 7500, cooldownFreeze = 11000, duracaoFreeze = 1500; 
let lastTeleportLeft = 0, lastTeleportRight = 0, efeitosVisuais = []; 
let lastFreezeLeft = 0, lastFreezeRight = 0, isFrozen = false, freezeEndTime = 0;
let savedBallVX = 0, savedBallVY = 0; 

// ESTRUTURAS DOS NOVOS MODOS
// Modo Orbes
let orb = { active: false, x: 0, y: 0, radius: 16, type: '', spawnTimer: 300 }; 
const ORB_TYPES = ['ult', 'speed', 'shrink'];
let lastHit = null, p1ShrinkTimer = 0, p2ShrinkTimer = 0;
// Modo Colapso
let colapsoSize = 0; 
// Modo Trincheira (Escudos)
let blocks = [];
function initBlocks() {
    blocks = [];
    let rows = 8, bw = 12; 
    let bh = (canvas.height - 40) / rows; 
    
    let startX1 = 80; // Defesa Esquerda
    let startX2 = canvas.width - 80 - bw; // Defesa Direita
    let startY = 20;

    for(let j=0; j<rows; j++) {
        blocks.push({x: startX1, y: startY + j*bh, w: bw, h: bh, active: true, color: "var(--p1-color)"});
        blocks.push({x: startX2, y: startY + j*bh, w: bw, h: bh, active: true, color: "var(--p2-color)"});
    }
}

function aplicarEfeitoOrbe(tipo, quemBateu) {
    dispararScreenShake(15, 6); criarParticulasHit(orb.x, orb.y, "#ffffff"); 
    let textX = quemBateu === 'left' ? canvas.width/4 : canvas.width*0.75;
    let textY = canvas.height/2 + 50;
    if (tipo === 'ult') {
        tocarSom('orb_ult');
        if (quemBateu === 'left') { lastTeleportLeft = 0; lastFreezeLeft = 0; }
        if (quemBateu === 'right') { lastTeleportRight = 0; lastFreezeRight = 0; }
        criarAlertaHUD("🌟 SURTO DE ENERGIA!", textX, textY, "#fbbf24");
    } else if (tipo === 'speed') {
        tocarSom('orb_speed');
        ballVX = (ballVX > 0 ? 1 : -1) * 16; ballVY = (ballVY > 0 ? 1 : -1) * 12;
        criarAlertaHUD("⚡ OVERCLOCK ATIVADO!", canvas.width/2, textY, "#ef4444");
    } else if (tipo === 'shrink') {
        tocarSom('orb_shrink');
        if (quemBateu === 'left') { p2ShrinkTimer = 360; criarAlertaHUD("🦠 NANOVÍRUS! (6s)", canvas.width*0.75, textY, "#a855f7"); }
        if (quemBateu === 'right') { p1ShrinkTimer = 360; criarAlertaHUD("🦠 NANOVÍRUS! (6s)", canvas.width/4, textY, "#a855f7"); }
    }
}

// SÍNTESE DE ÁUDIO
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tocarSom(tipo) {
    if (!sonsAtivos) return; 
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    
    if (tipo === 'teleport') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); 
    } else if (tipo === 'freeze') {
        osc.type = 'square'; osc.frequency.setValueAtTime(750, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.2); 
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2); 
    } else if (tipo === 'hitPaddle' || tipo === 'hitBlock') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(tipo === 'hitBlock' ? 600 : 450, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08); 
    } else if (tipo === 'hitWall') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(240, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08); 
    } else if (tipo === 'orb_ult') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1); osc.frequency.linearRampToValueAtTime(1400, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    } else if (tipo === 'orb_speed') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    } else if (tipo === 'orb_shrink') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    }
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

// INTELIGÊNCIA ARTIFICIAL E FÍSICA
let aiTargetY = canvas.height / 2, aiReactionTimer = 0, aiSpeed = 0;

function preverPosicaoY() {
  let distanciaX = (canvas.width - 20) - ballX; let tempoAteChegar = distanciaX / ballVX;
  let yPrevisto = ballY + (ballVY * tempoAteChegar);
  
  let limitTop = gameStyle === 'collapse' ? colapsoSize : 0;
  let limitBot = gameStyle === 'collapse' ? canvas.height - colapsoSize : canvas.height;

  while (yPrevisto < limitTop || yPrevisto > limitBot) {
    if (yPrevisto < limitTop) yPrevisto = limitTop + (limitTop - yPrevisto); 
    if (yPrevisto > limitBot) yPrevisto = limitBot - (yPrevisto - limitBot); 
  }
  return yPrevisto;
}

function getPaddleSizes() {
    let p1H = (gameStyle === 'chaos' && p1ShrinkTimer > 0) ? defaultPaddleHeight * 0.5 : defaultPaddleHeight;
    let p2H = (gameStyle === 'chaos' && p2ShrinkTimer > 0) ? defaultPaddleHeight * 0.5 : defaultPaddleHeight;
    return { p1H, p2H };
}

function processarInteligenciaArtificial() {
    let reactionDelay = 0; let errorMargin = 0;   
    if(gameMode === 'facil'){ reactionDelay = 45; aiSpeed = 3.6; errorMargin = 135; } 
    else if(gameMode === 'medio'){ reactionDelay = 22; aiSpeed = 3.6; errorMargin = 100; }
    else if(gameMode === 'dificil'){ reactionDelay = 4; aiSpeed = 3.6; errorMargin = 65; }

    if (ballVX > 0) { 
        if (aiReactionTimer <= 0) {
            aiTargetY = preverPosicaoY() + ((Math.random() * 2 - 1) * errorMargin); 
            aiReactionTimer = reactionDelay; 
        } else aiReactionTimer--;
    } else { aiTargetY = canvas.height / 2; aiReactionTimer = 0; }

    const { p2H } = getPaddleSizes();
    let centroRaqueteIA = rightY + (p2H / 2);
    if (centroRaqueteIA < aiTargetY - 10) rightY += aiSpeed; 
    else if (centroRaqueteIA > aiTargetY + 10) rightY -= aiSpeed;
}

// LOOP PRINCIPAL DE UPDATE
function update() {
  if (!running || isPaused || gameEnded) return;

  const { p1H, p2H } = getPaddleSizes();

  // Controles e Poderes P1
  if (keys['w'] || keys['W']) leftY -= 6;
  if (keys['s'] || keys['S']) leftY += 6;
  if (poderesAtivos && (keys['e'] || keys['E'])) {
      let agora = Date.now();
      if (agora - lastTeleportLeft >= cooldownTeleporte) {
          efeitosVisuais.push({ x: 10, y: leftY, alpha: 0.8, h: p1H }); 
          leftY = ballY - (p1H / 2); lastTeleportLeft = agora;
          tocarSom('teleport'); dispararScreenShake(8, 3);
      }
  }
  if (poderesAtivos && (keys['q'] || keys['Q']) && !isFrozen) {
      let agora = Date.now();
      if (agora - lastFreezeLeft >= cooldownFreeze) {
          isFrozen = true; freezeEndTime = agora + duracaoFreeze;
          savedBallVX = ballVX; savedBallVY = ballVY; ballVX = 0; ballVY = 0;
          lastFreezeLeft = agora; tocarSom('freeze');
      }
  }

  // Controles e Poderes P2 ou IA
  if (gameMode === '2p'){
    if(keys['ArrowUp']) rightY -= 6;
    if(keys['ArrowDown']) rightY += 6;
    if (poderesAtivos && keys['ArrowLeft']) {
        let agora = Date.now();
        if (agora - lastTeleportRight >= cooldownTeleporte) {
            efeitosVisuais.push({ x: canvas.width - 20, y: rightY, alpha: 0.8, h: p2H });
            rightY = ballY - (p2H / 2); lastTeleportRight = agora;
            tocarSom('teleport'); dispararScreenShake(8, 3);
        }
    }
    if (poderesAtivos && keys['ArrowRight'] && !isFrozen) {
        let agora = Date.now();
        if (agora - lastFreezeRight >= cooldownFreeze) {
            isFrozen = true; freezeEndTime = agora + duracaoFreeze;
            savedBallVX = ballVX; savedBallVY = ballVY; ballVX = 0; ballVY = 0;
            lastFreezeRight = agora; tocarSom('freeze');
        }
    }
  } else processarInteligenciaArtificial(); 

  // MODO: ZONA DE COLAPSO (Avanço do Gás Tóxico)
  if (gameStyle === 'collapse' && !isFrozen) {
      colapsoSize += 0.02; 
      if (colapsoSize > 160) colapsoSize = 160; 
  }

  // MODO: ORBES DE CAOS
  if (gameStyle === 'chaos') {
      if (p1ShrinkTimer > 0) p1ShrinkTimer--;
      if (p2ShrinkTimer > 0) p2ShrinkTimer--;

      if (!orb.active) {
          orb.spawnTimer--;
          if (orb.spawnTimer <= 0) {
              orb.x = canvas.width / 2 + (Math.random() * 100 - 50); 
              orb.y = 50 + Math.random() * (canvas.height - 100);
              orb.type = ORB_TYPES[Math.floor(Math.random() * ORB_TYPES.length)];
              orb.active = true;
          }
      } else {
          let dist = Math.hypot(ballX - orb.x, ballY - orb.y);
          if (dist < 8 + orb.radius && lastHit) {
              orb.active = false; orb.spawnTimer = 600; 
              aplicarEfeitoOrbe(orb.type, lastHit);
          }
      }
  }

  // Descongelamento
  if (isFrozen && Date.now() >= freezeEndTime) {
      isFrozen = false; ballVX = savedBallVX; ballVY = savedBallVY;
  }

  // Clamping de Posição das Raquetes
  let boundTop = gameStyle === 'collapse' ? colapsoSize : 0;
  let boundBot = gameStyle === 'collapse' ? canvas.height - colapsoSize : canvas.height;
  
  leftY = Math.max(boundTop, Math.min(boundBot - p1H, leftY));
  rightY = Math.max(boundTop, Math.min(boundBot - p2H, rightY));

  if (animasAtivas && !isFrozen) {
      ballHistory.push({ x: ballX, y: ballY });
      if (ballHistory.length > 7) ballHistory.shift();
  } else ballHistory = [];

  for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.035;
      if (p.alpha <= 0) particles.splice(i, 1);
  }
  
  for (let i = uiAlerts.length - 1; i >= 0; i--) {
      let alert = uiAlerts[i]; alert.timer--; alert.y -= 0.3; 
      alert.alpha = alert.timer / alert.maxTimer;
      if (alert.timer <= 0) uiAlerts.splice(i, 1);
  }

  ballX += ballVX; ballY += ballVY;

  // MODO TRINCHEIRA: Colisão Tática
  if (gameStyle === 'trench' && !isFrozen) {
      for (let b of blocks) {
          if (b.active) {
              if (ballX + 8 > b.x && ballX - 8 < b.x + b.w && ballY + 8 > b.y && ballY - 8 < b.y + b.h) {
                  b.active = false;
                  ballVX *= -1; 
                  tocarSom('hitBlock');
                  dispararScreenShake(6, 3);
                  criarParticulasHit(ballX, ballY, b.color);
                  break; 
              }
          }
      }
  }

  // Colisão com Teto/Chão
  if (ballY < boundTop + 8 || ballY > boundBot - 8) { 
      ballVY *= -1; 
      if (ballY < boundTop + 8) ballY = boundTop + 8;
      if (ballY > boundBot - 8) ballY = boundBot - 8;
      tocarSom('hitWall'); dispararScreenShake(5, 2); 
  }

  const aceleracao = 1.05, limiteVelocidade = 15; 
  if (ballX < 10 + paddleWidth && ballY > leftY && ballY < leftY + p1H && ballVX < 0) {
    ballVX *= -1; ballX = 10 + paddleWidth; lastHit = 'left'; 
    tocarSom('hitPaddle'); dispararScreenShake(10, 4); criarParticulasHit(ballX, ballY, "var(--p1-color)");
    if (Math.abs(ballVX) < limiteVelocidade) { ballVX *= aceleracao; ballVY *= aceleracao; }
  }
  if (ballX > canvas.width - 10 - paddleWidth && ballY > rightY && ballY < rightY + p2H && ballVX > 0) {
    ballVX *= -1; ballX = canvas.width - 10 - paddleWidth; lastHit = 'right'; 
    tocarSom('hitPaddle'); dispararScreenShake(10, 4); criarParticulasHit(ballX, ballY, "var(--p2-color)");
    if (Math.abs(ballVX) < limiteVelocidade) { ballVX *= aceleracao; ballVY *= aceleracao; }
  }

  if (ballX < 0) { scoreRight++; if (scoreRight >= maxScore) gameEnded = true; else resetBall(); } 
  else if (ballX > canvas.width) { scoreLeft++; if (scoreLeft >= maxScore) gameEnded = true; else resetBall(); }
}

// RENDERIZAÇÃO
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { p1H, p2H } = getPaddleSizes();
  const fontGame = getComputedStyle(document.body).getPropertyValue('--font-game');
  const fontUI = getComputedStyle(document.body).getPropertyValue('--font-ui');
  
  ctx.save();
  if (animasAtivas && shakeDuration > 0) {
      ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
      shakeDuration--;
  }

  // Zonas de Colapso Visual
  if (gameStyle === 'collapse') {
      ctx.fillStyle = "rgba(0, 255, 100, 0.15)";
      ctx.fillRect(0, 0, canvas.width, colapsoSize); 
      ctx.fillRect(0, canvas.height - colapsoSize, canvas.width, colapsoSize); 
      injetarGlow("#00ff66", 15);
      ctx.fillStyle = "#00ff66";
      ctx.fillRect(0, colapsoSize - 2, canvas.width, 2);
      ctx.fillRect(0, canvas.height - colapsoSize, canvas.width, 2);
      cortarGlow();
  }

  // Rastro da bola
  if (animasAtivas) {
      for (let i = 0; i < ballHistory.length; i++) {
          ctx.save(); ctx.globalAlpha = (i + 1) / (ballHistory.length + 2) * 0.35;
          injetarGlow("var(--fg-color)", 8); ctx.fillStyle = colorFg;
          ctx.beginPath(); ctx.arc(ballHistory[i].x, ballHistory[i].y, 6.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
      }
  }

  // Partículas
  for (let p of particles) {
      ctx.save(); ctx.globalAlpha = p.alpha; injetarGlow(p.color, 6);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
  }

  // Blocos Trincheira
  if (gameStyle === 'trench') {
      for (let b of blocks) {
          if (b.active) {
              injetarGlow(b.color, 12);
              ctx.fillStyle = b.color;
              ctx.globalAlpha = 0.8;
              ctx.fillRect(b.x, b.y + 1, b.w, b.h - 2); 
              ctx.globalAlpha = 1.0;
          }
      }
      cortarGlow();
  }

  // Raquetes
  ctx.fillStyle = colorFg;
  injetarGlow("var(--p1-color)", 15); ctx.fillRect(10, leftY, paddleWidth, p1H);
  injetarGlow("var(--p2-color)", 15); ctx.fillRect(canvas.width - 20, rightY, paddleWidth, p2H);
  
  // Rede
  cortarGlow(); ctx.fillStyle = colorFg;
  for (let y = 0; y < canvas.height; y += 20) ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);

  // Orbe
  if (gameStyle === 'chaos' && orb.active) {
      ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      let orbColor = '#fff';
      if (orb.type === 'ult') orbColor = '#fbbf24'; 
      if (orb.type === 'speed') orbColor = '#ef4444'; 
      if (orb.type === 'shrink') orbColor = '#a855f7'; 
      injetarGlow(orbColor, 20); ctx.fillStyle = orbColor; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); cortarGlow();
  }

  // Bola Principal
  injetarGlow(colorFg, 22);
  ctx.beginPath(); ctx.arc(ballX, ballY, 8, 0, Math.PI * 2); ctx.fill();
  if (isFrozen) {
      ctx.beginPath(); ctx.arc(ballX, ballY, 20, 0, Math.PI * 2);
      ctx.fillStyle = colorGelo; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = colorBordaGelo; ctx.stroke();
  }

  // Placar Numérico
  cortarGlow(); ctx.fillStyle = colorFg;
  ctx.font = "bold 42px " + fontGame; ctx.textAlign = "center";
  ctx.fillText(scoreLeft, canvas.width / 4, 50); ctx.fillText(scoreRight, canvas.width * 3 / 4, 50);

  // Textos HUD Interno
  ctx.font = "bold 14px " + fontUI;
  if (p1ShrinkTimer > 0) { ctx.fillStyle = "#a855f7"; ctx.fillText(`NANOVÍRUS: ${(p1ShrinkTimer/60).toFixed(1)}s`, canvas.width/4, 80); }
  if (p2ShrinkTimer > 0) { ctx.fillStyle = "#a855f7"; ctx.fillText(`NANOVÍRUS: ${(p2ShrinkTimer/60).toFixed(1)}s`, canvas.width*0.75, 80); }

  for (let alert of uiAlerts) {
      ctx.save(); ctx.globalAlpha = alert.alpha; ctx.fillStyle = alert.color;
      ctx.font = "bold 16px " + fontUI; ctx.fillText(alert.text, alert.x, alert.y); ctx.restore();
  }

  ctx.restore(); // Fim do Shake Render

  // HUD HTML Externo
  if (poderesAtivos) {
      let agora = Date.now();
      let tLeft = Math.max(0, (cooldownTeleporte - (agora - lastTeleportLeft)) / 1000);
      let fLeft = Math.max(0, (cooldownFreeze - (agora - lastFreezeLeft)) / 1000);
      p1TeleportCD.innerText = tLeft > 0 ? `Dash: ${tLeft.toFixed(1)}s` : "Dash: PRONTO"; p1TeleportCD.style.color = tLeft > 0 ? "var(--border-color)" : "var(--p1-color)";
      p1FreezeCD.innerText = fLeft > 0 ? `Congelar: ${fLeft.toFixed(1)}s` : "Congelar: PRONTO"; p1FreezeCD.style.color = fLeft > 0 ? "var(--border-color)" : "var(--p1-color)";

      if (gameMode === '2p') {
          p2PowerHUD.style.display = "block";
          let tRight = Math.max(0, (cooldownTeleporte - (agora - lastTeleportRight)) / 1000);
          let fRight = Math.max(0, (cooldownFreeze - (agora - lastFreezeRight)) / 1000);
          p2TeleportCD.innerText = tRight > 0 ? `Dash: ${tRight.toFixed(1)}s` : "Dash: PRONTO"; p2TeleportCD.style.color = tRight > 0 ? "var(--border-color)" : "var(--p2-color)";
          p2FreezeCD.innerText = fRight > 0 ? `Congelar: ${fRight.toFixed(1)}s` : "Congelar: PRONTO"; p2FreezeCD.style.color = fRight > 0 ? "var(--border-color)" : "var(--p2-color)";
      } else p2PowerHUD.style.display = "none";
  }

  for (let i = efeitosVisuais.length - 1; i >= 0; i--) {
      let e = efeitosVisuais[i]; ctx.save(); ctx.globalAlpha = e.alpha;
      ctx.fillStyle = "rgba(128, 128, 128, 0.4)"; ctx.fillRect(e.x, e.y, paddleWidth, e.h);
      ctx.restore(); e.alpha -= 0.05; if (e.alpha <= 0) efeitosVisuais.splice(i, 1); 
  }

  // Telas Finais Centralizadas
  if (isPaused && !gameEnded) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colorFg; ctx.font = "bold 48px " + fontGame; ctx.textAlign = "center";
      ctx.fillText("PAUSADO", canvas.width / 2, canvas.height / 2);
  }

  if (gameEnded) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colorFg; ctx.font = "bold 42px " + fontGame; ctx.textAlign = "center";
      let vencedor = scoreLeft >= maxScore ? "JOGADOR 1" : (gameMode === '2p' ? "JOGADOR 2" : "MÁQUINA");
      ctx.fillText(`${vencedor} VENCEU!`, canvas.width / 2, canvas.height / 2);
      ctx.font = "16px " + fontUI; ctx.fillText("Pressione MENU para reiniciar", canvas.width / 2, canvas.height / 2 + 50);
  }
}

function resetBall() {
  isFrozen = false; ballX = canvas.width / 2; ballY = canvas.height / 2;
  ballVX = 5 * (Math.random() > 0.5 ? 1 : -1); ballVY = 4 * (Math.random() > 0.5 ? 1 : -1);
  aiReactionTimer = 0; ballHistory = []; lastHit = null; colapsoSize = 0;
  orb.active = false; orb.spawnTimer = 300; p1ShrinkTimer = 0; p2ShrinkTimer = 0;
  
  if (gameStyle === 'trench') initBlocks(); 
}

function loop() { update(); if (running) draw(); requestAnimationFrame(loop); }

// LISTENERS
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

howToPlayBtn.addEventListener('click', () => { menu.style.display = 'none'; instructions.style.display = 'block'; });
closeInstructionsBtn.addEventListener('click', () => { instructions.style.display = 'none'; menu.style.display = 'flex'; });

pauseBtn.addEventListener('click', () => {
    if (gameEnded) return; 
    isPaused = !isPaused; pauseBtn.innerText = isPaused ? "CONTINUAR" : "PAUSAR";
});

startBtn.addEventListener('click', () => {
  gameMode = modeSelect.value; gameStyle = styleSelect.value;
  poderesAtivos = checkPoderes.checked; sonsAtivos = checkSons.checked;       
  bloomAtivo = checkBloom.checked; animasAtivas = checkAnimas.checked;
  maxScore = parseInt(maxScoreInput.value) || 5; 
  
  isPaused = false; gameEnded = false; pauseBtn.innerText = "PAUSAR";
  atualizarCores(); 
  
  if (gameStyle === 'trench') initBlocks();

  if (sonsAtivos && audioCtx.state === 'suspended') audioCtx.resume();
  if (gameMode === '2p') p2MobileControls.style.display = 'flex'; else p2MobileControls.style.display = 'none';

  menu.style.display = 'none'; canvas.style.display = 'block'; 
  gameActions.style.display = 'flex'; 
  if (poderesAtivos) hud.style.display = 'block'; 
  mobileControls.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  
  scoreLeft = 0; scoreRight = 0; resetBall();
  running = true; 
});

backBtn.addEventListener('click', () => {
  running = false; isPaused = false; gameEnded = false;
  menu.style.display = 'flex'; canvas.style.display = 'none'; 
  gameActions.style.display = 'none'; hud.style.display = 'none'; mobileControls.style.display = 'none';
  
  leftY = (canvas.height - defaultPaddleHeight)/2; rightY = (canvas.height - defaultPaddleHeight)/2;
  efeitosVisuais = []; particles = []; ballHistory = []; uiAlerts = [];
  lastTeleportLeft = 0; lastTeleportRight = 0; lastFreezeLeft = 0; lastFreezeRight = 0;
});

const touchBtns = document.querySelectorAll('.touch-btn');
touchBtns.forEach(btn => {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[btn.getAttribute('data-key')] = true; }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[btn.getAttribute('data-key')] = false; }, { passive: false });
});

window.addEventListener('resize', () => {
    if (running && window.innerWidth <= 768) mobileControls.style.display = 'flex';
    else if (window.innerWidth > 768) mobileControls.style.display = 'none';
});

atualizarCores(); loop();