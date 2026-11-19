const canvas = document.querySelector('#specimen');
const context = canvas.getContext('2d');
const specimen = document.createElement('canvas');
specimen.width = canvas.width;
specimen.height = canvas.height;
const tissue = specimen.getContext('2d');

const prediction = new Path2D('M 250 259 C 222 214 269 145 332 145 C 389 140 413 99 471 122 C 510 137 511 186 559 189 C 610 186 659 198 671 241 C 686 292 647 315 618 343 C 593 366 594 421 552 443 C 508 465 478 439 435 444 C 374 454 346 423 342 382 C 337 338 289 330 262 299 C 252 286 254 271 250 259 Z');
const revision = new Path2D('M 269 249 C 250 207 276 165 336 161 C 380 156 419 117 463 136 C 501 151 493 198 553 205 C 599 208 639 210 651 237 C 675 285 630 309 602 331 C 568 357 581 400 540 423 C 505 444 484 418 438 429 C 393 441 362 413 358 378 C 353 339 337 325 306 308 C 280 294 265 274 269 249 Z M 703 342 C 729 318 770 324 784 351 C 806 393 765 412 732 403 C 701 393 687 366 703 342 Z');

const views = {
  source: {
    label: '原图',
    description: '查看合成显微视野，先观察组织纹理和边界。',
  },
  prediction: {
    label: '模型分割',
    description: '模型分割视图叠加候选轮廓，便于逐处核查边界。',
    path: prediction,
    color: '213, 255, 151',
  },
  revision: {
    label: '人工修订',
    description: '对照候选轮廓，复核后收紧主区域的边界，并补画右侧区域。',
    path: revision,
    color: '152, 244, 255',
  },
};

const controls = [...document.querySelectorAll('[data-view]')];
const opacity = document.querySelector('#opacity');
const opacityValue = document.querySelector('#opacity-value');
const stageLabel = document.querySelector('#stage-label');
const viewDescription = document.querySelector('#view-description');
let currentView = 'prediction';
let seed = 1527;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function paintSpecimen() {
  const { width, height } = specimen;
  tissue.fillStyle = '#e7abc9';
  tissue.fillRect(0, 0, width, height);

  for (let patch = 0; patch < 125; patch++) {
    const x = random() * width;
    const y = random() * height;
    const radius = 18 + random() * 175;
    const light = random() > .55;
    const wash = tissue.createRadialGradient(x, y, 0, x, y, radius);
    const color = light ? '255, 239, 247' : '171, 61, 132';
    wash.addColorStop(0, `rgba(${color}, ${.14 + random() * .43})`);
    wash.addColorStop(1, `rgba(${color}, 0)`);
    tissue.fillStyle = wash;
    tissue.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  tissue.fillStyle = '#9950854f';
  tissue.fill(revision);
  tissue.strokeStyle = '#b6528740';
  tissue.lineWidth = 11;
  tissue.stroke(revision);

  for (let fiber = 0; fiber < 525; fiber++) {
    const x = random() * width;
    const y = random() * height;
    const length = 15 + random() * 58;
    const fold = Math.sin(x / 92 + y / 65) * 27;
    tissue.strokeStyle = random() > .52 ? '#ffe7ef51' : '#9e4b8325';
    tissue.lineWidth = 1 + random() * 4;
    tissue.beginPath();
    tissue.moveTo(x, y);
    tissue.quadraticCurveTo(x + length * .35, y + fold, x + length, y + fold * .55);
    tissue.stroke();
  }

  for (let cell = 0; cell < 9800; cell++) {
    const x = random() * width;
    const y = random() * height;
    const dense = tissue.isPointInPath(revision, x, y);
    const density = .42 + .16 * Math.sin(x / 40 + Math.sin(y / 41));
    if (!dense && random() > density) continue;
    const radius = 1.1 + random() * (dense ? 3.15 : 2.6);
    const angle = Math.sin(x / 73 + y / 98) + random();
    tissue.beginPath();
    tissue.ellipse(x, y, radius * (1.3 + random() * .5), radius, angle, 0, Math.PI * 2);
    tissue.fillStyle = dense ? '#f6c4e64e' : '#f9b9de44';
    tissue.fill();
    tissue.beginPath();
    tissue.ellipse(x + .2, y - .25, radius * 1.03, radius * .58, angle, 0, Math.PI * 2);
    tissue.fillStyle = `rgba(64, 22, 85, ${.28 + random() * (dense ? .56 : .40)})`;
    tissue.fill();
  }
}

function drawView() {
  const view = views[currentView];
  const strength = opacity.valueAsNumber / 100;
  context.drawImage(specimen, 0, 0);
  if (view.path && strength > 0) {
    context.fillStyle = `rgba(${view.color}, ${.42 * strength})`;
    context.fill(view.path);
    context.save();
    context.strokeStyle = `rgba(${view.color}, ${strength})`;
    context.lineWidth = 4;
    context.shadowColor = '#1e142a';
    context.shadowBlur = 4;
    context.stroke(view.path);
    context.restore();
  }
  opacityValue.textContent = opacity.disabled ? '—' : `${opacity.value}%`;
  const visible = view.path && strength > 0;
  canvas.setAttribute('aria-label', `合成病理视野，${visible ? `显示${view.label}的示意轮廓` : '显示原图'}`);
}

function selectView(nextView) {
  currentView = nextView;
  const view = views[currentView];
  for (const button of controls) {
    button.setAttribute('aria-pressed', String(button.dataset.view === currentView));
  }
  opacity.disabled = !view.path;
  stageLabel.textContent = view.label;
  viewDescription.textContent = view.description;
  drawView();
}

paintSpecimen();
selectView(currentView);
for (const button of controls) {
  button.addEventListener('click', () => selectView(button.dataset.view));
}
opacity.addEventListener('input', drawView);
