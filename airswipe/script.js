const video = document.getElementById("cam");
const object = document.getElementById("object");

// suavizado
let smoothFactor = 0.25;
let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
let currentX = targetX;
let currentY = targetY;

// rotación
let rotation = 0;
let lastHandX = null;

// gestos
let grabbing = false;
let isFist = false;
let isOpen = false;

// ---------------------------
// utilidades
// ---------------------------
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function detectPinch(hand) {
  return dist(hand[4], hand[8]) < 0.06;
}

function detectFist(hand) {
  const tips = [8, 12, 16, 20];
  const mcp = [5, 9, 13, 17];
  let folded = 0;

  for (let i = 0; i < tips.length; i++) {
    if (hand[tips[i]].y > hand[mcp[i]].y) folded++;
  }
  return folded >= 3;
}

function detectOpen(hand) {
  const tips = [8, 12, 16, 20];
  const mcp = [5, 9, 13, 17];
  let extended = 0;

  for (let i = 0; i < tips.length; i++) {
    if (hand[tips[i]].y < hand[mcp[i]].y) extended++;
  }
  return extended >= 3;
}

// ---------------------------
// tracking principal
// ---------------------------
function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0)
    return;

  const hand = results.multiHandLandmarks[0];

  const pinch = detectPinch(hand);
  const fist = detectFist(hand);
  const open = detectOpen(hand);

  // cambio de estados
  if (pinch && !grabbing) {
    grabbing = true;
    object.style.boxShadow = "0 0 30px #4ee1a1";
    object.style.transform = `scale(0.9) rotate(${rotation}deg)`;
  }

  if (!pinch && grabbing) {
    grabbing = false;
    object.style.boxShadow = "0 12px 40px rgba(0,0,0,0.45)";
    object.style.transform = `scale(1) rotate(${rotation}deg)`;
  }

  if (fist) {
    object.style.transform = `scale(0.6) rotate(${rotation}deg)`;
    object.style.boxShadow = "0 0 35px red";
  }

  if (open) {
    object.style.boxShadow = "0 0 35px #00a2ff";

    // rotación suave según movimiento horizontal de la mano
    const handX = hand[9].x * window.innerWidth;
    if (lastHandX !== null) {
      const delta = handX - lastHandX;
      rotation += delta * 0.2; // ajustar velocidad
    }
    lastHandX = handX;

    object.style.transform = `scale(1.2) rotate(${rotation}deg)`;
  }

  if (!open) {
    lastHandX = null; // reiniciar rotación cuando se suelta la mano abierta
  }

  // posición de la mano
  const rx = hand[9].x * window.innerWidth;
  const ry = hand[9].y * window.innerHeight;

  const handX = window.innerWidth - rx; // invertir horizontal
  const handY = ry;

  // mover solo si está agarrando
  if (grabbing) {
    targetX = handX;
    targetY = handY;
  }
}

// ---------------------------
// animación suave
// ---------------------------
function animate() {
  currentX += (targetX - currentX) * smoothFactor;
  currentY += (targetY - currentY) * smoothFactor;

  object.style.left = currentX + "px";
  object.style.top = currentY + "px";

  requestAnimationFrame(animate);
}
animate();

// MediaPipe
const hands = new Hands({
  locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.65,
});

hands.onResults(onResults);

// cámara
const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});
cam.start();
