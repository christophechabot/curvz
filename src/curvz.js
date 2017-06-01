(function() {
  'use strict';

  const ROUNDING_PRECISION = 2;

  // Rounds num to ROUNDING_PRECISION decimals
  var _round = (num) => +(num.toFixed(ROUNDING_PRECISION));



  // Computes the gcd and lcm of 2 integers
  var _gcd = (a, b) => (! b) ? a : _gcd(b, a % b);
  var _lcm = (a, b) => (a *b) / _gcd(a, b);


  ////////////////////
  // CURVE EQUATIONS
  ////////////////////

  var CIRCLE = (opts) => {
    const options = opts || {},
          r = options.r || 1;

    return {
      start: 0,
      end: 2 * Math.PI,
      getXY: (t) => ({ x: r * Math.cos(t), y: r * Math.sin(t) })
    }
  };

  var ELLIPSIS = (opts) => {
    const options = opts || {},
          a = options.a || 1,
          b = options.b || 1;

    return {
      start: 0,
      end: 2 * Math.PI,
      getXY: (t) => ({ x: a * Math.cos(t), y: b * Math.sin(t) })
    };
  };

  var SPIRAL = (opts) => {
    const options = opts || {},
          a = options.a || 1,
          r = options.r || 1,
          start = 0,
          end = 2 * Math.PI;

    return {
      start: start,
      end: end,
      getXY: (t) => {
        return { x: t/end * r * Math.cos(a * t), y: t/end * r * Math.sin(a * t) }}
    };
  };

  var FERMATSPIRAL = function(opts) {
    const options = opts || {},
      a = options.a || 1,
      r = options.r || 1,
      start = 0,
      end = 2 * Math.PI;
    return {
      start: start,
      end: end,
      getXY: function(t) {
        return {
          x: (t<Math.PI) ? r * Math.sqrt(end-2*t)/Math.sqrt(end) * Math.cos(a * (end-2*t)) : - r * Math.sqrt(2*t-end)/Math.sqrt(end) * Math.cos(a * (2*t-end)),
          y: (t<Math.PI) ? r * Math.sqrt(end-2*t)/Math.sqrt(end) * Math.sin(a * (end-2*t)) : - r * Math.sqrt(2*t-end)/Math.sqrt(end) * Math.sin(a * (2*t-end))
        }
      }
    };
  };

  var RHODONEA = (opts) => {
    const options = opts || {},
      a = options.a || 2,
      r = options.r || 1,
      start = 0,
      end = 2 * Math.PI;

    return {
        start: start,
        end: end,
        getXY: (t) => {
        return { x: r * Math.sin(a * t) * Math.cos(t), y: r * Math.sin(a * t) * Math.sin(t) }}
    };
  };

  var LISSAJOUS = (opts) => {
    const options = opts || {},
          a = options.a || 1,
          b = options.b || 1,
          kx = options.kx || 1,
          ky = options.ky || 1;

    return {
      start: 0,
      end: 2 * Math.PI,
      getXY: (t) => ({ x: a * Math.cos(kx * t), y: b * Math.sin(ky * t) })
    };
  };

  // Precision of R, r to 2 decimal points
  var HYPOTROCHOID = (opts) => {
    const options = opts || {},
          R = options.R || 1,
          r = options.r || 0.6,
          d = (options.d == undefined) ? 1 : options.d,
          nbLoops = _lcm(R * 100, r * 100) / (R * 100), //nb of loops required to go back to starting point
          nbPetals = _lcm(R * 100, r * 100) / (r * 100); //nb of loops performed by the inner circle

    return {
      nbLoops: nbLoops,
      nbPetals: nbPetals,
      start: 0,
      end: nbLoops * 2 * Math.PI,
      getXY: (t) => ({
        x: (R-r) * Math.cos(t) + d*Math.cos(((R-r)/r)*t),
        y: (R-r) * Math.sin(t) - d*Math.sin(((R-r)/r)*t)
      })
    };
  };







  //////////////////////
  // CURVE CONSTRUCTOR
  //////////////////////

  var curve = (curveObj, opts) => {
    const options = opts || {},
          tStart = options.tStart || 0,
          tEnd = options.tEnd || 1,
          x0 = options.x0 || 0,
          y0 = options.y0 || 0,
          x1 = options.x1 || 1,
          y1 = options.y1 || 1,
          start = curveObj.start || 0,
          end = curveObj.end || 2 * Math.PI;

    var getCoords = (t) => {
      let normalized_t = start + (t-tStart)/(tEnd-tStart)*(end-start),
          coords = curveObj.getXY(normalized_t);
      return {
        x: _round(x0 + coords.x * (x1-x0)),
        y: _round(y0 - coords.y * (y1-y0))
      };
    };

    var _getCoordsFromRange = (t0, t1, nbPoints) => {
      let coordsArray = [], i;

      for (i=0; i<nbPoints; i++) {
        coordsArray.push(getCoords(t0 + i/(nbPoints-1) * (t1-t0)));
      }

      return coordsArray;
    };

    var getPath = (t0, t1, nbPoints) => {
      const points = _getCoordsFromRange(t0, t1, nbPoints);
      let i,
          path = "M" + points[0].x + " " + points[0].y;

      for (i=1; i<nbPoints; i++) {
        path += " L " + points[i].x + " " + points[i].y;
      }

      return path;
    };

    var getPointsPath = (t0, t1, nbPoints) => {
      const points = _getCoordsFromRange(t0, t1, nbPoints);
      let i,
          path = "M" + points[0].x + " " + points[0].y + "L" + (points[0].x + 1) + " " + (points[0].y + 1);

      for (i=1; i<nbPoints; i++) {
        path += " M" + points[i].x + " " + points[i].y + "L" + (points[i].x + 1) + " " + (points[i].y + 1);
      }

      return path;
    };

    var getPathLengthArray = (t0, t1, nbPoints) => {
      let i,
          step = (t1-t0) / nbPoints,
          t = t0,
          fakePath = document.createElementNS('http://www.w3.org/2000/svg',"path"),
          pathLengthArray = [];

      for (i=1; i<nbPoints; i++) {
        t += step;
        fakePath.setAttribute("d", getPath(t0, t, i+1));
        pathLengthArray.push(fakePath.getTotalLength());
      }

      return pathLengthArray;
    }

    return {
      curveObj: curveObj,
      getCoords: getCoords,
      getPath: getPath,
      getPointsPath: getPointsPath,
      getPathLengthArray: getPathLengthArray
    }
  };




  /////////////////////
  // EASING FUNCTIONS
  /////////////////////

  const LINEAR = (t) => (t);

  // SINE EASING FUNCTIONS
  const EASEINOUT = (t) => (-1/2 * (Math.cos(Math.PI*t) - 1));

  const EASEIN = (t) => (-Math.cos(t * (Math.PI/2)) + 1);

  const EASEOUT = (t) => (Math.sin(t * (Math.PI/2)));

  // QUARTIC EASING FUNCTIONS
  const EASEINOUTQUART = (t) => (((t*=2) < 1) ? 1/2*t*t*t*t : -1/2 * ((t-=2)*t*t*t - 2));

  const EASEINQUART = (t) => (t*t*t*t);

  const EASEOUTQUART = (t) => (-((t=t-1)*t*t*t - 1));

  // ELASTIC EASING FUNCTIONS
  const EASEINELASTIC = (t) => {
    var s=1.70158;var p=0.5;var a=1;
    if (t==0) return 0;  if (t==1) return 1;  if (!p) p=.3;
    if (a < 1) { a=1; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (1/a);
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t-s)*(2*Math.PI)/p ));
  };

  const EASEOUTELASTIC = (t) => {
    var s=1.70158;var p=0.5;var a=1;
    if (t==0) return 0;  if (t==1) return 1;  if (!p) p=.3;
    if (a < 1) { a=1; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (1/a);
    return a*Math.pow(2,-10*t) * Math.sin( (t-s)*(2*Math.PI)/p ) + 1;
  };

  const EASEINOUTELASTIC = (t) => {
    var s=1.70158;var p=0.5;var a=1;
    if (t==0) return 0;  if ((t/=1/2)==2) return 1;  if (!p) p=(.3*1.5);
    if (a < 1) { a=1; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (1/a);
    if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t-s)*(2*Math.PI)/p ));
    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t-s)*(2*Math.PI)/p )*.5 + 1;
  };


  const BOUNCEOUT = (t) => {
    if (t < (1/2.75)) {
      return (7.5625*t*t);
    } else if (t < (2/2.75)) {
      return (7.5625*(t-=(1.5/2.75))*t + .75);
    } else if (t < (2.5/2.75)) {
      return (7.5625*(t-=(2.25/2.75))*t + .9375);
    } else {
      return (7.5625*(t-=(2.625/2.75))*t + .984375);
    }
  };

  const BOUNCEIN = (t) => (1 - BOUNCEOUT(1-t));

  const BOUNCEINOUT = (t) => ((t < 1/2) ? BOUNCEIN(t*2) * .5 : BOUNCEOUT(t*2-1) * .5 + .5);





  //////////////////////
  // CUSTOM ANIMATIONS
  //////////////////////

  var translateAlongCurve = (element, curveElt, opts) => {
    element.style.visibility = "hidden";

    const elementHalfWidth = element.offsetWidth/2,
          elementHalfHeight = element.offsetHeight/2,
          updateFn = (t) => {
            const coords = curveElt.getCoords(t),
                  x = coords.x - elementHalfWidth,
                  y = coords.y - elementHalfHeight;

            element.style.transform = "translate(" + x + "px," + y + "px)";
          };

    element.style.visibility = "visible";
    animate(updateFn, opts);
  };




  var drawCurve = (path, curveElt, opts) => {
    const tStart = curveElt.tStart || 0,
      tEnd = curveElt.tEnd || 1,
      options = opts || {},
      nbPoints = options.nbPoints || 1000,
      pointsOnly = options.pointsOnly || false;

    // const pathLengthArray = curveElt.getPathLengthArray(tStart, tEnd, nbPoints); // TODO - get 1 by 1 instead of huge Array

    path.style.visibility = "hidden";
    path.setAttribute("d", curveElt.getPath(tStart, tEnd, nbPoints));

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;

    if (pointsOnly) path.setAttribute("d", curveElt.getPointsPath(tStart, tEnd, nbPoints));

    const updateFn = function(t) {
      path.style.strokeDashoffset = pathLength * (1-t);
      // path.style.strokeDashoffset = pathLength - pathLengthArray[Math.floor(t*(nbPoints-1))]; // TODO - get 1 by 1 instead of huge Array
    };

    path.style.visibility = "visible";
    animate(updateFn, opts);
  };





  //////////////////////////
  // ANIMATION CONSTRUCTOR
  //////////////////////////

  var animate = function(updateFn, opts) {
    var options = opts || {},
        duration = options.duration || 1000,
        tStart = options.tStart || 0,
        tEnd = (options.tEnd == undefined) ? 1 : options.tEnd,
        frameRate = options.frameRate || 60,
        easing = options.easing || LINEAR,
        frameLength = 1000/frameRate,
        lastTimestamp,
        startTime;

    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp;
        lastTimestamp = timestamp;
      }

      var normalized_t = (timestamp - startTime)/duration,
          timeSinceLastFrame = timestamp - lastTimestamp;

      normalized_t = (normalized_t >= 1) ? 1 : easing(normalized_t);

      if ((timeSinceLastFrame >= frameLength) || (normalized_t == 1)) {
        updateFn(tStart + normalized_t * (tEnd - tStart));
        lastTimestamp = timestamp;
      }

      (normalized_t != 1) && window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  };


  ////////////////////////
  // EXPORTED METHODS
  ////////////////////////

  var CURVZ = {
    // Curve equations
    CIRCLE: CIRCLE,
    ELLIPSIS: ELLIPSIS,
    SPIRAL: SPIRAL,
    FERMATSPIRAL: FERMATSPIRAL,
    RHODONEA: RHODONEA,
    HYPOTROCHOID: HYPOTROCHOID,
    LISSAJOUS: LISSAJOUS,
    // Easing functions
    LINEAR: LINEAR,
    EASEINOUT: EASEINOUT,
    EASEIN: EASEIN,
    EASEOUT: EASEOUT,
    EASEINOUTQUART: EASEINOUTQUART,
    EASEINQUART: EASEINQUART,
    EASEOUTQUART: EASEOUTQUART,
    BOUNCEIN: BOUNCEIN,
    BOUNCEOUT: BOUNCEOUT,
    BOUNCEINOUT: BOUNCEINOUT,
    EASEINELASTIC: EASEINELASTIC,
    EASEOUTELASTIC: EASEOUTELASTIC,
    EASEINOUTELASTIC: EASEINOUTELASTIC,
    // Constructors
    curve: curve,
    animate: animate,
    // Custom animation functions
    drawCurve: drawCurve,
    translateAlongCurve: translateAlongCurve
  };




  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CURVZ;
  } else {
    window.CURVZ = CURVZ;
  }
}());

