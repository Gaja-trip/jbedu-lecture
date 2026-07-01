const POSTER_SIZE = {
  width: 1672,
  height: 941,
};

const supportsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsTouchPreview = window.matchMedia("(hover: none), (pointer: coarse)");
const TOUCH_PREVIEW_CLASS = "is-touch-preview";
const TOUCH_PREVIEW_DURATION = 3200;
const SVG_NS = "http://www.w3.org/2000/svg";

let lastPointerType = "";
const touchPreviewTimers = new WeakMap();

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

function isTouchLikePointer(pointerType) {
  return pointerType === "touch" || pointerType === "pen";
}

function shouldUseTouchPreview(event) {
  if (event.detail === 0) {
    return false;
  }

  if (isTouchLikePointer(lastPointerType)) {
    return true;
  }

  return supportsTouchPreview.matches && lastPointerType !== "mouse";
}

function clearTouchPreview(layer) {
  const timer = touchPreviewTimers.get(layer);

  if (timer) {
    window.clearTimeout(timer);
    touchPreviewTimers.delete(layer);
  }

  layer.classList.remove(TOUCH_PREVIEW_CLASS);
}

function showTouchPreview(layer) {
  clearTouchPreview(layer);
  layer.classList.add(TOUCH_PREVIEW_CLASS);

  touchPreviewTimers.set(
    layer,
    window.setTimeout(() => {
      clearTouchPreview(layer);
    }, TOUCH_PREVIEW_DURATION),
  );
}

function getTouchPreviewTarget(event) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  return event.target.closest(".company-hotspot, .school-hotspot, .tiger-hotspot");
}

function clearOtherTouchPreviews(activeLayer) {
  document.querySelectorAll(`.${TOUCH_PREVIEW_CLASS}`).forEach((layer) => {
    if (layer !== activeLayer) {
      clearTouchPreview(layer);
    }
  });
}

function rememberPointerInput(event) {
  lastPointerType = event.pointerType || "";
  clearOtherTouchPreviews(getTouchPreviewTarget(event));
}

function rememberTouchInput(event) {
  lastPointerType = "touch";
  clearOtherTouchPreviews(getTouchPreviewTarget(event));
}

function setupTouchPreviewLink(link) {
  link.addEventListener("click", (event) => {
    if (!shouldUseTouchPreview(event)) {
      return;
    }

    if (link.classList.contains(TOUCH_PREVIEW_CLASS)) {
      clearTouchPreview(link);
      return;
    }

    event.preventDefault();
    showTouchPreview(link);
  });
}

function setupTouchPreviewTarget(target) {
  target.addEventListener("pointerdown", (event) => {
    if (isTouchLikePointer(event.pointerType)) {
      showTouchPreview(target);
    }
  });

  target.addEventListener("click", (event) => {
    if (shouldUseTouchPreview(event)) {
      showTouchPreview(target);
    }
  });
}

function createSvgCircle({ x, y, radius, color, delay, startX, startY }) {
  const dot = document.createElementNS(SVG_NS, "circle");

  dot.classList.add("drone-dot");
  dot.setAttribute("cx", x.toFixed(1));
  dot.setAttribute("cy", y.toFixed(1));
  dot.setAttribute("r", radius.toFixed(1));
  dot.style.setProperty("--drone-color", color);
  dot.style.setProperty("--drone-delay", `${Math.round(delay)}ms`);
  dot.style.setProperty("--start-x", `${Math.round(startX)}px`);
  dot.style.setProperty("--start-y", `${Math.round(startY)}px`);

  return dot;
}

function getDroneStartOffset(index, group) {
  const wave = Math.sin(index * 1.73) * 28;
  const side = index % 4;

  if (group === "flower") {
    return side < 2
      ? { startX: -190 + wave, startY: -42 + side * 94 }
      : { startX: 70 - wave, startY: -150 + side * 52 };
  }

  if (group === "branch") {
    return { startX: 180 - wave, startY: -96 + side * 46 };
  }

  return side < 2
    ? { startX: -110 + wave, startY: 145 - side * 58 }
    : { startX: 142 - wave, startY: 118 - side * 44 };
}

function pushDronePoint(points, group, x, y, color, delay, radius = 2.2) {
  const index = points.length;
  const { startX, startY } = getDroneStartOffset(index, group);

  points.push({ x, y, radius, color, delay, startX, startY });
}

function pushRing(points, group, cx, cy, rx, ry, count, color, delayBase, radius = 2.2, phase = 0) {
  for (let index = 0; index < count; index += 1) {
    const angle = phase + (Math.PI * 2 * index) / count;
    pushDronePoint(
      points,
      group,
      cx + Math.cos(angle) * rx,
      cy + Math.sin(angle) * ry,
      color,
      delayBase + index * 18,
      radius,
    );
  }
}

