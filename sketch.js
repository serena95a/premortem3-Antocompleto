let sketch = (p) => {
  let bgImages = [];
  let glitchOverlay, wall;
  let blocks = [];
  let glitchMode = false;
  let glitchFrames = 0;
  let glitchLevel = 0;
  let maxBlocks = 7;
  let textureCache = [];
  let dx = 0, dy = 0;
  let invertMode = false;
  let invertTimer = 0;

  let isDead = false;
  let counter = 0;
  const MAX_TOUCHES = 50;

  let socket;
  let isSketch3Active = false;
  let sketch3Timer = 0;

  let clickedImages = [];
  let img1;
  let finalImage;
  let restartTimeoutId;

  // AUDIO
  let osc, noise;
  let isAudioStarted = false;

  const restartDelay = 2 * 60 * 1000;
  const imagePaths = [
    'mercadopago.png',
    'img1.png',
    'img1.png',
    'img1.png'
  ];

  p.preload = () => {
    glitchOverlay = p.loadImage('img_28.jpeg');
    wall = p.loadImage('wall2.gif');
    img1 = p.loadImage('img1.png');
    finalImage = p.loadImage('cargafinal.png');
    for (let path of imagePaths) {
      bgImages.push(p.loadImage(path));
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.colorMode(p.HSB, 360, 100, 100);
    p.rectMode(p.CORNER);
    p.noSmooth();

    socket = new WebSocket('wss://server-7di9.onrender.com');
    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
        if (data.type === "launchSketch3") {
            isSketch3Active = data.active;
            // Si Sketch 3 se activa, reiniciamos su temporizador
            if (isSketch3Active) {
                sketch3Timer = p.millis();
            }
        }
      } catch (e) {
        console.warn("Mensaje no JSON:", event.data);
      }
    };

    osc = new p5.Oscillator('square');
    osc.amp(0);
    osc.freq(440);
    osc.start();

    noise = new p5.Noise('white');
    noise.amp(0);
    noise.start();

    cacheTextures();
    for (let i = 0; i < 10; i++) blocks.push(new Block(p));
  };

  p.draw = () => {
    if (isSketch3Active) {
      runSketch3();
      // Opcional: Desactivar Sketch 3 después de un tiempo (ej. 5 segundos)
      if (p.millis() - sketch3Timer > 5000) {
        isSketch3Active = false;
        console.log("Sketch 3 desactivado automáticamente después de 5 segundos.");
      }
      return; // Sale de p.draw para no ejecutar el código del sketch principal
    }

    if (isDead) {
      p.image(finalImage, 0, 0, p.width, p.height);
      return;
    }

    if (!invertMode && p.random(1) < 0.03) {
      invertMode = true;
      invertTimer = p.int(p.random(10, 200));
    } else if (invertMode) {
      invertTimer--;
      if (invertTimer <= 0) invertMode = false;
    }

    if (invertMode) {
      p.push();
      p.blendMode(p.DIFFERENCE);
      p.background(255);
      p.pop();
    } else {
      if (glitchLevel < 5) p.image(glitchOverlay, 0, 0, p.width, p.height);
      else p.background(0, 0, 100);
    }

    if (glitchOverlay && glitchLevel < 20) {
      p.tint(50, 0, 100, 10 + glitchLevel * 1.5);
      p.image(glitchOverlay, 0, 0, p.width, p.height);
      p.noTint();
    }

    if (glitchMode && glitchFrames > 0) {
      p.translate(dx, dy);
      glitchFrames--;
    } else {
      glitchMode = false;
    }

    for (let pos of clickedImages) {
      p.image(img1, pos.x, pos.y, img1.width / 2, img1.height / 2);
    }

    for (let b of blocks) {
      b.display();
      b.move();
    }

    if (glitchMode) drawScanlines();
  };

  function runSketch3() {
    p.background(0);
    p.fill(0, 100, 100);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, 100 + 30 * p.sin(p.frameCount * 0.1));
    // La lógica de temporizador para desactivar se maneja en p.draw
  }

  p.touchStarted = () => {
    if (isDead) return false;

    if (!isAudioStarted) {
      p.userStartAudio();
      osc.start();
      noise.start();
      isAudioStarted = true;
    }

    if (counter < MAX_TOUCHES) {
      counter++;

      let oscVol = p.map(counter, 0, MAX_TOUCHES, 0.05, 0.2);
      osc.amp(oscVol, 0.1);
      let oscFreq = p.map(counter, 0, MAX_TOUCHES, 800, p.random(2000, 5000));
      osc.freq(oscFreq, 0.05);
      let noiseVol = p.map(counter, 0, MAX_TOUCHES, 0.05, 0.7);
      noise.amp(noiseVol, 0.1);
      noise.amp(noiseVol + 0.3, 0.01);
      noise.amp(noiseVol, 0.15, p.frameCount + 1);
      osc.freq(p.random(6000, 8000), 0.01);
      osc.freq(oscFreq, 0.15, p.frameCount + 1);

      glitchLevel = Math.min(glitchLevel + 1, 20);
      glitchMode = true;
      glitchFrames = 1 + glitchLevel;
      dx = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);
      dy = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);

      let newBlocks = Math.min(3 + glitchLevel, maxBlocks - blocks.length);
      for (let i = 0; i < newBlocks; i++) {
        blocks.push(new Block(p));
      }

      for (let b of blocks) {
        if (p.random(1) < 0.4) {
          b.rect_w = p.random(p.width * 0.03, p.width * 0.15);
          b.rect_h = p.random(p.height * 0.02, p.height * 0.1);
          b.y += p.random(-glitchLevel * 5, glitchLevel * 5);
          b.speed = p.random(3 + glitchLevel, 10 + glitchLevel * 2);
          b.texture = p.random(textureCache);
        }
      }

      clickedImages.push({
        x: p.random(-100, p.width + 100),
        y: p.random(-100, p.height + 100)
      });

      if (counter >= MAX_TOUCHES) {
        triggerDeath();
      }
    }

    return false;
  };

  function triggerDeath() {
    isDead = true;
    // --- NUEVA ADICIÓN: Desactivar Sketch 3 cuando el sketch principal "muere" ---
    isSketch3Active = false;
    // --- FIN DE NUEVA ADICIÓN ---

    if (isAudioStarted) {
      osc.stop();
      noise.stop();
      isAudioStarted = false;
    }
    restartTimeoutId = setTimeout(resetSketch, restartDelay);

    // --- NUEVA ADICIÓN: Comunicar al padre que el sketch está "muerto" ---
    window.parent.postMessage({ type: 'isDead', value: true }, '*');
    // --- FIN DE NUEVA ADICIÓN ---
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  function drawScanlines() {
    p.stroke(0, 0, 100, 4);
    for (let y = 0; y < p.height; y += 6) {
      p.line(0, y, p.width, y);
    }
  }

  function cacheTextures() {
    let cols = 5;
    let rows = 5;
    for (let img of bgImages) {
      let tw = img.width / cols;
      let th = img.height / rows;
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          let tex = img.get(x * tw, y * th, tw, th);
          textureCache.push(tex);
        }
      }
    }
  }

  class Block {
    constructor(p) {
      this.p = p;
      this.speed = p.random(3 + glitchLevel, 10 + glitchLevel * 2);
      this.rect_w = p.random(p.width * 0.04, p.width * 0.1);
      this.rect_h = p.random(p.height * 0.03, p.height * 0.08);
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.texture = p.random(textureCache);
    }

    display() {
      p.image(this.texture, this.x, this.y);
      if (glitchMode || glitchLevel === 15) {
        let copies = p.constrain(glitchLevel, 2, 3);
        let useDifference = (glitchLevel === 15);
        for (let i = 0; i < copies; i++) {
          let offsetX = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          let offsetY = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          p.tint(p.random(360), 80, 100, useDifference ? 60 : (20 + glitchLevel * 2));
          p.image(this.texture, this.x + offsetX, this.y + offsetY);
        }
        p.noTint();
      }
    }

    move() {
      this.y += this.speed;
      if (this.y > p.height + this.rect_h || this.y < -this.rect_h) {
        this.rect_w = p.random(p.width * 0.04, p.width * 0.1);
        this.rect_h = p.random(p.height * 0.03, p.height * 0.08);
        this.x = p.random(p.width);
        this.y = -this.rect_h;
        this.texture = p.random(textureCache);
      }
    }
  }

  function resetSketch() {
    console.log("Reiniciando sketch...");
    counter = 0;
    glitchLevel = 0;
    glitches = [];
    clickedImages = [];
    blocks = [];
    isDead = false;
    isAudioStarted = false;
    // --- NUEVA ADICIÓN: Asegurarse de que Sketch 3 esté desactivado al reiniciar ---
    isSketch3Active = false;
    // --- FIN DE NUEVA ADICIÓN ---
    osc.amp(0);
    noise.amp(0);
    for (let i = 0; i < 10; i++) blocks.push(new Block(p));
    p.loop();
    clearTimeout(restartTimeoutId);

    // --- NUEVA ADICIÓN: Comunicar al padre que el sketch ya no está "muerto" ---
    window.parent.postMessage({ type: 'isDead', value: false }, '*');
    // --- FIN DE NUEVA ADICIÓN ---
  }
};

new p5(sketch);