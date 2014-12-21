// Made By Andrew Schmitt

// Simulation Control Variables
var past_coordinates;
var cur;
var time_step_values;
var radius = 8;
var lines;
var line_index = 0;
var step = 0.05;
var max_steps;

// Simulation Control Variables
var parser = math.parser();
var ticker;
var is_running = false;
var was_running = false;

// User Supplied Conditions
var max_time;
var rabi_freq;
var purity;
var pps;
// var theta_start;
// var phi_start;

// Color Control Varaibles
var cur_white = true;
var black = new Pre3d.RGBA(0, 0, 0, 1);
var white = new Pre3d.RGBA(1, 1, 1, 1);
var line_colorIndex = 1;
var arrow_colorIndex = 2;
var colors = [
  new Pre3d.RGBA(1, 0, 0, 1),
  new Pre3d.RGBA(0, 1, 0, 1),
  new Pre3d.RGBA(0, 0, 1, 1),
  new Pre3d.RGBA(0, 1, 1, 1),
  new Pre3d.RGBA(1, 1, 0, 1),
  new Pre3d.RGBA(1, 1, 1, 1)
];

// If a box is clicked on it should turn white
function colorWhite(elm) {
  elm.className = "white";
}

// Physics Variables
var i = math.complex(0, 1);
var neg_i = math.complex(0, -1);
var hbar = 1.054571726 * Math.pow(10, -34);
var id = math.matrix([[1, 0], [0, 1]]);
var sig_x = math.matrix([[0,1], [1, 0]]);
var sig_y = math.matrix([[0, neg_i], [i, 0]]);
var sig_z = math.matrix([[1, 0], [0, -1]]);
var raise_op = math.matrix([[0, 1], [0, 0]]);
var lower_op = math.matrix([[0,0],[1,0]]);

// F is expected to be a function of t.  Returns an array with 
// the function and its complex conjugate evaluated at time T
function computeFrequencyVals(f, t) {
  var parser = math.parser();
  parser.eval('t = ' + t);
  var func_val = parser.eval(f);
  var complex_val = parser.eval(conjugate(f));
  return [func_val, complex_val];
}

// F is assumed to be a pontentailly complex valued function.
function conjugate(f) {
  var conj = f;
  var prev_char;
  var cur_char;
  for(k = 1; k < f.length; k++) {
    prev_char = f.charAt(k-1);
    cur_char = f.charAt(k);
    if (cur_char == 'i' && prev_char != 's') {
      conj = f.substring(0, k) + '-i' + f.substring(k+1);
    }
  }
  return conj;
}

// calculates the inverse of a 2x2 matrix
function twoDInverse(matrix) {
  var determinant = math.det(matrix);
  var top_l = math.subset(matrix, math.index(1, 1));
  var top_r = math.multiply(-1, math.subset(matrix, math.index(0, 1)));
  var bot_l = math.multiply(-1, math.subset(matrix, math.index(1, 0)));
  var bot_r = math.subset(matrix, math.index(0, 0));
  var new_matrix = math.matrix([[top_l, top_r], [bot_l, bot_r]]);
  return math.multiply(new_matrix, (1/determinant));
}

// Computes a 2x2 matrix representing the hamiltonian for the system
// with time dependence
function computeHamiltonian(t) {
  var func_vals = computeFrequencyVals(rabi_freq, t);
  var func_val = func_vals[0];
  var complex_val = func_vals[1];
  var matrix1 = math.multiply(raise_op, func_val);
  var matrix2 = math.multiply(lower_op, complex_val);
  var matrix3 = math.add(matrix2, matrix1);
  var matrix4 = math.subtract(sig_z, matrix3);
  var ham = math.multiply(matrix4, hbar/2);
  return ham;
}

// transpose a 2x1 matrix and take its conjugate
function twoByOneTranpose(matrix) {
  var elem1 = math.conj(math.complex(math.subset(matrix, math.index(0, 0))));
  var elem2 = math.conj(math.complex(math.subset(matrix, math.index(1, 0))));
  return math.matrix([[elem1, elem2]]);
}