function pushLine(points, group, x1, y1, x2, y2, count, color, delayBase, radius = 2.2) {
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0 : index / (count - 1);
    pushDronePoint(
      points,
      group,
      x1 + (x2 - x1) * t,
      y1 + (y2 - y1) * t,
      color,
      delayBase + index * 22,
      radius,
    );
  }
}

function pushCubic(points, group, x1, y1, cx1, cy1, cx2, cy2, x2, y2, count, color, delayBase, radius = 2.2) {
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0 : index / (count - 1);
    const mt = 1 - t;
    const x = mt ** 3 * x1 + 3 * mt ** 2 * t * cx1 + 3 * mt * t ** 2 * cx2 + t ** 3 * x2;
    const y = mt ** 3 * y1 + 3 * mt ** 2 * t * cy1 + 3 * mt * t ** 2 * cy2 + t ** 3 * y2;

    pushDronePoint(points, group, x, y, color, delayBase + index * 24, radius);
  }
}

function buildSchoolDroneShow(school) {
  const container = school.querySelector("[data-drone-show]");

  if (!container || container.dataset.ready === "true") {
    return;
  }

  const points = [];
  const flowerColors = ["#ffffff", "#f5e8ff", "#d8c9ff", "#ffd8fb"];
  const flowerCenter = { x: 104, y: 72 };

  for (let petal = 0; petal < 9; petal += 1) {
    const petalAngle = -Math.PI / 2 + (Math.PI * 2 * petal) / 9;
    const petalX = flowerCenter.x + Math.cos(petalAngle) * 34;
    const petalY = flowerCenter.y + Math.sin(petalAngle) * 29;

    pushRing(
      points,
      "flower",
      petalX,
      petalY,
      13,
      9,
      8,
      flowerColors[petal % flowerColors.length],
      70 + petal * 42,
      2.1,
      petalAngle / 2,
    );
  }

  pushRing(points, "flower", flowerCenter.x, flowerCenter.y, 19, 14, 18, "#ffffff", 220, 2);
  pushRing(points, "flower", flowerCenter.x, flowerCenter.y, 7, 5, 10, "#ffe6ff", 340, 2.3);

  pushRing(points, "ribbon", 182, 127, 28, 22, 30, "#86a2ff", 480, 2.15, 0.2);
  pushRing(points, "ribbon", 223, 126, 29, 21, 30, "#6f8cff", 520, 2.15, -0.15);
  pushRing(points, "ribbon", 203, 130, 9, 7, 10, "#c8d4ff", 640, 2.35);
  pushLine(points, "ribbon", 202, 137, 162, 208, 17, "#6f8cff", 700, 2.2);
  pushLine(points, "ribbon", 205, 137, 241, 209, 17, "#8aa6ff", 735, 2.2);
  pushLine(points, "ribbon", 196, 138, 206, 198, 13, "#9fb4ff", 790, 2);

  pushCubic(points, "branch", 238, 91, 275, 48, 330, 55, 363, 76, 31, "#7dffd8", 920, 2);
  pushCubic(points, "branch", 239, 112, 280, 132, 326, 132, 364, 119, 27, "#6fffc7", 1000, 2);
  pushLine(points, "branch", 281, 76, 302, 49, 10, "#a8fff0", 1070, 1.9);
  pushLine(points, "branch", 289, 80, 318, 74, 11, "#bffff4", 1110, 1.9);
  pushLine(points, "branch", 300, 116, 332, 145, 13, "#86ffd9", 1160, 1.9);
  pushLine(points, "branch", 268, 105, 248, 132, 10, "#a8fff0", 1210, 1.9);

  points.forEach((point) => {
    container.appendChild(createSvgCircle(point));
  });

  container.dataset.ready = "true";
}

function createTigerSpark({
  x,
  y,
  size,
  color,
  accent,
  delay,
  scale,
  rotation,
  driftX = 0,
  driftY = 0,
  driftAltX = 0,
  driftAltY = 0,
  driftGlintX = 0,
  driftGlintY = 0,
  duration = 1120,
}) {
  const spark = document.createElement("span");

  spark.className = "tiger-spark tiger-spark-field";
  spark.setAttribute("aria-hidden", "true");
  spark.style.left = `${x}%`;
  spark.style.top = `${y}%`;
  spark.style.setProperty("--spark-size", `${size}px`);
  spark.style.setProperty("--spark-color", color);
  spark.style.setProperty("--spark-accent", accent);
  spark.style.setProperty("--spark-delay", `${delay}ms`);
  spark.style.setProperty("--spark-drift-alt-x", `${driftAltX.toFixed(1)}px`);
  spark.style.setProperty("--spark-drift-alt-y", `${driftAltY.toFixed(1)}px`);
  spark.style.setProperty("--spark-drift-glint-x", `${driftGlintX.toFixed(1)}px`);
  spark.style.setProperty("--spark-drift-glint-y", `${driftGlintY.toFixed(1)}px`);
  spark.style.setProperty("--spark-drift-x", `${driftX.toFixed(1)}px`);
  spark.style.setProperty("--spark-drift-y", `${driftY.toFixed(1)}px`);
  spark.style.setProperty("--spark-duration", `${duration}ms`);
  spark.style.setProperty("--spark-hover-scale", scale.toFixed(2));
  spark.style.setProperty("--spark-rest-scale", "0.22");
  spark.style.setProperty("--spark-rotation", `${rotation}deg`);

  return spark;
}

