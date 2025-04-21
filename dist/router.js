/*!
  * wia router v1.0.19
  * (c) 2014 Sibyl Yu
  * Licensed under the Elastic License 2.0.
  * You may not use this file except in compliance with the Elastic License.
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["@wiajs/router"] = factory());
})(this, (function () { 'use strict';

  /*!
    * wia core v1.1.28
    * (c) 2015-2024 Sibyl Yu and contributors
    * Released under the MIT License.
    */ /**
   * promise version ajax get、post
   * return Promise objext.
   * get move to base.js
   */ function _extends$1() {
      _extends$1 = Object.assign || function(target) {
          for(var i = 1; i < arguments.length; i++){
              var source = arguments[i];
              for(var key in source){
                  if (Object.prototype.hasOwnProperty.call(source, key)) {
                      target[key] = source[key];
                  }
              }
          }
          return target;
      };
      return _extends$1.apply(this, arguments);
  }
  /* eslint-disable */ function signum(num) {
      return num < 0 ? -1 : 0 === num ? 0 : 1;
  }
  function lerp(start, stop, amount) {
      return (1 - amount) * start + amount * stop;
  }
  function clampInt(min, max, input) {
      return input < min ? min : input > max ? max : input;
  }
  function clampDouble(min, max, input) {
      return input < min ? min : input > max ? max : input;
  }
  function sanitizeDegreesDouble(degrees) {
      return (degrees %= 360) < 0 && (degrees += 360), degrees;
  }
  function rotationDirection(from, to) {
      return sanitizeDegreesDouble(to - from) <= 180 ? 1 : -1;
  }
  function differenceDegrees(a, b) {
      return 180 - Math.abs(Math.abs(a - b) - 180);
  }
  function matrixMultiply(row, matrix) {
      return [
          row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2],
          row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2],
          row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2]
      ];
  }
  const SRGB_TO_XYZ = [
      [
          .41233895,
          .35762064,
          .18051042
      ],
      [
          .2126,
          .7152,
          .0722
      ],
      [
          .01932141,
          .11916382,
          .95034478
      ]
  ], XYZ_TO_SRGB = [
      [
          3.2413774792388685,
          -1.5376652402851851,
          -.49885366846268053
      ],
      [
          -.9691452513005321,
          1.8758853451067872,
          .04156585616912061
      ],
      [
          .05562093689691305,
          -.20395524564742123,
          1.0571799111220335
      ]
  ], WHITE_POINT_D65 = [
      95.047,
      100,
      108.883
  ];
  function argbFromRgb(red, green, blue) {
      return (255 << 24 | (255 & red) << 16 | (255 & green) << 8 | 255 & blue) >>> 0;
  }
  function argbFromLinrgb(linrgb) {
      return argbFromRgb(delinearized(linrgb[0]), delinearized(linrgb[1]), delinearized(linrgb[2]));
  }
  function redFromArgb(argb) {
      return argb >> 16 & 255;
  }
  function greenFromArgb(argb) {
      return argb >> 8 & 255;
  }
  function blueFromArgb(argb) {
      return 255 & argb;
  }
  function argbFromXyz(x, y, z) {
      const matrix = XYZ_TO_SRGB, linearR = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z, linearG = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z, linearB = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;
      return argbFromRgb(delinearized(linearR), delinearized(linearG), delinearized(linearB));
  }
  function xyzFromArgb(argb) {
      return matrixMultiply([
          linearized(redFromArgb(argb)),
          linearized(greenFromArgb(argb)),
          linearized(blueFromArgb(argb))
      ], SRGB_TO_XYZ);
  }
  function argbFromLstar(lstar) {
      const component = delinearized(yFromLstar(lstar));
      return argbFromRgb(component, component, component);
  }
  function lstarFromArgb(argb) {
      return 116 * labF(xyzFromArgb(argb)[1] / 100) - 16;
  }
  function yFromLstar(lstar) {
      return 100 * labInvf((lstar + 16) / 116);
  }
  function lstarFromY(y) {
      return 116 * labF(y / 100) - 16;
  }
  function linearized(rgbComponent) {
      const normalized = rgbComponent / 255;
      return normalized <= .040449936 ? normalized / 12.92 * 100 : 100 * Math.pow((normalized + .055) / 1.055, 2.4);
  }
  function delinearized(rgbComponent) {
      const normalized = rgbComponent / 100;
      let delinearized = 0;
      return delinearized = normalized <= .0031308 ? 12.92 * normalized : 1.055 * Math.pow(normalized, 1 / 2.4) - .055, clampInt(0, 255, Math.round(255 * delinearized));
  }
  function whitePointD65() {
      return WHITE_POINT_D65;
  }
  function labF(t) {
      return t > 216 / 24389 ? Math.pow(t, 1 / 3) : (903.2962962962963 * t + 16) / 116;
  }
  function labInvf(ft) {
      const ft3 = ft * ft * ft;
      return ft3 > 216 / 24389 ? ft3 : (116 * ft - 16) / 903.2962962962963;
  }
  let ViewingConditions = class ViewingConditions {
      static make(whitePoint = whitePointD65(), adaptingLuminance = 200 / Math.PI * yFromLstar(50) / 100, backgroundLstar = 50, surround = 2, discountingIlluminant = !1) {
          const xyz = whitePoint, rW = .401288 * xyz[0] + .650173 * xyz[1] + -.051461 * xyz[2], gW = -.250268 * xyz[0] + 1.204414 * xyz[1] + .045854 * xyz[2], bW = -.002079 * xyz[0] + .048952 * xyz[1] + .953127 * xyz[2], f = .8 + surround / 10, c = f >= .9 ? lerp(.59, .69, 10 * (f - .9)) : lerp(.525, .59, 10 * (f - .8));
          let d = discountingIlluminant ? 1 : f * (1 - 1 / 3.6 * Math.exp((-adaptingLuminance - 42) / 92));
          d = d > 1 ? 1 : d < 0 ? 0 : d;
          const nc = f, rgbD = [
              d * (100 / rW) + 1 - d,
              d * (100 / gW) + 1 - d,
              d * (100 / bW) + 1 - d
          ], k = 1 / (5 * adaptingLuminance + 1), k4 = k * k * k * k, k4F = 1 - k4, fl = k4 * adaptingLuminance + .1 * k4F * k4F * Math.cbrt(5 * adaptingLuminance), n = yFromLstar(backgroundLstar) / whitePoint[1], z = 1.48 + Math.sqrt(n), nbb = .725 / Math.pow(n, .2), ncb = nbb, rgbAFactors = [
              Math.pow(fl * rgbD[0] * rW / 100, .42),
              Math.pow(fl * rgbD[1] * gW / 100, .42),
              Math.pow(fl * rgbD[2] * bW / 100, .42)
          ], rgbA = [
              400 * rgbAFactors[0] / (rgbAFactors[0] + 27.13),
              400 * rgbAFactors[1] / (rgbAFactors[1] + 27.13),
              400 * rgbAFactors[2] / (rgbAFactors[2] + 27.13)
          ];
          return new ViewingConditions(n, (2 * rgbA[0] + rgbA[1] + .05 * rgbA[2]) * nbb, nbb, ncb, c, nc, rgbD, fl, Math.pow(fl, .25), z);
      }
      constructor(n, aw, nbb, ncb, c, nc, rgbD, fl, fLRoot, z){
          this.n = n, this.aw = aw, this.nbb = nbb, this.ncb = ncb, this.c = c, this.nc = nc, this.rgbD = rgbD, this.fl = fl, this.fLRoot = fLRoot, this.z = z;
      }
  };
  ViewingConditions.DEFAULT = ViewingConditions.make();
  let Cam16 = class Cam16 {
      distance(other) {
          const dJ = this.jstar - other.jstar, dA = this.astar - other.astar, dB = this.bstar - other.bstar, dEPrime = Math.sqrt(dJ * dJ + dA * dA + dB * dB);
          return 1.41 * Math.pow(dEPrime, .63);
      }
      static fromInt(argb) {
          return Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
      }
      static fromIntInViewingConditions(argb, viewingConditions) {
          const green = (65280 & argb) >> 8, blue = 255 & argb, redL = linearized((16711680 & argb) >> 16), greenL = linearized(green), blueL = linearized(blue), x = .41233895 * redL + .35762064 * greenL + .18051042 * blueL, y = .2126 * redL + .7152 * greenL + .0722 * blueL, z = .01932141 * redL + .11916382 * greenL + .95034478 * blueL, rC = .401288 * x + .650173 * y - .051461 * z, gC = -.250268 * x + 1.204414 * y + .045854 * z, bC = -.002079 * x + .048952 * y + .953127 * z, rD = viewingConditions.rgbD[0] * rC, gD = viewingConditions.rgbD[1] * gC, bD = viewingConditions.rgbD[2] * bC, rAF = Math.pow(viewingConditions.fl * Math.abs(rD) / 100, .42), gAF = Math.pow(viewingConditions.fl * Math.abs(gD) / 100, .42), bAF = Math.pow(viewingConditions.fl * Math.abs(bD) / 100, .42), rA = 400 * signum(rD) * rAF / (rAF + 27.13), gA = 400 * signum(gD) * gAF / (gAF + 27.13), bA = 400 * signum(bD) * bAF / (bAF + 27.13), a = (11 * rA + -12 * gA + bA) / 11, b = (rA + gA - 2 * bA) / 9, u = (20 * rA + 20 * gA + 21 * bA) / 20, p2 = (40 * rA + 20 * gA + bA) / 20, atanDegrees = 180 * Math.atan2(b, a) / Math.PI, hue = atanDegrees < 0 ? atanDegrees + 360 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees, hueRadians = hue * Math.PI / 180, ac = p2 * viewingConditions.nbb, j = 100 * Math.pow(ac / viewingConditions.aw, viewingConditions.c * viewingConditions.z), q = 4 / viewingConditions.c * Math.sqrt(j / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot, huePrime = hue < 20.14 ? hue + 360 : hue, t = 5e4 / 13 * (.25 * (Math.cos(huePrime * Math.PI / 180 + 2) + 3.8)) * viewingConditions.nc * viewingConditions.ncb * Math.sqrt(a * a + b * b) / (u + .305), alpha = Math.pow(t, .9) * Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73), c = alpha * Math.sqrt(j / 100), m = c * viewingConditions.fLRoot, s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4)), jstar = (1 + 100 * .007) * j / (1 + .007 * j), mstar = 1 / .0228 * Math.log(1 + .0228 * m), astar = mstar * Math.cos(hueRadians), bstar = mstar * Math.sin(hueRadians);
          return new Cam16(hue, c, j, q, m, s, jstar, astar, bstar);
      }
      static fromJch(j, c, h) {
          return Cam16.fromJchInViewingConditions(j, c, h, ViewingConditions.DEFAULT);
      }
      static fromJchInViewingConditions(j, c, h, viewingConditions) {
          const q = 4 / viewingConditions.c * Math.sqrt(j / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot, m = c * viewingConditions.fLRoot, alpha = c / Math.sqrt(j / 100), s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4)), hueRadians = h * Math.PI / 180, jstar = (1 + 100 * .007) * j / (1 + .007 * j), mstar = 1 / .0228 * Math.log(1 + .0228 * m), astar = mstar * Math.cos(hueRadians), bstar = mstar * Math.sin(hueRadians);
          return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
      }
      static fromUcs(jstar, astar, bstar) {
          return Cam16.fromUcsInViewingConditions(jstar, astar, bstar, ViewingConditions.DEFAULT);
      }
      static fromUcsInViewingConditions(jstar, astar, bstar, viewingConditions) {
          const a = astar, b = bstar, m = Math.sqrt(a * a + b * b), c = (Math.exp(.0228 * m) - 1) / .0228 / viewingConditions.fLRoot;
          let h = Math.atan2(b, a) * (180 / Math.PI);
          h < 0 && (h += 360);
          const j = jstar / (1 - .007 * (jstar - 100));
          return Cam16.fromJchInViewingConditions(j, c, h, viewingConditions);
      }
      toInt() {
          return this.viewed(ViewingConditions.DEFAULT);
      }
      viewed(viewingConditions) {
          const alpha = 0 === this.chroma || 0 === this.j ? 0 : this.chroma / Math.sqrt(this.j / 100), t = Math.pow(alpha / Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73), 1 / .9), hRad = this.hue * Math.PI / 180, eHue = .25 * (Math.cos(hRad + 2) + 3.8), ac = viewingConditions.aw * Math.pow(this.j / 100, 1 / viewingConditions.c / viewingConditions.z), p1 = eHue * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb, p2 = ac / viewingConditions.nbb, hSin = Math.sin(hRad), hCos = Math.cos(hRad), gamma = 23 * (p2 + .305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin), a = gamma * hCos, b = gamma * hSin, rA = (460 * p2 + 451 * a + 288 * b) / 1403, gA = (460 * p2 - 891 * a - 261 * b) / 1403, bA = (460 * p2 - 220 * a - 6300 * b) / 1403, rCBase = Math.max(0, 27.13 * Math.abs(rA) / (400 - Math.abs(rA))), rC = signum(rA) * (100 / viewingConditions.fl) * Math.pow(rCBase, 1 / .42), gCBase = Math.max(0, 27.13 * Math.abs(gA) / (400 - Math.abs(gA))), gC = signum(gA) * (100 / viewingConditions.fl) * Math.pow(gCBase, 1 / .42), bCBase = Math.max(0, 27.13 * Math.abs(bA) / (400 - Math.abs(bA))), bC = signum(bA) * (100 / viewingConditions.fl) * Math.pow(bCBase, 1 / .42), rF = rC / viewingConditions.rgbD[0], gF = gC / viewingConditions.rgbD[1], bF = bC / viewingConditions.rgbD[2];
          return argbFromXyz(1.86206786 * rF - 1.01125463 * gF + .14918677 * bF, .38752654 * rF + .62144744 * gF - .00897398 * bF, -.0158415 * rF - .03412294 * gF + 1.04996444 * bF);
      }
      static fromXyzInViewingConditions(x, y, z, viewingConditions) {
          const rC = .401288 * x + .650173 * y - .051461 * z, gC = -.250268 * x + 1.204414 * y + .045854 * z, bC = -.002079 * x + .048952 * y + .953127 * z, rD = viewingConditions.rgbD[0] * rC, gD = viewingConditions.rgbD[1] * gC, bD = viewingConditions.rgbD[2] * bC, rAF = Math.pow(viewingConditions.fl * Math.abs(rD) / 100, .42), gAF = Math.pow(viewingConditions.fl * Math.abs(gD) / 100, .42), bAF = Math.pow(viewingConditions.fl * Math.abs(bD) / 100, .42), rA = 400 * signum(rD) * rAF / (rAF + 27.13), gA = 400 * signum(gD) * gAF / (gAF + 27.13), bA = 400 * signum(bD) * bAF / (bAF + 27.13), a = (11 * rA + -12 * gA + bA) / 11, b = (rA + gA - 2 * bA) / 9, u = (20 * rA + 20 * gA + 21 * bA) / 20, p2 = (40 * rA + 20 * gA + bA) / 20, atanDegrees = 180 * Math.atan2(b, a) / Math.PI, hue = atanDegrees < 0 ? atanDegrees + 360 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees, hueRadians = hue * Math.PI / 180, ac = p2 * viewingConditions.nbb, J = 100 * Math.pow(ac / viewingConditions.aw, viewingConditions.c * viewingConditions.z), Q = 4 / viewingConditions.c * Math.sqrt(J / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot, huePrime = hue < 20.14 ? hue + 360 : hue, t = 5e4 / 13 * (1 / 4 * (Math.cos(huePrime * Math.PI / 180 + 2) + 3.8)) * viewingConditions.nc * viewingConditions.ncb * Math.sqrt(a * a + b * b) / (u + .305), alpha = Math.pow(t, .9) * Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73), C = alpha * Math.sqrt(J / 100), M = C * viewingConditions.fLRoot, s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4)), jstar = (1 + 100 * .007) * J / (1 + .007 * J), mstar = Math.log(1 + .0228 * M) / .0228, astar = mstar * Math.cos(hueRadians), bstar = mstar * Math.sin(hueRadians);
          return new Cam16(hue, C, J, Q, M, s, jstar, astar, bstar);
      }
      xyzInViewingConditions(viewingConditions) {
          const alpha = 0 === this.chroma || 0 === this.j ? 0 : this.chroma / Math.sqrt(this.j / 100), t = Math.pow(alpha / Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73), 1 / .9), hRad = this.hue * Math.PI / 180, eHue = .25 * (Math.cos(hRad + 2) + 3.8), ac = viewingConditions.aw * Math.pow(this.j / 100, 1 / viewingConditions.c / viewingConditions.z), p1 = eHue * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb, p2 = ac / viewingConditions.nbb, hSin = Math.sin(hRad), hCos = Math.cos(hRad), gamma = 23 * (p2 + .305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin), a = gamma * hCos, b = gamma * hSin, rA = (460 * p2 + 451 * a + 288 * b) / 1403, gA = (460 * p2 - 891 * a - 261 * b) / 1403, bA = (460 * p2 - 220 * a - 6300 * b) / 1403, rCBase = Math.max(0, 27.13 * Math.abs(rA) / (400 - Math.abs(rA))), rC = signum(rA) * (100 / viewingConditions.fl) * Math.pow(rCBase, 1 / .42), gCBase = Math.max(0, 27.13 * Math.abs(gA) / (400 - Math.abs(gA))), gC = signum(gA) * (100 / viewingConditions.fl) * Math.pow(gCBase, 1 / .42), bCBase = Math.max(0, 27.13 * Math.abs(bA) / (400 - Math.abs(bA))), bC = signum(bA) * (100 / viewingConditions.fl) * Math.pow(bCBase, 1 / .42), rF = rC / viewingConditions.rgbD[0], gF = gC / viewingConditions.rgbD[1], bF = bC / viewingConditions.rgbD[2];
          return [
              1.86206786 * rF - 1.01125463 * gF + .14918677 * bF,
              .38752654 * rF + .62144744 * gF - .00897398 * bF,
              -.0158415 * rF - .03412294 * gF + 1.04996444 * bF
          ];
      }
      constructor(hue, chroma, j, q, m, s, jstar, astar, bstar){
          this.hue = hue, this.chroma = chroma, this.j = j, this.q = q, this.m = m, this.s = s, this.jstar = jstar, this.astar = astar, this.bstar = bstar;
      }
  };
  let HctSolver = class HctSolver {
      static sanitizeRadians(angle) {
          return (angle + 8 * Math.PI) % (2 * Math.PI);
      }
      static trueDelinearized(rgbComponent) {
          const normalized = rgbComponent / 100;
          let delinearized = 0;
          return delinearized = normalized <= .0031308 ? 12.92 * normalized : 1.055 * Math.pow(normalized, 1 / 2.4) - .055, 255 * delinearized;
      }
      static chromaticAdaptation(component) {
          const af = Math.pow(Math.abs(component), .42);
          return 400 * signum(component) * af / (af + 27.13);
      }
      static hueOf(linrgb) {
          const scaledDiscount = matrixMultiply(linrgb, HctSolver.SCALED_DISCOUNT_FROM_LINRGB), rA = HctSolver.chromaticAdaptation(scaledDiscount[0]), gA = HctSolver.chromaticAdaptation(scaledDiscount[1]), bA = HctSolver.chromaticAdaptation(scaledDiscount[2]), a = (11 * rA + -12 * gA + bA) / 11, b = (rA + gA - 2 * bA) / 9;
          return Math.atan2(b, a);
      }
      static areInCyclicOrder(a, b, c) {
          return HctSolver.sanitizeRadians(b - a) < HctSolver.sanitizeRadians(c - a);
      }
      static intercept(source, mid, target) {
          return (mid - source) / (target - source);
      }
      static lerpPoint(source, t, target) {
          return [
              source[0] + (target[0] - source[0]) * t,
              source[1] + (target[1] - source[1]) * t,
              source[2] + (target[2] - source[2]) * t
          ];
      }
      static setCoordinate(source, coordinate, target, axis) {
          const t = HctSolver.intercept(source[axis], coordinate, target[axis]);
          return HctSolver.lerpPoint(source, t, target);
      }
      static isBounded(x) {
          return 0 <= x && x <= 100;
      }
      static nthVertex(y, n) {
          const kR = HctSolver.Y_FROM_LINRGB[0], kG = HctSolver.Y_FROM_LINRGB[1], kB = HctSolver.Y_FROM_LINRGB[2], coordA = n % 4 <= 1 ? 0 : 100, coordB = n % 2 == 0 ? 0 : 100;
          if (n < 4) {
              const g = coordA, b = coordB, r = (y - g * kG - b * kB) / kR;
              return HctSolver.isBounded(r) ? [
                  r,
                  g,
                  b
              ] : [
                  -1,
                  -1,
                  -1
              ];
          }
          if (n < 8) {
              const b = coordA, r = coordB, g = (y - r * kR - b * kB) / kG;
              return HctSolver.isBounded(g) ? [
                  r,
                  g,
                  b
              ] : [
                  -1,
                  -1,
                  -1
              ];
          }
          {
              const r = coordA, g = coordB, b = (y - r * kR - g * kG) / kB;
              return HctSolver.isBounded(b) ? [
                  r,
                  g,
                  b
              ] : [
                  -1,
                  -1,
                  -1
              ];
          }
      }
      static bisectToSegment(y, targetHue) {
          let left = [
              -1,
              -1,
              -1
          ], right = left, leftHue = 0, rightHue = 0, initialized = !1, uncut = !0;
          for(let n = 0; n < 12; n++){
              const mid = HctSolver.nthVertex(y, n);
              if (mid[0] < 0) continue;
              const midHue = HctSolver.hueOf(mid);
              initialized ? (uncut || HctSolver.areInCyclicOrder(leftHue, midHue, rightHue)) && (uncut = !1, HctSolver.areInCyclicOrder(leftHue, targetHue, midHue) ? (right = mid, rightHue = midHue) : (left = mid, leftHue = midHue)) : (left = mid, right = mid, leftHue = midHue, rightHue = midHue, initialized = !0);
          }
          return [
              left,
              right
          ];
      }
      static midpoint(a, b) {
          return [
              (a[0] + b[0]) / 2,
              (a[1] + b[1]) / 2,
              (a[2] + b[2]) / 2
          ];
      }
      static criticalPlaneBelow(x) {
          return Math.floor(x - .5);
      }
      static criticalPlaneAbove(x) {
          return Math.ceil(x - .5);
      }
      static bisectToLimit(y, targetHue) {
          const segment = HctSolver.bisectToSegment(y, targetHue);
          let left = segment[0], leftHue = HctSolver.hueOf(left), right = segment[1];
          for(let axis = 0; axis < 3; axis++)if (left[axis] !== right[axis]) {
              let lPlane = -1, rPlane = 255;
              left[axis] < right[axis] ? (lPlane = HctSolver.criticalPlaneBelow(HctSolver.trueDelinearized(left[axis])), rPlane = HctSolver.criticalPlaneAbove(HctSolver.trueDelinearized(right[axis]))) : (lPlane = HctSolver.criticalPlaneAbove(HctSolver.trueDelinearized(left[axis])), rPlane = HctSolver.criticalPlaneBelow(HctSolver.trueDelinearized(right[axis])));
              for(let i = 0; i < 8 && !(Math.abs(rPlane - lPlane) <= 1); i++){
                  const mPlane = Math.floor((lPlane + rPlane) / 2), midPlaneCoordinate = HctSolver.CRITICAL_PLANES[mPlane], mid = HctSolver.setCoordinate(left, midPlaneCoordinate, right, axis), midHue = HctSolver.hueOf(mid);
                  HctSolver.areInCyclicOrder(leftHue, targetHue, midHue) ? (right = mid, rPlane = mPlane) : (left = mid, leftHue = midHue, lPlane = mPlane);
              }
          }
          return HctSolver.midpoint(left, right);
      }
      static inverseChromaticAdaptation(adapted) {
          const adaptedAbs = Math.abs(adapted), base = Math.max(0, 27.13 * adaptedAbs / (400 - adaptedAbs));
          return signum(adapted) * Math.pow(base, 1 / .42);
      }
      static findResultByJ(hueRadians, chroma, y) {
          let j = 11 * Math.sqrt(y);
          const viewingConditions = ViewingConditions.DEFAULT, tInnerCoeff = 1 / Math.pow(1.64 - Math.pow(.29, viewingConditions.n), .73), p1 = .25 * (Math.cos(hueRadians + 2) + 3.8) * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb, hSin = Math.sin(hueRadians), hCos = Math.cos(hueRadians);
          for(let iterationRound = 0; iterationRound < 5; iterationRound++){
              const jNormalized = j / 100, alpha = 0 === chroma || 0 === j ? 0 : chroma / Math.sqrt(jNormalized), t = Math.pow(alpha * tInnerCoeff, 1 / .9), p2 = viewingConditions.aw * Math.pow(jNormalized, 1 / viewingConditions.c / viewingConditions.z) / viewingConditions.nbb, gamma = 23 * (p2 + .305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin), a = gamma * hCos, b = gamma * hSin, rA = (460 * p2 + 451 * a + 288 * b) / 1403, gA = (460 * p2 - 891 * a - 261 * b) / 1403, bA = (460 * p2 - 220 * a - 6300 * b) / 1403, linrgb = matrixMultiply([
                  HctSolver.inverseChromaticAdaptation(rA),
                  HctSolver.inverseChromaticAdaptation(gA),
                  HctSolver.inverseChromaticAdaptation(bA)
              ], HctSolver.LINRGB_FROM_SCALED_DISCOUNT);
              if (linrgb[0] < 0 || linrgb[1] < 0 || linrgb[2] < 0) return 0;
              const kR = HctSolver.Y_FROM_LINRGB[0], kG = HctSolver.Y_FROM_LINRGB[1], kB = HctSolver.Y_FROM_LINRGB[2], fnj = kR * linrgb[0] + kG * linrgb[1] + kB * linrgb[2];
              if (fnj <= 0) return 0;
              if (4 === iterationRound || Math.abs(fnj - y) < .002) return linrgb[0] > 100.01 || linrgb[1] > 100.01 || linrgb[2] > 100.01 ? 0 : argbFromLinrgb(linrgb);
              j -= (fnj - y) * j / (2 * fnj);
          }
          return 0;
      }
      static solveToInt(hueDegrees, chroma, lstar) {
          if (chroma < 1e-4 || lstar < 1e-4 || lstar > 99.9999) return argbFromLstar(lstar);
          const hueRadians = (hueDegrees = sanitizeDegreesDouble(hueDegrees)) / 180 * Math.PI, y = yFromLstar(lstar), exactAnswer = HctSolver.findResultByJ(hueRadians, chroma, y);
          if (0 !== exactAnswer) return exactAnswer;
          return argbFromLinrgb(HctSolver.bisectToLimit(y, hueRadians));
      }
      static solveToCam(hueDegrees, chroma, lstar) {
          return Cam16.fromInt(HctSolver.solveToInt(hueDegrees, chroma, lstar));
      }
  };
  HctSolver.SCALED_DISCOUNT_FROM_LINRGB = [
      [
          .001200833568784504,
          .002389694492170889,
          .0002795742885861124
      ],
      [
          .0005891086651375999,
          .0029785502573438758,
          .0003270666104008398
      ],
      [
          .00010146692491640572,
          .0005364214359186694,
          .0032979401770712076
      ]
  ], HctSolver.LINRGB_FROM_SCALED_DISCOUNT = [
      [
          1373.2198709594231,
          -1100.4251190754821,
          -7.278681089101213
      ],
      [
          -271.815969077903,
          559.6580465940733,
          -32.46047482791194
      ],
      [
          1.9622899599665666,
          -57.173814538844006,
          308.7233197812385
      ]
  ], HctSolver.Y_FROM_LINRGB = [
      .2126,
      .7152,
      .0722
  ], HctSolver.CRITICAL_PLANES = [
      .015176349177441876,
      .045529047532325624,
      .07588174588720938,
      .10623444424209313,
      .13658714259697685,
      .16693984095186062,
      .19729253930674434,
      .2276452376616281,
      .2579979360165119,
      .28835063437139563,
      .3188300904430532,
      .350925934958123,
      .3848314933096426,
      .42057480301049466,
      .458183274052838,
      .4976837250274023,
      .5391024159806381,
      .5824650784040898,
      .6277969426914107,
      .6751227633498623,
      .7244668422128921,
      .775853049866786,
      .829304845476233,
      .8848452951698498,
      .942497089126609,
      1.0022825574869039,
      1.0642236851973577,
      1.1283421258858297,
      1.1946592148522128,
      1.2631959812511864,
      1.3339731595349034,
      1.407011200216447,
      1.4823302800086415,
      1.5599503113873272,
      1.6398909516233677,
      1.7221716113234105,
      1.8068114625156377,
      1.8938294463134073,
      1.9832442801866852,
      2.075074464868551,
      2.1693382909216234,
      2.2660538449872063,
      2.36523901573795,
      2.4669114995532007,
      2.5710888059345764,
      2.6777882626779785,
      2.7870270208169257,
      2.898822059350997,
      3.0131901897720907,
      3.1301480604002863,
      3.2497121605402226,
      3.3718988244681087,
      3.4967242352587946,
      3.624204428461639,
      3.754355295633311,
      3.887192587735158,
      4.022731918402185,
      4.160988767090289,
      4.301978482107941,
      4.445716283538092,
      4.592217266055746,
      4.741496401646282,
      4.893568542229298,
      5.048448422192488,
      5.20615066083972,
      5.3666897647573375,
      5.5300801301023865,
      5.696336044816294,
      5.865471690767354,
      6.037501145825082,
      6.212438385869475,
      6.390297286737924,
      6.571091626112461,
      6.7548350853498045,
      6.941541251256611,
      7.131223617812143,
      7.323895587840543,
      7.5195704746346665,
      7.7182615035334345,
      7.919981813454504,
      8.124744458384042,
      8.332562408825165,
      8.543448553206703,
      8.757415699253682,
      8.974476575321063,
      9.194643831691977,
      9.417930041841839,
      9.644347703669503,
      9.873909240696694,
      10.106627003236781,
      10.342513269534024,
      10.58158024687427,
      10.8238400726681,
      11.069304815507364,
      11.317986476196008,
      11.569896988756009,
      11.825048221409341,
      12.083451977536606,
      12.345119996613247,
      12.610063955123938,
      12.878295467455942,
      13.149826086772048,
      13.42466730586372,
      13.702830557985108,
      13.984327217668513,
      14.269168601521828,
      14.55736596900856,
      14.848930523210871,
      15.143873411576273,
      15.44220572664832,
      15.743938506781891,
      16.04908273684337,
      16.35764934889634,
      16.66964922287304,
      16.985093187232053,
      17.30399201960269,
      17.62635644741625,
      17.95219714852476,
      18.281524751807332,
      18.614349837764564,
      18.95068293910138,
      19.290534541298456,
      19.633915083172692,
      19.98083495742689,
      20.331304511189067,
      20.685334046541502,
      21.042933821039977,
      21.404114048223256,
      21.76888489811322,
      22.137256497705877,
      22.50923893145328,
      22.884842241736916,
      23.264076429332462,
      23.6469514538663,
      24.033477234264016,
      24.42366364919083,
      24.817520537484558,
      25.21505769858089,
      25.61628489293138,
      26.021211842414342,
      26.429848230738664,
      26.842203703840827,
      27.258287870275353,
      27.678110301598522,
      28.10168053274597,
      28.529008062403893,
      28.96010235337422,
      29.39497283293396,
      29.83362889318845,
      30.276079891419332,
      30.722335150426627,
      31.172403958865512,
      31.62629557157785,
      32.08401920991837,
      32.54558406207592,
      33.010999283389665,
      33.4802739966603,
      33.953417292456834,
      34.430438229418264,
      34.911345834551085,
      35.39614910352207,
      35.88485700094671,
      36.37747846067349,
      36.87402238606382,
      37.37449765026789,
      37.87891309649659,
      38.38727753828926,
      38.89959975977785,
      39.41588851594697,
      39.93615253289054,
      40.460400508064545,
      40.98864111053629,
      41.520882981230194,
      42.05713473317016,
      42.597404951718396,
      43.141702194811224,
      43.6900349931913,
      44.24241185063697,
      44.798841244188324,
      45.35933162437017,
      45.92389141541209,
      46.49252901546552,
      47.065252796817916,
      47.64207110610409,
      48.22299226451468,
      48.808024568002054,
      49.3971762874833,
      49.9904556690408,
      50.587870934119984,
      51.189430279724725,
      51.79514187861014,
      52.40501387947288,
      53.0190544071392,
      53.637271562750364,
      54.259673423945976,
      54.88626804504493,
      55.517063457223934,
      56.15206766869424,
      56.79128866487574,
      57.43473440856916,
      58.08241284012621,
      58.734331877617365,
      59.39049941699807,
      60.05092333227251,
      60.715611475655585,
      61.38457167773311,
      62.057811747619894,
      62.7353394731159,
      63.417162620860914,
      64.10328893648692,
      64.79372614476921,
      65.48848194977529,
      66.18756403501224,
      66.89098006357258,
      67.59873767827808,
      68.31084450182222,
      69.02730813691093,
      69.74813616640164,
      70.47333615344107,
      71.20291564160104,
      71.93688215501312,
      72.67524319850172,
      73.41800625771542,
      74.16517879925733,
      74.9167682708136,
      75.67278210128072,
      76.43322770089146,
      77.1981124613393,
      77.96744375590167,
      78.74122893956174,
      79.51947534912904,
      80.30219030335869,
      81.08938110306934,
      81.88105503125999,
      82.67721935322541,
      83.4778813166706,
      84.28304815182372,
      85.09272707154808,
      85.90692527145302,
      86.72564993000343,
      87.54890820862819,
      88.3767072518277,
      89.2090541872801,
      90.04595612594655,
      90.88742016217518,
      91.73345337380438,
      92.58406282226491,
      93.43925555268066,
      94.29903859396902,
      95.16341895893969,
      96.03240364439274,
      96.9059996312159,
      97.78421388448044,
      98.6670533535366,
      99.55452497210776
  ];
  let Hct = class Hct {
      static from(hue, chroma, tone) {
          return new Hct(HctSolver.solveToInt(hue, chroma, tone));
      }
      static fromInt(argb) {
          return new Hct(argb);
      }
      toInt() {
          return this.argb;
      }
      get hue() {
          return this.internalHue;
      }
      set hue(newHue) {
          this.setInternalState(HctSolver.solveToInt(newHue, this.internalChroma, this.internalTone));
      }
      get chroma() {
          return this.internalChroma;
      }
      set chroma(newChroma) {
          this.setInternalState(HctSolver.solveToInt(this.internalHue, newChroma, this.internalTone));
      }
      get tone() {
          return this.internalTone;
      }
      set tone(newTone) {
          this.setInternalState(HctSolver.solveToInt(this.internalHue, this.internalChroma, newTone));
      }
      setInternalState(argb) {
          const cam = Cam16.fromInt(argb);
          this.internalHue = cam.hue, this.internalChroma = cam.chroma, this.internalTone = lstarFromArgb(argb), this.argb = argb;
      }
      inViewingConditions(vc) {
          const viewedInVc = Cam16.fromInt(this.toInt()).xyzInViewingConditions(vc), recastInVc = Cam16.fromXyzInViewingConditions(viewedInVc[0], viewedInVc[1], viewedInVc[2], ViewingConditions.make());
          return Hct.from(recastInVc.hue, recastInVc.chroma, lstarFromY(viewedInVc[1]));
      }
      constructor(argb){
          this.argb = argb;
          const cam = Cam16.fromInt(argb);
          this.internalHue = cam.hue, this.internalChroma = cam.chroma, this.internalTone = lstarFromArgb(argb), this.argb = argb;
      }
  };
  let Blend = class Blend {
      static harmonize(designColor, sourceColor) {
          const fromHct = Hct.fromInt(designColor), toHct = Hct.fromInt(sourceColor), differenceDegrees$1 = differenceDegrees(fromHct.hue, toHct.hue), rotationDegrees = Math.min(.5 * differenceDegrees$1, 15), outputHue = sanitizeDegreesDouble(fromHct.hue + rotationDegrees * rotationDirection(fromHct.hue, toHct.hue));
          return Hct.from(outputHue, fromHct.chroma, fromHct.tone).toInt();
      }
      static hctHue(from, to, amount) {
          const ucs = Blend.cam16Ucs(from, to, amount), ucsCam = Cam16.fromInt(ucs), fromCam = Cam16.fromInt(from);
          return Hct.from(ucsCam.hue, fromCam.chroma, lstarFromArgb(from)).toInt();
      }
      static cam16Ucs(from, to, amount) {
          const fromCam = Cam16.fromInt(from), toCam = Cam16.fromInt(to), fromJ = fromCam.jstar, fromA = fromCam.astar, fromB = fromCam.bstar, jstar = fromJ + (toCam.jstar - fromJ) * amount, astar = fromA + (toCam.astar - fromA) * amount, bstar = fromB + (toCam.bstar - fromB) * amount;
          return Cam16.fromUcs(jstar, astar, bstar).toInt();
      }
  };
  let Contrast = class Contrast {
      static ratioOfTones(toneA, toneB) {
          return toneA = clampDouble(0, 100, toneA), toneB = clampDouble(0, 100, toneB), Contrast.ratioOfYs(yFromLstar(toneA), yFromLstar(toneB));
      }
      static ratioOfYs(y1, y2) {
          const lighter = y1 > y2 ? y1 : y2;
          return (lighter + 5) / ((lighter === y2 ? y1 : y2) + 5);
      }
      static lighter(tone, ratio) {
          if (tone < 0 || tone > 100) return -1;
          const darkY = yFromLstar(tone), lightY = ratio * (darkY + 5) - 5, realContrast = Contrast.ratioOfYs(lightY, darkY), delta = Math.abs(realContrast - ratio);
          if (realContrast < ratio && delta > .04) return -1;
          const returnValue = lstarFromY(lightY) + .4;
          return returnValue < 0 || returnValue > 100 ? -1 : returnValue;
      }
      static darker(tone, ratio) {
          if (tone < 0 || tone > 100) return -1;
          const lightY = yFromLstar(tone), darkY = (lightY + 5) / ratio - 5, realContrast = Contrast.ratioOfYs(lightY, darkY), delta = Math.abs(realContrast - ratio);
          if (realContrast < ratio && delta > .04) return -1;
          const returnValue = lstarFromY(darkY) - .4;
          return returnValue < 0 || returnValue > 100 ? -1 : returnValue;
      }
      static lighterUnsafe(tone, ratio) {
          const lighterSafe = Contrast.lighter(tone, ratio);
          return lighterSafe < 0 ? 100 : lighterSafe;
      }
      static darkerUnsafe(tone, ratio) {
          const darkerSafe = Contrast.darker(tone, ratio);
          return darkerSafe < 0 ? 0 : darkerSafe;
      }
  };
  let DislikeAnalyzer = class DislikeAnalyzer {
      static isDisliked(hct) {
          const huePasses = Math.round(hct.hue) >= 90 && Math.round(hct.hue) <= 111, chromaPasses = Math.round(hct.chroma) > 16, tonePasses = Math.round(hct.tone) < 65;
          return huePasses && chromaPasses && tonePasses;
      }
      static fixIfDisliked(hct) {
          return DislikeAnalyzer.isDisliked(hct) ? Hct.from(hct.hue, hct.chroma, 70) : hct;
      }
  };
  let DynamicColor = class DynamicColor {
      static fromPalette(args) {
          var _args_name, _args_isBackground;
          return new DynamicColor((_args_name = args.name) != null ? _args_name : "", args.palette, args.tone, (_args_isBackground = args.isBackground) != null ? _args_isBackground : !1, args.background, args.secondBackground, args.contrastCurve, args.toneDeltaPair);
      }
      getArgb(scheme) {
          return this.getHct(scheme).toInt();
      }
      getHct(scheme) {
          const cachedAnswer = this.hctCache.get(scheme);
          if (null != cachedAnswer) return cachedAnswer;
          const tone = this.getTone(scheme), answer = this.palette(scheme).getHct(tone);
          return this.hctCache.size > 4 && this.hctCache.clear(), this.hctCache.set(scheme, answer), answer;
      }
      getTone(scheme) {
          const decreasingContrast = scheme.contrastLevel < 0;
          if (this.toneDeltaPair) {
              const toneDeltaPair = this.toneDeltaPair(scheme), roleA = toneDeltaPair.roleA, roleB = toneDeltaPair.roleB, delta = toneDeltaPair.delta, polarity = toneDeltaPair.polarity, stayTogether = toneDeltaPair.stayTogether, bgTone = this.background(scheme).getTone(scheme), aIsNearer = "nearer" === polarity || "lighter" === polarity && !scheme.isDark || "darker" === polarity && scheme.isDark, nearer = aIsNearer ? roleA : roleB, farther = aIsNearer ? roleB : roleA, amNearer = this.name === nearer.name, expansionDir = scheme.isDark ? 1 : -1, nContrast = nearer.contrastCurve.getContrast(scheme.contrastLevel), fContrast = farther.contrastCurve.getContrast(scheme.contrastLevel), nInitialTone = nearer.tone(scheme);
              let nTone = Contrast.ratioOfTones(bgTone, nInitialTone) >= nContrast ? nInitialTone : DynamicColor.foregroundTone(bgTone, nContrast);
              const fInitialTone = farther.tone(scheme);
              let fTone = Contrast.ratioOfTones(bgTone, fInitialTone) >= fContrast ? fInitialTone : DynamicColor.foregroundTone(bgTone, fContrast);
              return decreasingContrast && (nTone = DynamicColor.foregroundTone(bgTone, nContrast), fTone = DynamicColor.foregroundTone(bgTone, fContrast)), (fTone - nTone) * expansionDir >= delta || (fTone = clampDouble(0, 100, nTone + delta * expansionDir), (fTone - nTone) * expansionDir >= delta || (nTone = clampDouble(0, 100, fTone - delta * expansionDir))), 50 <= nTone && nTone < 60 ? expansionDir > 0 ? (nTone = 60, fTone = Math.max(fTone, nTone + delta * expansionDir)) : (nTone = 49, fTone = Math.min(fTone, nTone + delta * expansionDir)) : 50 <= fTone && fTone < 60 && (stayTogether ? expansionDir > 0 ? (nTone = 60, fTone = Math.max(fTone, nTone + delta * expansionDir)) : (nTone = 49, fTone = Math.min(fTone, nTone + delta * expansionDir)) : fTone = expansionDir > 0 ? 60 : 49), amNearer ? nTone : fTone;
          }
          {
              let answer = this.tone(scheme);
              if (null == this.background) return answer;
              const bgTone = this.background(scheme).getTone(scheme), desiredRatio = this.contrastCurve.getContrast(scheme.contrastLevel);
              if (Contrast.ratioOfTones(bgTone, answer) >= desiredRatio || (answer = DynamicColor.foregroundTone(bgTone, desiredRatio)), decreasingContrast && (answer = DynamicColor.foregroundTone(bgTone, desiredRatio)), this.isBackground && 50 <= answer && answer < 60 && (answer = Contrast.ratioOfTones(49, bgTone) >= desiredRatio ? 49 : 60), this.secondBackground) {
                  const [bg1, bg2] = [
                      this.background,
                      this.secondBackground
                  ], [bgTone1, bgTone2] = [
                      bg1(scheme).getTone(scheme),
                      bg2(scheme).getTone(scheme)
                  ], [upper, lower] = [
                      Math.max(bgTone1, bgTone2),
                      Math.min(bgTone1, bgTone2)
                  ];
                  if (Contrast.ratioOfTones(upper, answer) >= desiredRatio && Contrast.ratioOfTones(lower, answer) >= desiredRatio) return answer;
                  const lightOption = Contrast.lighter(upper, desiredRatio), darkOption = Contrast.darker(lower, desiredRatio), availables = [];
                  -1 !== lightOption && availables.push(lightOption), -1 !== darkOption && availables.push(darkOption);
                  return DynamicColor.tonePrefersLightForeground(bgTone1) || DynamicColor.tonePrefersLightForeground(bgTone2) ? lightOption < 0 ? 100 : lightOption : 1 === availables.length ? availables[0] : darkOption < 0 ? 0 : darkOption;
              }
              return answer;
          }
      }
      static foregroundTone(bgTone, ratio) {
          const lighterTone = Contrast.lighterUnsafe(bgTone, ratio), darkerTone = Contrast.darkerUnsafe(bgTone, ratio), lighterRatio = Contrast.ratioOfTones(lighterTone, bgTone), darkerRatio = Contrast.ratioOfTones(darkerTone, bgTone);
          if (DynamicColor.tonePrefersLightForeground(bgTone)) {
              const negligibleDifference = Math.abs(lighterRatio - darkerRatio) < .1 && lighterRatio < ratio && darkerRatio < ratio;
              return lighterRatio >= ratio || lighterRatio >= darkerRatio || negligibleDifference ? lighterTone : darkerTone;
          }
          return darkerRatio >= ratio || darkerRatio >= lighterRatio ? darkerTone : lighterTone;
      }
      static tonePrefersLightForeground(tone) {
          return Math.round(tone) < 60;
      }
      static toneAllowsLightForeground(tone) {
          return Math.round(tone) <= 49;
      }
      static enableLightForeground(tone) {
          return DynamicColor.tonePrefersLightForeground(tone) && !DynamicColor.toneAllowsLightForeground(tone) ? 49 : tone;
      }
      constructor(name, palette, tone, isBackground, background, secondBackground, contrastCurve, toneDeltaPair){
          if (this.name = name, this.palette = palette, this.tone = tone, this.isBackground = isBackground, this.background = background, this.secondBackground = secondBackground, this.contrastCurve = contrastCurve, this.toneDeltaPair = toneDeltaPair, this.hctCache = new Map, !background && secondBackground) throw new Error(`Color ${name} has secondBackgrounddefined, but background is not defined.`);
          if (!background && contrastCurve) throw new Error(`Color ${name} has contrastCurvedefined, but background is not defined.`);
          if (background && !contrastCurve) throw new Error(`Color ${name} has backgrounddefined, but contrastCurve is not defined.`);
      }
  };
  var Variant;
  !function(Variant) {
      Variant[Variant.MONOCHROME = 0] = "MONOCHROME", Variant[Variant.NEUTRAL = 1] = "NEUTRAL", Variant[Variant.TONAL_SPOT = 2] = "TONAL_SPOT", Variant[Variant.VIBRANT = 3] = "VIBRANT", Variant[Variant.EXPRESSIVE = 4] = "EXPRESSIVE", Variant[Variant.FIDELITY = 5] = "FIDELITY", Variant[Variant.CONTENT = 6] = "CONTENT", Variant[Variant.RAINBOW = 7] = "RAINBOW", Variant[Variant.FRUIT_SALAD = 8] = "FRUIT_SALAD";
  }(Variant || (Variant = {}));
  let ContrastCurve = class ContrastCurve {
      getContrast(contrastLevel) {
          return contrastLevel <= -1 ? this.low : contrastLevel < 0 ? lerp(this.low, this.normal, (contrastLevel - -1) / 1) : contrastLevel < .5 ? lerp(this.normal, this.medium, (contrastLevel - 0) / .5) : contrastLevel < 1 ? lerp(this.medium, this.high, (contrastLevel - .5) / .5) : this.high;
      }
      constructor(low, normal, medium, high){
          this.low = low, this.normal = normal, this.medium = medium, this.high = high;
      }
  };
  let ToneDeltaPair = class ToneDeltaPair {
      constructor(roleA, roleB, delta, polarity, stayTogether){
          this.roleA = roleA, this.roleB = roleB, this.delta = delta, this.polarity = polarity, this.stayTogether = stayTogether;
      }
  };
  function isFidelity(scheme) {
      return scheme.variant === Variant.FIDELITY || scheme.variant === Variant.CONTENT;
  }
  function isMonochrome(scheme) {
      return scheme.variant === Variant.MONOCHROME;
  }
  function findDesiredChromaByTone(hue, chroma, tone, byDecreasingTone) {
      let answer = tone, closestToChroma = Hct.from(hue, chroma, tone);
      if (closestToChroma.chroma < chroma) {
          let chromaPeak = closestToChroma.chroma;
          for(; closestToChroma.chroma < chroma;){
              answer += byDecreasingTone ? -1 : 1;
              const potentialSolution = Hct.from(hue, chroma, answer);
              if (chromaPeak > potentialSolution.chroma) break;
              if (Math.abs(potentialSolution.chroma - chroma) < .4) break;
              Math.abs(potentialSolution.chroma - chroma) < Math.abs(closestToChroma.chroma - chroma) && (closestToChroma = potentialSolution), chromaPeak = Math.max(chromaPeak, potentialSolution.chroma);
          }
      }
      return answer;
  }
  function viewingConditionsForAlbers(scheme) {
      return ViewingConditions.make(void 0, void 0, scheme.isDark ? 30 : 80, void 0, void 0);
  }
  function performAlbers(prealbers, scheme) {
      const albersd = prealbers.inViewingConditions(viewingConditionsForAlbers(scheme));
      return DynamicColor.tonePrefersLightForeground(prealbers.tone) && !DynamicColor.toneAllowsLightForeground(albersd.tone) ? DynamicColor.enableLightForeground(prealbers.tone) : DynamicColor.enableLightForeground(albersd.tone);
  }
  let MaterialDynamicColors = class MaterialDynamicColors {
      static highestSurface(s) {
          return s.isDark ? MaterialDynamicColors.surfaceBright : MaterialDynamicColors.surfaceDim;
      }
  };
  MaterialDynamicColors.contentAccentToneDelta = 15, MaterialDynamicColors.primaryPaletteKeyColor = DynamicColor.fromPalette({
      name: "primary_palette_key_color",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>s.primaryPalette.keyColor.tone
  }), MaterialDynamicColors.secondaryPaletteKeyColor = DynamicColor.fromPalette({
      name: "secondary_palette_key_color",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>s.secondaryPalette.keyColor.tone
  }), MaterialDynamicColors.tertiaryPaletteKeyColor = DynamicColor.fromPalette({
      name: "tertiary_palette_key_color",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>s.tertiaryPalette.keyColor.tone
  }), MaterialDynamicColors.neutralPaletteKeyColor = DynamicColor.fromPalette({
      name: "neutral_palette_key_color",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.neutralPalette.keyColor.tone
  }), MaterialDynamicColors.neutralVariantPaletteKeyColor = DynamicColor.fromPalette({
      name: "neutral_variant_palette_key_color",
      palette: (s)=>s.neutralVariantPalette,
      tone: (s)=>s.neutralVariantPalette.keyColor.tone
  }), MaterialDynamicColors.background = DynamicColor.fromPalette({
      name: "background",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 6 : 98,
      isBackground: !0
  }), MaterialDynamicColors.onBackground = DynamicColor.fromPalette({
      name: "on_background",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.background,
      contrastCurve: new ContrastCurve(3, 3, 4.5, 7)
  }), MaterialDynamicColors.surface = DynamicColor.fromPalette({
      name: "surface",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 6 : 98,
      isBackground: !0
  }), MaterialDynamicColors.surfaceDim = DynamicColor.fromPalette({
      name: "surface_dim",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 6 : 87,
      isBackground: !0
  }), MaterialDynamicColors.surfaceBright = DynamicColor.fromPalette({
      name: "surface_bright",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 24 : 98,
      isBackground: !0
  }), MaterialDynamicColors.surfaceContainerLowest = DynamicColor.fromPalette({
      name: "surface_container_lowest",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 4 : 100,
      isBackground: !0
  }), MaterialDynamicColors.surfaceContainerLow = DynamicColor.fromPalette({
      name: "surface_container_low",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 10 : 96,
      isBackground: !0
  }), MaterialDynamicColors.surfaceContainer = DynamicColor.fromPalette({
      name: "surface_container",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 12 : 94,
      isBackground: !0
  }), MaterialDynamicColors.surfaceContainerHigh = DynamicColor.fromPalette({
      name: "surface_container_high",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 17 : 92,
      isBackground: !0
  }), MaterialDynamicColors.surfaceContainerHighest = DynamicColor.fromPalette({
      name: "surface_container_highest",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 22 : 90,
      isBackground: !0
  }), MaterialDynamicColors.onSurface = DynamicColor.fromPalette({
      name: "on_surface",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.surfaceVariant = DynamicColor.fromPalette({
      name: "surface_variant",
      palette: (s)=>s.neutralVariantPalette,
      tone: (s)=>s.isDark ? 30 : 90,
      isBackground: !0
  }), MaterialDynamicColors.onSurfaceVariant = DynamicColor.fromPalette({
      name: "on_surface_variant",
      palette: (s)=>s.neutralVariantPalette,
      tone: (s)=>s.isDark ? 80 : 30,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11)
  }), MaterialDynamicColors.inverseSurface = DynamicColor.fromPalette({
      name: "inverse_surface",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 90 : 20
  }), MaterialDynamicColors.inverseOnSurface = DynamicColor.fromPalette({
      name: "inverse_on_surface",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>s.isDark ? 20 : 95,
      background: (s)=>MaterialDynamicColors.inverseSurface,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.outline = DynamicColor.fromPalette({
      name: "outline",
      palette: (s)=>s.neutralVariantPalette,
      tone: (s)=>s.isDark ? 60 : 50,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1.5, 3, 4.5, 7)
  }), MaterialDynamicColors.outlineVariant = DynamicColor.fromPalette({
      name: "outline_variant",
      palette: (s)=>s.neutralVariantPalette,
      tone: (s)=>s.isDark ? 30 : 80,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7)
  }), MaterialDynamicColors.shadow = DynamicColor.fromPalette({
      name: "shadow",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>0
  }), MaterialDynamicColors.scrim = DynamicColor.fromPalette({
      name: "scrim",
      palette: (s)=>s.neutralPalette,
      tone: (s)=>0
  }), MaterialDynamicColors.surfaceTint = DynamicColor.fromPalette({
      name: "surface_tint",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>s.isDark ? 80 : 40,
      isBackground: !0
  }), MaterialDynamicColors.primary = DynamicColor.fromPalette({
      name: "primary",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 100 : 0 : s.isDark ? 80 : 40,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.primaryContainer, MaterialDynamicColors.primary, 15, "nearer", !1)
  }), MaterialDynamicColors.onPrimary = DynamicColor.fromPalette({
      name: "on_primary",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 10 : 90 : s.isDark ? 20 : 100,
      background: (s)=>MaterialDynamicColors.primary,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.primaryContainer = DynamicColor.fromPalette({
      name: "primary_container",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isFidelity(s) ? performAlbers(s.sourceColorHct, s) : isMonochrome(s) ? s.isDark ? 85 : 25 : s.isDark ? 30 : 90,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.primaryContainer, MaterialDynamicColors.primary, 15, "nearer", !1)
  }), MaterialDynamicColors.onPrimaryContainer = DynamicColor.fromPalette({
      name: "on_primary_container",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isFidelity(s) ? DynamicColor.foregroundTone(MaterialDynamicColors.primaryContainer.tone(s), 4.5) : isMonochrome(s) ? s.isDark ? 0 : 100 : s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.primaryContainer,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.inversePrimary = DynamicColor.fromPalette({
      name: "inverse_primary",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>s.isDark ? 40 : 80,
      background: (s)=>MaterialDynamicColors.inverseSurface,
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11)
  }), MaterialDynamicColors.secondary = DynamicColor.fromPalette({
      name: "secondary",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>s.isDark ? 80 : 40,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.secondaryContainer, MaterialDynamicColors.secondary, 15, "nearer", !1)
  }), MaterialDynamicColors.onSecondary = DynamicColor.fromPalette({
      name: "on_secondary",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 10 : 100 : s.isDark ? 20 : 100,
      background: (s)=>MaterialDynamicColors.secondary,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.secondaryContainer = DynamicColor.fromPalette({
      name: "secondary_container",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>{
          const initialTone = s.isDark ? 30 : 90;
          if (isMonochrome(s)) return s.isDark ? 30 : 85;
          if (!isFidelity(s)) return initialTone;
          let answer = findDesiredChromaByTone(s.secondaryPalette.hue, s.secondaryPalette.chroma, initialTone, !s.isDark);
          return answer = performAlbers(s.secondaryPalette.getHct(answer), s), answer;
      },
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.secondaryContainer, MaterialDynamicColors.secondary, 15, "nearer", !1)
  }), MaterialDynamicColors.onSecondaryContainer = DynamicColor.fromPalette({
      name: "on_secondary_container",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>isFidelity(s) ? DynamicColor.foregroundTone(MaterialDynamicColors.secondaryContainer.tone(s), 4.5) : s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.secondaryContainer,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.tertiary = DynamicColor.fromPalette({
      name: "tertiary",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 90 : 25 : s.isDark ? 80 : 40,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.tertiaryContainer, MaterialDynamicColors.tertiary, 15, "nearer", !1)
  }), MaterialDynamicColors.onTertiary = DynamicColor.fromPalette({
      name: "on_tertiary",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 10 : 90 : s.isDark ? 20 : 100,
      background: (s)=>MaterialDynamicColors.tertiary,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.tertiaryContainer = DynamicColor.fromPalette({
      name: "tertiary_container",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>{
          if (isMonochrome(s)) return s.isDark ? 60 : 49;
          if (!isFidelity(s)) return s.isDark ? 30 : 90;
          const albersTone = performAlbers(s.tertiaryPalette.getHct(s.sourceColorHct.tone), s), proposedHct = s.tertiaryPalette.getHct(albersTone);
          return DislikeAnalyzer.fixIfDisliked(proposedHct).tone;
      },
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.tertiaryContainer, MaterialDynamicColors.tertiary, 15, "nearer", !1)
  }), MaterialDynamicColors.onTertiaryContainer = DynamicColor.fromPalette({
      name: "on_tertiary_container",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? s.isDark ? 0 : 100 : isFidelity(s) ? DynamicColor.foregroundTone(MaterialDynamicColors.tertiaryContainer.tone(s), 4.5) : s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.tertiaryContainer,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.error = DynamicColor.fromPalette({
      name: "error",
      palette: (s)=>s.errorPalette,
      tone: (s)=>s.isDark ? 80 : 40,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.errorContainer, MaterialDynamicColors.error, 15, "nearer", !1)
  }), MaterialDynamicColors.onError = DynamicColor.fromPalette({
      name: "on_error",
      palette: (s)=>s.errorPalette,
      tone: (s)=>s.isDark ? 20 : 100,
      background: (s)=>MaterialDynamicColors.error,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.errorContainer = DynamicColor.fromPalette({
      name: "error_container",
      palette: (s)=>s.errorPalette,
      tone: (s)=>s.isDark ? 30 : 90,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.errorContainer, MaterialDynamicColors.error, 15, "nearer", !1)
  }), MaterialDynamicColors.onErrorContainer = DynamicColor.fromPalette({
      name: "on_error_container",
      palette: (s)=>s.errorPalette,
      tone: (s)=>s.isDark ? 90 : 10,
      background: (s)=>MaterialDynamicColors.errorContainer,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.primaryFixed = DynamicColor.fromPalette({
      name: "primary_fixed",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? 40 : 90,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.primaryFixed, MaterialDynamicColors.primaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.primaryFixedDim = DynamicColor.fromPalette({
      name: "primary_fixed_dim",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? 30 : 80,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.primaryFixed, MaterialDynamicColors.primaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.onPrimaryFixed = DynamicColor.fromPalette({
      name: "on_primary_fixed",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? 100 : 10,
      background: (s)=>MaterialDynamicColors.primaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.primaryFixed,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.onPrimaryFixedVariant = DynamicColor.fromPalette({
      name: "on_primary_fixed_variant",
      palette: (s)=>s.primaryPalette,
      tone: (s)=>isMonochrome(s) ? 90 : 30,
      background: (s)=>MaterialDynamicColors.primaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.primaryFixed,
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11)
  }), MaterialDynamicColors.secondaryFixed = DynamicColor.fromPalette({
      name: "secondary_fixed",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>isMonochrome(s) ? 80 : 90,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.secondaryFixed, MaterialDynamicColors.secondaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.secondaryFixedDim = DynamicColor.fromPalette({
      name: "secondary_fixed_dim",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>isMonochrome(s) ? 70 : 80,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.secondaryFixed, MaterialDynamicColors.secondaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.onSecondaryFixed = DynamicColor.fromPalette({
      name: "on_secondary_fixed",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>10,
      background: (s)=>MaterialDynamicColors.secondaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.secondaryFixed,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.onSecondaryFixedVariant = DynamicColor.fromPalette({
      name: "on_secondary_fixed_variant",
      palette: (s)=>s.secondaryPalette,
      tone: (s)=>isMonochrome(s) ? 25 : 30,
      background: (s)=>MaterialDynamicColors.secondaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.secondaryFixed,
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11)
  }), MaterialDynamicColors.tertiaryFixed = DynamicColor.fromPalette({
      name: "tertiary_fixed",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? 40 : 90,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.tertiaryFixed, MaterialDynamicColors.tertiaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.tertiaryFixedDim = DynamicColor.fromPalette({
      name: "tertiary_fixed_dim",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? 30 : 80,
      isBackground: !0,
      background: (s)=>MaterialDynamicColors.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s)=>new ToneDeltaPair(MaterialDynamicColors.tertiaryFixed, MaterialDynamicColors.tertiaryFixedDim, 10, "lighter", !0)
  }), MaterialDynamicColors.onTertiaryFixed = DynamicColor.fromPalette({
      name: "on_tertiary_fixed",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? 100 : 10,
      background: (s)=>MaterialDynamicColors.tertiaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.tertiaryFixed,
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21)
  }), MaterialDynamicColors.onTertiaryFixedVariant = DynamicColor.fromPalette({
      name: "on_tertiary_fixed_variant",
      palette: (s)=>s.tertiaryPalette,
      tone: (s)=>isMonochrome(s) ? 90 : 30,
      background: (s)=>MaterialDynamicColors.tertiaryFixedDim,
      secondBackground: (s)=>MaterialDynamicColors.tertiaryFixed,
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11)
  });
  let TonalPalette = class TonalPalette {
      static fromInt(argb) {
          const hct = Hct.fromInt(argb);
          return TonalPalette.fromHct(hct);
      }
      static fromHct(hct) {
          return new TonalPalette(hct.hue, hct.chroma, hct);
      }
      static fromHueAndChroma(hue, chroma) {
          return new TonalPalette(hue, chroma, TonalPalette.createKeyColor(hue, chroma));
      }
      static createKeyColor(hue, chroma) {
          let smallestDeltaHct = Hct.from(hue, chroma, 50), smallestDelta = Math.abs(smallestDeltaHct.chroma - chroma);
          for(let delta = 1; delta < 50; delta += 1){
              if (Math.round(chroma) === Math.round(smallestDeltaHct.chroma)) return smallestDeltaHct;
              const hctAdd = Hct.from(hue, chroma, 50 + delta), hctAddDelta = Math.abs(hctAdd.chroma - chroma);
              hctAddDelta < smallestDelta && (smallestDelta = hctAddDelta, smallestDeltaHct = hctAdd);
              const hctSubtract = Hct.from(hue, chroma, 50 - delta), hctSubtractDelta = Math.abs(hctSubtract.chroma - chroma);
              hctSubtractDelta < smallestDelta && (smallestDelta = hctSubtractDelta, smallestDeltaHct = hctSubtract);
          }
          return smallestDeltaHct;
      }
      tone(tone) {
          let argb = this.cache.get(tone);
          return void 0 === argb && (argb = Hct.from(this.hue, this.chroma, tone).toInt(), this.cache.set(tone, argb)), argb;
      }
      getHct(tone) {
          return Hct.fromInt(this.tone(tone));
      }
      constructor(hue, chroma, keyColor){
          this.hue = hue, this.chroma = chroma, this.keyColor = keyColor, this.cache = new Map;
      }
  };
  let CorePalette = class CorePalette {
      static of(argb) {
          return new CorePalette(argb, !1);
      }
      static contentOf(argb) {
          return new CorePalette(argb, !0);
      }
      static fromColors(colors) {
          return CorePalette.createPaletteFromColors(!1, colors);
      }
      static contentFromColors(colors) {
          return CorePalette.createPaletteFromColors(!0, colors);
      }
      static createPaletteFromColors(content, colors) {
          const palette = new CorePalette(colors.primary, content);
          if (colors.secondary) {
              const p = new CorePalette(colors.secondary, content);
              palette.a2 = p.a1;
          }
          if (colors.tertiary) {
              const p = new CorePalette(colors.tertiary, content);
              palette.a3 = p.a1;
          }
          if (colors.error) {
              const p = new CorePalette(colors.error, content);
              palette.error = p.a1;
          }
          if (colors.neutral) {
              const p = new CorePalette(colors.neutral, content);
              palette.n1 = p.n1;
          }
          if (colors.neutralVariant) {
              const p = new CorePalette(colors.neutralVariant, content);
              palette.n2 = p.n2;
          }
          return palette;
      }
      constructor(argb, isContent){
          const hct = Hct.fromInt(argb), hue = hct.hue, chroma = hct.chroma;
          isContent ? (this.a1 = TonalPalette.fromHueAndChroma(hue, chroma), this.a2 = TonalPalette.fromHueAndChroma(hue, chroma / 3), this.a3 = TonalPalette.fromHueAndChroma(hue + 60, chroma / 2), this.n1 = TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 12, 4)), this.n2 = TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 6, 8))) : (this.a1 = TonalPalette.fromHueAndChroma(hue, Math.max(48, chroma)), this.a2 = TonalPalette.fromHueAndChroma(hue, 16), this.a3 = TonalPalette.fromHueAndChroma(hue + 60, 24), this.n1 = TonalPalette.fromHueAndChroma(hue, 4), this.n2 = TonalPalette.fromHueAndChroma(hue, 8)), this.error = TonalPalette.fromHueAndChroma(25, 84);
      }
  };
  let Scheme = class Scheme {
      get primary() {
          return this.props.primary;
      }
      get onPrimary() {
          return this.props.onPrimary;
      }
      get primaryContainer() {
          return this.props.primaryContainer;
      }
      get onPrimaryContainer() {
          return this.props.onPrimaryContainer;
      }
      get secondary() {
          return this.props.secondary;
      }
      get onSecondary() {
          return this.props.onSecondary;
      }
      get secondaryContainer() {
          return this.props.secondaryContainer;
      }
      get onSecondaryContainer() {
          return this.props.onSecondaryContainer;
      }
      get tertiary() {
          return this.props.tertiary;
      }
      get onTertiary() {
          return this.props.onTertiary;
      }
      get tertiaryContainer() {
          return this.props.tertiaryContainer;
      }
      get onTertiaryContainer() {
          return this.props.onTertiaryContainer;
      }
      get error() {
          return this.props.error;
      }
      get onError() {
          return this.props.onError;
      }
      get errorContainer() {
          return this.props.errorContainer;
      }
      get onErrorContainer() {
          return this.props.onErrorContainer;
      }
      get background() {
          return this.props.background;
      }
      get onBackground() {
          return this.props.onBackground;
      }
      get surface() {
          return this.props.surface;
      }
      get onSurface() {
          return this.props.onSurface;
      }
      get surfaceVariant() {
          return this.props.surfaceVariant;
      }
      get onSurfaceVariant() {
          return this.props.onSurfaceVariant;
      }
      get outline() {
          return this.props.outline;
      }
      get outlineVariant() {
          return this.props.outlineVariant;
      }
      get shadow() {
          return this.props.shadow;
      }
      get scrim() {
          return this.props.scrim;
      }
      get inverseSurface() {
          return this.props.inverseSurface;
      }
      get inverseOnSurface() {
          return this.props.inverseOnSurface;
      }
      get inversePrimary() {
          return this.props.inversePrimary;
      }
      static light(argb) {
          return Scheme.lightFromCorePalette(CorePalette.of(argb));
      }
      static dark(argb) {
          return Scheme.darkFromCorePalette(CorePalette.of(argb));
      }
      static lightContent(argb) {
          return Scheme.lightFromCorePalette(CorePalette.contentOf(argb));
      }
      static darkContent(argb) {
          return Scheme.darkFromCorePalette(CorePalette.contentOf(argb));
      }
      static lightFromCorePalette(core) {
          return new Scheme({
              primary: core.a1.tone(40),
              onPrimary: core.a1.tone(100),
              primaryContainer: core.a1.tone(90),
              onPrimaryContainer: core.a1.tone(10),
              secondary: core.a2.tone(40),
              onSecondary: core.a2.tone(100),
              secondaryContainer: core.a2.tone(90),
              onSecondaryContainer: core.a2.tone(10),
              tertiary: core.a3.tone(40),
              onTertiary: core.a3.tone(100),
              tertiaryContainer: core.a3.tone(90),
              onTertiaryContainer: core.a3.tone(10),
              error: core.error.tone(40),
              onError: core.error.tone(100),
              errorContainer: core.error.tone(90),
              onErrorContainer: core.error.tone(10),
              background: core.n1.tone(99),
              onBackground: core.n1.tone(10),
              surface: core.n1.tone(99),
              onSurface: core.n1.tone(10),
              surfaceVariant: core.n2.tone(90),
              onSurfaceVariant: core.n2.tone(30),
              outline: core.n2.tone(50),
              outlineVariant: core.n2.tone(80),
              shadow: core.n1.tone(0),
              scrim: core.n1.tone(0),
              inverseSurface: core.n1.tone(20),
              inverseOnSurface: core.n1.tone(95),
              inversePrimary: core.a1.tone(80)
          });
      }
      static darkFromCorePalette(core) {
          return new Scheme({
              primary: core.a1.tone(80),
              onPrimary: core.a1.tone(20),
              primaryContainer: core.a1.tone(30),
              onPrimaryContainer: core.a1.tone(90),
              secondary: core.a2.tone(80),
              onSecondary: core.a2.tone(20),
              secondaryContainer: core.a2.tone(30),
              onSecondaryContainer: core.a2.tone(90),
              tertiary: core.a3.tone(80),
              onTertiary: core.a3.tone(20),
              tertiaryContainer: core.a3.tone(30),
              onTertiaryContainer: core.a3.tone(90),
              error: core.error.tone(80),
              onError: core.error.tone(20),
              errorContainer: core.error.tone(30),
              onErrorContainer: core.error.tone(80),
              background: core.n1.tone(10),
              onBackground: core.n1.tone(90),
              surface: core.n1.tone(10),
              onSurface: core.n1.tone(90),
              surfaceVariant: core.n2.tone(30),
              onSurfaceVariant: core.n2.tone(80),
              outline: core.n2.tone(60),
              outlineVariant: core.n2.tone(30),
              shadow: core.n1.tone(0),
              scrim: core.n1.tone(0),
              inverseSurface: core.n1.tone(90),
              inverseOnSurface: core.n1.tone(20),
              inversePrimary: core.a1.tone(40)
          });
      }
      toJSON() {
          return _extends$1({}, this.props);
      }
      constructor(props){
          this.props = props;
      }
  };
  function hexFromArgb(argb) {
      const r = redFromArgb(argb), g = greenFromArgb(argb), b = blueFromArgb(argb), outParts = [
          r.toString(16),
          g.toString(16),
          b.toString(16)
      ];
      for (const [i, part] of outParts.entries())1 === part.length && (outParts[i] = "0" + part);
      return "#" + outParts.join("");
  }
  function argbFromHex(hex) {
      const isThree = 3 === (hex = hex.replace("#", "")).length, isSix = 6 === hex.length, isEight = 8 === hex.length;
      if (!isThree && !isSix && !isEight) throw new Error("unexpected hex " + hex);
      let r = 0, g = 0, b = 0;
      return isThree ? (r = parseIntHex(hex.slice(0, 1).repeat(2)), g = parseIntHex(hex.slice(1, 2).repeat(2)), b = parseIntHex(hex.slice(2, 3).repeat(2))) : isSix ? (r = parseIntHex(hex.slice(0, 2)), g = parseIntHex(hex.slice(2, 4)), b = parseIntHex(hex.slice(4, 6))) : isEight && (r = parseIntHex(hex.slice(2, 4)), g = parseIntHex(hex.slice(4, 6)), b = parseIntHex(hex.slice(6, 8))), (255 << 24 | (255 & r) << 16 | (255 & g) << 8 | 255 & b) >>> 0;
  }
  function parseIntHex(value) {
      return parseInt(value, 16);
  }
  function themeFromSourceColor(source, customColors = []) {
      const palette = CorePalette.of(source);
      return {
          source: source,
          schemes: {
              light: Scheme.light(source),
              dark: Scheme.dark(source)
          },
          palettes: {
              primary: palette.a1,
              secondary: palette.a2,
              tertiary: palette.a3,
              neutral: palette.n1,
              neutralVariant: palette.n2,
              error: palette.error
          },
          customColors: customColors.map((c)=>customColor(source, c))
      };
  }
  function customColor(source, color) {
      let value = color.value;
      const from = value, to = source;
      color.blend && (value = Blend.harmonize(from, to));
      const tones = CorePalette.of(value).a1;
      return {
          color: color,
          value: value,
          light: {
              color: tones.tone(40),
              onColor: tones.tone(100),
              colorContainer: tones.tone(90),
              onColorContainer: tones.tone(10)
          },
          dark: {
              color: tones.tone(80),
              onColor: tones.tone(20),
              colorContainer: tones.tone(30),
              onColorContainer: tones.tone(90)
          }
      };
  }
  // eslint-disable-next-line
  /* eslint-disable */ // prettier-ignore
  function toRGBA(d) {
      const r = Math.round;
      const l = d.length;
      const rgba = {};
      if (d.slice(0, 3).toLowerCase() === 'rgb') {
          d = d.replace(' ', '').split(',');
          rgba[0] = parseInt(d[0].slice(d[3].toLowerCase() === 'a' ? 5 : 4), 10);
          rgba[1] = parseInt(d[1], 10);
          rgba[2] = parseInt(d[2], 10);
          rgba[3] = d[3] ? parseFloat(d[3]) : -1;
      } else {
          if (l < 6) d = parseInt(String(d[1]) + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? String(d[4]) + d[4] : ''), 16);
          else d = parseInt(d.slice(1), 16);
          rgba[0] = d >> 16 & 255;
          rgba[1] = d >> 8 & 255;
          rgba[2] = d & 255;
          rgba[3] = l === 9 || l === 5 ? r((d >> 24 & 255) / 255 * 10000) / 10000 : -1;
      }
      return rgba;
  }
  // prettier-ignore
  function blend(from, to, p = 0.5) {
      const r = Math.round;
      from = from.trim();
      to = to.trim();
      const b = p < 0;
      p = b ? p * -1 : p;
      const f = toRGBA(from);
      const t = toRGBA(to);
      if (to[0] === 'r') {
          return 'rgb' + (to[3] === 'a' ? 'a(' : '(') + r((t[0] - f[0]) * p + f[0]) + ',' + r((t[1] - f[1]) * p + f[1]) + ',' + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? '' : ',' + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3])) + ')';
      }
      return '#' + (0x100000000 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255) * 0x1000000 + r((t[0] - f[0]) * p + f[0]) * 0x10000 + r((t[1] - f[1]) * p + f[1]) * 0x100 + r((t[2] - f[2]) * p + f[2])).toString(16).slice(f[3] > -1 || t[3] > -1 ? 1 : 3);
  }
  /* eslint-enable */ const materialColors = (hexColor = '')=>{
      const theme = themeFromSourceColor(argbFromHex(`#${hexColor.replace('#', '')}`));
      [
          0.05,
          0.08,
          0.11,
          0.12,
          0.14
      ].forEach((amount, index)=>{
          theme.schemes.light.props[`surface${index + 1}`] = argbFromHex(blend(hexFromArgb(theme.schemes.light.props.surface), hexFromArgb(theme.schemes.light.props.primary), amount));
          theme.schemes.dark.props[`surface${index + 1}`] = argbFromHex(blend(hexFromArgb(theme.schemes.dark.props.surface), hexFromArgb(theme.schemes.dark.props.primary), amount));
      });
      const name = (n)=>{
          return n.split('').map((char)=>char.toUpperCase() === char && char !== '-' && char !== '7' ? `-${char.toLowerCase()}` : char).join('');
      };
      const shouldSkip = (prop)=>{
          const skip = [
              'tertiary',
              'shadow',
              'scrim',
              'error',
              'background'
          ];
          return skip.filter((v)=>prop.toLowerCase().includes(v)).length > 0;
      };
      const light = {};
      const dark = {};
      Object.keys(theme.schemes.light.props).forEach((prop)=>{
          if (shouldSkip(prop)) return;
          light[name(`--f7-md-${prop}`)] = hexFromArgb(theme.schemes.light.props[prop]);
      });
      Object.keys(theme.schemes.dark.props).forEach((prop)=>{
          if (shouldSkip(prop)) return;
          dark[name(`--f7-md-${prop}`)] = hexFromArgb(theme.schemes.dark.props[prop]);
      });
      return {
          light,
          dark
      };
  };
  /* eslint no-control-regex: "off" */ let uniqueNumber = 1;
  const Utils = {
      uniqueNumber () {
          uniqueNumber += 1;
          return uniqueNumber;
      },
      id (mask = 'xxxxxxxxxx', map = '0123456789abcdef') {
          return $.uid(mask, map);
      },
      mdPreloaderContent: `
		<span class="preloader-inner">
			<svg viewBox="0 0 36 36">
				<circle cx="18" cy="18" r="16"></circle>
			</svg>
    </span>
  `.trim(),
      iosPreloaderContent: `
		<span class="preloader-inner">
			${[
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
    ].map(()=>'<span class="preloader-inner-line"></span>').join('')}
		</span>
  `.trim(),
      pcPreloaderContent: `
  <span class="preloader-inner">
    <span class="preloader-inner-circle"></span>
  </span>
`,
      eventNameToColonCase (eventName) {
          let hasColon;
          return eventName.split('').map((char, index)=>{
              if (char.match(/[A-Z]/) && index !== 0 && !hasColon) {
                  hasColon = true;
                  return `:${char.toLowerCase()}`;
              }
              return char.toLowerCase();
          }).join('');
      },
      deleteProps (obj) {
          $.deleteProps(obj);
      },
      requestAnimationFrame (cb) {
          return $.requestAnimationFrame(cb);
      },
      cancelAnimationFrame (id) {
          return $.cancelAnimationFrame(id);
      },
      nextTick (cb, delay = 0) {
          return $.nextTick(cb, delay);
      },
      nextFrame (cb) {
          return $.nextFrame(cb);
      },
      now () {
          return Date.now();
      },
      parseUrlQuery (url) {
          return $.urlParam(url);
      },
      getTranslate (el, axis = 'x') {
          return $.getTranslate(el, axis);
      },
      serializeObject (obj, parents = []) {
          if (typeof obj === 'string') return obj;
          const resultArray = [];
          const separator = '&';
          let newParents;
          function varName(name) {
              if (parents.length > 0) {
                  let parentParts = '';
                  for(let j = 0; j < parents.length; j += 1){
                      if (j === 0) parentParts += parents[j];
                      else parentParts += `[${encodeURIComponent(parents[j])}]`;
                  }
                  return `${parentParts}[${encodeURIComponent(name)}]`;
              }
              return encodeURIComponent(name);
          }
          function varValue(value) {
              return encodeURIComponent(value);
          }
          Object.keys(obj).forEach((prop)=>{
              let toPush;
              if (Array.isArray(obj[prop])) {
                  toPush = [];
                  for(let i = 0; i < obj[prop].length; i += 1){
                      if (!Array.isArray(obj[prop][i]) && typeof obj[prop][i] === 'object') {
                          newParents = parents.slice();
                          newParents.push(prop);
                          newParents.push(String(i));
                          toPush.push(Utils.serializeObject(obj[prop][i], newParents));
                      } else {
                          toPush.push(`${varName(prop)}[]=${varValue(obj[prop][i])}`);
                      }
                  }
                  if (toPush.length > 0) resultArray.push(toPush.join(separator));
              } else if (obj[prop] === null || obj[prop] === '') {
                  resultArray.push(`${varName(prop)}=`);
              } else if (typeof obj[prop] === 'object') {
                  // Object, convert to named array
                  newParents = parents.slice();
                  newParents.push(prop);
                  toPush = Utils.serializeObject(obj[prop], newParents);
                  if (toPush !== '') resultArray.push(toPush);
              } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
                  // Should be string or plain value
                  resultArray.push(`${varName(prop)}=${varValue(obj[prop])}`);
              } else if (obj[prop] === '') resultArray.push(varName(prop));
          });
          return resultArray.join(separator);
      },
      isObject (o) {
          return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
      },
      merge (...args) {
          return $.merge(...args);
      },
      extend (...args) {
          const to = args[0];
          args.splice(0, 1);
          return $.assign(to, ...args);
      },
      // 绑定类方法到类实例，复制类属性、方法到类
      bindMethods (instance, obj) {
          Object.keys(obj).forEach((key)=>{
              if (Utils.isObject(obj[key])) {
                  Object.keys(obj[key]).forEach((subKey)=>{
                      if (typeof obj[key][subKey] === 'function') {
                          obj[key][subKey] = obj[key][subKey].bind(instance);
                      }
                  });
              }
              instance[key] = obj[key];
          });
      },
      flattenArray (...args) {
          const arr = [];
          args.forEach((arg)=>{
              if (Array.isArray(arg)) arr.push(...flattenArray(...arg));
              else arr.push(arg);
          });
          return arr;
      },
      colorHexToRgb (hex) {
          const h = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b)=>r + r + g + g + b + b);
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
          return result ? result.slice(1).map((n)=>parseInt(n, 16)) : null;
      },
      colorRgbToHex (r, g, b) {
          const result = [
              r,
              g,
              b
          ].map((n)=>{
              const hex = n.toString(16);
              return hex.length === 1 ? `0${hex}` : hex;
          }).join('');
          return `#${result}`;
      },
      colorRgbToHsl (r, g, b) {
          r /= 255; // eslint-disable-line
          g /= 255; // eslint-disable-line
          b /= 255; // eslint-disable-line
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const d = max - min;
          let h;
          if (d === 0) h = 0;
          else if (max === r) h = (g - b) / d % 6;
          else if (max === g) h = (b - r) / d + 2;
          else if (max === b) h = (r - g) / d + 4;
          const l = (min + max) / 2;
          const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
          if (h < 0) h = 360 / 60 + h;
          return [
              h * 60,
              s,
              l
          ];
      },
      colorHslToRgb (h, s, l) {
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const hp = h / 60;
          const x = c * (1 - Math.abs(hp % 2 - 1));
          let rgb1;
          if (Number.isNaN(h) || typeof h === 'undefined') {
              rgb1 = [
                  0,
                  0,
                  0
              ];
          } else if (hp <= 1) rgb1 = [
              c,
              x,
              0
          ];
          else if (hp <= 2) rgb1 = [
              x,
              c,
              0
          ];
          else if (hp <= 3) rgb1 = [
              0,
              c,
              x
          ];
          else if (hp <= 4) rgb1 = [
              0,
              x,
              c
          ];
          else if (hp <= 5) rgb1 = [
              x,
              0,
              c
          ];
          else if (hp <= 6) rgb1 = [
              c,
              0,
              x
          ];
          const m = l - c / 2;
          return rgb1.map((n)=>Math.max(0, Math.min(255, Math.round(255 * (n + m)))));
      },
      colorHsbToHsl (h, s, b) {
          const HSL = {
              h,
              s: 0,
              l: 0
          };
          const HSB = {
              h,
              s,
              b
          };
          HSL.l = (2 - HSB.s) * HSB.b / 2;
          HSL.s = HSL.l && HSL.l < 1 ? HSB.s * HSB.b / (HSL.l < 0.5 ? HSL.l * 2 : 2 - HSL.l * 2) : HSL.s;
          return [
              HSL.h,
              HSL.s,
              HSL.l
          ];
      },
      colorHslToHsb (h, s, l) {
          const HSB = {
              h,
              s: 0,
              b: 0
          };
          const HSL = {
              h,
              s,
              l
          };
          const t = HSL.s * (HSL.l < 0.5 ? HSL.l : 1 - HSL.l);
          HSB.b = HSL.l + t;
          HSB.s = HSL.l > 0 ? 2 * t / HSB.b : HSB.s;
          return [
              HSB.h,
              HSB.s,
              HSB.b
          ];
      },
      getShadeTintColors (rgb) {
          const hsl = Utils.colorRgbToHsl(...rgb);
          const hslShade = [
              hsl[0],
              hsl[1],
              Math.max(0, hsl[2] - 0.08)
          ];
          const hslTint = [
              hsl[0],
              hsl[1],
              Math.max(0, hsl[2] + 0.08)
          ];
          const shade = Utils.colorRgbToHex(...Utils.colorHslToRgb(...hslShade));
          const tint = Utils.colorRgbToHex(...Utils.colorHslToRgb(...hslTint));
          return {
              shade,
              tint
          };
      },
      colorThemeCSSProperties (...args) {
          let hex;
          let rgb;
          if (args.length === 1) {
              hex = args[0];
              rgb = Utils.colorHexToRgb(hex);
          } else if (args.length === 3) {
              rgb = args;
              hex = Utils.colorRgbToHex(...rgb);
          }
          if (!rgb) return {};
          const { light, dark } = materialColors(hex);
          const shadeTintIos = Utils.getShadeTintColors(rgb);
          const shadeTintMdLight = Utils.getShadeTintColors(Utils.colorHexToRgb(light['--f7-md-primary']));
          const shadeTintMdDark = Utils.getShadeTintColors(Utils.colorHexToRgb(dark['--f7-md-primary']));
          Object.keys(light).forEach((key)=>{
              if (key.includes('surface-')) {
                  light[`${key}-rgb`] = Utils.colorHexToRgb(light[key]);
              }
          });
          Object.keys(dark).forEach((key)=>{
              if (key.includes('surface-')) {
                  dark[`${key}-rgb`] = Utils.colorHexToRgb(dark[key]);
              }
          });
          return {
              ios: {
                  '--f7-theme-color': 'var(--f7-ios-primary)',
                  '--f7-theme-color-rgb': 'var(--f7-ios-primary-rgb)',
                  '--f7-theme-color-shade': 'var(--f7-ios-primary-shade)',
                  '--f7-theme-color-tint': 'var(--f7-ios-primary-tint)'
              },
              md: {
                  '--f7-theme-color': 'var(--f7-md-primary)',
                  '--f7-theme-color-rgb': 'var(--f7-md-primary-rgb)',
                  '--f7-theme-color-shade': 'var(--f7-md-primary-shade)',
                  '--f7-theme-color-tint': 'var(--f7-md-primary-tint)'
              },
              light: _extends$1({
                  '--f7-ios-primary': hex,
                  '--f7-ios-primary-shade': shadeTintIos.shade,
                  '--f7-ios-primary-tint': shadeTintIos.tint,
                  '--f7-ios-primary-rgb': rgb.join(', '),
                  '--f7-md-primary-shade': shadeTintMdLight.shade,
                  '--f7-md-primary-tint': shadeTintMdLight.tint,
                  '--f7-md-primary-rgb': Utils.colorHexToRgb(light['--f7-md-primary']).join(', ')
              }, light),
              dark: _extends$1({
                  '--f7-md-primary-shade': shadeTintMdDark.shade,
                  '--f7-md-primary-tint': shadeTintMdDark.tint,
                  '--f7-md-primary-rgb': Utils.colorHexToRgb(dark['--f7-md-primary']).join(', ')
              }, dark)
          };
      },
      colorThemeCSSStyles (colors = {}) {
          const stringifyObject = (obj)=>{
              let res = '';
              Object.keys(obj).forEach((key)=>{
                  res += `${key}:${obj[key]};`;
              });
              return res;
          };
          const colorVars = Utils.colorThemeCSSProperties(colors.primary);
          const primary = [
              `:root{`,
              stringifyObject(colorVars.light),
              `--swiper-theme-color:var(--f7-theme-color);`,
              ...Object.keys(colors).map((colorName)=>`--f7-color-${colorName}: ${colors[colorName]};`),
              `}`,
              `.dark{`,
              stringifyObject(colorVars.dark),
              `}`,
              `.ios, .ios .dark{`,
              stringifyObject(colorVars.ios),
              '}',
              `.md, .md .dark{`,
              stringifyObject(colorVars.md),
              '}'
          ].join('');
          const restVars = {};
          Object.keys(colors).forEach((colorName)=>{
              const colorValue = colors[colorName];
              restVars[colorName] = Utils.colorThemeCSSProperties(colorValue);
          });
          // rest
          let rest = '';
          Object.keys(colors).forEach((colorName)=>{
              const { light, dark, ios, md } = restVars[colorName];
              const whiteColorVars = `
			--f7-ios-primary: #ffffff;
			--f7-ios-primary-shade: #ebebeb;
			--f7-ios-primary-tint: #ffffff;
			--f7-ios-primary-rgb: 255, 255, 255;
			--f7-md-primary-shade: #eee;
			--f7-md-primary-tint: #fff;
			--f7-md-primary-rgb: 255, 255, 255;
			--f7-md-primary: #fff;
			--f7-md-on-primary: #000;
			--f7-md-primary-container: #fff;
			--f7-md-on-primary-container: #000;
			--f7-md-secondary: #fff;
			--f7-md-on-secondary: #000;
			--f7-md-secondary-container: #555;
			--f7-md-on-secondary-container: #fff;
			--f7-md-surface: #fff;
			--f7-md-on-surface: #000;
			--f7-md-surface-variant: #333;
			--f7-md-on-surface-variant: #fff;
			--f7-md-outline: #fff;
			--f7-md-outline-variant: #fff;
			--f7-md-inverse-surface: #000;
			--f7-md-inverse-on-surface: #fff;
			--f7-md-inverse-primary: #000;
			--f7-md-surface-1: #f8f8f8;
			--f7-md-surface-2: #f1f1f1;
			--f7-md-surface-3: #e7e7e7;
			--f7-md-surface-4: #e1e1e1;
			--f7-md-surface-5: #d7d7d7;
			--f7-md-surface-variant-rgb: 51, 51, 51;
			--f7-md-on-surface-variant-rgb: 255, 255, 255;
			--f7-md-surface-1-rgb: 248, 248, 248;
			--f7-md-surface-2-rgb: 241, 241, 241;
			--f7-md-surface-3-rgb: 231, 231, 231;
			--f7-md-surface-4-rgb: 225, 225, 225;
			--f7-md-surface-5-rgb: 215, 215, 215;
			`;
              const blackColorVars = `
			--f7-ios-primary: #000;
			--f7-ios-primary-shade: #000;
			--f7-ios-primary-tint: #232323;
			--f7-ios-primary-rgb: 0, 0, 0;
			--f7-md-primary-shade: #000;
			--f7-md-primary-tint: #232323;
			--f7-md-primary-rgb: 0, 0, 0;
			--f7-md-primary: #000;
			--f7-md-on-primary: #fff;
			--f7-md-primary-container: #000;
			--f7-md-on-primary-container: #fff;
			--f7-md-secondary: #000;
			--f7-md-on-secondary: #fff;
			--f7-md-secondary-container: #aaa;
			--f7-md-on-secondary-container: #000;
			--f7-md-surface: #000;
			--f7-md-on-surface: #fff;
			--f7-md-surface-variant: #ccc;
			--f7-md-on-surface-variant: #000;
			--f7-md-outline: #000;
			--f7-md-outline-variant: #000;
			--f7-md-inverse-surface: #fff;
			--f7-md-inverse-on-surface: #000;
			--f7-md-inverse-primary: #fff;
			--f7-md-surface-1: #070707;
			--f7-md-surface-2: #161616;
			--f7-md-surface-3: #232323;
			--f7-md-surface-4: #303030;
			--f7-md-surface-5: #373737;
			--f7-md-surface-variant-rgb: 204, 204, 204;
			--f7-md-on-surface-variant-rgb: 0, 0, 0;
			--f7-md-surface-1-rgb: 7, 7, 7;
			--f7-md-surface-2-rgb: 22, 22, 22;
			--f7-md-surface-3-rgb: 35, 35, 35;
			--f7-md-surface-4-rgb: 48, 48, 48;
			--f7-md-surface-5-rgb: 55, 55, 55;
			`;
              /* eslint-disable */ const lightString = colorName === 'white' ? whiteColorVars : colorName === 'black' ? blackColorVars : stringifyObject(light);
              const darkString = colorName === 'white' ? whiteColorVars : colorName === 'black' ? blackColorVars : stringifyObject(dark);
              /* eslint-enable */ rest += [
                  `.color-${colorName} {`,
                  lightString,
                  `--swiper-theme-color: var(--f7-theme-color);`,
                  `}`,
                  `.color-${colorName}.dark, .color-${colorName} .dark, .dark .color-${colorName} {`,
                  darkString,
                  `--swiper-theme-color: var(--f7-theme-color);`,
                  `}`,
                  `.ios .color-${colorName}, .ios.color-${colorName}, .ios .dark .color-${colorName}, .ios .dark.color-${colorName} {`,
                  stringifyObject(ios),
                  `}`,
                  `.md .color-${colorName}, .md.color-${colorName}, .md .dark .color-${colorName}, .md .dark.color-${colorName} {`,
                  stringifyObject(md),
                  `}`,
                  // text color
                  `.text-color-${colorName} {`,
                  `--f7-theme-color-text-color: ${colors[colorName]};`,
                  `}`,
                  // bg color
                  `.bg-color-${colorName} {`,
                  `--f7-theme-color-bg-color: ${colors[colorName]};`,
                  `}`,
                  // border color
                  `.border-color-${colorName} {`,
                  `--f7-theme-color-border-color: ${colors[colorName]};`,
                  `}`,
                  // ripple color
                  `.ripple-color-${colorName} {`,
                  `--f7-theme-color-ripple-color: rgba(${light['--f7-ios-primary-rgb']}, 0.3);`,
                  `}`
              ].join('');
          });
          return `${primary}${rest}`;
      }
  };
  /**
   * 事件类，提供对象的事件侦听、触发，只在类实例中有效。
   * 需要支持事件的对象，可以从这个类继承，则类实例具备事件功能。
   * Fork from Framework7，
   */ let Event = class Event {
      /**
     * 添加事件响应函数
     * @param {*} events 多个事件用空格隔开
     * @param {*} handler 事件响应函数
     * @param {*} priority 是否优先，缺省不优先
     * @returns
     */ on(events, handler, priority = false) {
          const m = this;
          if (typeof handler !== 'function') return m;
          const method = priority ? 'unshift' : 'push';
          events.split(' ').forEach((event)=>{
              const lis = {
                  owner: '',
                  appName: '',
                  handler
              };
              // 对象自身事件
              if (!m.eventsListeners[event]) m.eventsListeners[event] = [];
              m.eventsListeners[event][method](lis);
          });
          return m;
      }
      /**
     * 调用一次后清除
     * @param {*} events 多个事件用空格隔开
     * @param {*} handler 事件响应函数
     * @param {*} priority 是否优先，缺省不优先
     * @returns
     */ once(events, handler, priority = false) {
          const m = this;
          if (typeof handler !== 'function') return m;
          // 调用一次后自动删除事件
          function onceHandler(...args) {
              m.off(events, onceHandler);
              if (onceHandler.proxy) {
                  onceHandler.proxy.apply(m, args);
                  delete onceHandler.proxy;
              }
          }
          onceHandler.proxy = handler;
          return m.on(events, onceHandler, priority);
      }
      /**
     * 删除事件响应函数
     * @param {*} events 事件，多个事件空格隔开，不传则清除该对象所有事件响应函数
     * @param {*} handler 事件响应函数
     * @returns
     */ off(events, handler) {
          const m = this;
          if (!m.eventsListeners) return m;
          if (events) {
              events.split(' ').forEach((event)=>{
                  if (typeof handler === 'undefined') m.eventsListeners[event] = [];
                  else if (m.eventsListeners[event]) {
                      const arr = m.eventsListeners[event];
                      for(let i = arr.length - 1; i >= 0; i--){
                          var _lis_handler;
                          const lis = arr[i];
                          if (lis.handler === handler || ((_lis_handler = lis.handler) == null ? void 0 : _lis_handler.proxy) === handler) arr.splice(i, 1);
                      }
                  }
              });
          } else m.eventsListeners = {};
          return m;
      }
      /**
     * 事件触发，应用事件只能由 Page 实例触发，才能按同页面所有者触发事件
     * @param {*} 事件，字符串、数组或对象
     * @param {*} 数据，传递到事件响应函数的数据
     */ emit(...args) {
          const m = this;
          if (!m.eventsListeners) return m;
          let events;
          let data;
          let context;
          let eventsParents;
          let pop = false;
          let event = args[0]; // 事件
          if (!event) return m;
          // 原始触发事件
          if (typeof event === 'string' || Array.isArray(event)) {
              event = event.split(' ');
              // 带前缀，自动添加前缀向父节点传递事件
              if (m.pre) {
                  events = [];
                  event.forEach((ev)=>{
                      events.push(`.${ev}`); // 本组件事件
                      events.push(`${m.pre}${ev[0].toUpperCase()}${ev.substr(1)}`); // 向上事件
                  });
              } else events = event;
              data = args.slice(1, args.length);
              context = m;
              eventsParents = m.eventsParents;
          } else {
              // 冒泡向上传递事件，或指定对象触发事件
              pop = event.pop;
              events = event.events;
              data = event.data;
              context = event.context || m;
              eventsParents = event.local ? [] : event.parents || m.eventsParents;
          }
          const eventsArray = Array.isArray(events) ? events : events.split(' ');
          // 本对象事件
          // ['local::event'] or ['.event']，不向父组件传递
          const selfEvents = eventsArray.map((ev)=>ev.replace(/local::|^[.]/, ''));
          // 非本对象事件，向上传递时，转换为对象，记录来源
          let parentEvents = null;
          if (pop) parentEvents = event;
          else {
              const popEvents = eventsArray.filter((ev)=>!ev.match(/^local::|^[.]/));
              if (popEvents == null ? void 0 : popEvents.length) {
                  parentEvents = {
                      pop: true,
                      events: popEvents,
                      context: m,
                      data,
                      owner: '',
                      appName: ''
                  };
              }
          }
          // 记录page属性，标记事件来源，冒泡到app时判断是否触发本页面应用事件
          // if (parentEvents && $.isPage(m)) {
          //    parentEvents.owner = m?.owner;
          //    parentEvents.appName = m?.appName;
          // }
          // 调用对象事件函数，父对象emit后，调用父对象事件函数
          selfEvents.forEach((ev)=>{
              if (m.eventsListeners && m.eventsListeners[ev]) {
                  const handlers = [];
                  m.eventsListeners[ev].forEach((lis)=>{
                      // 一个页面，只有一个应用，不可能有多个应用
                      // // 应用事件，需判断所有者
                      // if (lis.owner && lis.appName) {
                      //   // 同一html页面运行多个应用页面层时，只有所有者、应用名称相同才能触发跨页面事件，避免跨应用事件安全问题。
                      //   // 页面冒泡到应用事件
                      //   if (pop && lis.owner === ev.owner && lis.appName === ev.appName)
                      //     handlers.push(lis.handler);
                      // } else
                      handlers.push(lis.handler);
                  });
                  // 由 window 对象异步调用，而不是事件对象直接调用
                  handlers.forEach((fn)=>{
                      // setTimeout(() => fn.apply(context, data), 0);
                      fn.apply(context, data); // this 指针为原始触发事件对象，事件函数中可引用
                  });
              }
          });
          // 向上一级一级迭代冒泡传递后，触发父对象事件响应函数
          if (parentEvents && (eventsParents == null ? void 0 : eventsParents.length) > 0) {
              eventsParents.forEach((eventsParent)=>eventsParent.emit(parentEvents));
          }
          return m;
      }
      /**
     * 页面Page实例事件触发，f7 UI组件需要
     * @param {Object} params 参数
     * @param {Array} parents 事件组件的父对象，用于向上传播事件！
     * 组件的parents 是 Page实例，Page实例的Parent是App实例
     * @param {String} pre 向上传播前缀，避免事件重名冲突
     * @private
     */ constructor(params1 = {}, parents = [], pre = ''){
          const m = this;
          m.params = params1;
          if (parents) {
              if (!Array.isArray(parents)) m.eventsParents = [
                  parents
              ];
              else m.eventsParents = parents.filter((p)=>p);
          } else m.eventsParents = [];
          m.eventsListeners = {};
          m.pre = pre;
          // 通过 params 中的 on 加载事件响应
          if (m.params && m.params.on) {
              Object.keys(m.params.on).forEach((eventName)=>{
                  m.on(eventName, m.params.on[eventName]);
              });
          }
      }
  };
  /**
   * 所有页面从该类继承，并必须实现 load 事件！
   * 事件
   *  五个个事件：load -> ready -> show / hide -> unload
   *  load：必选，加载视图、代码，第一次加载后缓存，后续不会重复加载，动态代码也要在这里加载
   *    参数；param
   *    如果需要前路由数据，通过 $.lastPage.data 访问
   *    view 还未创建，隐藏page 不存在
   *  ready：可选，对视图中的对象事件绑定，已经缓存的视图，比如回退，不会再次触发 ready
   *    参数；view、param
   *    如果需要前路由数据，通过 $.lastPage.data 访问
   *  show：可选，视图显示时触发，可以接收参数，操作视图，无论是否缓存（比如回退）都会触发
   *    对于已经加载、绑定隐藏（缓存）的页面，重新显示时，不会触发load和ready，只会触发show
   *    参数：view、param
   *  hide：可选，视图卸载删除时触发，适合保存卸载页面的数据，卸载的页面从页面删除，进入缓存
   *  unload：可选，页面从缓存中删除时触发，目前暂未实现
   *
   * 数据传递
   *  每个页面都能访问当前路由，路由存在以下参数，用户跨页面数据传递
   *  url：页面跳转时的原始网址
   *  param：页面网址及go中传入的参数合并，保存在 param 中
   *  data：路由中需要保存的数据
   *  view：当前页面层，dom 对象，已经包括绑定的事件
   *  $.page：当前页面对象
   *  $.lastPage：前路由，可通过该参数，获取前路由的 data，在后续路由中使用
   *
   */ let Page = class Page extends Event {
      /**
     * 异步加载页面视图内容
     * 返回Promise对象
     * @param {*} param
     * @param {*} cfg
     */ load(param) {
          // $.assign(this.data, param);
          this.emit('local::load pageLoad', param);
          this.emit('pageLoad', this, param);
      }
      /**
     * 在已经加载就绪的视图上操作
     * @param {*} view 页面层的 Dom 对象，已经使用`$(#page-name)`，做了处理
     * @param {*} param go 函数的参数，或 网址中 url 中的参数
     * @param {*} back 是否为回退，A->B, B->A，这种操作属于回退
     */ ready(view, param, back) {
          // $.assign(this, {page, param, back});
          // $.assign(this.data, param);
          // 隐藏所有模板
          this.init();
          this.emit('local::ready', view, param, back);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageReady', this, view, param, back);
      }
      /**
     * 对页面进行初始化处理，或页面内容动态变更时，对局部页面容器进行初始化
     * @param {*} v dom 容器，默认为页面实例的view
     */ init(v) {
          const { view } = this;
          v = v ? $(v) : view;
      }
      // 显示已加载的页面
      // view：页面Dom层，param：参数
      show(view, param) {
          // 隐藏所有模板
          view.qus('[name$=-tp]').hide();
          // 防止空链接，刷新页面
          view.qus('a[href=""]').attr('href', 'javascript:;');
          // this.init();
          if (this.reset) this.reset();
          this.emit('local::show', view, param);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageShow', this, view, param);
      }
      // 回退显示已加载的页面
      // view：页面Dom层，param：参数
      back(view, param) {
          // 隐藏所有模板
          view.qus('[name$=-tp]').hide();
          // 防止空链接，刷新页面
          view.qus('a[href=""]').attr('href', 'javascript:;');
          this.emit('local::back', view, param);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageBack', this, view, param);
      }
      change(view, param, lastParam) {
          this.emit('local::change', view, param, lastParam);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageChange', this, view, param, lastParam);
      }
      hide(view) {
          this.emit('local::hide', view);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageHide', this, view);
      }
      unload(view) {
          this.emit('local::unload', view);
          // 向上触发跨页面事件，存在安全问题
          this.emit('pageUnload', this, view);
      }
      constructor(app, name, title, style){
          super(null, [
              app
          ]);
          this.app = app; // 应用实例
          this.cfg = app.cfg;
          this.name = name; // 名称，可带路径 admin/login
          this.title = title; // 浏览器标题
          this.style = style || `./page/${name}.css`;
          // 以下变量由路由器赋值
          this.owner = '';
          this.appName = '';
          this.path = '';
          this.view = null; // 页面的div层$Dom对象，router创建实例时赋值
          this.dom = null; // 页面的div层dom对象，router创建实例时赋值
          this.$el = null; // $dom === view
          this.el = null; // dom === dom
          this.html = ''; // 页面html文本，router创建实例时赋值
          this.css = ''; // 页面css样式，router创建实例时赋值
          this.js = ''; // 页面代码，router创建实例时赋值
          this.data = {}; // 页面数据对象
          this.param = {}; // 页面切换传递进来的参数对象，router创建实例时赋值
      }
  };
  /**
   * Wia app、router等继承类，通过模块化扩展类功能
   * 使用 use 装载，注解可能完成类似功能
   * 不装载则需在代码中按普通泪，单独引用、创建、使用
   * 装载的模块可能影响其他模块
   */ let Module = class Module extends Event {
      // eslint-disable-next-line
      useModuleParams(module, instanceParams) {
          if (module.params) {
              const originalParams = {};
              Object.keys(module.params).forEach((paramKey)=>{
                  if (typeof instanceParams[paramKey] === 'undefined') return;
                  originalParams[paramKey] = $.extend({}, instanceParams[paramKey]);
              });
              $.extend(instanceParams, module.params);
              Object.keys(originalParams).forEach((paramKey)=>{
                  $.extend(instanceParams[paramKey], originalParams[paramKey]);
              });
          }
      }
      useModulesParams(instanceParams) {
          const instance = this;
          if (!instance.modules) return;
          Object.keys(instance.modules).forEach((moduleName)=>{
              const module = instance.modules[moduleName];
              // Extend params
              if (module.params) {
                  $.extend(instanceParams, module.params);
              }
          });
      }
      /**
     * 将扩展模块的相关方法、事件加载到类实例
     * @param {*} moduleName 扩展模块名称
     * @param {*} moduleParams
     */ useModule(moduleName = '', moduleParams = {}) {
          const instance = this;
          if (!instance.modules) return;
          // 从原型中获得的模块类引用
          const module = typeof moduleName === 'string' ? instance.modules[moduleName] : moduleName;
          if (!module) return;
          // 扩展实例的方法和属性，Extend instance methods and props
          if (module.instance) {
              Object.keys(module.instance).forEach((modulePropName)=>{
                  const moduleProp = module.instance[modulePropName];
                  if (typeof moduleProp === 'function') {
                      instance[modulePropName] = moduleProp.bind(instance);
                  } else {
                      instance[modulePropName] = moduleProp;
                  }
              });
          }
          // 将扩展模块中的on加载到实例的事件侦听中，比如 init 在实例初始化时被调用
          if (module.on && instance.on) {
              Object.keys(module.on).forEach((eventName)=>{
                  // 避免模块事件异常溢出影响其他模块
                  function fn(...args) {
                      try {
                          module.on[eventName].bind(this)(...args);
                      } catch (e) {
                          console.log(`${moduleName}.on${eventName} exp:${e.message}`);
                      }
                  }
                  instance.on(eventName, fn);
              });
          }
          // 加载扩展模块的vnodeHooks，Add vnode hooks
          if (module.vnode) {
              if (!instance.vnodeHooks) instance.vnodeHooks = {};
              Object.keys(module.vnode).forEach((vnodeId)=>{
                  Object.keys(module.vnode[vnodeId]).forEach((hookName)=>{
                      const handler = module.vnode[vnodeId][hookName];
                      if (!instance.vnodeHooks[hookName]) instance.vnodeHooks[hookName] = {};
                      if (!instance.vnodeHooks[hookName][vnodeId]) instance.vnodeHooks[hookName][vnodeId] = [];
                      instance.vnodeHooks[hookName][vnodeId].push(handler.bind(instance));
                  });
              });
          }
          // 执行模块的create方法，模块实例化回调，Module create callback
          if (module.create) {
              module.create.bind(instance)(moduleParams);
          }
      }
      /**
     * 实例创建初始化时，执行扩展模块中定义的相关回调
     * @param {*} modulesParams
     */ useModules(modulesParams = {}) {
          const instance = this;
          if (!instance.modules) return;
          Object.keys(instance.modules).forEach((moduleName)=>{
              const moduleParams = modulesParams[moduleName] || {};
              instance.useModule(moduleName, moduleParams);
          });
      }
      static set components(components) {
          const Class = this;
          if (!Class.use) return;
          Class.use(components);
      }
      /**
     * 将模块类装配到指定类的modules属性，用于扩展类
     * @param {*} module 模块类
     * @param  {...any} params 参数
     */ static installModule(module, ...params1) {
          const Class = this;
          if (!Class.prototype.modules) Class.prototype.modules = {};
          const name = module.name || `${Object.keys(Class.prototype.modules).length}_${$.now()}`;
          // 原型属性中引用该模块类，类实例
          Class.prototype.modules[name] = module;
          // 模块如果定义了原型，则将模块原型加载到类原型
          if (module.proto) {
              Object.keys(module.proto).forEach((key)=>{
                  Class.prototype[key] = module.proto[key];
              });
          }
          // 加载静态属性
          if (module.static) {
              Object.keys(module.static).forEach((key)=>{
                  Class[key] = module.static[key];
              });
          }
          // 执行加载回调函数
          if (module.install) {
              module.install.apply(Class, params1);
          }
          return Class;
      }
      /**
     * 加载扩展模块到类
     * @param {*} module
     * @param  {...any} params
     */ static use(module, ...params1) {
          const Class = this;
          if (Array.isArray(module)) {
              module.forEach((m)=>Class.installModule(m));
              return Class;
          }
          return Class.installModule(module, ...params1);
      }
      constructor(params1 = {}, parents = []){
          super(params1, parents);
          const self = this;
          self.params = params1;
      }
  };
  /**
   * 扩展构造函数
   * @param {*} parameters
   */ function Constructors(parameters = {}) {
      const { defaultSelector, constructor: Constructor, domProp, app, addMethods } = parameters;
      const methods = {
          create (...args) {
              if (app) return new Constructor(app, ...args);
              return new Constructor(...args);
          },
          get (el = defaultSelector) {
              if (el instanceof Constructor) return el;
              const $el = $(el);
              if ($el.length === 0) return undefined;
              return $el[0][domProp];
          },
          destroy (el) {
              const instance = methods.get(el);
              if (instance && instance.destroy) return instance.destroy();
              return undefined;
          }
      };
      if (addMethods && Array.isArray(addMethods)) {
          addMethods.forEach((methodName)=>{
              methods[methodName] = (el = defaultSelector, ...args)=>{
                  const instance = methods.get(el);
                  if (instance && instance[methodName]) return instance[methodName](...args);
                  return undefined;
              };
          });
      }
      return methods;
  }
  function Modals(parameters = {}) {
      const { defaultSelector, constructor: Constructor, app } = parameters;
      const methods = $.extend(Constructors({
          defaultSelector,
          constructor: Constructor,
          app,
          domProp: 'f7Modal'
      }), {
          open (el, animate, targetEl) {
              let $el = $(el);
              if ($el.length > 1 && targetEl) {
                  // check if same modal in other page
                  const $targetPage = $(targetEl).parents('.page');
                  if ($targetPage.length) {
                      $el.each((modalEl)=>{
                          const $modalEl = $(modalEl);
                          if ($modalEl.parents($targetPage)[0] === $targetPage[0]) {
                              $el = $modalEl;
                          }
                      });
                  }
              }
              if ($el.length > 1) {
                  $el = $el.eq($el.length - 1);
              }
              if (!$el.length) return undefined;
              let instance = $el[0].f7Modal;
              if (!instance) {
                  const params1 = $el.dataset();
                  instance = new Constructor(app, _extends$1({
                      el: $el
                  }, params1));
              }
              return instance.open(animate);
          },
          close (el = defaultSelector, animate, targetEl) {
              let $el = $(el);
              if (!$el.length) return undefined;
              if ($el.length > 1) {
                  // check if close link (targetEl) in this modal
                  let $parentEl;
                  if (targetEl) {
                      const $targetEl = $(targetEl);
                      if ($targetEl.length) {
                          $parentEl = $targetEl.parents($el);
                      }
                  }
                  if ($parentEl && $parentEl.length > 0) {
                      $el = $parentEl;
                  } else {
                      $el = $el.eq($el.length - 1);
                  }
              }
              let instance = $el[0].f7Modal;
              if (!instance) {
                  const params1 = $el.dataset();
                  instance = new Constructor(app, _extends$1({
                      el: $el
                  }, params1));
              }
              return instance.close(animate);
          }
      });
      return methods;
  }
  /**
   * 动态加载扩展模块，被 App调用。
   * 通过写入页面标签实现动态加载js、css
   * wia base中已经实现了动态下载、加载模块功能，该模块应删除
   */ const fetchedModules = [];
  function loadModule(moduleToLoad) {
      const App = this;
      return new Promise((resolve, reject)=>{
          const app = App.instance;
          let modulePath;
          let moduleObj;
          let moduleFunc;
          if (!moduleToLoad) {
              reject(new Error('Wia: Lazy module must be specified'));
              return;
          }
          function install(module) {
              App.use(module);
              if (app) {
                  app.useModuleParams(module, app.params);
                  app.useModule(module);
              }
          }
          if (typeof moduleToLoad === 'string') {
              const matchNamePattern = moduleToLoad.match(/([a-z0-9-]*)/i);
              if (moduleToLoad.indexOf('.') < 0 && matchNamePattern && matchNamePattern[0].length === moduleToLoad.length) {
                  if (!app || app && !app.params.lazyModulesPath) {
                      reject(new Error('Wia: "lazyModulesPath" app parameter must be specified to fetch module by name'));
                      return;
                  }
                  modulePath = `${app.params.lazyModulesPath}/${moduleToLoad}.js`;
              } else {
                  modulePath = moduleToLoad;
              }
          } else if (typeof moduleToLoad === 'function') {
              moduleFunc = moduleToLoad;
          } else {
              // considering F7-Plugin object
              moduleObj = moduleToLoad;
          }
          if (moduleFunc) {
              const module = moduleFunc(App, false);
              if (!module) {
                  reject(new Error("Wia: Can't find Wia component in specified component function"));
                  return;
              }
              // Check if it was added
              if (App.prototype.modules && App.prototype.modules[module.name]) {
                  resolve();
                  return;
              }
              // Install It
              install(module);
              resolve();
          }
          if (moduleObj) {
              const module = moduleObj;
              if (!module) {
                  reject(new Error("Wia: Can't find Wia component in specified component"));
                  return;
              }
              // Check if it was added
              if (App.prototype.modules && App.prototype.modules[module.name]) {
                  resolve();
                  return;
              }
              // Install It
              install(module);
              resolve();
          }
          if (modulePath) {
              if (fetchedModules.indexOf(modulePath) >= 0) {
                  resolve();
                  return;
              }
              fetchedModules.push(modulePath);
              // 动态加载 js 脚本
              const scriptLoad = new Promise((resolveScript, rejectScript)=>{
                  App.request.get(modulePath, (scriptContent)=>{
                      const id = $.id();
                      const callbackLoadName = `wia_component_loader_callback_${id}`;
                      const scriptEl = document.createElement('script');
                      scriptEl.innerHTML = `window.${callbackLoadName} = function (Wia, WiaAutoInstallComponent) {return ${scriptContent.trim()}}`;
                      // 动态加载 js
                      $('head').append(scriptEl);
                      const componentLoader = window[callbackLoadName];
                      delete window[callbackLoadName];
                      $(scriptEl).remove();
                      const module = componentLoader(App, false);
                      if (!module) {
                          rejectScript(new Error(`Wia: Can't find Wia component in ${modulePath} file`));
                          return;
                      }
                      // Check if it was added
                      if (App.prototype.modules && App.prototype.modules[module.name]) {
                          resolveScript();
                          return;
                      }
                      // Install It
                      install(module);
                      resolveScript();
                  }, (xhr, status)=>{
                      rejectScript(xhr, status);
                  });
              });
              // 动态加载css样式
              const styleLoad = new Promise((resolveStyle)=>{
                  App.request.get(modulePath.replace('.js', app.rtl ? '.rtl.css' : '.css'), (styleContent)=>{
                      const styleEl = document.createElement('style');
                      styleEl.innerHTML = styleContent;
                      $('head').append(styleEl);
                      resolveStyle();
                  }, ()=>{
                      resolveStyle();
                  });
              });
              Promise.all([
                  scriptLoad,
                  styleLoad
              ]).then(()=>{
                  resolve();
              }).catch((err)=>{
                  reject(err);
              });
          }
      });
  }
  // replace react, use by @babel/plugin-transform-react-jsx
  /* eslint-disable prefer-rest-params */ function jsx(tag, props, ...args) {
      const attrs = props || {};
      const children = args || [];
      const attrsString = Object.keys(attrs).map((attr)=>{
          if (attr[0] === '_') {
              if (attrs[attr]) return attr.replace('_', '');
              return '';
          }
          return `${attr}="${attrs[attr]}"`;
      }).filter((attr)=>!!attr).join(' ');
      if ([
          'path',
          'img',
          'circle',
          'polygon',
          'line',
          'input'
      ].indexOf(tag) >= 0) {
          return `<${tag} ${attrsString} />`.trim();
      }
      const childrenContent = children.filter((c)=>!!c).map((c)=>Array.isArray(c) ? c.join('') : c).join('');
      return `<${tag} ${attrsString}>${childrenContent}</${tag}>`.trim();
  }
  const Resize = {
      name: 'resize',
      instance: {
          getSize () {
              const app = this;
              if (!app.root[0]) return {
                  width: 0,
                  height: 0,
                  left: 0,
                  top: 0
              };
              const offset = app.root.offset();
              const [width, height, left, top] = [
                  app.root[0].offsetWidth,
                  app.root[0].offsetHeight,
                  offset.left,
                  offset.top
              ];
              app.width = width;
              app.height = height;
              app.left = left;
              app.top = top;
              return {
                  width,
                  height,
                  left,
                  top
              };
          }
      },
      on: {
          init () {
              const app = this;
              // Get Size
              app.getSize();
              // Emit resize
              window.addEventListener('resize', ()=>{
                  app.emit('resize');
              }, false);
              // Emit orientationchange
              window.addEventListener('orientationchange', ()=>{
                  app.emit('orientationchange');
              });
          },
          orientationchange () {
              const app = this;
              // Fix iPad weird body scroll
              if (app.device.ipad) {
                  document.body.scrollLeft = 0;
                  setTimeout(()=>{
                      document.body.scrollLeft = 0;
                  }, 0);
              }
          },
          resize () {
              const app = this;
              app.getSize();
          }
      }
  };
  /**
   * document 绑定click事件，传递到 app.on
   * 触发所有子模块的 clicks 
   * 支持touch则绑定touch，否则绑定click
   * 无论touch 还是 click事件，都会触发事件响应函数
   * @param {*} cb
   */ function bindClick(cb) {
      let touchStartX;
      let touchStartY;
      function touchStart(ev) {
          // ev.preventDefault();
          touchStartX = ev.changedTouches[0].clientX;
          touchStartY = ev.changedTouches[0].clientY;
      }
      function touchEnd(ev) {
          // ev.preventDefault();
          const x = Math.abs(ev.changedTouches[0].clientX - touchStartX);
          const y = Math.abs(ev.changedTouches[0].clientY - touchStartY);
          // console.log('touchEnd', {x, y});
          if (x <= 5 && y <= 5) {
              cb.call(this, ev);
          }
      }
      // 在捕捉时触发，不影响后续冒泡阶段再次触发
      if ($.support.touch) {
          // console.log('bind touch');
          document.addEventListener('touchstart', touchStart, true);
          document.addEventListener('touchend', touchEnd, true);
      } else {
          // console.log('bind click');
          document.addEventListener('click', cb, true);
      }
  }
  function initClicks(app) {
      function appClick(ev) {
          app.emit({
              events: 'click',
              data: [
                  ev
              ]
          });
      }
      function handleClicks(e) {
          const $clickedEl = $(e.target);
          const $clickedLinkEl = $clickedEl.closest('a');
          const isLink = $clickedLinkEl.length > 0;
          isLink && $clickedLinkEl.attr('href');
          // call Modules Clicks
          Object.keys(app.modules).forEach((moduleName)=>{
              const moduleClicks = app.modules[moduleName].clicks;
              if (!moduleClicks) return;
              if (e.preventF7Router) return;
              Object.keys(moduleClicks).forEach((clickSelector)=>{
                  const matchingClickedElement = $clickedEl.closest(clickSelector).eq(0);
                  if (matchingClickedElement.length > 0) {
                      moduleClicks[clickSelector].call(app, matchingClickedElement, matchingClickedElement.dataset(), e);
                  }
              });
          });
      }
      // 绑定click 或 touch 事件，触发时，发射click事件
      bindClick(appClick);
      // click event 响应
      app.on('click', handleClicks);
  }
  const Click = {
      name: 'clicks',
      params: {
          clicks: {
              // External Links
              externalLinks: '.ext'
          }
      },
      on: {
          // app 创建时被调用
          init () {
              const app = this;
              initClicks(app);
          }
      }
  };
  /* eslint-disable no-nested-ternary */ const { extend: extend$1 } = Utils;
  const { device: device$1, support: support$1 } = $;
  function initTouch() {
      const app = this;
      const params1 = app.params.touch;
      const useRipple = params1[`${app.theme}TouchRipple`];
      if (device$1.ios && device$1.webView) {
          // Strange hack required for iOS 8 webview to work on inputs
          window.addEventListener('touchstart', ()=>{});
      }
      let touchStartX;
      let touchStartY;
      let targetElement;
      let isMoved;
      let tapHoldFired;
      let tapHoldTimeout;
      let preventClick;
      let activableElement;
      let activeTimeout;
      let rippleWave;
      let rippleTarget;
      let rippleTimeout;
      function findActivableElement(el) {
          const target = $(el);
          const parents = target.parents(params1.activeStateElements);
          if (target.closest('.no-active-state').length) {
              return null;
          }
          let activable;
          if (target.is(params1.activeStateElements)) {
              activable = target;
          }
          if (parents.length > 0) {
              activable = activable ? activable.add(parents) : parents;
          }
          if (activable && activable.length > 1) {
              const newActivable = [];
              let preventPropagation;
              for(let i = 0; i < activable.length; i += 1){
                  if (!preventPropagation) {
                      newActivable.push(activable[i]);
                      if (activable.eq(i).hasClass('prevent-active-state-propagation') || activable.eq(i).hasClass('no-active-state-propagation')) {
                          preventPropagation = true;
                      }
                  }
              }
              activable = $(newActivable);
          }
          return activable || target;
      }
      function isInsideScrollableView(el) {
          const pageContent = el.parents('.page-content');
          return pageContent.length > 0;
      }
      function addActive() {
          if (!activableElement) return;
          activableElement.addClass('active-state');
      }
      function removeActive() {
          if (!activableElement) return;
          activableElement.removeClass('active-state');
          activableElement = null;
      }
      // Ripple handlers
      function findRippleElement(el) {
          const rippleElements = params1.touchRippleElements;
          const $el = $(el);
          if ($el.is(rippleElements)) {
              if ($el.hasClass('no-ripple')) {
                  return false;
              }
              return $el;
          }
          if ($el.parents(rippleElements).length > 0) {
              const rippleParent = $el.parents(rippleElements).eq(0);
              if (rippleParent.hasClass('no-ripple')) {
                  return false;
              }
              return rippleParent;
          }
          return false;
      }
      function createRipple($el, x, y) {
          if (!$el) return;
          rippleWave = app.touchRipple.create(app, $el, x, y);
      }
      function removeRipple() {
          if (!rippleWave) return;
          rippleWave.remove();
          rippleWave = undefined;
          rippleTarget = undefined;
      }
      function rippleTouchStart(el) {
          rippleTarget = findRippleElement(el);
          if (!rippleTarget || rippleTarget.length === 0) {
              rippleTarget = undefined;
              return;
          }
          const inScrollable = isInsideScrollableView(rippleTarget);
          if (!inScrollable) {
              removeRipple();
              createRipple(rippleTarget, touchStartX, touchStartY);
          } else {
              clearTimeout(rippleTimeout);
              rippleTimeout = setTimeout(()=>{
                  removeRipple();
                  createRipple(rippleTarget, touchStartX, touchStartY);
              }, 80);
          }
      }
      function rippleTouchMove() {
          clearTimeout(rippleTimeout);
          removeRipple();
      }
      function rippleTouchEnd() {
          if (!rippleWave && rippleTarget && !isMoved) {
              clearTimeout(rippleTimeout);
              createRipple(rippleTarget, touchStartX, touchStartY);
              setTimeout(removeRipple, 0);
          } else {
              removeRipple();
          }
      }
      // Mouse Handlers
      function handleMouseDown(e) {
          const $activableEl = findActivableElement(e.target);
          if ($activableEl) {
              $activableEl.addClass('active-state');
              if ('which' in e && e.which === 3) {
                  setTimeout(()=>{
                      $('.active-state').removeClass('active-state');
                  }, 0);
              }
          }
          if (useRipple) {
              touchStartX = e.pageX;
              touchStartY = e.pageY;
              rippleTouchStart(e.target, e.pageX, e.pageY);
          }
      }
      function handleMouseMove() {
          if (!params1.activeStateOnMouseMove) {
              $('.active-state').removeClass('active-state');
          }
          if (useRipple) {
              rippleTouchMove();
          }
      }
      function handleMouseUp() {
          $('.active-state').removeClass('active-state');
          if (useRipple) {
              rippleTouchEnd();
          }
      }
      function handleTouchCancel() {
          targetElement = null;
          // Remove Active State
          clearTimeout(activeTimeout);
          clearTimeout(tapHoldTimeout);
          if (params1.activeState) {
              removeActive();
          }
          // Remove Ripple
          if (useRipple) {
              rippleTouchEnd();
          }
      }
      let isScrolling;
      let isSegmentedStrong = false;
      let segmentedStrongEl = null;
      const touchMoveActivableIos = '.dialog-button, .actions-button';
      let isTouchMoveActivable = false;
      let touchmoveActivableEl = null;
      function handleTouchStart(e) {
          if (!e.isTrusted) return true;
          isMoved = false;
          tapHoldFired = false;
          preventClick = false;
          isScrolling = undefined;
          if (e.targetTouches.length > 1) {
              if (activableElement) removeActive();
              return true;
          }
          if (e.touches.length > 1 && activableElement) {
              removeActive();
          }
          if (params1.tapHold) {
              if (tapHoldTimeout) clearTimeout(tapHoldTimeout);
              tapHoldTimeout = setTimeout(()=>{
                  if (e && e.touches && e.touches.length > 1) return;
                  tapHoldFired = true;
                  e.preventDefault();
                  preventClick = true;
                  $(e.target).trigger('taphold', e);
                  app.emit('taphold', e);
              }, params1.tapHoldDelay);
          }
          targetElement = e.target;
          touchStartX = e.targetTouches[0].pageX;
          touchStartY = e.targetTouches[0].pageY;
          isSegmentedStrong = e.target.closest('.segmented-strong .button-active, .segmented-strong .tab-link-active');
          isTouchMoveActivable = app.theme === 'ios' && e.target.closest(touchMoveActivableIos);
          if (isSegmentedStrong) {
              segmentedStrongEl = isSegmentedStrong.closest('.segmented-strong');
          }
          if (params1.activeState) {
              activableElement = findActivableElement(targetElement);
              if (activableElement && !isInsideScrollableView(activableElement)) {
                  addActive();
              } else if (activableElement) {
                  activeTimeout = setTimeout(addActive, 80);
              }
          }
          if (useRipple) {
              rippleTouchStart(targetElement);
          }
          return true;
      }
      function handleTouchMove(e) {
          if (!e.isTrusted) return;
          let touch;
          let distance;
          let shouldRemoveActive = true;
          if (e.type === 'touchmove') {
              touch = e.targetTouches[0];
              distance = params1.touchClicksDistanceThreshold;
          }
          const touchCurrentX = e.targetTouches[0].pageX;
          const touchCurrentY = e.targetTouches[0].pageY;
          if (typeof isScrolling === 'undefined') {
              isScrolling = !!(isScrolling || Math.abs(touchCurrentY - touchStartY) > Math.abs(touchCurrentX - touchStartX));
          }
          if (isTouchMoveActivable || !isScrolling && isSegmentedStrong && segmentedStrongEl) {
              if (e.cancelable) e.preventDefault();
          }
          if (!isScrolling && isSegmentedStrong && segmentedStrongEl) {
              const elementFromPoint = document.elementFromPoint(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
              const buttonEl = elementFromPoint.closest('.segmented-strong .button:not(.button-active):not(.tab-link-active)');
              if (buttonEl && segmentedStrongEl.contains(buttonEl)) {
                  $(buttonEl).trigger('click', 'f7Segmented');
                  targetElement = buttonEl;
              }
          }
          if (distance && touch) {
              const { pageX, pageY } = touch;
              if (Math.abs(pageX - touchStartX) > distance || Math.abs(pageY - touchStartY) > distance) {
                  isMoved = true;
              }
          } else {
              isMoved = true;
          }
          if (isMoved) {
              preventClick = true;
              // Keep active state on touchMove (for dialog and actions buttons)
              if (isTouchMoveActivable) {
                  const elementFromPoint = document.elementFromPoint(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
                  touchmoveActivableEl = elementFromPoint.closest(touchMoveActivableIos);
                  if (touchmoveActivableEl && activableElement && activableElement[0] === touchmoveActivableEl) {
                      shouldRemoveActive = false;
                  } else if (touchmoveActivableEl) {
                      setTimeout(()=>{
                          activableElement = findActivableElement(touchmoveActivableEl);
                          addActive();
                      });
                  }
              }
              if (params1.tapHold) {
                  clearTimeout(tapHoldTimeout);
              }
              if (params1.activeState && shouldRemoveActive) {
                  clearTimeout(activeTimeout);
                  removeActive();
              }
              if (useRipple) {
                  rippleTouchMove();
              }
          }
      }
      function handleTouchEnd(e) {
          if (!e.isTrusted) return true;
          isScrolling = undefined;
          isSegmentedStrong = false;
          segmentedStrongEl = null;
          isTouchMoveActivable = false;
          clearTimeout(activeTimeout);
          clearTimeout(tapHoldTimeout);
          if (touchmoveActivableEl) {
              $(touchmoveActivableEl).trigger('click', 'f7TouchMoveActivable');
              touchmoveActivableEl = null;
          }
          if (document.activeElement === e.target) {
              if (params1.activeState) removeActive();
              if (useRipple) {
                  rippleTouchEnd();
              }
              return true;
          }
          if (params1.activeState) {
              addActive();
              setTimeout(removeActive, 0);
          }
          if (useRipple) {
              rippleTouchEnd();
          }
          if (params1.tapHoldPreventClicks && tapHoldFired || preventClick) {
              if (e.cancelable) e.preventDefault();
              preventClick = true;
              return false;
          }
          return true;
      }
      function handleClick(e) {
          const isOverswipe = e && e.detail && e.detail === 'f7Overswipe';
          const isSegmented = e && e.detail && e.detail === 'f7Segmented';
          // eslint-disable-next-line
          const isTouchMoveActivable = e && e.detail && e.detail === 'f7TouchMoveActivable';
          let localPreventClick = preventClick;
          if (targetElement && e.target !== targetElement) {
              if (isOverswipe || isSegmented || isTouchMoveActivable) {
                  localPreventClick = false;
              } else {
                  localPreventClick = true;
              }
          } else if (isTouchMoveActivable) {
              localPreventClick = false;
          }
          if (params1.tapHold && params1.tapHoldPreventClicks && tapHoldFired) {
              localPreventClick = true;
          }
          if (localPreventClick) {
              e.stopImmediatePropagation();
              e.stopPropagation();
              e.preventDefault();
          }
          if (params1.tapHold) {
              tapHoldTimeout = setTimeout(()=>{
                  tapHoldFired = false;
              }, device$1.ios || device$1.androidChrome ? 100 : 400);
          }
          preventClick = false;
          targetElement = null;
          return !localPreventClick;
      }
      /**
     * document touch �¼����ݸ� app.on
     * @param {*} name
     * @param {*} e
     */ function emitAppTouchEvent(name, e) {
          app.emit({
              events: name,
              data: [
                  e
              ]
          });
      }
      function appTouchStartActive(e) {
          emitAppTouchEvent('touchstart touchstart:active', e);
      }
      function appTouchMoveActive(e) {
          emitAppTouchEvent('touchmove touchmove:active', e);
      }
      function appTouchEndActive(e) {
          emitAppTouchEvent('touchend touchend:active', e);
      }
      function appTouchStartPassive(e) {
          emitAppTouchEvent('touchstart:passive', e);
      }
      function appTouchMovePassive(e) {
          emitAppTouchEvent('touchmove:passive', e);
      }
      function appTouchEndPassive(e) {
          emitAppTouchEvent('touchend:passive', e);
      }
      const passiveListener = support$1.passiveListener ? {
          passive: true
      } : false;
      const passiveListenerCapture = support$1.passiveListener ? {
          passive: true,
          capture: true
      } : true;
      const activeListener = support$1.passiveListener ? {
          passive: false
      } : false;
      const activeListenerCapture = support$1.passiveListener ? {
          passive: false,
          capture: true
      } : true;
      // document touch �¼� ���ݸ� app.on
      if (support$1.passiveListener) {
          document.addEventListener(app.touchEvents.start, appTouchStartActive, activeListenerCapture);
          document.addEventListener(app.touchEvents.move, appTouchMoveActive, activeListener);
          document.addEventListener(app.touchEvents.end, appTouchEndActive, activeListener);
          document.addEventListener(app.touchEvents.start, appTouchStartPassive, passiveListenerCapture);
          document.addEventListener(app.touchEvents.move, appTouchMovePassive, passiveListener);
          document.addEventListener(app.touchEvents.end, appTouchEndPassive, passiveListener);
      } else {
          document.addEventListener(app.touchEvents.start, (e)=>{
              appTouchStartActive(e);
              appTouchStartPassive(e);
          }, true);
          document.addEventListener(app.touchEvents.move, (e)=>{
              appTouchMoveActive(e);
              appTouchMovePassive(e);
          }, false);
          document.addEventListener(app.touchEvents.end, (e)=>{
              appTouchEndActive(e);
              appTouchEndPassive(e);
          }, false);
      }
      if (support$1.touch) {
          app.on('click', handleClick);
          app.on('touchstart', handleTouchStart);
          app.on('touchmove', handleTouchMove);
          app.on('touchend', handleTouchEnd);
          document.addEventListener('touchcancel', handleTouchCancel, {
              passive: true
          });
      } else if (params1.activeState) {
          app.on('touchstart', handleMouseDown);
          app.on('touchmove', handleMouseMove);
          app.on('touchend', handleMouseUp);
          document.addEventListener('pointercancel', handleMouseUp, {
              passive: true
          });
      }
      document.addEventListener('contextmenu', (e)=>{
          if (params1.disableContextMenu && (device$1.ios || device$1.android || device$1.cordova || window.Capacitor && window.Capacitor.isNative)) {
              e.preventDefault();
          }
          if (useRipple) {
              if (activableElement) removeActive();
              rippleTouchEnd();
          }
      });
  }
  const Touch = {
      name: 'touch',
      params: {
          touch: {
              // Clicks
              touchClicksDistanceThreshold: 5,
              // ContextMenu
              disableContextMenu: false,
              // Tap Hold
              tapHold: false,
              tapHoldDelay: 750,
              tapHoldPreventClicks: true,
              // Active State
              activeState: true,
              activeStateElements: 'a, button, label, span, .actions-button, .stepper-button, .stepper-button-plus, .stepper-button-minus, .card-expandable, .link, .item-link, .accordion-item-toggle',
              activeStateOnMouseMove: false,
              mdTouchRipple: true,
              iosTouchRipple: false,
              touchRippleElements: '.ripple, .link, .item-link, .list label.item-content, .list-button, .links-list a, .button, button, .input-clear-button, .dialog-button, .tab-link, .item-radio, .item-checkbox, .actions-button, .searchbar-disable-button, .fab a, .checkbox, .radio, .data-table .sortable-cell:not(.input-cell), .notification-close-button, .stepper-button, .stepper-button-minus, .stepper-button-plus, .list.accordion-list .accordion-item-toggle',
              touchRippleInsetElements: '.ripple-inset, .icon-only, .searchbar-disable-button, .input-clear-button, .notification-close-button, .md .navbar .link.back'
          }
      },
      create () {
          const app = this;
          extend$1(app, {
              touchEvents: {
                  start: support$1.touch ? 'touchstart' : support$1.pointerEvents ? 'pointerdown' : 'mousedown',
                  move: support$1.touch ? 'touchmove' : support$1.pointerEvents ? 'pointermove' : 'mousemove',
                  end: support$1.touch ? 'touchend' : support$1.pointerEvents ? 'pointerup' : 'mouseup'
              }
          });
      },
      on: {
          init: initTouch
      }
  };
  const SW = {
      registrations: [],
      register (path, scope) {
          const app = this;
          if (!('serviceWorker' in window.navigator) || !app.serviceWorker.container) {
              return new Promise((resolve, reject)=>{
                  reject(new Error('Service worker is not supported'));
              });
          }
          return new Promise((resolve, reject)=>{
              app.serviceWorker.container.register(path, scope ? {
                  scope
              } : {}).then((reg)=>{
                  SW.registrations.push(reg);
                  app.emit('serviceWorkerRegisterSuccess', reg);
                  resolve(reg);
              }).catch((error)=>{
                  app.emit('serviceWorkerRegisterError', error);
                  reject(error);
              });
          });
      },
      unregister (registration) {
          const app = this;
          if (!('serviceWorker' in window.navigator) || !app.serviceWorker.container) {
              return new Promise((resolve, reject)=>{
                  reject(new Error('Service worker is not supported'));
              });
          }
          let registrations;
          if (!registration) registrations = SW.registrations;
          else if (Array.isArray(registration)) registrations = registration;
          else registrations = [
              registration
          ];
          return Promise.all(registrations.map((reg)=>new Promise((resolve, reject)=>{
                  reg.unregister().then(()=>{
                      if (SW.registrations.indexOf(reg) >= 0) {
                          SW.registrations.splice(SW.registrations.indexOf(reg), 1);
                      }
                      app.emit('serviceWorkerUnregisterSuccess', reg);
                      resolve();
                  }).catch((error)=>{
                      app.emit('serviceWorkerUnregisterError', reg, error);
                      reject(error);
                  });
              })));
      }
  };
  const SW$1 = {
      name: 'sw',
      params: {
          serviceWorker: {
              path: undefined,
              scope: undefined
          }
      },
      create () {
          const app = this;
          $.extend(app, {
              serviceWorker: {
                  container: 'serviceWorker' in window.navigator ? window.navigator.serviceWorker : undefined,
                  registrations: SW.registrations,
                  register: SW.register.bind(app),
                  unregister: SW.unregister.bind(app)
              }
          });
      },
      on: {
          init () {
              if (!('serviceWorker' in window.navigator)) return;
              const app = this;
              if (app.device.cordova || window.Capacitor && window.Capacitor.isNative) return;
              if (!app.serviceWorker.container) return;
              const paths = app.params.serviceWorker.path;
              const scope = app.params.serviceWorker.scope;
              if (!paths || Array.isArray(paths) && !paths.length) return;
              const toRegister = Array.isArray(paths) ? paths : [
                  paths
              ];
              toRegister.forEach((path)=>{
                  app.serviceWorker.register(path, scope);
              });
          }
      }
  };
  /**
   * Wia App 基类，从 Module 和 Event 继承。
   */ // 使用 rollup打包注意
  // dom 独立，不打入 core！！！
  // import $ from '@wiajs/dom'; // dom操作库，这种引用，导致 dom的压缩、非压缩 common包都会打入 core
  // const $ = require('@wiajs/dom'); // dom操作库，这种引用，导致 dom的压缩、非压缩 common包都不会打入 core，保留了 require
  const { extend, nextFrame, colorThemeCSSStyles } = Utils;
  const { support, device } = $;
  // Default
  const def$1 = {
      version: '1.0.1',
      el: 'body',
      root: 'body',
      theme: 'auto',
      language: window.navigator.language,
      routes: [],
      name: 'App',
      lazyModulesPath: null,
      initOnDeviceReady: true,
      // init: true, // 路由加载应用时为true
      darkMode: undefined,
      iosTranslucentBars: true,
      iosTranslucentModals: true,
      component: undefined,
      componentUrl: undefined,
      userAgent: null,
      url: null,
      colors: {
          primary: '#007aff',
          red: '#ff3b30',
          green: '#4cd964',
          blue: '#2196f3',
          pink: '#ff2d55',
          yellow: '#ffcc00',
          orange: '#ff9500',
          purple: '#9c27b0',
          deeppurple: '#673ab7',
          lightblue: '#5ac8fa',
          teal: '#009688',
          lime: '#cddc39',
          deeporange: '#ff6b22',
          white: '#ffffff',
          black: '#000000'
      }
  };
  /**
   * 应用类，每个wia应用从该类继承，由 首页加载创建或者路由创建
   */ let App = class App extends Module {
      // 应用事件
      // 首次加载事件，全局只触发一次
      load(param) {
          this.emit('local::load appLoad', param);
      }
      // 从后台切换到前台显示事件
      show(url, data) {
          this.emit('local::show appShow', url, data);
      }
      // 从前台显示切换到后台事件
      hide() {
          this.emit('local::hide appHide');
      }
      // 卸载应用事件
      unload() {
          this.emit('local::unload appUnload');
      }
      setColorTheme(color) {
          if (!color) return;
          const app = this;
          app.colors.primary = color;
          app.setColors();
      }
      setColors() {
          const app = this;
          if (!app.colorsStyleEl) {
              app.colorsStyleEl = document.createElement('style');
              document.head.prepend(app.colorsStyleEl);
          }
          app.colorsStyleEl.textContent = colorThemeCSSStyles(app.colors);
      }
      /**
     * 绑定容器
     * 应用初始化时调用
     * @param {HTMLElement} rootEl
     */ mount(rootEl) {
          const app = this;
          const $rootEl = $(rootEl || app.params.el).eq(0);
          extend(app, {
              // Root
              root: $rootEl,
              $el: $rootEl,
              el: $rootEl == null ? void 0 : $rootEl[0],
              // RTL
              rtl: $rootEl.css('direction') === 'rtl'
          });
          // Save Root
          if (app.root && app.root[0]) {
              app.root[0].wia = app;
          }
          if (app.$el && app.$el[0]) {
              app.$el[0].wia = app;
          }
          app.el.f7 = app;
          // 自动暗黑主题，Auto Dark Theme
          const DARK = '(prefers-color-scheme: dark)';
          const LIGHT = '(prefers-color-scheme: light)';
          app.mq = {};
          if (window.matchMedia) {
              app.mq.dark = window.matchMedia(DARK);
              app.mq.light = window.matchMedia(LIGHT);
          }
          app.colorSchemeListener = ({ matches, media })=>{
              if (!matches) {
                  return;
              }
              const html = document.querySelector('html');
              if (media === DARK) {
                  html.classList.add('dark');
                  app.darkMode = true;
                  app.emit('darkModeChange', true);
              } else if (media === LIGHT) {
                  html.classList.remove('dark');
                  app.darkMode = false;
                  app.emit('darkModeChange', false);
              }
          };
          app.emit('mount');
      }
      /**
     * 初始化数据
     */ initData() {
          const app = this;
          // Data
          app.data = {};
          if (app.params.data && typeof app.params.data === 'function') {
              $.extend(app.data, app.params.data.bind(app)());
          } else if (app.params.data) {
              $.extend(app.data, app.params.data);
          }
          // Methods
          app.methods = {};
          if (app.params.methods) {
              Object.keys(app.params.methods).forEach((methodName)=>{
                  if (typeof app.params.methods[methodName] === 'function') {
                      app.methods[methodName] = app.params.methods[methodName].bind(app);
                  } else {
                      app.methods[methodName] = app.params.methods[methodName];
                  }
              });
          }
      }
      enableAutoDarkTheme() {
          if (!window.matchMedia) return;
          const app = this;
          const html = document.querySelector('html');
          if (app.mq.dark && app.mq.light) {
              app.mq.dark.addEventListener('change', app.colorSchemeListener);
              app.mq.light.addEventListener('change', app.colorSchemeListener);
          }
          if (app.mq.dark && app.mq.dark.matches) {
              html.classList.add('dark');
              app.darkMode = true;
              app.emit('darkModeChange', true);
          } else if (app.mq.light && app.mq.light.matches) {
              html.classList.remove('dark');
              app.darkMode = false;
              app.emit('darkModeChange', false);
          }
      }
      disableAutoDarkTheme() {
          if (!window.matchMedia) return;
          const app = this;
          if (app.mq.dark) app.mq.dark.removeEventListener('change', app.colorSchemeListener);
          if (app.mq.light) app.mq.light.removeEventListener('change', app.colorSchemeListener);
      }
      setDarkMode(mode) {
          const app = this;
          if (mode === 'auto') {
              app.enableAutoDarkMode();
          } else {
              app.disableAutoDarkMode();
              $('html')[mode ? 'addClass' : 'removeClass']('dark');
              app.darkMode = mode;
          }
      }
      initAppComponent(callback) {
          const app = this;
          app.router.componentLoader(app.params.component, app.params.componentUrl, {
              componentOptions: {
                  el: app.$el[0]
              }
          }, (el)=>{
              app.$el = $(el);
              app.$el[0].wia = app;
              app.$elComponent = el.f7Component;
              app.el = app.$el[0];
              if (callback) callback();
          }, ()=>{});
      }
      // 初始化，包括控制 html 样式，wia app 启动时需要执行，切换app时，不需要
      init(rootEl) {
          const app = this;
          app.setColors();
          app.mount(rootEl);
          const init = ()=>{
              if (app.initialized) return app;
              app.$el.addClass('framework7-initializing');
              // RTL attr
              if (app.rtl) {
                  $('html').attr('dir', 'rtl');
              }
              // Auto Dark Mode
              if (typeof app.params.darkMode === 'undefined') {
                  app.darkMode = $('html').hasClass('dark');
              } else {
                  app.setDarkMode(app.params.darkMode);
              }
              // Watch for online/offline state
              window.addEventListener('offline', ()=>{
                  app.online = false;
                  app.emit('offline');
                  app.emit('connection', false);
              });
              window.addEventListener('online', ()=>{
                  app.online = true;
                  app.emit('online');
                  app.emit('connection', true);
              });
              // Root class
              app.$el.addClass('framework7-root');
              // Theme class
              $('html').removeClass('ios md pc').addClass(app.theme);
              // iOS Translucent
              if (app.params.iosTranslucentBars && app.theme === 'ios') {
                  $('html').addClass('ios-translucent-bars');
              }
              if (app.params.iosTranslucentModals && app.theme === 'ios') {
                  $('html').addClass('ios-translucent-modals');
              }
              // Init class
              nextFrame(()=>{
                  app.$el.removeClass('framework7-initializing');
              });
              initStyle();
              // Emit, init other modules
              app.initialized = true;
              // 发起init 事件，模块 on 里面有 init方法的会被触发
              app.emit('init');
          };
          if (app.params.component || app.params.componentUrl) {
              app.initAppComponent(()=>{
                  init();
              });
          } else {
              init();
          }
          return app;
      }
      // eslint-disable-next-line
      // 加载模块
      loadModule(m) {
          App.loadModule(m);
          // 模块初始化
          if (this[m.name].init) this[m.name].init();
      }
      // eslint-disable-next-line
      loadModules(...args) {
          return App.loadModules(...args);
      }
      getVnodeHooks(hook, id) {
          const app = this;
          if (!app.vnodeHooks || !app.vnodeHooks[hook]) return [];
          return app.vnodeHooks[hook][id] || [];
      }
      // eslint-disable-next-line
      get $() {
          return $;
      }
      static get Dom() {
          return $;
      }
      static get $() {
          return $;
      }
      static get Module() {
          return Module;
      }
      static get Event() {
          return Event;
      }
      static get Class() {
          return Module;
      }
      static get Events() {
          return Event;
      }
      constructor(opts = {}){
          super(opts);
          // eslint-disable-next-line
          // 单例，只能一个
          if (App.instance && typeof window !== 'undefined') {
              throw new Error("App is already initialized and can't be initialized more than once");
          }
          const passedParams = extend({}, opts);
          const app = this;
          $.App = App;
          App.instance = app; // 控制单例
          app.device = device;
          app.support = support;
          console.log('App constructor', {
              Device: device,
              Support: support
          });
          // Extend defaults with modules params
          app.useModulesParams(def$1);
          // Extend defaults with passed params
          app.params = extend(def$1, opts);
          // 兼容 root
          if (opts.root && !opts.el) {
              app.params.el = opts.root;
          }
          // 判断Page、App实例
          $.isPage = (p)=>p instanceof Page;
          $.isApp = (p)=>p instanceof App;
          // 参数内容赋值给app 实例
          extend(app, {
              owner: app.params.owner,
              name: app.params.name,
              id: `${app.params.owner}.${app.params.name}`,
              version: app.params.version,
              // Routes
              routes: app.params.routes,
              // Lang
              language: app.params.language,
              cfg: app.params.cfg,
              api: app.params.api,
              // Theme 主题
              theme: (()=>{
                  if (app.params.theme === 'auto') {
                      if (device.ios) return 'ios';
                      if (device.desktop) return 'pc';
                      return 'md';
                  }
                  return app.params.theme;
              })(),
              // Initially passed parameters
              passedParams,
              online: window.navigator.onLine,
              colors: app.params.colors,
              darkMode: app.params.darkMode
          });
          if (opts.store) app.params.store = params.store;
          // 触摸事件
          app.touchEvents = {
              start: support.touch ? 'touchstart' : support.pointerEvents ? 'pointerdown' : 'mousedown',
              move: support.touch ? 'touchmove' : support.pointerEvents ? 'pointermove' : 'mousemove',
              end: support.touch ? 'touchend' : support.pointerEvents ? 'pointerup' : 'mouseup'
          };
          // 插件：插入的模块类，每个模块作为app的一个属性，合并到实例。
          // 模块包括相关属性及方法（如：create、get、destroy）
          // 调用每个模块的 create 方法
          app.useModules();
          // 初始化数据，Init Data & Methods
          app.initData();
          // 应用初始化，路由跳转时不执行初始化
          if (app.params.init) {
              if (device.cordova && app.params.initOnDeviceReady) {
                  $(document).on('deviceready', ()=>{
                      app.init();
                  });
              } else {
                  app.init();
              }
          }
          // Return app instance
          return app;
      }
  };
  App.apps = {};
  /**
   * 初始化html样式
   * from device module
   */ function initStyle() {
      const classNames = [];
      const html = document.querySelector('html');
      const metaStatusbar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!html) return;
      if (device.standalone && device.ios && metaStatusbar && metaStatusbar.content === 'black-translucent') {
          classNames.push('device-full-viewport');
      }
      // Pixel Ratio
      classNames.push(`device-pixel-ratio-${Math.floor(device.pixelRatio)}`);
      // OS classes
      if (device.os && !device.desktop) {
          classNames.push(`device-${device.os}`);
      } else if (device.desktop) {
          classNames.push('device-desktop');
          if (device.os) {
              classNames.push(`device-${device.os}`);
          }
      }
      if (device.cordova || device.phonegap) {
          classNames.push('device-cordova');
      }
      // Add html classes
      classNames.forEach((className)=>{
          html.classList.add(className);
      // console.log({className});
      });
  }
  // App 类 静态方法、属性
  App.jsx = jsx;
  App.ModalMethods = Modals;
  App.ConstructorMethods = Constructors;
  // 动态加载模块（base里面已经内置动态加载，这个方法应该用不上）
  App.loadModule = loadModule;
  App.loadModules = (modules)=>{
      return Promise.all(modules.map((module)=>App.loadModule(module)));
  };
  // app 加载到 app实例的一些扩展模块
  App.support = support;
  App.device = device;
  App.utils = Utils;
  // 添加应用缺省模块
  App.use([
      Resize,
      Click,
      Touch,
      SW$1
  ]);
  // feature detection
  // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/img/srcset.js
  document.body.classList.contains('srcset') || 'srcset' in document.createElement('img');
  // export {default as Support} from './support';
  // export {default as Device} from './device';
  $.support;
  $.device;

  /**
   * 前端日志输出，封装 console日志，简化代码，支持模块或直接输出
   * 调用时，描述字符串后置，便于可选缺省，输出时，自带前置，类似 后端pino，保持前后端一致性
   * m 为模块，fn 为函数名称
   */ let Log = class Log {
      /**
     * get log desc
     * 描述字符串后置调用，前置显示
     * @param {*[]} args
     * @returns {string}
     */ getDesc(args) {
          let R = '';
          try {
              const _ = this;
              const { m } = _;
              let fn = '', desc = '';
              if (args.length > 1) {
                  const last = args.at(-1);
                  if (typeof last === 'object') {
                      ;
                      ({ desc, fn } = last);
                  } else if (typeof last === 'string') desc = last;
                  if (desc || fn) {
                      fn = fn || _.fn;
                      _.fn = fn;
                      args.pop();
                  }
              }
              fn = fn || _.fn;
              if (m) desc = `${desc}[${m}${fn ? ':' + fn : ''}]`; // eslint-disable-line
              R = desc;
          } catch (e) {
              console.error(`getDesc exp:${e.message}`);
          }
          return R;
      }
      /** @param {...any} args - params */ log(...args) {
          const _ = this;
          const last = args.at(-1);
          // clear fn
          if (args.length === 1 && typeof last === 'object' && last.fn) _.fn = '';
          else {
              const desc = _.getDesc(args);
              console.log(desc, ...args);
          }
      }
      /** @param {...any} args - params */ debug(...args) {
          const _ = this;
          const desc = _.getDesc(args);
          if (desc) console.log(desc, ...args);
          else console.log(...args);
      }
      /** @param {...any} args - params */ info(...args) {
          const _ = this;
          const desc = _.getDesc(args);
          if (desc) console.info(desc, ...args);
          else console.log(...args);
      }
      /** @param {...any} args - params */ warn(...args) {
          const _ = this;
          const { desc, arg } = _.getDesc(args);
          if (desc) console.warn(desc, ...arg);
          else console.log(...args);
      }
      /** @param {...any} args - params */ trace(...args) {
          const _ = this;
          const { desc, arg } = _.getDesc(args);
          if (desc) console.trace(desc, ...arg);
          else console.trace(...args);
      }
      /** @param {...any} args - params */ error(...args) {
          const _ = this;
          const desc = _.getDesc(args);
          if (desc) console.error(desc, ...args);
          else console.log(...args);
      }
      /**
     * 用于 catch(e) log.err(e)
     * @param {...any} args - params */ err(...args) {
          const _ = this;
          const first = args == null ? void 0 : args[0];
          if (first instanceof Error || first && first.message && first.cause && first.stack) args[0] = {
              exp: args[0].message
          };
          _.error(...args);
      }
      /**
     * @param {string} m 模块
     */ constructor(m){
          /** @type {string} 模块 */ this.m = '';
          /** @type {string} 函数 */ this.fn = '';
          this.m = m;
      }
  };
  function getDesc(args) {
      let desc = '';
      const last = args.at(-1);
      if (typeof last === 'string') {
          desc = last;
          args.pop();
      }
      return desc;
  }
  /**
   * 标准日志输出或构建模块日志类实例，用于模块中带[m:xxx]标记日志输出
   * 启用 {f:fn} 标记时，需在函数尾部清除f（log({f:''})），否则会溢出到其他函数
   * @param {...any} args - params
   * returns {*}
   */ function log(...args) {
      const last = args.at(-1);
      // 全局日志
      if (args.length !== 1 || !(last == null ? void 0 : last.m)) {
          const desc = getDesc(args);
          desc ? console.log(desc, ...args) : console.log(...args);
          return;
      }
      // 唯一 m 属性，则构造新的 log 实例，这种写法，能被jsDoc识别子属性
      const lg = new Log(last == null ? void 0 : last.m);
      /** @param {*} args2 */ const R = (...args2)=>lg.log(...args2);
      R.debug = lg.debug.bind(lg);
      R.info = lg.info.bind(lg);
      R.warn = lg.warn.bind(lg);
      R.info = lg.info.bind(lg);
      R.trace = lg.trace.bind(lg);
      R.error = lg.error.bind(lg);
      R.err = lg.err.bind(lg);
      return R;
  }
  /**
   * 用于 catch(e) log.err(e)
   * @param {...any} args - params */ log.err = (...args)=>{
      const desc = getDesc(args);
      const first = args == null ? void 0 : args[0];
      if (first instanceof Error || first && first.message && first.cause && first.stack) args[0] = {
          exp: args[0].message
      };
      desc ? console.error(desc, ...args) : console.error(...args);
  };
  /**
   * @param {...any} args - params */ log.error = (...args)=>{
      const desc = getDesc(args);
      desc ? console.error(desc, ...args) : console.error(...args);
  };
  /**
   * @param {...any} args - params */ log.warn = (...args)=>{
      const desc = getDesc(args);
      desc ? console.warn(desc, ...args) : console.warn(...args);
  };
  /**
   * @param {...any} args - params */ log.info = (...args)=>{
      const desc = getDesc(args);
      desc ? console.info(desc, ...args) : console.info(...args);
  };
  /**
   * @param {...any} args - params */ log.debug = (...args)=>{
      const desc = getDesc(args);
      desc ? console.log(desc, ...args) : console.log(...args);
  };
  /**
   * @param {...any} args - params */ log.trace = (...args)=>{
      const desc = getDesc(args);
      desc ? console.trace(desc, ...args) : console.trace(...args);
  };

  /**
   * wia 前端路由
   * First Version Released on: September 13,2016
   * Copyright © 2014-2021 Sibyl Yu
   */ function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
          var info = gen[key](arg);
          var value = info.value;
      } catch (error) {
          reject(error);
          return;
      }
      if (info.done) {
          resolve(value);
      } else {
          Promise.resolve(value).then(_next, _throw);
      }
  }
  function _async_to_generator(fn) {
      return function() {
          var self = this, args = arguments;
          return new Promise(function(resolve, reject) {
              var gen = fn.apply(self, args);
              function _next(value) {
                  asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
              }
              function _throw(err) {
                  asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
              }
              _next(undefined);
          });
      };
  }
  function _extends() {
      _extends = Object.assign || function(target) {
          for(var i = 1; i < arguments.length; i++){
              var source = arguments[i];
              for(var key in source){
                  if (Object.prototype.hasOwnProperty.call(source, key)) {
                      target[key] = source[key];
                  }
              }
          }
          return target;
      };
      return _extends.apply(this, arguments);
  }
  log({
      m: 'router'
  }) // 创建日志实例
;
  /** {*} */ // @ts-ignore
  const $$1 = window.$;
  /** {*} */ // @ts-ignore
  const { location } = window // eslint-disable-line
  ;
  const LoginType = {
      site: 0,
      pwd: 1,
      sms: 2,
      email: 3,
      code: 4,
      sign: 5,
      wia: 6,
      wx: 7,
      wxqy: 8,
      wxapp: 9,
      bd: 10,
      ms: 11,
      gg: 12,
      ap: 13,
      fb: 14,
      gh: 15,
      fs: 16
  };
  /**
   * @typedef {object} Opts
   * @prop {string} el - 应用容器
   * @prop {string} view - 应用视图
   * @prop {string} cos - 资源网址
   * @prop {string} ver
   * @prop {string} mode - 本地调试时，需设置为 local，生产发布时需设置为 pub
   * @prop {string} [owner] - 自动加载应用作者，可选，自动加载 page/index，需确保存在！！！
   * @prop {string} [name] -  自动加载应用名称，
    // pages: vite ? pages : undefined, // 用于 vite 本地调试
   */ // default option
  const def = {
      el: '#wia-app',
      view: 'wia-view',
      style: 'wia-style',
      splashTime: 1000,
      className: 'page',
      nextClass: 'page-next',
      prevClass: 'page-previous',
      showClass: 'page-current',
      cos: 'https://cos.wia.pub',
      ver: '1.0.2',
      mode: 'local',
      transition: 'f7-flip',
      api: {
          host: 'https://wia.pub',
          token: 'auth/login',
          login: 'auth/login',
          logout: 'auth/logout',
          getCode: 'auth/getCode',
          getToken: 'auth/getToken',
          checkToken: 'auth/checkToken',
          userInfo: 'user/info'
      }
  };
  let Router = class Router extends Event {
      /**
     * 导航并传递对象参数, 更改当前路由 为 指定 路由
     * 网址 hash 直接导航只能传字符参数,不能传对象参数
     * @param {string} url hash
     * @param {object} [param] 对象参数 {name: val}，不是字符串！
     * @param {boolean} [refresh] 是否强制刷新, 默认跳转时，如果目的页面已经缓存，则直接显示，触发show事件，不会触发load和ready，
     * 如果设置为true，则跳转时，如果有缓存，则删除缓存，重新 触发 load、ready
     */ go(url, param = null, refresh = false) {
          const _ = this;
          // this._go = false;
          /*
       const r = this.getRoute(url);
       if (r) {
       r.param = r.param || {};
       $.assign(r.param, param);
       // this._go = true;
       r.refresh = refresh;
       }
       */ // 空路由到首页
          url = url || 'index';
          url = _.repairUrl(url);
          // console.log('go ', {url, param, refresh, href: location.href});
          // 刷新当前网页重新加载应用，不会触发 hashchange事件，当前hash作为第一个路由点
          if (getHash(location.href) === url) {
              // `#${url}`;
              _.nextHash = url;
              if (!_.hash.length || _.hash[_.hash.length - 1] !== _.nextHash) _.hash.push(_.nextHash);
              _.routeTo(url, param, refresh);
          } else {
              // 切换页面hash，通过 hash变化事件来路由
              _.setHash(url, param, refresh);
          }
      }
      /**
     * 全屏模式不能跨网页，因此不同应用只能用不同hash区分
     * 路由仅接受绝对hash，自动将相对path转换为绝对hash
     * 保留 search
     * http://wia.pub/#codecamp -> http://wia.pub/#/nuoya/camp/  快链
     * http://wia.pub/#/nuoya/camp -> http://wia.pub/#/nuoya/camp/
     * http://wia.pub/#/nuoya/camp/index -> http://wia.pub/#/nuoya/camp/
     * 对于启动router的应用
     * go('index') -> http://wia.pub/#/nuoya/store/index -> http://wia.pub
     * $.go('b') 转换为 $.go('/star/etrip/b')
     * 实际网址 https://wia.pub/#!/ower/name/b
     * $.go('/') 切换到当前路径的根路径：wia.pub/#/ower/name，
     * 在网址上输入 https://wia.pub/#b -> https://wia.pub/#/ower/name/b 当前应用自动补全
     * @param {string} url
     * @returns {string}
     */ repairUrl(url) {
          let R = '';
          const _ = this;
          const { opt } = _;
          if (!url) return '';
          try {
              R = url;
              // 快链
              if (url === 'codecamp') R = '/nuoya/camp/course/';
              else if (url === '~') {
                  // 首页
                  if (_.owner && _.appName) {
                      // 启动应用
                      if (_.owner === opt.owner && _.appName === opt.name) R = '';
                      else R = `/${_.owner}/${_.appName}/`;
                  }
              } else if (url.startsWith('../')) {
                  // 上一级路径
                  let { path } = this;
                  let pos = this.path.lastIndexOf('/');
                  if (pos > -1) {
                      path = path.substring(0, pos);
                      pos = this.path.lastIndexOf('/');
                      if (pos > -1) path = path.substring(0, pos);
                      else path = '';
                  } else path = '';
                  if (path === '') R = `/${this.owner}/${this.appName}/${url.substr(3)}`;
                  else R = `/${this.owner}/${this.appName}/${path}/${url.substr(3)}`;
              } else if (url.startsWith('./') && _.path) {
                  // 当前路径
                  let { path } = _;
                  const pos = _.path.lastIndexOf('/');
                  if (pos > -1) {
                      path = path.substring(0, pos);
                      R = `/${_.owner}/${_.appName}/${path}/${url.slice(2)}`;
                  } else R = `/${_.owner}/${_.appName}/${url.slice(2)}`;
              } else if (!url.startsWith('/')) {
                  // xxx -> /owner/name/xxx
                  // xxx -> /xxx
                  if (_.owner && _.appName) R = `/${_.owner}/${_.appName}/${url}`;
                  else if (_.opt.owner && _.opt.name) R = `/${_.opt.owner}/${_.opt.name}/${url}`;
                  else R = `/${url}`;
              } else if (url.startsWith('/')) {
                  // 自动补充 index
                  const ms = url.match(/([^/?]+)\/([^/?]+)\/?([^?]*)([\s\S]*)/);
                  // default to index
                  if (ms) {
                      const owner = ms[1];
                      const name = ms[2];
                      const page = ms[3];
                      if (owner && name && !page) R = `/${owner}/${name}/${ms[4]}`;
                  }
              }
              if (R.endsWith('/index')) R = R.replace(/\/index$/, '/');
              // 启动应用 /nuoya/store/index => '' /nuoya/store/ => ''
              if (new RegExp(`^/${opt.owner}/${opt.name}/$`).test(R)) R = '';
              // /ower/app/index -> /ower/app/
              // R = url.endsWith('/') ? url.substr(0, url.length - 1) : url;
              // / 结尾，代表目录，自动加载 index，网址后缀不加 index保留网址简洁
              // /ower/app/fea/ => /ower/app/fea/index
              // R = R.endsWith('/') ? `${R}index` : R
              // /ower/app/fea/?a=1 => /ower/app/fea/index?a=1
              // R = R.replace(/\/\?/g, '/index?')
              if (R !== url) console.log(`router repairUrl:${url} -> ${R}`);
          } catch (e) {
              console.error(`router repairUrl exp:${e.message}`);
          }
          return R;
      }
      /**
     * 回退
     * @param {*} param 参数
     * @param {*} refresh 刷新
     */ back(param, refresh = false) {
          var _this_hash;
          if (((_this_hash = this.hash) == null ? void 0 : _this_hash.length) > 1) {
              const to = this.hash[this.hash.length - 2];
              this.param[to] = param;
              this.refresh[to] = refresh;
          }
          // 浏览器回退
          window.history.back();
      }
      /**
     * 判断页面是否已加载过
     */ loaded(p) {
          return $$1.id(p.id) || this.vs[p.id];
      }
      /**
     * 动态下载页面js，里面包括js、html和css
     * 本地调试，则动态从本地下载html、css
     * @param {string} url 加载页面网址，格式：/ower/appname/page
     * @param {*} param
     * @returns {Promise<Object>}
     */ load(url, param) {
          var _this = this;
          return _async_to_generator(function*() {
              let R;
              const _ = _this;
              const { opt } = _;
              try {
                  // console.log(`router load url:${url}`);
                  // const pos = path.lastIndexOf('/');
                  // const name = path.substr(pos + 1);
                  // 空路由作为启动应用index页面，/结尾或/? 加 index
                  if (url === '') {
                      // if (_.owner && _.appName) url = `/${_.owner}/${_.appName}/index`
                      if (opt.owner && opt.name) url = `/${opt.owner}/${opt.name}/index`;
                  } else if (url.endsWith('/')) url += 'index';
                  else if (url.includes('/?')) url = url.replace('/?', '/index?');
                  const ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)/);
                  // const ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)([\s\S]*)/);
                  const owner = ms == null ? void 0 : ms[1];
                  const name = ms == null ? void 0 : ms[2];
                  let path = ms == null ? void 0 : ms[3];
                  // 默认page 为 index
                  if (owner && name && !path) path = 'index';
                  console.log('load', {
                      url,
                      owner,
                      name,
                      path
                  });
                  // 加载页面必须 owner、name 和 page
                  if (!owner || !name || !path) throw new Error('need owner|name|path');
                  let app = _.findApp(owner, name);
                  if (!app) {
                      // ! 应用不存在，创建并切换应用
                      yield _.switchApp(owner, name, path, param);
                      // 加载应用时，需在显示事件中完成应用内路由，避免越权
                      // _.showApp(app)
                      // ! 终止当前路由，由应用show完成后续路由（身份识别与登录等）
                      return;
                  }
                  if (opt.mode === 'local') {
                      // 本地调试状态，直接获取本地页面
                      // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
                      const pgHtml = new Promise((resHtml, rejHtml)=>{
                          const pgurl = `${opt.cos}/page/${path}.html?v=${Date.now()}`;
                          // console.log('router load html:', {url: pgurl})
                          $$1.get(pgurl).then((rs)=>{
                              var _this_pages;
                              // 页面获取成功，vite 需使用 this.pages才生效
                              // debugger;
                              console.log('router load html:', {
                                  url: pgurl,
                                  rs
                              });
                              var _this_pages_;
                              // 获得页面模块类，并创建页面对象实例
                              const Cls = (_this_pages_ = (_this_pages = _this.pages) == null ? void 0 : _this_pages[`./page/${path}`]) != null ? _this_pages_ : __webpack_require__(`./src/page/${path}.js`).default // eslint-disable-line
                              ;
                              // 创建页面实例
                              const p = new Cls({
                                  app: _.app
                              }) // eslint-disable-line
                              ;
                              // master login
                              if (p.opt) {}
                              // 去掉 vite 添加的 脚本标签
                              p.html = _.vite ? rs.replace('<script type="module" src="/@vite/client"></script>', '') : rs;
                              p.param = param;
                              // 保存应用所有者和应用名称
                              p.owner = owner;
                              p.appName = name;
                              p.url = `/${owner}/${name}/${path}`;
                              p.path = path;
                              let { hash } = window.location;
                              if (hash.startsWith('#')) hash = hash.substring(1);
                              if (hash.startsWith('!')) hash = hash.substring(1);
                              p.hash = hash;
                              _this.cachePage(p) // save page instance
                              ;
                              resHtml(p);
                          }, (err)=>rejHtml(err));
                      });
                      const pgCss = new Promise((resCss, rejCss)=>{
                          const pgurl = `${opt.cos}/page/${path}.css?v=${Date.now()}`;
                          // console.log(`router load css:${url}`);
                          if (_.vite) {
                              import(`${opt.cos}/page/${path}.css`).then((m)=>resCss(m)).catch((err)=>rejCss(err));
                          } else {
                              $$1.get(pgurl).then((rs)=>{
                                  // debugger;
                                  // console.log('router load css:', {url: pgurl, rs});
                                  resCss(rs);
                              }, (err)=>resCss('') // rejCss(err) css 可选
                              );
                          }
                      });
                      const rs = yield Promise.all([
                          pgHtml,
                          pgCss
                      ]);
                      const p = rs[0];
                      p.css = rs[1] // eslint-disable-line
                      ;
                      // 触发 load 事件
                      if (p.load) p.load(param || {});
                      R = p;
                  } else {
                      // wia pub 模式，gzip压缩包，2020年 chrome，2023年3月 safari
                      if (opt.cos.includes('localhost:')) url = `${opt.cos}/page/${path}.zip?v=${Date.now()}`;
                      else url = `${opt.cos}/${owner}/${name}/page/${path}.zip?v=${Date.now()}`;
                      console.log('router load page:', {
                          url
                      });
                      // let r = await $.get(url)
                      const r = yield unzip(url);
                      // console.log(r);
                      if (r == null ? void 0 : r.js) {
                          const k = `${owner}/${name}/page/${path}.js`;
                          const code = r.js[k];
                          if (!$$1.M.m[k]) $$1.M.add(r.js) // 模块加入到缓存数组
                          ;
                          // console.log(r.js);
                          const Cls = $$1.M(k).default // 加载该模块
                          ;
                          // 创建页面实例
                          const p = new Cls({
                              app: _.app
                          }) // eslint-disable-line
                          ;
                          // master login
                          if (p.opt) {}
                          p.html = r.html;
                          p.css = r.css;
                          p.param = param;
                          // 保存应用所有者和应用名称
                          p.owner = owner;
                          p.appName = name;
                          p.url = `/${owner}/${name}/${path}`;
                          p.path = path;
                          _.cachePage(p);
                          // 触发 load 事件
                          if (p.load) p.load(param || {});
                          R = p;
                      }
                  }
              } catch (e) {
                  console.error(`load exp:${e.message}`);
              }
              return R;
          })();
      }
      /**
     * 创建应用
     * @param {string} owner 所有者
     * @param {string} name 应用名称
     * @returns {Promise <*>}
     */ createApp(owner, name) {
          var _this = this;
          return _async_to_generator(function*() {
              let R;
              const _ = _this;
              const { opt } = _;
              try {
                  let app = _.findApp(owner, name);
                  if (app) return app;
                  let appCls = null;
                  if (opt.mode === 'local') {
                      var __pages;
                      var __pages_srcindex;
                      // 本地调试，owner 必须一致
                      if (owner === opt.owner) appCls = (__pages_srcindex = (__pages = _.pages) == null ? void 0 : __pages['./src/index']) != null ? __pages_srcindex : __webpack_require__('./src/index.js').default;
                  // appCls = _.pages?.['./src/index'] ?? __webpack_require__('./src/index.js')
                  } else {
                      // wia 模式
                      const m = `${owner}/${name}/index.js`;
                      // 需动态下载
                      if (!$$1.M.m[m]) {
                          let url;
                          if (opt.cos.includes('localhost:')) url = `${opt.cos}/index.zip?v=${Date.now()}`;
                          else url = `${opt.cos}/${owner}/${name}/index.zip?v=${Date.now()}`;
                          console.log('router load app:', {
                              url
                          });
                          // const r = await $.get(url)
                          const r = yield unzip(url);
                          // debugger;
                          // console.log(r);
                          if (r == null ? void 0 : r.js) $$1.M.add(r.js) // 模块加入到缓存数组
                          ;
                      }
                      if ($$1.M.m[m]) appCls = $$1.M(m).default // 加载应用index模块
                      ;
                  }
                  if (appCls) {
                      // eslint-disable-next-line
                      app = new appCls({
                          el: opt.el || opt.root,
                          init: _.init,
                          owner,
                          name
                      });
                      if (app) {
                          _.app = app;
                          _.init = false // 第一个应用需初始化，后续应用无需初始化
                          ;
                      }
                      // 缓存应用
                      _.apps[`${owner}.${name}`] = app;
                      // _.lastPage = null // 切换 app
                      // _.page = null
                      // $.lastPage = null
                      // $.page = null
                      if (app.ready) // 重新绑定事件
                      $$1.nextTick(()=>{
                          app.ready();
                      });
                      R = app;
                  }
              } catch (e) {
                  console.log('createApp exp:', e.message);
              }
              return R;
          })();
      }
      /**
     * 已创建应用的显示，触发应用show事件
     * 终止原路由，调用show后，重新路由，应用show事件中可修改返回路由策略，包括 master 和 login
     * 应用显示时，根据应用login设置，跳转到login页面，由login跳转到hash
     * login跳转再次执行当前函数，触发应用show函数，应用show函数可控制路由
     * 如缺省路由、master/detail 路由等
     * 应用启动(show)后，通过 hash 直接加载页面，不再通过当前函数
     *  state 微信oAuth通过state传参数
     *  from:从哪里启动 to:去哪里 sid:site id，appid：app id
       应用显示时路由优先级：
       param中的to或应用show中通过param指定to
       > state(微信)中param的to > 用户hash指定 > 应用配置的home > 缺省 page/index
       tate 移到 应用创建前处理，showApp不再处理 state，state中的param作为参数传入
       ash 作为参数传入，showApp不读取当前网址hash
       ash指定是用户要去的路由，应用可在show中通过指定to来修改去向，并将用户hash放入 param中，
       由去向处理用户路由
       如 login，修改路由到login，登录成功在到to，在to中，应用根据 param 处理后续路由
       微信路由有些不同：
       1. 从菜单进入，没有hash，只有url param中的state，需在启动应用中通过state中的hash来创建应用，
         from 指定菜单来源，sid 指定主站来源
         state中的sid 优于app config缺省sid，master则由应用config设置，无需在state中设置
       2. 微信生态链接进入：微信聊天或微信公众号（可选hash与hash后的param），配置了autoAuth的应用，通过微信跳转再次进入
         此时，需将hash 和 param放入 state，from 为 chat 或 param指定，sid 为应用缺省或param指定，
         sid、from 用于识别用户入口，计算收益时用，二级：sid主站（一级），from主播（二级）
         二次进入时，类似菜单进入，通过 state中的hash创建应用，还原state中的param
       3. state中只配置hash、from、sid和param，之前的to由 hash 替代，菜单与跳转保持统一
       4. showApp在第一次进入时，依然可修改 hash 和 param，修改后微信跳转二次进入时，二次触发hash对应应用
       5. 二次进入时，会再次触发 showApp，此时，param 为第一次进入showApp时返回的 param
       3. 进入应用后，带参数跳转其他应用，此时已获得token，不再做跳转授权，此时的param为内部共享对象。
       4. 因此，对state需在路由创建时处理，以创建对应应用，showApp时，直接传入 hash 和 param。
       5. pc模拟调试手机，设置state，在启动应用创建时处理，以创建模拟应用，不在showApp中处理
     * @param {*} app
     * @param {*} [param]
     */ showApp(app, param) {
          var _this = this;
          return _async_to_generator(function*() {
              // biome-ignore lint/complexity/noUselessThisAlias: <explanation>
              const _ = _this;
              const { cfg } = app;
              const { home } = cfg;
              try {
                  // 微信二维码扫码授权跳转，需另外建一个简单页面，加快跳转速度
                  if ((param == null ? void 0 : param.loginType) === 7 && (param == null ? void 0 : param.from) === 'qr') {
                      const { sid, code: verifier } = param;
                      const from = 'wx';
                      const { appid, url, scope, authSucc: hash } = cfg.wx;
                      let { redirect } = cfg.wx;
                      const state = encodeURIComponent(`hash=${hash}&sid=${sid}&from=${from}&loginType=7&verifier=${verifier}`);
                      redirect = encodeURIComponent(redirect);
                      const href = `${url}?appid=${appid}&redirect_uri=${redirect}&response_type=code&scope=${scope}` + `&state=${state}#wechat_redirect`;
                      console.log('wxAuth', {
                          href
                      });
                      location.href = href;
                      return;
                  }
                  // 加载应用时，需在显示事件中完成应用内路由，避免越权
                  $$1.nextTick(/*#__PURE__*/ _async_to_generator(function*() {
                      var __view_qu;
                      // 加载应用时，当前网址hash 作为为用户路由去向
                      let { hash } = window.location;
                      if (hash.startsWith('#')) hash = hash.substring(1);
                      if (hash.startsWith('!')) hash = hash.substring(1);
                      // 没有param，通过网址hash后的?获取参数：from、to、sid
                      if (!param && hash) param = $$1.urlParam(hash);
                      // 保留 search
                      // hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash
                      // 微信菜单进入，需在state中配置五个参数：master、from、to、sid、param
                      // 应用 show 可修改返回新的 hash、param
                      if (app == null ? void 0 : app.show) {
                          try {
                              const rs = yield app.show(hash, param || {});
                              if (rs) ({ hash, param } = rs);
                          } catch (e) {}
                      }
                      // debugger
                      console.log('showApp', {
                          hash,
                          param
                      });
                      // code、state 参数，微信挑转，一般来源于微信服务号菜单配置，调试中也可模拟
                      // 抑制页面空 href 刷新页面行为
                      $$1.view.qus('a[href=""]').attr('href', 'javascript:;');
                      let { from, to, code, verifier, appid, sid, master, login, bindMobile, loginType } = param || {};
                      // 微信公众号菜单中对应的链接中设置 hash、from、sid，微信会通过url转发到应用中
                      appid = appid != null ? appid : cfg.appid;
                      sid = sid != null ? sid : cfg.sid;
                      var _ref;
                      master = (_ref = master != null ? master : cfg.master) != null ? _ref : '';
                      var _ref1;
                      login = (_ref1 = login != null ? login : cfg.login) != null ? _ref1 : false;
                      var _ref2;
                      bindMobile = (_ref2 = bindMobile != null ? bindMobile : cfg.bindMobile) != null ? _ref2 : false;
                      // 原路由终止，重新路由：to 优先，用户show函数可设置to覆盖网址中的hash路由
                      to = to || hash || home || 'index';
                      if (sid) sid = Number.parseInt(sid);
                      if (appid) appid = Number.parseInt(appid);
                      // 微信授权打开，通过微信code获取用户信息
                      // 优先本地缓存，缓存默认 30天过期
                      const token = yield _.getToken(app, sid, code, loginType, verifier);
                      // 删除 url中的search 参数
                      console.log('showApp', {
                          appid,
                          sid,
                          master,
                          from,
                          to,
                          code,
                          token
                      });
                      // sid 保存到全局，sid 可能与cfg中的不一样！
                      if (sid) $$1.app.sid = sid;
                      if (appid) $$1.app.id = appid;
                      // 免登录 test
                      // if (hash) $.go(hash, param)
                      // else $.go('index') // 默认加载首页
                      // _.wxAuth(app, hash, param)
                      // return
                      // 用户身份已确认（微信图像和昵称）
                      // 如需手机验证码确认，在需要时调用login登录页面！！！
                      if (token) {
                          const u = $$1.app.user;
                          // 没有手机，则需使用手机短信验证码绑定手机
                          // 已经绑定手机无需再次绑定
                          if (cfg.bindMobile && !(u == null ? void 0 : u.mobile)) _.go('login', {
                              master,
                              to,
                              param
                          });
                          else {
                              var __view_qu1;
                              // 先加载master页面，由master加载detail页面
                              if (master && !((__view_qu1 = _.view.qu('.page-master')) == null ? void 0 : __view_qu1.dom)) _.go(master, {
                                  to,
                                  param
                              });
                              else _.go(to, param);
                          }
                      } else if (!code && $$1.device.wx && cfg.wx.autoAuth) _.wxAuth(app, hash, param);
                      else if (login) {
                          // 非微信环境，手机验证登录进入
                          _.go('login', {
                              master,
                              to,
                              param
                          });
                      } else if (master && !((__view_qu = _.view.qu('.page-master')) == null ? void 0 : __view_qu.dom)) _.go(master, {
                          to,
                          param
                      });
                      else if (to) _.go(to, param) // 重新路由
                      ;
                  }));
              } catch (e) {
                  console.log('showApp err:', e.message);
              }
          })();
      }
      /**
     * 微信授权获取用户头像、昵称，获取后保存到数据库，并产生token保存单客户端本地
     * 如处理不当，微信中会反复跳转页面
     * @param {*} app
     * @param {string} hash
     * @param {*} param
     */ wxAuth(app, hash, param) {
          const { cfg } = app;
          try {
              const k = 'wxAuthCnt';
              var _$_store_get;
              let cnt = (_$_store_get = $$1.store.get(k)) != null ? _$_store_get : 0;
              if (cnt === '') cnt = 0;
              cnt = Number.parseInt(cnt);
              cnt++;
              $$1.store.set(k, cnt, 1) // 1分钟后失效，重新开始计数
              ;
              if (cnt <= cfg.wx.autoAuth) {
                  console.log({
                      hash,
                      param,
                      cnt,
                      autoAuth: cfg.wx.autoAuth
                  }, 'wxAuth');
                  if (typeof param === 'object' && Object.keys(param).length) param = JSON.stringify(param);
                  param = param != null ? param : '';
                  let state = '';
                  if (hash || param) state = encodeURIComponent(`hash=${hash}&auth=wx&param=${param}`);
                  const redirect = encodeURIComponent(cfg.wx.redirect);
                  const href = `${cfg.wx.url}?appid=${cfg.wx.appid}&redirect_uri=${redirect}&response_type=code&scope=${cfg.wx.scope}` + `&state=${state}#wechat_redirect`;
                  console.log('wxAuth', {
                      state,
                      href
                  });
                  window.location.href = href // 微信带code跳转，通过code能获得用户昵称、头像
                  ;
              }
          } catch (e) {}
      }
      /**
     * 切换应用，触发 showApp
     * @param {string} owner 所有者
     * @param {string} name 应用名称
     * @param {string} [path] 应用路径
     * @param {*} [param] 参数
     * returns 是否成功
     */ switchApp(owner, name, path, param) {
          var _this = this;
          return _async_to_generator(function*() {
              let R = false;
              const _ = _this;
              try {
                  // 无需切换
                  if (owner === _.owner && name === _.appName) {
                      if (path && path !== _.path) _.path = path;
                      return true;
                  }
                  // ! 切换需获取新应用token，暂时屏蔽
                  const tk = true // await this.getToken(owner, name)
                  ;
                  if (tk) {
                      // 应用切换处理
                      if (owner) {
                          if (_.owner !== _.lastOwner) _.lastOwner = _.owner;
                          _.owner = owner;
                      }
                      if (name) {
                          if (_.appName !== _.lastName) _.lastName = _.appName;
                          _.appName = name;
                      }
                      if (path) {
                          if (_.path !== _.lastPath) _.lastPath = _.path;
                          _.path = path;
                      }
                      let app = _.findApp(owner, name);
                      if (!app) app = yield _.createApp(owner, name);
                      if (app) {
                          if (_.lastApp) {
                              const lastApp = _.lastApp;
                              if (lastApp.hide) $$1.nextTick(()=>{
                                  lastApp.hide();
                              });
                          }
                          if (_.app) _.lastApp = _.app;
                          _.app = app;
                          $$1.app = app;
                          // 切换 app，清理上一个应用的缓存参数，避免数据泄露
                          _.lastPage = null;
                          _.page = null;
                          $$1.lastPage = null;
                          $$1.page = null;
                          // 加载应用时，需在显示事件中完成应用内路由，避免越权
                          yield _.showApp(app, param);
                          R = true;
                      }
                  }
              } catch (e) {
                  console.log('switchApp exp:', e.message);
              }
              return R;
          })();
      }
      /**
     * 获取登录token，对于需login的应用，需token调用后台接口
     * 获取有效用户身份令牌和用户信息（头像、昵称、手机号码等）
     * 用户信息保存在 $.app.user 备用！
     * 优先本地获取，本地过期，或服务器user无法获取，重新获取token
     * 服务器返回token无法获取用户信息，作为无效token删除，返回空。
     * 微信进入，有sid和code，可获取用户头像和昵称
     * 如本地有缓存token，用户无头像、昵称，则重新通过微信code、sid获取
     * 微信后台通过code获取openid，获取微信用户信息，保存到数据库
     * 微信获取图像、昵称，目前只有通过userinfo授权，否则仅获取openid
     * @param {*} app - 应用
     * @param {number} sid -  siteid
     * @param {string} code - 微信等返回的 code
     * @param {LoginType} loginType - loginType
     * @param {string} verifier - 微信扫码登录
     */ getToken(app, sid, code, loginType, verifier) {
          var _this = this;
          return _async_to_generator(function*() {
              let R = '';
              const _ = _this;
              const { opt } = _;
              const { cfg } = app;
              try {
                  let token = $$1.store.get(cfg.token);
                  if (!token) {
                      // 已通过camp登录的，保持登录
                      token = $$1.store.get(`nuoya/camp/${cfg.token}`);
                      if (token) $$1.store.set(cfg.token, token);
                  }
                  console.log('getToken', {
                      key: cfg.token,
                      token
                  });
                  // 存在登录令牌，获取用户信息
                  if (token) {
                      const u = $$1._user ? $$1._user : yield _.getUser(app, token);
                      console.log({
                          u
                      }, 'getToken');
                      if (u) {
                          if (!$$1._user) $$1._user = u // 全局保存
                          ;
                          app.user = u;
                          R = token;
                      } else if (u === 0) {
                          R = token;
                          console.error('offline!');
                      } else {
                          $$1.store.remove(cfg.token);
                          console.error('token invalid, remove and getToken again!');
                      }
                  }
                  // 通过code，重新获取 token，如微信、飞书
                  if (!R && sid && code) {
                      let type = loginType != null ? loginType : LoginType.wx;
                      // @ts-ignore
                      type = Number.parseInt(loginType);
                      const url = `${cfg[cfg.mode].api}/${opt.api.token}`;
                      let from;
                      if (type === LoginType.wx && verifier) from = 'qr';
                      if ([
                          LoginType.ms,
                          LoginType.fs
                      ].includes(type)) verifier = $$1.store.get('codeVerifier') // ms/fs PKCE 需要
                      ;
                      // 通过code login 获取 token
                      console.log({
                          url,
                          sid,
                          code,
                          verifier
                      }, 'getToken');
                      // login 获取token
                      const rs = yield $$1.post(url, {
                          sid,
                          code,
                          verifier,
                          from,
                          type
                      }) // wxfw 微信服务号
                      ;
                      if (rs) {
                          var _rs_data;
                          console.log('getToken', {
                              rs
                          });
                          if (rs.code === 200 && ((_rs_data = rs.data) == null ? void 0 : _rs_data.token)) {
                              token = rs.data.token;
                              $$1.store.set(cfg.token, token);
                              const u = yield _.getUser(app, token);
                              if (u) {
                                  $$1._user = u // 全局保存
                                  ;
                                  $$1.app.user = u;
                                  R = token;
                              } else {
                                  $$1.store.remove(cfg.token);
                                  console.error({
                                      rs
                                  }, 'getUser fail, remove token!');
                              }
                          } else console.error({
                              rs
                          }, 'getToken fail!');
                      }
                  // new Error('获取身份失败,请退出重新进入或联系客服!'), '');
                  }
              // this.checkToken(owner, name, tk).then(rs => {
              //   if (rs) {
              //     $.app.token = tk
              //     res(tk)
              //   } else {
              //     tk = $.app.token
              //     $.app.token = ''
              //     // const code = await this.getCode(tk);
              //     this.getCode(tk).then(code => {
              //       if (code) {
              //         $.get(`${_.opt.api}/${owner}/${name}/${API.getToken}`, `code=${code}`)
              //           .then(r => {
              //             if (r) {
              //               // console.log('getToken', {r});
              //               if (r.code === 200) {
              //                 tk = r.data.token
              //                 $.app.token = tk
              //                 $.store.set(key, tk)
              //                 R = tk
              //               } else console.error('getToken error', {r})
              //             }
              //             res(R)
              //           })
              //           .catch(res(R))
              //       } else {
              //         console.error('getToken fail! no code.')
              //         res(R)
              //       }
              //     })
              //   }
              // })
              } catch (e) {
                  console.error('getToken exp:', e.message);
              }
              return R;
          })();
      }
      /**
     * 获取用户信息，后端api需实现 user/info 接口
     * @param {*} app - 应用
     * @param {string} token - 登录令牌
     * @returns {Promise<*>} 0 - 没网
     */ getUser(app, token) {
          var _this = this;
          return _async_to_generator(function*() {
              let R = null;
              const _ = _this;
              const { cfg } = app;
              try {
                  const url = `${cfg[cfg.mode].api}/${_.opt.api.userInfo}`;
                  const rs = yield $$1.post(url, null, {
                      'x-wia-token': token
                  });
                  console.log('getUser', {
                      url,
                      rs
                  });
                  if (rs && rs.code === 200) R = rs.data;
              } catch (e) {
                  if (e.status === 0) R = 0;
                  console.error(e, 'getUser');
              }
              return R;
          })();
      }
      /**
     * 检查当前token是否有效
     * @param {*} app 应用
     * @param {*} token 用户持有的身份令牌
     */ checkToken(app, token) {
          var _this = this;
          return _async_to_generator(function*() {
              let R = false;
              const _ = _this;
              const { cfg } = app;
              try {
                  if (!token) return false;
                  const rs = yield $$1.get(`${cfg[cfg.mode].api}/${_.opt.api.checkToken}`, `token=${token}`);
                  // console.log('checkToken', {token, rs});
                  // {res: true, expire: 秒数}
                  if (rs.code === 200) {
                      const exp = rs.data.expire // 过期时刻，1970-01-01 之后的秒数
                      ;
                      R = rs.data.res;
                  }
              } catch (e) {
                  console.error('checkToken exp:', e.message);
              }
              return R;
          })();
      }
      /**
     * 通过当前登录token获取用户临时code，用于跨应用授权
     * @param {*} app 应用
     * @param {string} token 用户持有的身份令牌
     */ getCode(app, token) {
          var _this = this;
          return _async_to_generator(function*() {
              let R = '';
              const _ = _this;
              const { cfg } = app;
              try {
                  const rs = $$1.get(`${cfg[cfg.mode].api}/${_.opt.api.getCode}`, `token=${token}`);
                  // console.log('getCode', {token, rs});
                  if (rs.code === 200) R = rs.data;
                  else console.error('getCode fail.', {
                      token,
                      rs
                  });
              } catch (e) {
                  console.error('getCode exp:', e.message);
              }
              return R;
          })();
      }
      /**
     * 页面插入dom， 没有调用页面中的脚本
     * 实现 按次序加载 script
     * @param {*} v - 页面视图
     * @param {*} [last] - v 插入位置
     */ addHtml(v, last = true) {
          let R;
          const _ = this;
          try {
              R = new Promise((res, rej)=>{
                  if (!v) return rej();
                  // 提取所有 script 标签
                  const scripts = v.getElementsByTagName('script');
                  let srcs = [];
                  if (scripts.length) {
                      for (const sc of Array.from(scripts)){
                          if (sc.src) {
                              srcs.push(sc.src);
                              sc.remove();
                          }
                      }
                  }
                  if (last) _.view.dom.appendChild(v);
                  else _.view.dom.insertBefore(v, _.view.lastChild().dom);
                  // 加载脚本
                  if (srcs.length) loadScripts(0, v, srcs, res);
                  else res();
              });
          } catch (e) {
              console.error(`addHtml exp:${e.message}`);
          }
          return R;
      }
      /**
     * 向页面添加样式
     */ addCss(p) {
          if (p.css) {
              const id = `css-${p.id}`;
              let d = $$1.id(id);
              if (!d) {
                  d = document.createElement('style');
                  d.id = id;
                  d.innerHTML = p.css;
                  $$1('head').append(d);
              }
          }
      }
      /**
     * 从页面删除样式
     */ removeCss(p) {
          const id = `css-${p.id}`;
          const d = $$1.id(id);
          if (d) $$1(d).remove();
      }
      /**
     * route to the specify url, 内部访问
     * @param {string} url 新hash，需 repair 后的hash，空表示启动应用index
     * @param {*} param 参数
     * @param {boolean} [refresh] 强制刷新，重新加载
     * @param {string} [lastHash] 前hash
     */ routeTo(url, param, refresh = false, lastHash = '') {
          const _ = this;
          refresh = refresh != null ? refresh : false;
          // 还原通过master、login路由的 refresh、lastHash
          if (!refresh && (param == null ? void 0 : param.refresh)) {
              refresh = true;
              delete param.refresh;
          }
          if (!lastHash && (param == null ? void 0 : param.lastHash)) {
              lastHash = param.lastHash;
              delete param.lastHash;
          }
          console.log('routeTo ', {
              url,
              param,
              refresh
          });
          // 已缓存页面，直接跳转
          let p = _.findPage(url, param, refresh);
          if (p) {
              // _.to(p, refresh, lastHash)
              // @ts-ignore
              const { master, login } = p.opt || {} // 页面实例传入路由参数
              ;
              if (login) {
                  var __view_qu;
                  if (!param) param = {};
                  if (refresh) param.refresh = true;
                  if (lastHash) param.lastHash = lastHash;
                  if (!$$1.app.user) _.go('login', {
                      master,
                      to: url,
                      param
                  });
                  else if (master && !((__view_qu = _.view.qu('.page-master')) == null ? void 0 : __view_qu.dom)) _.go(master, {
                      to: url,
                      param
                  });
                  else _.to(p, refresh, lastHash);
              } else {
                  var __view_qu1;
                  if (master && !((__view_qu1 = _.view.qu('.page-master')) == null ? void 0 : __view_qu1.dom)) _.go(master, {
                      to: url,
                      param
                  });
                  else _.to(p, refresh, lastHash);
              }
          } else {
              // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
              // 没有缓存，则动态加载
              this.load(url, param).then((r)=>{
                  p = _.findPage(url, param, refresh);
                  if (p) {
                      // if (p) _.to(p, refresh, lastHash)
                      // @ts-ignore
                      const { master, login } = p.opt || {} // 页面实例传入路由参数
                      ;
                      if (login) {
                          var __view_qu;
                          if (!param) param = {};
                          if (refresh) param.refresh = true;
                          if (lastHash) param.lastHash = lastHash;
                          if (!$$1.app.user) _.go('login', {
                              master,
                              to: url,
                              param
                          });
                          else if (master && !((__view_qu = _.view.qu('.page-master')) == null ? void 0 : __view_qu.dom)) _.go(master, {
                              to: url,
                              param
                          });
                          else _.to(p, refresh, lastHash);
                      } else {
                          var __view_qu1;
                          if (master && !((__view_qu1 = _.view.qu('.page-master')) == null ? void 0 : __view_qu1.dom)) _.go(master, {
                              to: url,
                              param
                          });
                          else _.to(p, refresh, lastHash);
                      }
                  }
              });
          }
      }
      /**
     * 切换到指定页面
     * @param {*} p 当前page类实例，已创建
     * @param {boolean=} refresh 刷新
     * @param {string} lastHash 前hash
     */ to(p, refresh = false, lastHash = '') {
          const _ = this;
          if (!p) {
              console.error('route to null page.');
              return;
          }
          // 切换应用
          _.switchApp(p.owner, p.appName, p.path).then((rt)=>{
              if (rt) {
                  var _this_lastPage_view_class_dom, _this_lastPage_view_class;
                  // 记录当前page实例
                  this.lastPage = this.page;
                  var _this_lastPage_view_class_dom_scrollTop;
                  // 记录当前 scrollTop
                  if (this.lastPage && this.lastPage.scrollTop) this.lastPage.scrollTop = (_this_lastPage_view_class_dom_scrollTop = (_this_lastPage_view_class = this.lastPage.view.class('page-content')) == null ? void 0 : (_this_lastPage_view_class_dom = _this_lastPage_view_class.dom) == null ? void 0 : _this_lastPage_view_class_dom.scrollTop) != null ? _this_lastPage_view_class_dom_scrollTop : 0;
                  // 切换app
                  this.page = p;
                  $$1.page = this.page;
                  $$1.lastPage = this.lastPage;
                  // alert(`routeTo url:${r.url}`);
                  // 返回还是前进
                  const { ids } = this;
                  this.backed = false;
                  // 如果切换的是前一个page，则为回退！
                  if (ids.length > 1 && ids[ids.length - 2] === p.id) {
                      this.backed = true;
                      console.log(`to back id:${p.id} <- ${ids[ids.length - 1]}`);
                      ids.pop();
                  } else if (ids.length > 0 && ids[ids.length - 1] === p.id) {
                      // pageid 相同，仅search 变化
                      if (p.change && p.search !== p.lastSearch) {
                          console.log(`search ${p.lastSearch} -> ${p.search}`);
                          $$1.nextTick(()=>{
                              try {
                                  p.change(p.view, p.search, p.lastSearch);
                              } catch (exp) {
                                  console.log('page change exp!', {
                                      exp
                                  });
                              }
                          });
                      } else console.log(`to same page id: ${p.id}`);
                  } else if (ids.length === 0 || ids.length > 0 && ids[ids.length - 1] !== p.id) {
                      if (ids.length > 0) console.log(`to id:${ids[ids.length - 1]} -> ${p.id}`);
                      else console.log(`to id:null -> ${p.id}`);
                      ids.push(p.id);
                  }
                  // 进入跳转的页面, p为页面类实例，d为页面dom对象
                  const enter = (d)=>{
                      p.doReady = false;
                      // 页面上是否存在，已经隐藏
                      let v = $$1.id(p.id);
                      // debugger;
                      // 页面上不存在，则从缓存获取，并加载到主页面
                      if (!v) {
                          // 从缓存加载到页面，触发ready
                          v = this.vs[p.id] // dom实例
                          ;
                          // 缓存也不存在，表明是刚Load，第一次加载到页面，触发Ready事件
                          if (!v && d) {
                              v = d;
                              // 缓存页面dom实例
                              this.vs[p.id] = v;
                              p.doReady = true;
                          }
                          // back 插在前面
                          // forward添加在后面，并移到左侧
                          if (v && this.view) {
                              // this.style.href = r.style;
                              if (!this.vite) // vite 已加载 css
                              this.addCss(p) // 准备 css
                              ;
                              const $v = $$1(v);
                              const pm = $v.hasClass('page-master') // master 页面一直显示
                              ;
                              if ((this.backed || pm) && this.view.hasChild()) {
                                  if (this.opt.className) $v.addClass(`${this.opt.className}`);
                                  if (this.opt.prevClass && !pm) $v.addClass(`${this.opt.prevClass}`);
                                  // master 和 前页面 插到前面，master 之后
                                  // this.view.dom.insertBefore(v, this.view.lastChild().dom) // 没有调用页面中的脚本
                                  // this.view.children().last().before(v) // 调用页面中的脚本
                                  this.addHtml(v, false).then(()=>_.showHtml(p, v, lastHash));
                              } else {
                                  if (this.opt.className) $v.addClass(`${this.opt.className}`);
                                  if (this.opt.nextClass && !pm) $v.addClass(`${this.opt.nextClass}`);
                                  // this.view.dom.appendChild(v) // 没有调用页面中的脚本
                                  // this.view.append(v) // 调用页面中的脚本
                                  this.addHtml(v).then(()=>_.showHtml(p, v, lastHash));
                              }
                          }
                      } else this.showHtml(p, v, lastHash);
                  };
                  // 强制刷新，删除存在页面及缓存
                  if (refresh) {
                      let v = $$1.id(p.id);
                      if (v) $$1.remove(v);
                      // 删除缓存
                      v = this.vs[p.id];
                      if (v) delete this.vs[p.id];
                  }
                  // 加载页面视图回调
                  const onload = (err, html = '')=>{
                      if (err) throw err;
                      // console.log('onload html:', html);
                      // 创建 页面层
                      const $v = $$1(html, true);
                      $v.dom.id = p.id;
                      p.view = $v // $dom 保存到页面实体的view中
                      ;
                      p.$el = $v;
                      p.el = $v.dom;
                      p.dom = $v.dom;
                      // dom 与页面实例映射
                      this.vps.set(p.dom, p);
                      // 进入页面
                      enter(p.dom);
                  };
                  const nextPage = this.loaded(p);
                  // 页面不存在则加载页面
                  if (!nextPage) {
                      onload(null, p.html);
                  // if (r.load) // 加载视图
                  //   r.load.then((html) => {onload(null, html)});
                  // else if (r.view) // 兼容
                  //   r.view(onload);
                  // else
                  //   throw new Error(`route ${r.id} hasn't load function!`);
                  } else enter() // 存在则直接进入
                  ;
              }
          }).catch((err)=>console.error('to err:', err));
      }
      /**
     *
     * @param {*} p
     * @param {*} v
     * @param {*} lastHash
     */ showHtml(p, v, lastHash) {
          var _p_$el, _p_view;
          // 记录即将显示视图
          if (p.el !== v) p.el = v // view 层保存在el中
          ;
          if (p.dom !== v) p.dom = v;
          if (((_p_$el = p.$el) == null ? void 0 : _p_$el.dom) !== v) p.$el = $$1(v, true) // 加载name
          ;
          if (((_p_view = p.view) == null ? void 0 : _p_view.dom) !== v) p.view = p.$el;
          // 动画方式切换页面，如果页面在 ready 中被切换，则不再切换！
          // 应该判断 hash 是否已经改变，如已改变，则不切换
          // alert(`hash:${this.hash} => ${this.nextHash}`);
          if (!this.nextHash || this.nextHash === this.hash[this.hash.length - 1]) {
              this.switchPage(p, this.backed, lastHash);
          }
      }
      /**
     * 路由仅接受绝对path，通过url获取绝对path、 search、 param
     * 将相对path 转换为绝对path
     * 将?后面的内容从url剥离，并转换为参数，？需包含在hash中，也就是 # 之后
     * 比如当前hash为 '#a' 切换到 '#b'
     * $.go('b')
     * 网址上输入 https://wia.pub/#/ower/name
     * 默认到首页 https://wia.pub/#/ower/bame/home
     * @param {string} url
     */ parseUrl(url = '') {
          const R = {
              url
          };
          const _ = this;
          try {
              // 把?后面的内容作为 search 参数处理，？需包含在hash中，也就是 # 之后
              let pos = url.indexOf('?');
              if (pos >= 0) {
                  R.url = url.slice(0, pos);
                  R.search = url.slice(pos + 1);
                  if (R.search) {
                      R.param = {};
                      const ps = R.search.split('&');
                      ps.forEach((p)=>{
                          pos = p.indexOf('=');
                          if (pos > 0) R.param[p.substr(0, pos)] = p.substr(pos + 1);
                      });
                  }
              }
              // 启动应用index路由修补后为空，因此不修补
              if (!new RegExp(`/${_.opt.owner}/${_.opt.name}/\\S*index$`).test(R.url)) R.url = _.repairUrl(R.url);
              const ms = url.match(/([^/]+)\/([^/]+)\/([^?]+)/);
              // eslint-disable-next-line prefer-destructuring
              if (ms) R.path = ms[3];
              if (url !== R.url) console.log(`router parseUrl url:${url} -> ${R.url} path:${R.path}`);
          } catch (e) {
              console.error(`router parseUrl exp:${e.message}`);
          }
          return R;
      }
      /**
     * 从缓存ps中查找页面实例，去掉 ? 号后的 search，search 放入 param
     * /ower/name/path，去掉参数，参数放入 r.param
     * @param {string} url /ower/name/page
     * @param {*} param
     * @returns {Object}
     */ findPage(url, param, refresh = false) {
          let R = null;
          const _ = this;
          const rs = _.parseUrl(url);
          // 空路由特殊处理
          if (_.opt.owner && _.opt.name && rs.url === '') rs.url = `/${_.opt.owner}/${_.opt.name}/index`;
          else if (rs.url.endsWith('/')) rs.url += 'index';
          else if (rs.url.includes('/?')) rs.url = url.replace('/?', '/index?');
          // for (let i = 0, len = this.rs.length; i < len; i++) {
          const p = _.ps[rs.url] // find(rt => rt.url === rs.url);
          ;
          if (!p) {
              console.log('findPage not find!', {
                  url,
                  url2: rs.url
              });
          } else {
              if (rs.param) p.param = _extends({}, rs.param);
              else p.param = {};
              if (param) $$1.assign(p.param, param);
              // 记录当前 path
              // r.path = rs.path;
              // r.url = url;
              p.lastSearch = p.search;
              p.search = rs.search;
              p.refresh = refresh;
              R = p;
          }
          return R;
      }
      /**
     * 从缓存中查找应用，避免重新加载
     * @param {string} owner /ower/name/page
     * @param {string} name
     * @param {*} [param]
     * @param {boolean} [reload]
     * @returns {Object}
     */ findApp(owner, name, param, reload = false) {
          let R = null;
          const app = this.apps[`${owner}.${name}`];
          if (!app) {
              console.log('findApp not find!', {
                  owner,
                  name
              });
          } else {
              app.param = {};
              if (param) $$1.assign(app.param, param);
              app.reload = reload;
              R = app;
          }
          return R;
      }
      /**
     * cache page instance
     * @param {Object} p
     * @returns {Router}
     */ cachePage(p) {
          try {
              if (!p) throw new Error('page is empty!');
              if (!p.url) throw new Error("page's url is empty!");
              // 按url自动生成唯一id，该id作为Dom页面的id属性
              p.id = `${p.url.replace(/\//g, '-')}`;
              if (p.id.startsWith('-')) p.id = p.id.substr(1);
              // 将 path 转换为绝对路径
              // r.path = `/${this.opt.owner}/${this.opt.name}/${r.path}`;
              p.ready = p.ready || $$1.noop;
              p.router = this;
              this.ps[p.url] = p;
              // console.log(`router cache page.url:${p.url} succ.`);
              return this;
          } catch (ex) {
              console.error(`router.cachePage exp: ${ex.message}`);
          }
      }
      /**
     * 以动画方式切换页面
     * 动画有 class 样式来实现的
     * @param from 当前显示的元素
     * @param to 待显示的元素
     * @param dir 切换的方向 forward backward
     * @private
     */ aniPage(from, to, dir, cb) {
          const aniClass = `router-transition-${dir || 'forward'} router-transition`;
          // console.log('aniPage ', {aniClass});
          // 动画结束，去掉 animation css 样式
          if ($$1.device.ios) {
              to.animationEnd(()=>{
                  // console.log('animation end.');
                  this.view.removeClass(aniClass);
                  // from.removeClass('page-previous');
                  if (cb) cb();
              });
          } else {
              let end = to;
              if (dir === 'backward') end = from;
              // md to's animation: none, only from's animation
              end.animationEnd(()=>{
                  // console.log('animation end.');
                  this.view.removeClass(aniClass);
                  // from.removeClass('page-previous');
                  if (cb) cb();
              });
          }
          // console.log('animation start...');
          // Add class, start animation
          this.view.addClass(aniClass);
      }
      /**
     * 显示新页面时，卸载当前页面，避免页面上相同id冲突
     * @param {*} p 卸载页面实例
     * @param {*} v 卸载页面视图 $Dom
     */ hidePage(p, v) {
          const _ = this;
          if (!v || !p) return;
          try {
              v.removeClass(this.opt.showClass);
              v.removeClass(this.opt.prevClass);
              v.removeClass(this.opt.nextClass);
              // 触发隐藏事件
              try {
                  $$1.nextTick(()=>{
                      const { path, param, name, title, owner, appName, url, hash } = p;
                      _.emit('hide', {
                          path,
                          param,
                          name,
                          title,
                          owner,
                          appName,
                          url,
                          hash
                      });
                      p == null ? void 0 : p.hide(v, p.param || {});
                  });
              } catch (exp) {
                  console.log('page hide exp!', {
                      exp
                  });
              }
              // this.pageEvent('hide', p, v);
              // 缓存当前 page
              // this.vs[p.id] = v.dom;
              // removeChild
              v.remove();
              this.removeCss(p);
          } catch (ex) {
              console.error('hidePage exp:', ex.message);
          }
      }
      /**
     * 启动动画前调用show/ready事件,在页面显示前,准备好页面
     * 如果在动画后调用,会先看到旧页面残留,体验不好
     * 上个页面和当前页面同时存在,如果存在相同id,可能会有问题.
     * 获取dom 元素时,最好限定在事件参数view范围获取.
     * @param {*} p 页面实例
     * @param {string} lastHash 前hash
     */ onShow(p, lastHash) {
          const _ = this;
          try {
              if (!p) return;
              const v = p.view;
              // 重新绑定事件
              if (p.doReady) {
                  if (p.ready) {
                      // 如果不使用延时，加载无法获取dom节点坐标！
                      //  node.getBoundingClientRect().top node.offsetTop 为 0，原因未知！！！
                      $$1.nextTick(()=>{
                          try {
                              p.ready(v, p.param || {}, _.backed, lastHash);
                          } catch (exp) {
                              console.log('page ready exp!', {
                                  exp
                              });
                          }
                          // ready 回调函数可能会创建 page 节点，pageInit事件在ready后触发！
                          // page 实例就绪时，回调页面组件的pageInit事件，执行组件实例、事件初始化等，实现组件相关功能
                          // 跨页面事件，存在安全问题，所有f7组件需修脱离app，仅作为Page组件！！！
                          _.pageEvent('init', p, v);
                          $$1.fastLink() // 对所有 link 绑定 ontouch，消除 300ms等待
                          ;
                      });
                  }
              }
              // 触发
              if (p.back && _.backed) {
                  $$1.nextTick(()=>{
                      try {
                          var _v_class_dom, _v_class;
                          // this.pageEvent('back', p, v);
                          const { path, param, name, title, owner, appName, url, hash } = p;
                          _.emit('back', {
                              path,
                              param,
                              name,
                              title,
                              owner,
                              appName,
                              url,
                              hash
                          });
                          var _p_scrollTop;
                          if ((_v_class = v.class('page-content')) == null ? void 0 : (_v_class_dom = _v_class.dom) == null ? void 0 : _v_class_dom.scrollTop) v.class('page-content').dom.scrollTop = (_p_scrollTop = p.scrollTop) != null ? _p_scrollTop : 0;
                          p.back(v, p.param || {}, lastHash);
                      } catch (exp) {
                          console.log('page back exp!', {
                              exp
                          });
                      }
                  });
              }
              if (p.show && !_.backed) {
                  $$1.nextTick(()=>{
                      try {
                          const { path, param, name, title, owner, appName, url, hash } = p;
                          _.emit('show', {
                              path,
                              param,
                              name,
                              title,
                              owner,
                              appName,
                              url,
                              hash
                          });
                          p.show(v, p.param || {}, lastHash);
                      } catch (exp) {
                          console.log('page show exp!', {
                              exp
                          });
                      }
                  // this.pageEvent('show', p, v);
                  });
              }
          } catch (ex) {
              console.error('onShow ', {
                  ex: ex.message
              });
          }
      }
      /**
     * 通过css设置，显示新页面
     * @param {*} p 当前页面实例
     */ showPage(p) {
          if (p) {
              const v = p.view;
              v.removeClass(this.opt.nextClass);
              v.removeClass(this.opt.prevClass);
              // master-detail 主从页面，主页面一直显示
              // 页面包含主从样式，应用view添加主从样式，否则，删除主从样式
              if (v.hasClass('page-master') || v.hasClass('page-master-detail')) this.view.addClass('view-master-detail');
              else if (this.view.hasClass('view-master-detail')) this.view.removeClass('view-master-detail');
              // master页面一直显示，普通页面切换显示
              if (!v.hasClass('page-master')) v.addClass(this.opt.showClass);
          }
      // $to.trigger(EVENTS.pageAnimationEnd, [to.id, to]);
      // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
      // $to.trigger(EVENTS.pageInit, [to.id, to]);
      }
      /**
     * 切换页面
     * 把新页从右边切入展示，同时会把新的块的记录用 history.pushState 来保存起来
     * 如果已经是当前显示的块，那么不做任何处理；
     * 如果没对应的块，忽略。
     * @param {Router} p 待切换的页面实例
     * @param {boolean} back 是否返回
     * @param {string} lastHash 前hash
     * @private
     */ switchPage(p, back, lastHash) {
          if (!p) return;
          try {
              let fp = null;
              let from = this.getCurrentPage() // 当前显示页面
              ;
              if (from) {
                  from = $$1(from) // $(from); lastp.view;
                  ;
                  // master page not hide!
                  if (from.hasClass('page-master')) from = null;
                  else fp = this.vps.get(from.dom);
              }
              let to = $$1.id(p.id);
              if (to) {
                  to = p.view // $(to); ready/show 在页面实例view上修改
                  ;
                  // master page not hide!
                  if (to.hasClass('page-master')) from = null;
              }
              // 如果已经是当前页，不做任何处理
              if (from && to && from.dom === to.dom) return;
              const dir = back ? 'backward' : 'forward';
              if (from || to) {
                  // 页面切换动画
                  if (from && to) {
                      // 开机splash不需要动画
                      if (this.noAni) {
                          this.noAni = false;
                          this.hidePage(fp, from);
                          this.onShow(p, lastHash) // ready
                          ;
                          this.showPage(p);
                      } else {
                          // 需要动画，先触发show事件
                          this.onShow(p, lastHash) // ready 提前处理，切换效果好
                          ;
                          this.aniPage(from, to, dir, ()=>{
                              // 动画结束
                              this.hidePage(fp, from);
                              this.showPage(p);
                          });
                      }
                  } else if (from) {
                      this.hidePage(fp, from);
                  } else if (to) {
                      this.onShow(p, lastHash) // ready
                      ;
                      this.showPage(p);
                  }
              }
              setTitle(this.page.title);
              // this.pushNewState('#' + sectionId, sectionId);
              // 安全原因，删除页面传递参数
              if (this.hash.length > 0) {
                  var _this_param, _this_refresh;
                  const [hash] = this.hash.slice(-1);
                  if ((_this_param = this.param) == null ? void 0 : _this_param[hash]) delete this.param[hash];
                  if ((_this_refresh = this.refresh) == null ? void 0 : _this_refresh[hash]) delete this.param[hash];
              }
          } catch (e) {
              console.error(`switchPage exp:${e.message}`);
          }
      }
      /**
     * 页面Page实例事件触发，f7 UI组件需要
     * @param {string} ev 事件：init show back hide
     * @param {Page} p 页面实例
     * @param {Dom} v 视图
     * @private
     */ pageEvent(ev, p, v) {
          try {
              if (!p || !v) return;
              const r = this // router
              ;
              if (!v.length) return;
              const camelName = `page${ev[0].toUpperCase() + ev.slice(1, ev.length)}`;
              const colonName = `page:${ev.toLowerCase()}`;
              // 满足 f7 组件参数要求
              const data = {
                  $el: v,
                  el: v.dom
              };
              // if (callback === 'beforeRemove' && v[0].f7Page) {
              //   page = $.extend(v[0].f7Page, {from, to, position: from});
              // } else {
              //   page = r.getPageData(
              //     $pageEl[0],
              //     $navbarEl[0],
              //     from,
              //     to,
              //     route,
              //     pageFromEl
              //   );
              // }
              // page.swipeBack = !!options.swipeBack;
              // const {on = {}, once = {}} = options.route ? options.route.route : {};
              // if (options.on) {
              //   extend(on, options.on);
              // }
              // if (options.once) {
              //   extend(once, options.once);
              // }
              // pageInit event
              if (ev === 'init') {
                  // attachEvents();
                  if (v[0].f7PageInitialized) {
                      v.trigger('page:reinit', data);
                      r.app.emit('pageReinit', data);
                      return;
                  }
                  v[0].f7PageInitialized = true;
                  // 触发当前页面Dom事件，不存在安全问题，$el.on(ev, et=> {})
                  v.trigger(colonName, data);
                  // 触发全局应用页面事件，通过 app.on 侦听
                  r.app.emit(`local::${camelName}`, data);
              }
          // page 中已触发
          // Page 实例向上传递事件到App实例，
          // if (['hide', 'show', 'back'].includes(ev)) p.emit(camelName, p.path);
          // 触发页面事件，通过 page.on 侦听
          // p.emit(`local::${ev}`, data);
          } catch (ex) {
              console.error(`pageEvent exp:${ex.message}`);
          }
      }
      /**
     * 设置浏览器 hash，触发 hash change 事件
     * google 支持 #! 格式，百度浏览器修改hash无效
     * @param {string} url
     * @param {*} param
     * @param {boolean} refresh
     */ setHash(url, param = null, refresh = false) {
          const _ = this;
          let hash = url;
          // if (url[0] !== '!') hash = `!${url}` // 不加 !
          // console.log('setHash...', {url, href: location.href, hash: location.hash});
          location.hash = hash // modify invalid
          ;
          // 删除网址最后的 #
          if (hash === '') history.replaceState(null, '', location.pathname + location.search);
          // 传递参数
          if (param) {
              if (!_.param) _.param = {};
              _.param[url] = param;
          }
          if (refresh) {
              if (!_.refresh) _.refresh = {};
              _.refresh[url] = refresh;
          }
          _.nextHash = url;
      // $.nextTick(() => (location.hash = hash));
      // location.href = location.href.replace(/#[\s\S]*/i, hash);
      // console.log('setHash.', {url, href: location.href, hash: location.hash});
      }
      /**
     * constructor
     * @param {Opts} opts
     */ constructor(opts){
          const opt = _extends({}, def, opts);
          super(opt), this._index = 1, // container element
          /** @type {*} */ this.view = null, // 缓存所有app实例
          /** @type {*} */ this.apps = {}, // 缓存所有page实例
          this.ps = {}, /** @type {string[]} */ this.ids = [] // 页面id
          , // 缓存所有Page中的dom视图，不是$dom
          this.vs = {}, this.vps = new Map() // dom page 映射，通过 dom对象查找page实例！
          , this.url = '' // 当前路由所处的网址，实际上是hash部分！
          , // start route config
          // splash 开机画面不需要 动画
          this.splash = true, this.owner = '', this.appName = '', this.path = '' // 当前应用路径，去掉参数部分，不包括页面文件，a/b/c/1.html?x=1 为：c
          , this.lastOwner = '' // 上一个应用所有者
          , this.lastName = '' // 上一个应用名称
          , this.lastPath = '' // 上一个应用路径
          , /** @type {*} */ this.param = {} // 页面传递参数，按hash存储的kv，避免连续go时param丢失！
          , /** @type {*} */ this.refresh = {}, /** @type {*} */ this.page = null // 当前 page 实例
          , /** @type {string[]} */ this.hash = [] // 带参数的完整hash数组，回退pop，前进push 记录应用 导航路径，go 增加、back 减少
          , this.lastHash = '' // 前hash
          , this.nextHash = '' // 需到达的 hash
          , this.backed = false // 是否为返回
          , this.init = true // 第一个应用，需初始化
          , this.vite = false, /**
     * 获取当前显示的第一个 section
     *
     * @returns {*}
     * @private
     */ this.getCurrentPage = ()=>$$1.qu(`.${this.opt.showClass}`);
          // if (Router.instance) {
          //   throw new Error('Router is already initialized and can\'t be initialized more than once');
          // }
          // Router.instance = this; // 是否控制为单例？
          const _ = this;
          _.opt = opt;
          // this.app = this.opt.app;
          // this.app.router = this;
          _.view = $$1(`#${_.opt.view}`);
          // _.pages = opt.pages // vite 调试需要
          // if (opt.pages) _.vite = true // vite 调试模式
          _.lastPage = null // 上一个 page 实例
          ;
          _.lastApp = null // 上一个应用实例
          ;
          // 方便全局访问
          $$1.view = _.view // $化视图
          ;
          $$1.router = _ // 全局路由
          ;
          // why not `history.pushState`? see https://github.com/weui/weui/issues/26, Router in wechat webview
          // pushState 不支持 微信侧滑返回
          // 不带 hash 到 hash,返回时, 不能触发该事件,因此一开始就要设置 hash,否则无法回到 首页!
          // 监控浏览器 url hash变化
          window.addEventListener('hashchange', (event)=>{
              var __refresh, __refresh1, __param;
              const newHash = getHash(event.newURL);
              const oldHash = getHash(event.oldURL);
              // ???
              console.log(`router hash:${oldHash} -> ${newHash}`);
              let to = newHash || 'index';
              // 将不合规范url修改为规范url，/owner/name/index -> ''
              to = _.repairUrl(to);
              // 如不一致，重设 hash
              if (newHash !== to) {
                  _.setHash(to);
                  return;
              }
              // 如果不是绝对路径，则跳转到绝对路径
              // if (!newHash.startsWith('/')) {
              //   setHash(this.repairUrl(newHash));
              //   return;
              // }
              // hash无变化，当前页面刷新
              if (newHash === oldHash) {
                  _.nextHash = '';
                  return;
              }
              // 记录当前 hash
              // this.lastHash = oldHash;
              // this.hash = newHash;
              _.backed = false // 是否返回
              ;
              _.hash = _.hash || [];
              const hs = _.hash;
              const hslen = hs.length;
              _.lastHash = hslen > 0 ? hs[hslen - 1] : undefined // 不能为空
              ;
              // 新的 hash
              if (hslen > 1 && hs[hslen - 2] === newHash) {
                  // 回退
                  _.backed = true;
                  console.log(`hash:${newHash} <- ${_.lastHash}`);
                  // 删除 最后 hash
                  hs.pop();
              } else if (_.lastHash === newHash) console.log(`hash: == ${newHash}`) // same
              ;
              else if (_.lastHash !== newHash) {
                  console.log(`hash:${_.lastHash} -> ${newHash}`);
                  hs.push(newHash);
              }
              [to] = hs.slice(-1);
              to = to != null ? to : newHash;
              var __refresh_to;
              // console.log('hashchange', {to});
              const refresh = (__refresh_to = (__refresh = _.refresh) == null ? void 0 : __refresh[to]) != null ? __refresh_to : false;
              if ((__refresh1 = _.refresh) == null ? void 0 : __refresh1[to]) _.refresh[to] = false;
              _.routeTo(to, (__param = _.param) == null ? void 0 : __param[to], refresh, _.lastHash) //  , oldHash);
              ;
              _.nextHash = '';
          }, false);
          // 当前 hash
          let hash = getHash();
          /** @type {*} */ let param = $$1.urlParam();
          if (!hash && (param == null ? void 0 : param.state)) {
              // hash 前 或 后的参数，已使用 decodeURIComponent 解码
              // 微信跳转，没有hash、有state和code（微信入口），从state中解析路由
              const { state } = param;
              // 处理应用路由，包括登录、master-detail、缺省路由等
              /** @type {*} */ let v = {};
              // 微信网页授权参数在state中传递，应用show可修改state
              const vs = state.split('&');
              vs.forEach((p)=>{
                  const arr = p.split('=');
                  v[arr[0]] = arr[1];
              });
              // 从 state 中还原 param
              let para = {};
              if (v.param) {
                  try {
                      para = JSON.parse(v.param);
                      delete v.param;
                  } catch (e) {}
              }
              // 这些参数可在微信公众号菜单中对应的链接中设置，微信会通过url转发到应用中
              param = _extends({}, param, v, para);
              hash = v.hash;
              if (hash) {
                  hash = _.repairUrl(hash);
                  delete param.hash;
              }
              if (state) delete param.state;
              // 参数已解析到hash 和 param，清除网址中的 search
              const url = new URL(window.location.href);
              url.search = '' // 清空所有 search 参数
              ;
              url.hash = hash;
              history.replaceState(null, '', url.toString()) // 更新 URL，不刷新页面
              ;
          }
          if (hash) {
              // 有hash，跳过启动应用（wia store），直接进入hash指定应用（创建）
              console.log('router start', {
                  hash,
                  param
              });
              // 将不合规范url修改为规范url
              const to = _.repairUrl(hash);
              // 由 hash 触发路由，包括 owner/name/index -> ''
              if (hash !== to) _.setHash(to, param, true);
              else {
                  _.hash.push(to);
                  // const state = history.state || {};
                  // this.to(hash, state._index <= this._index);[to] = hs.slice(-1)
                  // console.log('hashchange', {to});
                  // const param = $.urlParam()
                  _.routeTo(to, param, true) // 首次启动，刷新
                  ;
                  _.nextHash = '';
              }
          } else if (opt.owner && opt.name) {
              _async_to_generator(function*() {
                  console.log('router start', {
                      app: `/${opt.owner}/${opt.name}`,
                      hash: '',
                      param
                  });
                  // 启动应用，无hash，如传入 owner、name，则创建指定应用，触发应用生命周期，默认加载 page/index页面
                  yield _.switchApp(opt.owner, opt.name, '', param);
              })();
          }
      }
  };
  /**
   * 获取 url 的 fragment（即 hash 中去掉 # 的剩余部分）
   *
   * 如果没有则返回字符串
   * 如: http://example.com/path/?query=d#123 => 123
   *
   * @param {String} [url] - url
   * @returns {string}
   */ function getHash(url) {
      // let {hash} = window.location
      //     if (hash.startsWith('#')) hash = hash.substr(1)
      //     if (hash.startsWith('!')) hash = hash.substr(1)
      //     hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash
      if (!url) url = location.href;
      let pos = url.indexOf('#!');
      if (pos !== -1) pos++;
      else pos = url.indexOf('#');
      return pos !== -1 ? url.substring(pos + 1) : '' // ??? '/'
      ;
  }
  /**
   * 修改微信 title
   * IOS：微信6.5.3版本 在17年3月，切换了WKWebview， 可以直接document.title修改。
   * Andriod： 一直都可以document.title修改
   */ function setTitle(val) {
      if (document.title === val) return;
      document.title = val;
  /*
    if (/MicroMessenger/i.test(navigator.userAgent)) {
      setTimeout(() => {
        // 利用iframe的onload事件刷新页面
        document.title = val;

        const fr = document.createElement('iframe');
        // fr.style.visibility = 'hidden';
        fr.style.display = 'none';
        // 避免大量服务器无效访问，需提供该文件！
        fr.src = 'favicon.ico';
        fr.onload = () => {
          setTimeout(() => {
            document.body.removeChild(fr);
          }, 0);
        };
        document.body.appendChild(fr);
      }, 0);
    } else document.title = val;
    */ }
  /**
   * 按顺序加载 script 标签
   * @param {number} idx
   * @param {*} v - page dom
   * @param {*[]} srcs - 脚本引用
   * @param {*} res
   * @returns
   */ function loadScripts(idx, v, srcs, res) {
      if (idx >= srcs.length) {
          // 所有脚本加载完成后退出
          return res();
      }
      const script = document.createElement('script');
      script.src = srcs[idx];
      // 当前脚本加载完成后，加载下一个脚本
      script.onload = ()=>{
          console.log(`Succed to load script: ${srcs[idx]}`);
          loadScripts(idx + 1, v, srcs, res);
      };
      script.onerror = ()=>{
          console.error(`Failed to load script: ${srcs[idx]}`);
          // 即使某个脚本加载失败，也继续加载下一个脚本
          loadScripts(idx + 1, v, srcs, res);
      };
      v.appendChild(script);
  }
  $$1.go = (url, param = null, refresh = false)=>{
      $$1.router.go(url, param, refresh);
  };
  $$1.back = (param, refresh = false)=>{
      $$1.router.back(param, refresh);
  };
  $$1.repairUrl = (url)=>$$1.router.repairUrl(url);
  function unzip(url) {
      return _unzip.apply(this, arguments);
  }
  function _unzip() {
      _unzip = /**
   * Decompress a GZIP file using DecompressionStream
   * @param {string} url - The GZIP file to decompress
   * @returns {Promise<*>} - The decompressed content as a string
   */ _async_to_generator(function*(url) {
          let R;
          if (!('DecompressionStream' in window)) {
              throw new Error('DecompressionStream is not supported in this browser.');
          }
          try {
              // Fetch the GZIP data from the server
              const response = yield fetch(url);
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              // Get the response body as a stream
              const compressedStream = response.body;
              // Decompress the GZIP stream
              const decompressedStream = compressedStream.pipeThrough(new DecompressionStream('gzip'));
              // Convert the decompressed stream to a string
              const tx = yield streamToString(decompressedStream);
              if (tx && /^\s*[{[]/.test(tx)) {
                  try {
                      R = JSON.parse(tx);
                  } catch (ex) {
                      console.log('parseSuccess', {
                          exp: ex.message
                      });
                  }
              }
          } catch (e) {
              console.error(e.message);
          }
          return R;
      });
      return _unzip.apply(this, arguments);
  }
  function streamToString(stream) {
      return _streamToString.apply(this, arguments);
  }
  function _streamToString() {
      _streamToString = /**
   * Convert a ReadableStream to a string
   * @param {ReadableStream} stream - The decompressed stream
   * @returns {Promise<string>} - The resulting string
   */ _async_to_generator(function*(stream) {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let result = '';
          let done = false;
          while(!done){
              const { value, done: isDone } = yield reader.read();
              done = isDone;
              if (value) {
                  result += decoder.decode(value, {
                      stream: true
                  });
              }
          }
          return result;
      });
      return _streamToString.apply(this, arguments);
  }
  Router.default = Router;

  return Router;

}));