// find expectation values and format as a point to be plotted, 
// where state is a 2x1 matrix
function computeExpectationPoint(state) {
  var trans = twoByOneTranpose(state);
  var expect_x = math.complex(math.multiply(math.multiply(trans, sig_x), state));
  var expect_y = math.complex(math.multiply(math.multiply(trans, sig_y), state));
  var expect_z = math.complex(math.multiply(math.multiply(trans, sig_z), state));
  return {x: expect_x.re * radius, y: expect_z.re * radius, z: expect_y.re * radius};
}

// Compute the multiplier at a given time. Returns a 2x2 matrix
function computeMultiplier(t) {
  var con = math.divide(step * .5 / hbar, i);
  var scaled_ham = math.multiply(computeHamiltonian(t+(step/2)), con);
  var matrix1 = math.subtract(id, scaled_ham);
  var matrix2 = math.add(id, scaled_ham);
  var inv_matrix = twoDInverse(matrix2);
  return math.multiply(inv_matrix, matrix1);
}


// This functions computes the values and draws everything
function runSimulation() {

  time_step_values = [ ];
  lines = [ ];
  past_coordinates = [ ];
  max_steps = (max_time/step);
  radius = radius * purity;

  function computeBlochSphereValues() {
    var cur_state = math.matrix([[1], [0]]);
    var new_point;
    var multiplier;
    for (t = 0; t < max_time; t += step) {
      new_point = computeExpectationPoint(cur_state);
      time_step_values.push(new_point);
      multiplier = computeMultiplier(t);
      cur_state = math.multiply(multiplier, cur_state);
      console.log(new_point);
    }
  }

  computeBlochSphereValues();

  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  // draws a line from the center and traces connections from previous points (if they exist)
  function draw() {

    var arrow_color = colors[arrow_colorIndex];

    // Draw the Bloch Sphere
    var sphere = Pre3d.ShapeUtils.makeSphere(8, 30, 30);
    renderer.fill_rgba = new Pre3d.RGBA(0, 0, 0, 0.3);
    renderer.bufferShape(sphere);

    // Draw Origin Sphere
    var sphere = Pre3d.ShapeUtils.makeSphere(.3, 15, 15);
    renderer.fill_rgba = new Pre3d.RGBA(arrow_color.r, arrow_color.g, arrow_color.b, arrow_color.a);
    renderer.bufferShape(sphere);

    // Draw BackGround as either White or black Initally
    if (cur_white) {
      renderer.ctx.setFillColor(1, 1, 1, 1);
    } else {
      renderer.ctx.setFillColor(0, 0, 0, 1);
    }
    renderer.drawBackground();

    // Set arrow color
    renderer.ctx.setStrokeColor(arrow_color.r, arrow_color.g, arrow_color.b, arrow_color.a);
    renderer.ctx.lineWidth = 2;

    // Update Position of Tracing Arrow
    var line = Pre3d.PathUtils.makeLine({x: 0, y: 0, z:0}, {x:cur.x, y:cur.y, z: cur.z});
    renderer.drawPath(line);

    renderer.drawBuffer();
    renderer.emptyBuffer();

    past_coordinates.push(cur)

    // set line color
    var line_color = colors[line_colorIndex];
    renderer.ctx.setStrokeColor(line_color.r, line_color.g, line_color.b, line_color.a);

    for (var k = 0; k < 20; ) {
        k += 1;
    }

    // Draw Path So Far Between Past Points
    var p0;
    var p1;
    if (past_coordinates.length > 1) {
      for (k = line_index; k+1 < past_coordinates.length; k++) {
        p0 = past_coordinates[k];
        p1 = past_coordinates[k+1];
        lines.push(Pre3d.PathUtils.makeLine(p0, p1));
        line_index += 1;
      }
    }

    for (k = 0; k < lines.length; k++) {
      renderer.drawPath(lines[k]);
    }
  }

  renderer.camera.focal_length = 2.5;
  // Have the engine handle mouse / camera movement for us.
  DemoUtils.autoCamera(renderer, 0, 0, -30, 0.40, -1.06, 0, draw);

  function updateDrawing(time) {
    if (time < max_steps) {
      document.getElementById("cur_time").value = Math.round(((time * step) + 0.00001) * 100) / 100;
      cur = time_step_values[time];
      draw();
    } else {
      ticker.stop()
      is_running = false;
      was_running = true;
    }
  }

  function convertToPolar(x_co, y_co, z_co) {
    r_ = Math.sqrt(Math.pow(x_co,2) + Math.pow(y_co,2) + Math.pow(z_co, 2));
    theta_ = Math.atan(y_co/z_co);
    phi_ = Math.acos(z_co, r_);
    
    return {r: r_, theta: theta_, phi: phi_};
  }

  function convertToCartesian(r, theta, phi) {
    x_ = r * Math.cos(theta) * Math.sin(phi);
    y_ = r * Math.sin(theta) * Math.sin(phi);
    z_ = r * Math.cos(phi);

    return {x: x_, y: z_, z: y_};
  }

  ticker = new DemoUtils.Ticker(pps, updateDrawing);
  ticker.start()
}



