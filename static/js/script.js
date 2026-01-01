const webcamBtn = document.getElementById("webcam-btn");
const webcamContainer = document.getElementById("webcam-container");
const closeWebcamBtn = document.getElementById("close-webcam-btn");
const controls = document.getElementById("controls");
const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

const previewImage = document.getElementById("preview-image");
const uploadForm = document.querySelector(".upload-form");
const detectBtn = document.getElementById("detect-btn");
const previewCanvas = document.getElementById("preview-canvas");
const previewCtx = previewCanvas.getContext("2d");

let hasFaceOnScreen = false;

let stream;
let detectionInterval;

const loading = document.getElementById("loading");

function showLoading() {
  loading.classList.remove("hidden");
  document.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
}

function hideLoading() {
  loading.classList.add("hidden");
  document.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
}

const dropZone = document.querySelector(".drop-zone");
const fileInput = dropZone.querySelector("input[type='file']");

["dragenter", "dragover"].forEach((event) => {
  dropZone.addEventListener(event, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((event) => {
  dropZone.addEventListener(event, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length) {
    fileInput.files = files;
    showPreview(files[0]);
  }
});

function showPreview(file) {
  previewCanvas.width = 0;
  previewCanvas.height = 0;
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  previewImage.src = URL.createObjectURL(file);
  document.getElementById("preview-container").style.display = "block";
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    showPreview(e.target.files[0]);
  }
});

document.getElementById("replace-btn").addEventListener("click", () => {
  fileInput.value = "";
  previewCanvas.width = 0;
  previewCanvas.height = 0;
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  document.getElementById("preview-container").style.display = "none";
});

detectBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) return;

  const minSpinnerTime = 500;
  const startTime = Date.now();
  showLoading();
  await new Promise(requestAnimationFrame);

  const file = fileInput.files[0];

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/detect-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const faces = data.faces || [];

    await new Promise((resolve) => {
      if (previewImage.complete) resolve();
      else previewImage.onload = resolve;
    });

    // Auto-resize canvas to match displayed image
    previewCanvas.width = previewImage.offsetWidth;
    previewCanvas.height = previewImage.offsetHeight;

    // Clear canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Draw bounding boxes
    faces.forEach((face) => {
      const box = face.bounding_box;
      const x = box.Left * previewCanvas.width;
      const y = box.Top * previewCanvas.height;
      const w = box.Width * previewCanvas.width;
      const h = box.Height * previewCanvas.height;

      previewCtx.strokeStyle = "#00e5ff";
      previewCtx.lineWidth = 3;
      previewCtx.strokeRect(x, y, w, h);

      previewCtx.fillStyle = "#00e5ff";
      previewCtx.font = "16px Segoe UI";
      previewCtx.fillText(
        `${face.name} (${face.confidence}%)`,
        x,
        y > 20 ? y - 5 : y + 20
      );
    });

    const elapsed = Date.now() - startTime;
    const remaining = minSpinnerTime - elapsed;
    setTimeout(hideLoading, remaining > 0 ? remaining : 0);
  } catch (err) {
    console.error("Image detection failed", err);
    hideLoading();
  }
});

// Start webcam
webcamBtn.addEventListener("click", async () => {
  const imageContainer = document.querySelector(".image-container");
  if (imageContainer) imageContainer.remove();

  controls.style.display = "none";
  webcamContainer.style.display = "block";

  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
  };
  showLoading();

  detectionInterval = setInterval(sendFrameForDetection, 700);
});

// Close webcam
closeWebcamBtn.addEventListener("click", () => {
  controls.style.display = "block";
  webcamContainer.style.display = "none";

  clearInterval(detectionInterval);

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;
  ctx.clearRect(0, 0, overlay.width, overlay.height);
});

// Webcam detection
async function sendFrameForDetection() {
  if (!stream || video.paused || video.ended) return;
  if (video.videoWidth === 0) return;

  try {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext("2d").drawImage(video, 0, 0);

    const imageBase64 = tempCanvas.toDataURL("image/jpeg");

    const formData = new FormData();
    formData.append("webcam_frame", imageBase64);

    const response = await fetch("/detect-webcam", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    drawResults(data);
  } catch (err) {
    console.error("Webcam detection failed", err);
  }
}

// Draw webcam boxes
function drawResults(data) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  // ❌ No faces
  if (!data.faces || data.faces.length === 0) {
    if (hasFaceOnScreen) {
      hasFaceOnScreen = false;
      showLoading(); // show "Detecting..."
    }
    return;
  }

  // ✅ Faces detected
  if (!hasFaceOnScreen) {
    hasFaceOnScreen = true;
    hideLoading(); // stop detecting animation
  }

  data.faces.forEach((face) => {
    const box = face.bounding_box;

    const x = box.Left * overlay.width;
    const y = box.Top * overlay.height;
    const w = box.Width * overlay.width;
    const h = box.Height * overlay.height;

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#00e5ff";
    ctx.font = "16px Segoe UI";
    ctx.fillText(
      `${face.name} (${face.confidence}%)`,
      x,
      y > 20 ? y - 6 : y + 18
    );
  });
}
