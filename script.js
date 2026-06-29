const POSTER_SIZE = {
  width: 1672,
  height: 941,
};

const supportsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function percent(value, total) {
  return `${(value / total) * 100}%`;
}

function placeCompanyCard(card) {
  const x = Number(card.dataset.x);
  const y = Number(card.dataset.y);
  const width = Number(card.dataset.w);
  const height = Number(card.dataset.h);
  const image = card.querySelector(".company-card-image");

  card.style.left = percent(x, POSTER_SIZE.width);
  card.style.top = percent(y, POSTER_SIZE.height);
  card.style.width = percent(width, POSTER_SIZE.width);
  card.style.height = percent(height, POSTER_SIZE.height);

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

document.querySelectorAll(".company-hotspot").forEach((card) => {
  placeCompanyCard(card);

  card.addEventListener("pointermove", (event) => updateTilt(card, event));
  card.addEventListener("pointerleave", () => resetTilt(card));
  card.addEventListener("blur", () => resetTilt(card));
});
