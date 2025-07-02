let sketch2 = (p) => {
  let imgs = [];
  let glitchTimer = 0;
  let pixelRes = 8;

  let osc, noise, filter;
  let audioStarted = false;
  let currentImg;

  p.preload = () => {
    imgs[0] = p.loadImage('placa1.jpg');
    imgs[1] = p.loadImage('placa2.jpg');
    imgs[2] = p.loadImage('placa3.jpg');
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noSmooth();
    p.pixelDensity(0.5);
    p5.disableFriendlyErrors = true;
    p.frameRate(5);
    p.userStartAudio();

    osc = new p5.Oscillator('square');
    osc.freq(200);
    osc.amp(0.15);
    osc.start();

    noise = new p5.Noise('white');
    noise.amp(0.25);
    noise.start();

    filter = new p5.LowPass();
    filter.freq(900);
    osc.disconnect();
    noise.disconnect();
    osc.connect(filter);
    noise.connect(filter);

    audioStarted = true;
  };

  p.draw = () => {
    currentImg = imgs[p.floor(p.random(imgs.length))];
    drawPixelated(currentImg);

    if (p.millis() > glitchTimer) {
      glitchWhiteLines();
      glitchCuts(currentImg);
      glitchScanLines();
      glitchStripes();
      glitchTimer = p.millis() + p.random(300, 700);

      if (audioStarted) {
        let freq = p.random(100, 777);
        let amp = p.random(0.1, 5);
        let filterFreq = p.random(300, 1000);

        osc.freq(freq, 0.5);
        osc.amp(amp, 5);
        noise.amp(amp + 2, 0.1);
        filter.freq(filterFreq);
      }
    }

    simulateScreenFracture();
  };

  function drawPixelated(img) {
    let smallW = p.width / pixelRes;
    let smallH = p.height / pixelRes;
    img.loadPixels();

    for (let y = 0; y < smallH; y++) {
      for (let x = 0; x < smallW; x++) {
        let sx = p.int(x * img.width / smallW);
        let sy = p.int(y * img.height / smallH);
        let idx = 4 * (sy * img.width + sx);
        let c = p.color(
          img.pixels[idx],
          img.pixels[idx + 1],
          img.pixels[idx + 2],
          img.pixels[idx + 3]
        );
        p.fill(c);
        p.rect(x * pixelRes, y * pixelRes, pixelRes, pixelRes);
      }
    }
  }

  function glitchWhiteLines() {
    let lines = p.int(p.random(2, 4));
    for (let i = 0; i < lines; i++) {
      let y = p.int(p.random(p.height));
      let h = p.int(p.random(2, 6));
      p.fill(255);
      p.noStroke();
      p.rect(0, y, p.width, h);
    }
  }

  function glitchCuts(img) {
    let cuts = p.int(p.random(1, 30));
    for (let i = 0; i < cuts; i++) {
      if (p.random() < 0.5) {
        let y = p.int(p.random(p.height));
        let h = p.int(p.random(4, 20));
        let offset = p.int(p.random(-60, 60));
        p.copy(img, 0, y, p.width, h, offset, y, p.width, h);
      } else {
        let x = p.int(p.random(p.width));
        let w = p.int(p.random(4, 20));
        let offset = p.int(p.random(-30, 30));
        p.copy(img, x, 0, w, p.height, x, offset, w, p.height);
      }
    }
  }

  function simulateScreenFracture() {
    let cols = 5;
    let rows = 10;
    let fragW = p.width / cols;
    let fragH = p.height / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = i * fragW;
        let y = j * fragH;
        let frag = p.get(x, y, fragW, fragH);
        p.push();
        p.translate(x + fragW / 2 + p.random(-3, 3), y + fragH / 2 + p.random(-3, 30));
        p.rotate(p.random(-p.PI / 60, p.PI / 60));
        p.image(frag, -fragW / 2, -fragH / 2);
        p.pop();
      }
    }
  }

  function glitchScanLines() {
    let lines = p.int(p.random(2, 5));
    for (let i = 0; i < lines; i++) {
      let y = p.int(p.random(p.height));
      let h = 2;
      let slice = p.get(0, y, p.width, h);
      p.push();
      p.tint(255, 0, 0);
      p.image(slice, p.random(-10, 10), y);
      p.tint(0, 255, 0);
      p.image(slice, p.random(-10, 10), y + 1);
      p.tint(0, 0, 255);
      p.image(slice, p.random(-10, 10), y + 2);
      p.pop();
    }
  }

  function glitchStripes() {
    let stripes = p.int(p.random(2, 6));
    for (let i = 0; i < stripes; i++) {
      let y = p.int(p.random(p.height));
      let h = p.int(p.random(2, 6));
      let stripe = p.get(0, y, p.width, h);
      p.push();
      p.translate(p.random(-20, 20), 0);
      p.image(stripe, 0, y, p.width * p.random(1.5, 3), h);
      p.pop();
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch2);