function errorCheck(f, time, p, t, pur, pps) {
  if (f === null) {
    document.getElementById("rabi").className = "input_error";
    return false;
  }
  if (time === null || isNaN(time)) {
    document.getElementById("max_time").className = "input_error";
    return false;
  }
  if (pur == null || isNaN(pur) || pur <= 0 || pur > 1) {
    document.getElementById("purity").className = "input_error";
    return false;
  }
  // if (p === null || isNaN(p)) {
  //   document.getElementById("start_phi").className = "input_error";
  //   return false;
  // }
  // if (t === null || isNaN(t)) {
  //   document.getElementById("start_theta").className = "input_error";
  //   return false;
  // }
  if (pps === null || isNaN(pps)) {
    document.getElementById("pps").className = "input_error";
    return false;
  }
  try {
    console.log(f);
    var parser = math.parser();
    parser.eval('t = ' + time);
    parser.eval(f);
  } catch(err) {
    console.log(err);
    document.getElementById("rabi").className = "input_error";
    return false;
  }
  document.getElementById("rabi").className="white";
  document.getElementById("max_time").className="white";
  document.getElementById("purity").className="white";
  // document.getElementById("start_phi").className="white";
  // document.getElementById("start_theta").className="white";
  return true;
}

function checkParser() {
  var newParser = math.parser();
  var f = 'e^(i*t)';
  newParser.eval('f(t) = ' + f);
  console.log(newParser.eval('t = 39.299999999999905'));
  console.log(newParser.eval('f(t)'));
}

// add key event listeners once the page loads
document.addEventListener('keydown', function(e) {
  var code = e.keyCode;

  switch(code) {
    case 66:
      if (cur_white) {
        document.body.className = "black";
      } else {
        document.body.className = "white";
      }
      cur_white = !cur_white;
      if (is_running || was_running) {
        runSimulation.draw();
      }
      break;
    case 67:
      if (is_running) {
        arrow_colorIndex += 1;
        if (arrow_colorIndex > colors.length-1) {
          arrow_colorIndex = 0;
          runSimulation.draw();
        } else {
          runSimulation.draw();
        }
      }
      break;
    case 76:
      if (is_running) {
        line_colorIndex += 1;
        if (line_colorIndex > colors.length-1) {
          line_colorIndex = 0;
        } else {
          draw();
        }
      }
      break;
    case 80:
      if (is_running) {
        ticker.stop()
        was_running = true;
        is_running = false;
      } else if (was_running) {
        ticker.start()
        is_running = true;
        was_running = false;
      }
      break;
    case 13:
      if (is_running || was_running) {
        ticker.stop()
        ticker = null;
        lines = [ ];
        line_index = 0;
        past_coordinates =[ ];
        radius = 8;
      }
      rabi_freq = document.getElementById("rabi").value;
      max_time = document.getElementById("max_time").value;
      purity = document.getElementById("purity").value;
      // start_phi = document.getElementById("start_phi").value;
      // start_theta = document.getElementById("start_theta").value;
      start_phi = null;
      start_theta = null;
      pps = document.getElementById("pps").value;
      if (errorCheck(rabi_freq, max_time, start_phi, start_theta, purity, pps)) {
        is_running = true;
        runSimulation();
      }
      break;
    default:
      return;
  }
}, false);
