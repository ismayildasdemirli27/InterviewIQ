/**
 * Polyfill DOM globals needed by pdf-parse and pdfjs in Node.js serverless environments.
 */

if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(_init?: any) {}
    static fromMatrix(_other?: any) { return new DOMMatrix(); }
    static fromFloat32Array(_arr?: any) { return new DOMMatrix(); }
    static fromFloat64Array(_arr?: any) { return new DOMMatrix(); }
    inverse() { return new DOMMatrix(); }
    multiply(_other?: any) { return new DOMMatrix(); }
    translate(_tx = 0, _ty = 0, _tz = 0) { return new DOMMatrix(); }
    scale(_sx = 1, _sy?: number, _sz = 1) { return new DOMMatrix(); }
    rotate(_rx = 0, _ry = 0, _rz = 0) { return new DOMMatrix(); }
    transformPoint(pt?: any) { return pt || { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
  };
}

if (typeof (globalThis as any).ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  };
}

export {};