function buildTigerSparkField(tiger) {
  if (tiger.dataset.sparkFieldReady === "true") {
    return;
  }

  const palette = [
    ["#ff4bb3", "#ffd0ef"],
    ["#25e2ff", "#d6fbff"],
    ["#47f6a7", "#d9ffe8"],
    ["#ffe15d", "#fff4bc"],
    ["#9b5cff", "#ddd1ff"],
    ["#ff5a4f", "#ffe0db"],
    ["#5dff62", "#dcffde"],
    ["#4f7cff", "#d6e1ff"],
  ];
  const sparks = [
    [-12, 10, 34], [4, -2, 26], [22, 6, 38], [47, -3, 24], [70, 5, 34], [96, 9, 30],
    [-6, 27, 24], [15, 24, 30], [86, 25, 27], [108, 30, 38], [2, 43, 39], [98, 46, 42],
    [-10, 61, 28], [11, 64, 24], [88, 61, 32], [106, 69, 25], [0, 81, 35], [24, 88, 27],
    [51, 86, 32], [78, 88, 25], [98, 84, 36], [36, 16, 22], [62, 21, 26], [74, 39, 22],
    [29, 48, 20], [66, 55, 24], [41, 71, 21], [58, 74, 24],
  ];

  sparks.forEach(([x, y, size], index) => {
    const [color, accent] = palette[index % palette.length];
    const motionAngle = index * 2.399 + 0.4;
    const distance = 4 + (index % 5) * 1.7;
    const driftX = Math.cos(motionAngle) * distance;
    const driftY = Math.sin(motionAngle) * distance;

    tiger.appendChild(
      createTigerSpark({
        x,
        y,
        size,
        color,
        accent,
        delay: (index % 9) * 72,
        scale: 0.58 + (index % 5) * 0.09,
        rotation: -32 + ((index * 29) % 78),
        driftX,
        driftY,
        driftAltX: driftX * -0.42,
        driftAltY: driftY * 0.36,
        driftGlintX: Math.sin(motionAngle) * distance * 0.62,
        driftGlintY: Math.cos(motionAngle) * distance * -0.58,
        duration: 820 + (index % 6) * 115,
      }),
    );
  });

  tiger.dataset.sparkFieldReady = "true";
}

function cropPosterImage(image, { x, y, width, height }) {
  image.style.width = `${(POSTER_SIZE.width / width) * 100}%`;
  image.style.height = `${(POSTER_SIZE.height / height) * 100}%`;
  image.style.left = `${(-x / width) * 100}%`;
  image.style.top = `${(-y / height) * 100}%`;
}

function placeCroppedLayer(layer, imageSelector) {
  const dimensions = placePosterLayer(layer);
  const image = layer.querySelector(imageSelector);

  if (image) {
    cropPosterImage(image, dimensions);
  }
}

function placeCompanyCard(card) {
  placeCroppedLayer(card, ".company-card-image");
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

document.addEventListener("pointerdown", rememberPointerInput, {
  capture: true,
  passive: true,
});

document.addEventListener("touchstart", rememberTouchInput, {
  capture: true,
  passive: true,
});

document.querySelectorAll(".company-hotspot").forEach((card) => {
  placeCompanyCard(card);
  setupTouchPreviewLink(card);

  card.addEventListener("pointermove", (event) => updateTilt(card, event));
  card.addEventListener("pointerleave", () => resetTilt(card));
  card.addEventListener("blur", () => resetTilt(card));
});

document.querySelectorAll(".tiger-hotspot").forEach((tiger) => {
  placePosterLayer(tiger);
  buildTigerSparkField(tiger);
  setupTouchPreviewTarget(tiger);

  tiger.addEventListener("pointermove", (event) => updateTigerTilt(tiger, event));
  tiger.addEventListener("pointerleave", () => resetTigerTilt(tiger));
  tiger.addEventListener("blur", () => resetTigerTilt(tiger));
});

document.querySelectorAll(".school-hotspot").forEach((school) => {
  placePosterLayer(school);
  buildSchoolDroneShow(school);
  setupTouchPreviewLink(school);
});
