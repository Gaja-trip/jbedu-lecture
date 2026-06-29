const POSTER_SIZE = {
  width: 1672,
  height: 941,
};

const supportsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function percent(value, total) {
  return `${(value / total) * 100}%`;
}

function placePosterLayer(layer) {
  const x = Number(layer.dataset.x);
  const y = Number(layer.dataset.y);
  const width = Number(layer.dataset.w);
  const height = Number(layer.dataset.h);

  layer.style.left = percent(x, POSTER_SIZE.width);
  layer.style.top = percent(y, POSTER_SIZE.height);
  layer.style.width = percent(width, POSTER_SIZE.width);
  layer.style.height = percent(height, POSTER_SIZE.height);

  return { x, y, width, height };
}

function placeCompanyCard(card) {
  const { x, y, width, height } = placePosterLayer(card);
  const image = card.querySelector(".company-card-image");

  image.style.width = `${(POSTER_SIZE.width / width) * 100}%`;
  image.style.height = `${(POSTER_SIZE.height / height) * 100}%`;
  image.style.left = `${(-x / width) * 100}%`;
  image.style.top = `${(-y / height) * 100}%`;
}

function updateTilt(card, event) {
  if (supportsReducedMotion.matches) {
    return;
  }

  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  card.style.setProperty("--tilt-x", `${y * -10}deg`);
  card.style.setProperty("--tilt-y", `${x * 12}deg`);
}

function resetTilt(card) {
  card.style.setProperty("--tilt-x", "0deg");
  card.style.setProperty("--tilt-y", "0deg");
}

function updateTigerTilt(tiger, event) {
  if (supportsReducedMotion.matches) {
    return;
  }

  const rect = tiger.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  tiger.style.setProperty("--tiger-tilt-x", `${y * -4}deg`);
  tiger.style.setProperty("--tiger-tilt-y", `${x * 5}deg`);
}

function resetTigerTilt(tiger) {
  tiger.style.setProperty("--tiger-tilt-x", "0deg");
  tiger.style.setProperty("--tiger-tilt-y", "0deg");
}

document.querySelectorAll(".company-hotspot").forEach((card) => {
  placeCompanyCard(card);

  card.addEventListener("pointermove", (event) => updateTilt(card, event));
  card.addEventListener("pointerleave", () => resetTilt(card));
  card.addEventListener("blur", () => resetTilt(card));
});

document.querySelectorAll(".tiger-hotspot").forEach((tiger) => {
  placePosterLayer(tiger);

  tiger.addEventListener("pointermove", (event) => updateTigerTilt(tiger, event));
  tiger.addEventListener("pointerleave", () => resetTigerTilt(tiger));
  tiger.addEventListener("blur", () => resetTigerTilt(tiger));
});
