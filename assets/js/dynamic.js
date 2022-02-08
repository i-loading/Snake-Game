// Функция для вычисления случайного числа из 2х значений
let rand = function (min, max) {
  let k = Math.floor(Math.random() * (max - min) + min);
  return Math.round(k / cellSize) * cellSize;
};

// Функция для вычисления случайного числа из 3х значений
function clamp(value, min, max){
  if (value < min) return min;
  else if (value > max) return max;
  return value;
}

let dom_canvas = document.querySelector("#canvas");
let CTX = dom_canvas.getContext("2d");
let food_canvas = document.querySelector("#canvasFood");
let CTX2 = food_canvas.getContext("2d");
const W = (dom_canvas.width = food_canvas.width = window.innerWidth);
const H = (dom_canvas.height = food_canvas.height = window.innerHeight);
let dom_score = document.querySelector(".current-score");
dom_score.innerHTML = `<p>Score</p><h4>00</h4>`;

let snake,
  food,
  currentHue,
  cells = 82,
  cellSize,
  isGameOver = false,
  tails = [],
  score = 00,
  maxScore = window.localStorage.getItem("maxScore") || undefined,
  particles = [],
  splashingParticleCount = 20,
  cellsCount,
  requestID = undefined;

// Перемення, в которой есть функции-помощники
let helpers = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    mult(v) {
      if (v instanceof helpers.Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
      } else {
        this.x *= v;
        this.y *= v;
        return this;
      }
    }
  },
  // Функция для проверки столкновения змейки и яблока
  isCollision(v1, v2) {
    return Math.floor(v1.x) == Math.floor(v2.x) && Math.floor(v1.y) == Math.floor(v2.y);
  },
  // Функция сборщик мусорных частиц
  garbageCollector() {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].size <= 0) {
        particles.splice(i, 1);
      }
    }
  },
  // Функция для отрисовка фона в виде сетки
  drawGrid() {
    /* Ооооочень криво сделан фон игры. Придумать способ лучше */
    CTX.lineWidth = 1.5;
    CTX.strokeStyle = "#232332";
    CTX.shadowBlur = 0;
    // Правая нижняя часть
    for (let i = 1; i < cells; i++) {
      let f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
    // Левая нижняя часть
    for (let i = 0; i <= cells; i++) {
      let f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(-f, 0);
      CTX.lineTo(-f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(-W, f);
      CTX.stroke();
      CTX.closePath();
    }
    // Левая верхняя часть
    for (let i = 0; i < cells; i++) {
      let f = (-W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, -H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(-W, f);
      CTX.stroke();
      CTX.closePath();
    }
    // Правая верхняя
    for (let i = 0; i < cells; i++) {
      let f = (-W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(-f, 0);
      CTX.lineTo(-f, -H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
  },
  // Функция для получания случайного значение Hue
  randHue() {
    return ~~(Math.random() * 360);
  },
  // Функция конвертер из HSL в RGB
  hsl2rgb(hue, saturation, lightness) {
    if (hue == undefined) {
      return [0, 0, 0];
    }
    let chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    let huePrime = hue / 60;
    let secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

    huePrime = ~~huePrime;
    let red, green, blue;

    if (huePrime === 0) {
      red = chroma;
      green = secondComponent;
      blue = 0;
    } else if (huePrime === 1) {
      red = secondComponent;
      green = chroma;
      blue = 0;
    } else if (huePrime === 2) {
      red = 0;
      green = chroma;
      blue = secondComponent;
    } else if (huePrime === 3) {
      red = 0;
      green = secondComponent;
      blue = chroma;
    } else if (huePrime === 4) {
      red = secondComponent;
      green = 0;
      blue = chroma;
    } else if (huePrime === 5) {
      red = chroma;
      green = 0;
      blue = secondComponent;
    }

    let lightnessAdjustment = lightness - chroma / 2;
    red += lightnessAdjustment;
    green += lightnessAdjustment;
    blue += lightnessAdjustment;

    return [
      Math.round(red * 255),
      Math.round(green * 255),
      Math.round(blue * 255),
    ];
  },
  // ??? - нигде не используется
  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  },
};

// Вспомогательная функция для проверки нажатия стрелок на клавиатуре
let KEY = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
  resetState() {
    this.ArrowUp = false;
    this.ArrowRight = false;
    this.ArrowDown = false;
    this.ArrowLeft = false;
  },
  listen() {
    addEventListener(
      "keydown",
      (e) => {
        if (e.key === "ArrowUp" && this.ArrowDown) return;
        if (e.key === "ArrowDown" && this.ArrowUp) return;
        if (e.key === "ArrowLeft" && this.ArrowRight) return;
        if (e.key === "ArrowRight" && this.ArrowLeft) return;
        this[e.key] = true;
        Object.keys(this)
          .filter((f) => f !== e.key && f !== "listen" && f !== "resetState")
          .forEach((k) => {
            this[k] = false;
          });
      },
      false
    );
  },
};

// Класс Змейки
class Snake {
  constructor(i, type) {
    this.pos = new helpers.Vec(cellSize, cellSize);
    this.dir = new helpers.Vec(0, 0);
    this.type = type;
    this.index = i;
    this.delay = 5;
    this.size = W / cells;
    this.color = "white";
    this.history = [];
    this.total = 1;
  }
  // Функция отрисовки змейки(первоначальной и последующей)
  draw() {
    let { x, y } = this.pos;
    CTX.fillStyle = this.color;
    CTX.shadowBlur = 20;
    CTX.shadowColor = "rgba(255,255,255,.3 )";
    CTX.fillRect(x, y, this.size, this.size);
    CTX.shadowBlur = 0;
    if (this.total >= 2) {
      for (let i = 0; i < this.history.length - 1; i++) {
        let { x, y } = this.history[i];
        CTX.lineWidth = 1;
        CTX.fillStyle = "rgba(225,225,225,1)";
        CTX.fillRect(x, y, this.size, this.size);
      }
    }
  }
  // Функция для установки "границ" карты
  walls() {
    let { x, y } = this.pos;

    // Границы карты
    let flagOpt = false;
    if (x < 0 - cellSize && !flagOpt) {
      gameOver();
      flagOpt = true;
    }
    if (x > window.innerWidth && !flagOpt) {
      gameOver();
      flagOpt = true;
    }
    if (y > window.innerHeight && !flagOpt) {
      gameOver();
      flagOpt = true;
    }
    if (y < 0 - cellSize && !flagOpt) {
      gameOver();
      flagOpt = true;
    }
  }
  // Функция для реагирования на нажатие стрелок и изменения направления змейки
  controlls() {
    let dir = this.size;
    if (KEY.ArrowUp) {
      this.dir = new helpers.Vec(0, -dir);
    }
    if (KEY.ArrowDown) {
      this.dir = new helpers.Vec(0, dir);
    }
    if (KEY.ArrowLeft) {
      this.dir = new helpers.Vec(-dir, 0);
    }
    if (KEY.ArrowRight) {
      this.dir = new helpers.Vec(dir, 0);
    }
  }
  /*
    Функция для проверки столкновения с телом змейки

    UPD: работает странно, нужно будет пофиксить
  */
  selfCollision() {
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      if (helpers.isCollision(this.pos, p)) {
        isGameOver = true;
      }
    }
  }
  // Фукнция обновления(как loop)
  update() {
    this.walls();
    this.draw();
    this.controlls();
    if (!this.delay--) {
      // console.log("this.pos", this.pos,"food.pos", food.pos);
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        particleSplash();
        food.draw();
        this.total++;
      }
      this.history[this.total - 1] = new helpers.Vec(this.pos.x, this.pos.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.history[i] = this.history[i + 1];
      }
      this.pos.add(this.dir);
      this.delay = 5;
      this.total > 3 ? this.selfCollision() : null;
    }
  }
}

// Класс Еды
class Food {
  constructor() {
    this.pos = new helpers.Vec(
      rand(cellSize * 2, dom_canvas.width - cellSize * 2),
      rand(cellSize * 2, dom_canvas.height - cellSize * 2)
    );
    this.color = currentHue = `hsl(${~~(Math.random() * 360)},100%,50%)`;
    this.size = cellSize;
  }
  // Функция для отрисовки первого яблока на случайной точке на карте
  draw(count) {
    let { x, y } = this.pos;
    for (let i = 1; i <= count; i++) {
      x = rand(cellSize * 2, dom_canvas.width - cellSize * 2);
      y = rand(cellSize * 2, dom_canvas.height - cellSize * 2);
      
      CTX2.globalCompositeOperation = "lighter";
      CTX2.shadowBlur = 20;
      CTX2.shadowColor = this.color;
      CTX2.fillStyle = this.color;
      CTX2.fillRect(x, y, this.size, this.size);
      CTX2.globalCompositeOperation = "source-over";
      CTX2.shadowBlur = 0;
      this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
    }
  }
  // Функция для отрисовки последующих яблок на случайной точке на карте
  spawn() {
    // let randX = rand(cellSize * 2, food_canvas.width - cellSize * 2);
    // let randY = rand(cellSize * 2, food_canvas.height - cellSize * 2);
    // for (let path of snake.history) {
    //   if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
    //     return this.spawn();
    //   }
    // }
    // this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
    // this.pos = new helpers.Vec(randX, randY);
  }
}

// Класс Частиц
class Particle {
  constructor(pos, color, size, vel) {
    this.pos = pos;
    this.color = color;
    this.size = Math.abs(size / 2);
    this.ttl = 0;
    this.gravity = -0.2;
    this.vel = vel;
  }
  // Функция для отрисовки частиц после того как яблоко было съедено
  draw() {
    let { x, y } = this.pos;
    let hsl = this.color
      .split("")
      .filter((l) => l.match(/[^hsl()$% ]/g))
      .join("")
      .split(",")
      .map((n) => +n);
    let [r, g, b] = helpers.hsl2rgb(hsl[0], hsl[1] / 100, hsl[2] / 100);
    CTX.shadowColor = `rgb(${r},${g},${b},${1})`;
    CTX.shadowBlur = 0;
    CTX.globalCompositeOperation = "lighter";
    CTX.fillStyle = `rgb(${r},${g},${b},${1})`;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.globalCompositeOperation = "source-over";
  }
  // Фунция для анимации частиц (разлетание в разные стороны)
  update() {
    this.draw();
    this.size -= 0.3;
    this.ttl += 1;
    this.pos.add(this.vel);
    this.vel.y -= this.gravity;
  }
}

// Функция для увеличения счета
function incrementScore() {
  score++;
  dom_score.innerHTML = `<p>Score</p><h4>${score.toString().padStart(2, "0")}</h4>`;
}

// Функция для отрисовки анимации частиц
function particleSplash() {
  for (let i = 0; i < splashingParticleCount; i++) {
    let vel = new helpers.Vec(Math.random() * 6 - 3, Math.random() * 6 - 3);
    let position = new helpers.Vec(food.pos.x, food.pos.y);
    particles.push(new Particle(position, currentHue, food.size, vel));
  }
}

// Обнуление канваса
function clear() {
  CTX.clearRect(0, 0, W, H);
}

// Функция для инициализации главных параметров игры (создание змейки, создание еды, прослушка нажатия стрелок и т.п)
function initialize() {
  CTX.imageSmoothingEnabled = false; 
  KEY.listen();
  cellsCount = cells * cells;
  cellSize = W / cells;
  snake = new Snake();
  food = new Food();

  food.draw(20);
  loop();
}

// Функция для создания "цикла" игры
function loop() {
  clear();
  if (!isGameOver) {
    // requestID = setTimeout(loop, 1000 / 60);
    if (typeof requestID !== undefined) {
      requestID = window.requestAnimationFrame(loop);
    }
    // if(food.draw()) {
    //   window.cancelAnimationFrame(requestID);
    //   requestID = undefined;
    // }

    snake.update();
    helpers.drawGrid();
    for (let p of particles) {
      p.update();
    }
    helpers.garbageCollector();
    // clearTimeout(requestID);
  } else {
    clear();
    gameOver();
  }
}

// Функция для проверки окончания игры
function gameOver() {
  maxScore ? null : (maxScore = score);
  score > maxScore ? (maxScore = score) : null;
  window.localStorage.setItem("maxScore", maxScore);

  const divOver = document.querySelector(".game-over");
  const scoreTitle = document.querySelector(".score-title");
  const maxScoreTitle = document.querySelector(".max_score-title");
  const resetBtn = document.querySelector("#reset-game");
  scoreTitle.innerText = `SCORE - ${score}`;
  maxScoreTitle.innerText = `MAX SCORE - ${maxScore}`;
  divOver.style.display = "flex";

  resetBtn.onclick = function () { 
    window.location.reload();
    return false;
  }
}

// Функция обнуления игры, игрового поля и т.п
function reset() {
  dom_score.innerText = "00";
  score = "00";
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  clearTimeout(requestID);
  loop();
}

initialize();
