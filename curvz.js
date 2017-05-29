(function() {

  const ROUNDING_PRECISION = 2;

  // Rounds num to ROUNDING_PRECISION decimals
  var _round = (num) => +(num.toFixed(ROUNDING_PRECISION));
  
  // Computes the gcd and lcm of 2 integers
  var _gcd = (a, b) => (! b) ? a : _gcd(b, a % b);
  var _lcm = (a, b) => (a *b) / _gcd(a, b);





  var CIRCLE = () => ({ 
    start: 0,
    end: 2 * Math.PI,
    getXY: (t) => ({ x: Math.cos(t), y: Math.sin(t) }) 
  });

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

  var HYPERBOLA = (opts) => {
    const options = opts || {},
          a = options.a || 1,
          b = options.b || 1,
          h = options.h || 0,
          k = options.k || 0,
          orientation = options.orientation || "W",
          isOrientationNS = (orientation == "N") || (orientation == "S"),
          isOrientationNE = (orientation == "N") || (orientation == "E"),
          start = isOrientationNE ? -Math.PI / 3 : 2 * Math.PI / 3,
          end = isOrientationNE ? Math.PI / 3 : 4 * Math.PI / 3;


    return {
      start: start,
      end: end,
      getXY: (t) => ({ 
        x: isOrientationNS ? b * Math.tan(t) + h : a / Math.cos(t) + h,
        y: isOrientationNS ? a / Math.cos(t) + k : b * Math.tan(t) + k
      })
    };
  };

  // Precision of R, r to 2 decimal points
  var HYPOTROCHOID = (opts) => {
    const options = opts || {},
          R = options.R || 1,
          r = options.r || 0.6,
          d = options.d || 1,
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
      getPathLengthArray: getPathLengthArray
    }
  };
















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
          nbPoints = options.nbPoints || 1000;

    // const pathLengthArray = curveElt.getPathLengthArray(tStart, tEnd, nbPoints); // TODO - get 1 by 1 instead of huge Array

    path.style.visibility = "hidden";
    path.setAttribute("d", curveElt.getPath(tStart, tEnd, nbPoints));

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;


    const updateFn = function(t) {
      path.style.strokeDashoffset = pathLength * (1-t);
      // path.style.strokeDashoffset = pathLength - pathLengthArray[Math.floor(t*(nbPoints-1))];
    };

    path.style.visibility = "visible";
    animate(updateFn, opts);
  };




  var animate = function(updateFn, opts) {
    var options = opts || {},
        state = {},
        duration = options.duration || 1000,
        tStart = options.tStart || 0,
        tEnd = options.tEnd || 1,
        frameRate = options.frameRate || 60,
        init = (options.init && options.init.bind(state)) || function(){},
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

      normalized_t = (normalized_t >= 1) ? 1 : normalized_t;

      if ((timeSinceLastFrame >= frameLength) || (normalized_t == 1)) {
        updateFn(tStart + normalized_t * (tEnd - tStart), state);
        lastTimestamp = timestamp;
      }

      (normalized_t != 1) && window.requestAnimationFrame(step);
    }

    init();
    window.requestAnimationFrame(step);
  };



  var CURVZ = {
    CIRCLE: CIRCLE,
    ELLIPSIS: ELLIPSIS,
    SPIRAL: SPIRAL,
    HYPOTROCHOID: HYPOTROCHOID,
    LISSAJOUS: LISSAJOUS,
    HYPERBOLA: HYPERBOLA,
    curve: curve,
    animate: animate,
    drawCurve: drawCurve,
    translateAlongCurve: translateAlongCurve
  };




  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CURVZ;
  } else {
    window.CURVZ = CURVZ;
  }
}());



// (function() {

//   var ROUNDING_PRECISION = 2;

//   // Rounds num to ROUNDING_PRECISION decimals
//   var _round = function(num) {
//     return +(num.toFixed(ROUNDING_PRECISION));
//   };


//   var CIRCLE = function() {
//     return {
//       getXY: function(t) {
//         return {
//           x: Math.cos(t),
//           y: Math.sin(t)
//         };
//       }
//     };
//   };

//   var ELLIPSIS = function(opts) {
//     var options = opts || {},
//         a = options.a || 1,
//         b = options.b || 1;

//     return {
//       getXY: function(t) {
//         return {
//           x: a * Math.cos(t),
//           y: b * Math.sin(t)
//         };
//       }
//     };
//   };

//   var LISSAJOUS = function(opts) {
//     var options = opts || {},
//         a = options.a || 1,
//         b = options.b || 1,
//         kx = options.kx || 1,
//         ky = options.ky || 1;

//     return {
//       getXY: function(t) {
//         return {
//           x: a * Math.cos(kx * t),
//           y: b * Math.sin(ky * t)
//         };
//       }
//     };
//   };

//   var HYPERBOLA = function(opts) {
//     var options = opts || {},
//         a = options.a || 1,
//         b = options.b || 1,
//         h = options.h || 0,
//         k = options.k || 0,
//         orientation = options.orientation || "EW";

