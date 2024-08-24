/** @type {HTMLCanvasElement} */
window.addEventListener("load", () => {
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 720;
  let enemies = [];
  let score = 0;
  let gameOver = false;

  class InputHandler {
    constructor() {
      // keys will be added/removed from list as they are pressed
      this.keys = [];
      this.touchY = "";
      this.touchThreshold = 30;
      window.addEventListener("keydown", (evt) => {
        if ((evt.key === "ArrowDown" || 
            evt.key === "ArrowUp" || 
            evt.key === "ArrowLeft" || 
            evt.key === "ArrowRight") 
            && this.keys.indexOf(evt.key) === -1) {
          this.keys.push(evt.key);
        } else if (evt.key === "Enter" && gameOver) {
          restartGame();
        }
      });
      window.addEventListener("keyup", (evt) => {
        if (evt.key === "ArrowDown" || 
            evt.key === "ArrowUp" || 
            evt.key === "ArrowLeft" || 
            evt.key === "ArrowRight") {
          this.keys.splice(this.keys.indexOf(evt.key), 1);
        }
      });
      window.addEventListener("touchstart", (evt) => {
        this.touchY = evt.changedTouches[0].pageY;
      });
      window.addEventListener("touchmove", (evt) => {
        const swipeDistance = evt.changedTouches[0].pageY - this.touchY;
        if (swipeDistance < -this.touchThreshold && this.keys.indexOf("SwipeUp") === -1) this.keys.push("SwipeUp");
        else if (swipeDistance > this.touchThreshold && this.keys.indexOf("SwipeDown") === -1) {
          this.keys.push("SwipeDown");
          if (gameOver) restartGame();
        }
      });
      window.addEventListener("touchend", (evt) => { 
        this.keys.splice(this.keys.indexOf("SwipeUp"), 1);
        this.keys.splice(this.keys.indexOf("SwipeDown"), 1);
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.x = 0;
      this.y = this.gameHeight - this.height;
      this.image = playerImage;
      this.frameX = 0;
      this.frames = 8;
      this.frameY = 0;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 0;
      this.vy = 0;
      this.gravity = 1;
    }

    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.frames = 8;
      this.frameY = 0;
    }

    draw(ctx) {
      ctx.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
    }

    update(input, deltaTime, enemies) {
      // collision detection
      enemies.forEach((e) => {
        if (!(Math.hypot( // change below values to alter hitboxes
            ((e.x + e.width / 2 - 30) - (this.x + this.width / 2)), 
            ((e.y + e.width / 2) - (this.y + this.width / 2 + 20))) 
          > e.width / 3 + this.width / 3)) 
        gameOver = true;
      });

      // sprite animation
      if (this.frameTimer >= this.frameInterval) {
        if (this.frameX >= this.frames) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      // controls
      if (input.keys.indexOf("ArrowRight") > -1) {
        this.speed = 5;
      } else if (input.keys.indexOf("ArrowLeft") > -1) {
        this.speed = -5;
      } else {
        this.speed = 0;
      }
      if ((input.keys.indexOf("ArrowUp") > -1 || input.keys.indexOf("SwipeUp") > -1) && this.onGround()) {
        this.vy -= 32;
      }

      // horizontal movement
      this.x += this.speed;
      if (this.x < 0) this.x = 0;
      else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

      // vertical movement
      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.gravity;
        this.frames = 5;
        this.frameY = 1;
      } else {
        this.vy = 0;
        this.frames = 8;
        this.frameY = 0;
      }
      if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
    }

    onGround() {
      // returns true if the player is on the ground
      return this.y >= this.gameHeight - this.height;
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = backgroundImage;
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.height = 720;
      this.speed = 20;
    }

    restart() {
      this.x = 0;
    }

    draw(ctx) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      ctx.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
    }

    update(ctx) {
      this.x -= this.speed;
      if (this.x < 0 - this.width) this.x = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.image = enemyImage;
      this.x = this.gameWidth - this.width;
      this.y = this.gameHeight - this.height;
      this.frameX = 0;
      this.frames = 5;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.delete = false;
    }

    draw(ctx) {
      ctx.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
    }

    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.frames) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
      this.x -= this.speed;
      
      // deletion
      if (this.x < 0 - this.width) {
        this.delete = true;
        score++;
      }
    }
  }

  function handleEnemies(deltaTime) {
    let enemyInterval = 1500 + Math.random() * 1000;
    if (enemyTimer > enemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((e) => {
      e.draw(ctx);
      e.update(deltaTime);
    });
    enemies = enemies.filter((e) => !e.delete);
  }

  function displayStatusText(ctx) {
    ctx.textAlign = "left";
    ctx.font = "40px Helvetica";
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 20, 50);
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 22, 52);
    if (gameOver) {
      ctx.textAlign = "center";
      ctx.fillStyle = "black";
      ctx.fillText("GAME OVER", canvas.width / 2, 200);
      ctx.fillStyle = "white";
      ctx.fillText("GAME OVER", canvas.width / 2 + 2, 202);
      ctx.font = "30px Helvetica"
      ctx.fillStyle = "black";
      ctx.fillText("PRESS ENTER / SWIPE DOWN TO RESTART", canvas.width / 2, 250);
      ctx.fillStyle = "white";
      ctx.fillText("PRESS ENTER / SWIPE DOWN TO RESTART", canvas.width / 2 + 2, 252);
    }
  }

  function restartGame() {
    player.restart();
    bg.restart();
    enemies = [];
    score = 0;
    gameOver = false;
    animate(0);
  }
  
  function toggleFullscreen() {
    if (!document.fullscreenElement) canvas.requestFullscreen().catch((err) => {
      alert(`Error, can't enable fullscreen mode: \n${err.message}`);
    });
    else document.exitFullscreen();
  }
  fullScreenBtn.addEventListener("click", toggleFullscreen);

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const bg = new Background(canvas.width, canvas.height);

  let lastTime = 0;
  let enemyTimer = 0;

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bg.draw(ctx);
    bg.update(ctx);
    handleEnemies(deltaTime);
    player.draw(ctx);
    player.update(input, deltaTime, enemies);
    displayStatusText(ctx);

    if (!gameOver) requestAnimationFrame(animate);
  }
  animate(0);
});