// Made By Andrew Schmitt

// Simulation Control Variables
var past_coordinates;
var cur;
var time_step_values;
var radius = 8;
var lines;
var line_index = 0;
var step = 0.1;
var max_steps;

// Simulation Control Variables
var parser = math.parser();
var ticker;
var is_running = false;
var was_running = false;

// User Supplied Conditions
var max_time;
var rabi_freq;
var theta_start;
var phi_start
var pps;

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

// This functions computes the values and draws everything
function runSimulation() {

  cur = convertToCartesian(radius, start_theta, start_phi);
  time_step_values = [ ];
  lines = [ ];
  past_coordinates = [ ];
  max_steps = (max_time * pps)+1;

  // computes all the values to be traced over given a max time and time interval
  function computeTimeStepValues() {
    for (i_phi = .1; i_phi < 60; i_phi += step) {
      for (i_theta = 0; i_theta < 6; i_theta += step) {
        if (time_step_values.length < max_steps) {
          var coord = convertToCartesian(radius, i_theta, i_phi);
          time_step_values.push(coord);
        } else {
          break;
        }
      }
      if (time_step_values.length > max_steps) {
        break;
      }
    }
  }

  computeTimeStepValues();

  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  // draws a line from the center and traces connections from previous points (if they exist)
  function draw() {

    var arrow_color = colors[arrow_colorIndex];

    // Draw the Bloch Sphere
    var sphere = Pre3d.ShapeUtils.makeSphere(8, 30, 30);
    renderer.fill_rgba = new Pre3d.RGBA(0, 0, 0, 0.1);
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

    for (var i = 0; i < 20; ) {
        i += 1;
    }

    // Draw Path So Far Between Past Points
    var p0;
    var p1;
    if (past_coordinates.length > 1) {
      for (i = line_index; i+1 < past_coordinates.length; i++) {
        p0 = past_coordinates[i];
        p1 = past_coordinates[i+1];
        lines.push(Pre3d.PathUtils.makeLine(p0, p1));
        line_index += 1;
      }
    }

    for (i = 0; i < lines.length; i++) {
      renderer.drawPath(lines[i]);
    }
  }

  renderer.camera.focal_length = 2.5;
  // Have the engine handle mouse / camera movement for us.
  DemoUtils.autoCamera(renderer, 0, 0, -30, 0.40, -1.06, 0, draw);

  function updateDrawing(time) {
    if (time < max_steps) {
      document.getElementById("cur_time").value = Math.round(((time / pps) + 0.00001) * 100) / 100;
      cur = time_step_values[time];
      draw();
    } else {
      ticker.stop()
      is_running = false;
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

function errorCheck(f, time, p, t, pps) {
  if (f === null) {
    document.getElementById("rabi").className = "input_error";
    return false;
  }
  if (time === null || isNaN(time)) {
    document.getElementById("max_time").className = "input_error";
    return false;
  }
  if (p === null || isNaN(p)) {
    document.getElementById("start_phi").className = "input_error";
    return false;
  }
  if (t === null || isNaN(t)) {
    document.getElementById("start_theta").className = "input_error";
    return false;
  }
  if (pps === null || isNaN(pps)) {
    document.getElementById("pps").className = "input_error";
    return false;
  }
  try {
    console.log(f);
    parser.eval('t = ' + time);
    parser.eval(f);
  } catch(err) {
    console.log(err);
    document.getElementById("rabi").className = "input_error";
    return false;
  }
  document.getElementById("rabi").className="white";
  document.getElementById("max_time").className="white";
  document.getElementById("start_phi").className="white";
  document.getElementById("start_theta").className="white";
  return true;
}

function checkParser() {
  var newParser = math.parser();
  var f = 'sin(t)';
  newParser.eval('f(t) = ' + f);
  console.log(newParser.eval('t = 1'));
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
      if (is_running) {
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
      }
      rabi_freq = document.getElementById("rabi").value;
      max_time = document.getElementById("max_time").value;
      start_phi = document.getElementById("start_phi").value;
      start_theta = document.getElementById("start_theta").value;
      pps = document.getElementById("pps").value;
      if (errorCheck(rabi_freq, max_time, start_phi, start_theta, pps)) {
        is_running = true;
        runSimulation();
      }
      break;
    default:
      return;
  }
}, false);
