const grid = document.querySelector("#animation-grid");
const ratePicker = document.querySelector("#frame-rate");
const toggle = document.querySelector("#toggle");
let players = [];
let timer;
let paused = false;

async function loadManifest() {
  const response = await fetch("/manifest.json");
  if (!response.ok) {
    throw new Error("Failed to load preview manifest.");
  }
  const animations = await response.json();
  players = animations.map(({ name, frames }) => {
    const frameCount = frames.length;
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
    <div class="card-header">
      <h2>${name.replace("-", " ")}</h2>
      <span class="frame-count">${frameCount} frames</span>
    </div>
    <div class="comparison" aria-label="${name} layer comparison">
      <figure class="stage"><figcaption>Robot</figcaption><img data-layer="robot" alt="${name} robot animation frame" /></figure>
      <figure class="stage"><figcaption>Drone</figcaption><img data-layer="drone" alt="${name} drone animation frame" /></figure>
      <figure class="stage"><figcaption>Combined</figcaption><img data-layer="combined" alt="${name} combined animation frame" /></figure>
    </div>`;
    grid.append(card);
    return {
      name,
      frameCount,
      frames,
      frame: 0,
      images: {
        robot: card.querySelector('[data-layer="robot"]'),
        drone: card.querySelector('[data-layer="drone"]'),
        combined: card.querySelector('[data-layer="combined"]'),
      },
    };
  });
  players.forEach(render);
  start();
}

function render(player) {
  const filename = player.frames[player.frame];
  player.images.robot.src = `/source/${player.name}/robot/${filename}.png`;
  player.images.drone.src = `/source/${player.name}/drone/${filename}.png`;
  player.images.combined.src = `/source/${player.name}/${filename}.png`;
}

function start() {
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    players.forEach((player) => {
      player.frame = (player.frame + 1) % player.frameCount;
      render(player);
    });
  }, 1000 / Number(ratePicker.value));
}

ratePicker.addEventListener("change", start);
toggle.addEventListener("click", () => {
  paused = !paused;
  toggle.textContent = paused ? "Play" : "Pause";
  toggle.setAttribute("aria-pressed", String(paused));
  if (paused) {
    window.clearInterval(timer);
  } else {
    start();
  }
});

loadManifest().catch((error) => {
  document.body.innerHTML = `<p class="error">${error.message}</p>`;
});
