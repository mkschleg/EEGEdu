export default function sketchFlash (p) {

  // let delta = 0;
  // let theta = 0;
  // let alpha = 0;
  // let beta = 0;
  // let gamma = 0;
  let freq = 4
  let delay = 1000/freq;
  let freqSlider;

  let DOMoffset = 1050; // Place the DOM elements underneath the canvas when we want to download the canvas
  let DOMgap = 5; // Gap between the DOM elements
  let leftGap = 200;

  freqSlider = p.createSlider(1, 20, 2, 1);
  freqSlider.position(leftGap + DOMgap, DOMoffset + freqSlider.height * 0 + 1 * DOMgap);
  
  let x = 0;
  let startTime = 0;
  let newOnset = true;
  

  p.setup = function () {
    p.createCanvas(300, 300);
    p.frameRate(60);
  };

  p.windowResized = function() {
    p.createCanvas(300, 300);
  }


  p.mousePressed = function () {
    p.background(256);
  }

  p.draw = function () {
    p.background(255);
    freq = freqSlider.value()
    delay = 1000/freq;
    
    x = x+1;
    if ((p.millis() - startTime) > delay) {
      newOnset = true;
    } else {
      newOnset = false;
    }
    if (newOnset) {
      p.fill(0, 0, 0);
      startTime = p.millis();  
    } else {
      p.fill(255, 255, 255);
    }
    p.noStroke();
    p.ellipse(p.width/2, p.height/2, 300);
    p.fill(255,0,0);
    p.text("+", p.width/2, p.height/2);

  }
};
