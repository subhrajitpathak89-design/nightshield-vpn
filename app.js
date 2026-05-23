const connectButton = document.querySelector("#connectButton");
const connectText = document.querySelector("#connectText");
const connectionState = document.querySelector("#connectionState");
const connectionDetail = document.querySelector("#connectionDetail");
const connectionOrb = document.querySelector("#connectionOrb");
const serverSelect = document.querySelector("#serverSelect");
const serverName = document.querySelector("#serverName");
const serverMeta = document.querySelector("#serverMeta");
const downloadStat = document.querySelector("#downloadStat");
const uploadStat = document.querySelector("#uploadStat");
const timerStat = document.querySelector("#timerStat");
const ipStat = document.querySelector("#ipStat");
const settingsButton = document.querySelector("#settingsButton");
const settingsList = document.querySelector("#settingsList");
const statusChip = document.querySelector("#statusChip");
const signalStat = document.querySelector("#signalStat");
const locationCards = document.querySelectorAll(".location-card");

let connected = false;
let connectedSeconds = 0;
let statsTimer = null;

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function randomSpeed(min, max) {
  return `${(Math.random() * (max - min) + min).toFixed(1)} Mbps`;
}

function setServerDetails() {
  const [city, purpose, latency] = serverSelect.value.split("|");
  serverName.textContent = city;
  serverMeta.textContent = `${purpose} - ${latency} ms`;

  if (connected) {
    connectionDetail.textContent = `Secured through ${city}.`;
  }
}

function resetStats() {
  connectedSeconds = 0;
  downloadStat.textContent = "0.0 Mbps";
  uploadStat.textContent = "0.0 Mbps";
  timerStat.textContent = "00:00";
  ipStat.textContent = "Hidden";
  signalStat.textContent = "0%";
}

function updateStats() {
  connectedSeconds += 1;
  downloadStat.textContent = randomSpeed(72, 184);
  uploadStat.textContent = randomSpeed(18, 64);
  timerStat.textContent = formatTime(connectedSeconds);
  signalStat.textContent = `${Math.floor(Math.random() * 8) + 92}%`;
}

function setConnection(nextState) {
  connected = nextState;
  document.body.classList.toggle("connected", connected);
  document.body.classList.toggle("disconnected", !connected);
  connectButton.classList.toggle("disconnect", connected);
  connectText.textContent = connected ? "Disconnect" : "Connect";
  connectionState.textContent = connected ? "Connected" : "Disconnected";
  statusChip.textContent = connected ? "Protected" : "Idle";

  if (connected) {
    const city = serverSelect.value.split("|")[0];
    connectionDetail.textContent = `Secured through ${city}.`;
    ipStat.textContent = "10.42.18.9";
    updateStats();
    statsTimer = window.setInterval(updateStats, 1000);
  } else {
    connectionDetail.textContent = "Your traffic is not protected.";
    window.clearInterval(statsTimer);
    resetStats();
  }
}

connectButton.addEventListener("click", () => {
  setConnection(!connected);
});

serverSelect.addEventListener("change", setServerDetails);

locationCards.forEach((card) => {
  card.addEventListener("click", () => {
    locationCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    serverSelect.value = card.dataset.server;
    setServerDetails();
  });
});

settingsButton.addEventListener("click", () => {
  settingsList.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

connectionOrb.classList.add("ready");
document.body.classList.add("disconnected");
setServerDetails();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
