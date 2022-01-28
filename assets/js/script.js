// Функция вычисления случайного числа между min и max
let rand = function (min, max) {
  let k = Math.floor(Math.random() * (max - min) + min);
  return Math.round(k / cellSize) * cellSize;
};

// Функция вычисления случайного значения. Принимает 3 аргумента: value, min и max
function clamp(value, min, max){
  if (value < min) return min;
  else if (value > max) return max;
  return value;
}

// ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ (присвоение им значения)
let dom_canvas = document.querySelector("#canvas");
let CTX = dom_canvas.getContext("2d");

const W = (dom_canvas.width = window.innerWidth);
const H = (dom_canvas.height = window.innerHeight);
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
  requestID;
// ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ (присвоение им значения)

// Перемення с Классом внутри, в котором есть функции-помощники
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
  // Функция сборщик мусорных частиц ???
  garbageCollector() {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].size <= 0) {
        particles.splice(i, 1);
      }
    }
  },
  // Функция для отрисовка фона в виде сетки
  drawGrid() {
    /*
    
      Ооооочень криво сделан фон игры. Придумать способ лучше

    */
    CTX.lineWidth = 2.5;
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

// Класс для Змейки
class Snake {
  constructor(i, type) {
    // this.pos = new helpers.Vec(cellSize * (cells / 2) - cellSize, cellSize * Math.floor(cells / 4)); // Старые координаты спавна змейки, возможно вернусь к ним
    this.pos = new helpers.Vec(-(cellSize * (cells / 2) - cellSize) + dom_canvas.width / 2, cellSize);
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
  /*
    Функция для установки "границ" карты

    UPD: сейчас используется как фукнция которая передвигает канвас в соответствии с позицией змейки; делает карту больше 
  */
  walls() {
    let { x, y } = this.pos;
    
    // context.setTransform(Горизонтальный масштаб, Горизонтальное скручивание, Вертикальное скручивание, Вертикальный масштаб, Горизонтальный сдвиг, Вертикальный сдвиг);
    CTX.setTransform(1, 0, 0, 1, 0, 0); // reset the transform matrix as it is cumulative
    CTX.clearRect(0, 0, dom_canvas.width, dom_canvas.height); // clear the viewport AFTER the matrix is reset

    // Clamp the camera position to the world bounds while centering the camera around the player
    let camX = clamp(-x + dom_canvas.width / 2, cellSize, window.innerWidth * 2 - dom_canvas.width);
    let camY = clamp(-y + dom_canvas.height / 2, cellSize, window.innerHeight * 2 - dom_canvas.height);
    CTX.translate( camX, camY );

    // if (x + cellSize > W) {
    //   this.pos.x = 0;
    // }
    // if (y + cellSize > H) {
    //   this.pos.y = 0;
    // }
    // if (x < 0) {
    //   this.pos.x = W - cellSize;
    // }
    // if (y < 0) {
    //   this.pos.y = H - cellSize - (window.innerHeight % cellSize);
    // }
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
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        particleSplash();
        food.spawn();
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

// Класс для Еды
class Food {
  constructor() {
    this.pos = new helpers.Vec(
      // ~~(Math.floor(Math.random().toFixed(1) * cells) * cellSize), ----- V1
      // ~~(Math.floor(Math.random().toFixed(1) * cells) * cellSize) ----- V1
      // rand(cellSize * 2, window.innerWidth - cellSize * 3), ----- V2
      // rand(cellSize * 2, window.innerHeight - cellSize * 3) ----- V2
      // rand(dom_canvas.width - dom_canvas.width + (cellSize * 3), dom_canvas.width - cellSize * 3), ----- V3
      // rand(dom_canvas.height - dom_canvas.height + (cellSize * 3), dom_canvas.height - cellSize * 3) ----- V3
      rand(-window.innerWidth + (cellSize * 3), window.innerWidth + (cellSize * 3)),
      rand(window.innerHeight + (cellSize * 3), -window.innerHeight + (cellSize * 3))
    );
    this.color = currentHue = `hsl(${~~(Math.random() * 360)},100%,50%)`;
    this.size = cellSize;
  }
  // Функция для отрисовки первого яблока на случайной точке на карте
  draw() {
    let { x, y } = this.pos;
    // console.log("x", x, "y", y);
    
    // if (x > W - cellSize) {
    //   x = W / 2 - cellSize * 3;
    // }
    // if (y > H - cellSize) {
    //   y = H / 2 - cellSize * 3;
    // }
    CTX.globalCompositeOperation = "lighter";
    CTX.shadowBlur = 20;
    CTX.shadowColor = this.color;
    CTX.fillStyle = this.color;
    CTX.fillRect(x, y, this.size, this.size);
    CTX.globalCompositeOperation = "source-over";
    CTX.shadowBlur = 0;
  }
  // Функция для отрисовки последующих яблок на случайной точке на карте
  spawn() {
    // ~~(Math.floor((Math.random() * cells) * this.size)) ----- V1
    // rand(cellSize * 2, window.innerWidth - cellSize * 3) ----- V2
    let randX = rand(-window.innerWidth + (cellSize * 3), window.innerWidth + (cellSize * 3));
    let randY = rand(window.innerHeight + (cellSize * 3), -window.innerHeight + (cellSize * 3));
    // console.log("x", randX, "y", randY);
    
    // if (randX > W - cellSize) {
    //   randX = W / 2 - cellSize * 3;
    // }
    // if (randY > H - cellSize) {
    //   randY = H / 2 - cellSize * 3;
    // }
    for (let path of snake.history) {
      if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
    this.pos = new helpers.Vec(randX, randY);
  }
}

// Класс для Частиц
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
  // dom_score.innerText = score.toString().padStart(2, "0");
}

// Функция для отрисовки анимации частиц
function particleSplash() {
  for (let i = 0; i < splashingParticleCount; i++) {
    let vel = new helpers.Vec(Math.random() * 6 - 3, Math.random() * 6 - 3);
    let position = new helpers.Vec(food.pos.x, food.pos.y);
    particles.push(new Particle(position, currentHue, food.size, vel));
  }
}

// Обнуление канваса ???
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
  // dom_replay.addEventListener("click", reset, false);
  loop();
}

// Функция для создания "цикла" игры
function loop() {
  clear(); 
  if (!isGameOver) {
    requestID = setTimeout(loop, 1000 / 60);
    snake.update();
    helpers.drawGrid();
    food.draw();
    for (let p of particles) {
      p.update();
    }
    helpers.garbageCollector();
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
  CTX.fillStyle = "#4cffd7";
  CTX.textAlign = "center";
  CTX.font = "bold 30px Poppins, sans-serif";
  CTX.fillText("GAME OVER", W / 2, H / 2);
  CTX.font = "15px Poppins, sans-serif";
  CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
  CTX.fillText(`MAX SCORE   ${maxScore}`, W / 2, H / 2 + 80);
}

// Функция обнуления игры, игрового поля и т.п
function reset() {
  // dom_score.innerText = "00";
  score = "00";
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  clearTimeout(requestID);
  loop();
}

initialize();
