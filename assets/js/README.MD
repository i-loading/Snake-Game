Файл для функций которые могут использоваться/используются в игре

Функция использованая для "слежки" камеры за змейкой и увеличения игрового мира (https://stackoverflow.com/questions/16919601/html5-canvas-camera-viewport-how-to-actually-do-it):
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
    ctx.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

    //Clamp the camera position to the world bounds while centering the camera around the player                                             
    var camX = clamp(-player.x + canvas.width/2, yourWorld.minX, yourWorld.maxX - canvas.width);
    var camY = clamp(-player.y + canvas.height/2, yourWorld.minY, yourWorld.maxY - canvas.height);

    ctx.translate( camX, camY );    

    //Draw everything
  }