Файл для функций которые могут использоваться/использовались/используются в игре

--------- Функция использованая для "слежки" камеры за змейкой и увеличения игрового мира (https://stackoverflow.com/questions/16919601/html5-canvas-camera-viewport-how-to-actually-do-it) ---------
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    ctx.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

    //Clamp the camera position to the world bounds while centering the camera around the player                                             
    var camX = clamp(-player.x + canvas.width/2, yourWorld.minX, yourWorld.maxX - canvas.width);
    var camY = clamp(-player.y + canvas.height/2, yourWorld.minY, yourWorld.maxY - canvas.height);

    ctx.translate( camX, camY );    

    //Draw everything
  }

--------- Старые координаты первого спавна еды ---------
  class Food {
    constructor() {
      this.pos = new helpers.Vec(
        // ~~(Math.floor(Math.random().toFixed(1) * cells) * cellSize), ----- V1
        // ~~(Math.floor(Math.random().toFixed(1) * cells) * cellSize) ----- V1
        // rand(cellSize * 2, window.innerWidth - cellSize * 3), ----- V2
        // rand(cellSize * 2, window.innerHeight - cellSize * 3) ----- V2
        // rand(dom_canvas.width - dom_canvas.width + (cellSize * 3), dom_canvas.width - cellSize * 3), ----- V3
        // rand(dom_canvas.height - dom_canvas.height + (cellSize * 3), dom_canvas.height - cellSize * 3) ----- V3
        rand(-window.innerWidth + (cellSize * 3), window.innerWidth - (cellSize * 3)),
        rand(window.innerHeight + (cellSize * 3), -window.innerHeight + (cellSize * 3))
      );
      this.color = currentHue = `hsl(${~~(Math.random() * 360)},100%,50%)`;
      this.size = cellSize;
    }
    draw() {
      let { x, y } = this.pos;
      
      // if (x > W - cellSize) {
      //   x = W / 2 - cellSize * 3;
      // }
      // if (y > H - cellSize) {
      //   y = H / 2 - cellSize * 3;
      // }
      for (let i = 0; i < 40; i++) {
        x = rand(-window.innerWidth + (cellSize * 3), window.innerWidth - (cellSize * 3));
        y = rand(window.innerHeight + (cellSize * 3), -window.innerHeight + (cellSize * 3));
        
        CTX.globalCompositeOperation = "lighter";
        CTX.shadowBlur = 20;
        CTX.shadowColor = this.color;
        CTX.fillStyle = this.color;
        CTX.fillRect(x, y, this.size, this.size);
        CTX.globalCompositeOperation = "source-over";
        CTX.shadowBlur = 0;
        this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
      }
    }

--------- Старые координаты последующего спавна еды ---------
  spawn() {
    // ~~(Math.floor((Math.random() * cells) * this.size)) ----- V1
    // rand(cellSize * 2, window.innerWidth - cellSize * 3) ----- V2
    let randX = rand(-window.innerWidth + (cellSize * 3), window.innerWidth - (cellSize * 3));
    let randY = rand(window.innerHeight + (cellSize * 3), -window.innerHeight + (cellSize * 3));
    
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

--------- Старые координаты спавна змейки ---------
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

--------- Старая функция окончания игры ---------
  function gameOver() {
    maxScore ? null : (maxScore = score);
    score > maxScore ? (maxScore = score) : null;
    window.localStorage.setItem("maxScore", maxScore);
    // CTX.fillStyle = "#4cffd7";
    // CTX.textAlign = "center";
    // CTX.font = "bold 30px Poppins, sans-serif";
    // CTX.fillText("GAME OVER", W / 2, H / 2);
    // CTX.font = "15px Poppins, sans-serif";
    // CTX.fillText(`SCORE   ${score}`, W / 2, H / 2 + 60);
    // CTX.fillText(`MAX SCORE   ${maxScore}`, W / 2, H / 2 + 80);
    const divOver = document.querySelector(".game-over");
    divOver.innerHTML = `
      <h1>GAME OVER</h1>
      <h4>SCORE - ${score}</h4>
      <h4>MAX SCORE - ${maxScore}</h4>
      <button id="reset-game" onclick="location.reload(); return false;">Restart The Game</button>
    `;
    divOver.style.display = "flex";
  }
