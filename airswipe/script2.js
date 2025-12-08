import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

let handLandmarker;
let slides = [];
let slideIndex = 0;
let canChange = true;

const slideDiv = document.getElementById("slide");
const startBtn = document.getElementById("startBtn");
const slidesInput = document.getElementById("slidesInput");
const inputContainer = document.getElementById("inputContainer");
const fontSizeInput = document.getElementById("fontSizeInput");
const colorInput = document.getElementById("colorInput");

// Iniciar presentación
startBtn.addEventListener("click", () => {
  const lines = slidesInput.value.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    alert("Ingresá al menos una diapositiva.");
    return;
  }
  slides = lines;
  slideIndex = 0;

  // Aplicar estilos del usuario
  slideDiv.style.fontSize = fontSizeInput.value + "px";
  slideDiv.style.color = colorInput.value;

  showSlide();
  inputContainer.style.display = "none";
  initHand();
});

function showSlide() {
  slideDiv.style.opacity = 0;
  slideDiv.style.transform = "translate(-50%, -55%)";

  setTimeout(() => {
    slideDiv.textContent = slides[slideIndex];
    slideDiv.style.opacity = 1;
    slideDiv.style.transform = "translate(-50%, -50%)";
  }, 300);
}

function changeSlide(delta) {
  slideIndex += delta;
  if (slideIndex < 0) slideIndex = 0;
  if (slideIndex >= slides.length) slideIndex = slides.length - 1;
  showSlide();
}

// Conteo de dedos preciso
function countFingersPrecise(landmarks) {
  if (!landmarks) return 0;
  let count = 0;
  const MARGIN = 0.02;
  if (landmarks[8].y + MARGIN < landmarks[6].y) count++;
  if (landmarks[12].y + MARGIN < landmarks[10].y) count++;
  if (landmarks[16].y + MARGIN < landmarks[14].y) count++;
  if (landmarks[20].y + MARGIN < landmarks[18].y) count++;
  if (landmarks[4].x > landmarks[3].x + MARGIN) count++;
  return count;
}

// Inicialización HandLandmarker
async function initHand() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "./hand/hand_landmarker.task"
    },
    numHands: 1
  });

  const video = document.getElementById("webcam");
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.style.transform = "scaleX(1)";
  video.onloadeddata = () => loop();
}

// Loop principal
async function loop() {
  const video = document.getElementById("webcam");
  const result = await handLandmarker.detect(video);

  if (result.landmarks && result.landmarks.length > 0 && canChange) {
    const fingers = countFingersPrecise(result.landmarks[0]);

    if (fingers === 1) {
      changeSlide(1);
      blockChange();
    } else if (fingers === 2) {
      changeSlide(-1);
      blockChange();
    }
  }

  requestAnimationFrame(loop);
}

// Cooldown
function blockChange() {
  canChange = false;
  setTimeout(() => { canChange = true; }, 700);
}