//     return {
//       getXY: function(t) {
//         return {
//           x: (orientation == "NS") ? b * Math.tan(t) + h : a / Math.cos(t) + h,
//           y: (orientation == "NS") ? a / Math.cos(t) + k : b * Math.tan(t) + k
//         };
//       }
//     };
//   };

//   var HYPOTROCHOID = function(opts) {
//     var options = opts || {},
//         R = options.R || 1,
//         r = options.r || 0.6,
//         d = options.d || 1;

//     return {
//       getXY: function(t) {
//         return {
//           x: (R-r) * Math.cos(t) + d*Math.cos(((R-r)/r)*t),
//           y: (R-r) * Math.sin(t) - d*Math.sin(((R-r)/r)*t)
//         };
//       }
//     };
//   };









//   var curve = function(curveObj, opts) {
//     var options = opts || {},
//         start = options.start || 0,
//         end = options.end || 2 * Math.PI,
//         tStart = options.tStart || 0,
//         tEnd = options.tEnd || 1,
//         x0 = options.x0 || 0,
//         y0 = options.y0 || 0,
//         x1 = options.x1 || 1,
//         y1 = options.y1 || 1;

//     var getCoords = function(t) {
//       var normalized_t = start + (t-tStart)/(tEnd-tStart)*(end-start),
//           coords = curveObj.getXY(normalized_t);
//       return {
//         x: _round(x0 + coords.x * (x1-x0)),
//         y: _round(y0 - coords.y * (y1-y0))
//       };
//     };

//     var _getCoordsFromRange = function(t0, t1, nbPoints) {
//       var coordsArray = [], i;

//       for (i=0; i<nbPoints; i++) {
//         coordsArray.push(getCoords(t0 + i/(nbPoints-1) * (t1-t0)));
//       }

//       return coordsArray;
//     };

//     var getPath = function(t0, t1, nbPoints) {
//       var i,
//           points = _getCoordsFromRange(t0, t1, nbPoints),
//           path = "M" + points[0].x + " " + points[0].y;

//       for (i=1; i<nbPoints; i++) {
//         path += " L " + points[i].x + " " + points[i].y;
//       }

//       return path;
//     };

//     return {
//       getCoords: getCoords,
//       getPath: getPath
//     }
//   };






//   var translateAlongCurve = function(element, curveElt, opts) {
//     var elementHalfWidth = element.offsetWidth/2,
//         elementHalfHeight = element.offsetHeight/2,
//         updateFn = function(t) {
//           var coords = curveElt.getCoords(t),
//             x = coords.x - elementHalfWidth,
//             y = coords.y - elementHalfHeight;

//           element.style.transform = "translate(" + x + "px," + y + "px)";
//         };

//     animate(updateFn, opts);
//   };


//   var drawCurve = function(path, curveElt, opts) {
//     path.style.visibility = "hidden";
//     path.setAttribute("d", curveElt.getPath(0, 5, 1000));

//     var pathLength = path.getTotalLength();
//     path.style.strokeDasharray = pathLength;
//     path.style.strokeDashoffset = pathLength;

//     var updateFn = function(t) {
//       path.style.strokeDashoffset = pathLength * (1-t);
//     };

//     path.style.visibility = "visible";
//     animate(updateFn, opts);
//   };




//   var animate = function(updateFn, opts) {
//     var options = opts || {},
//         state = {},
//         duration = options.duration || 1000,
//         tEnd = options.tEnd || 1,
//         frameRate = options.frameRate || 60,
//         init = (options.init && options.init.bind(state)) || function(){},
//         frameLength = 1000/frameRate,
//         lastTimestamp,
//         startTime;

//     function step(timestamp) {
//       if (!startTime) {
//         startTime = timestamp;
//         lastTimestamp = timestamp;
//       }

//       var normalized_t = (timestamp - startTime)/duration,
//           timeSinceLastFrame = timestamp - lastTimestamp;

//       normalized_t = (normalized_t >= 1) ? 1 : normalized_t;

//       if (timeSinceLastFrame >= frameLength) {
//         updateFn(normalized_t * tEnd, state);
//         lastTimestamp = timestamp;
//       }

//       (normalized_t != 1) && window.requestAnimationFrame(step);
//     }

//     init();
//     window.requestAnimationFrame(step);
//   };



//   var CURVZ = {
//     CIRCLE: CIRCLE,
//     ELLIPSIS: ELLIPSIS,
//     HYPOTROCHOID: HYPOTROCHOID,
//     LISSAJOUS: LISSAJOUS,
//     HYPERBOLA: HYPERBOLA,
//     curve: curve,
//     animate: animate,
//     drawCurve: drawCurve,
//     translateAlongCurve: translateAlongCurve
//   };




//   if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
//     module.exports = CURVZ;
//   } else {
//     window.CURVZ = CURVZ;
//   }
// }());