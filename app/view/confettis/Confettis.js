var THREE = require('three');
var random = require('../utils').random;
var textureLoader = require('../utils').textureLoader;

var vertexShader = require('./vs-confettis.glsl');
var fragmentShader = require('./fs-confettis.glsl');

/**
 * @interface IBoundaries {
 *  float top;
 *  float bottom;
 *  float left;
 *  float right;
 *  float front;
 *  float back;
 * }
 */

/**
 * @param {THREE.Vector3} size
 * @param {int} [count=200]
 */
function Confettis(size, count) {
  this._size = size;
  this._count = count || 200;

  this._isActive = false;

  this._boundaries = null;
  this._computeBoundaries();

  this._geometry = null;
  this._createGeometry();

  this._points = new THREE.Points(this._geometry, Confettis._material);
  this._points.frustumCulled = false;

  this.el = new THREE.Object3D();
  this.el.add(this._points);
};

Confettis._typesCount = 6;

Confettis._material = new THREE.RawShaderMaterial({
  uniforms: {
    size: { type: 'f', value: 40 },
    map: { type: 't', value: textureLoader.load('assets/textures/confettis.png') },
    repeat: { type: 'v2', value: new THREE.Vector2(1 / Confettis._typesCount, 1) }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  transparent: true,
  depthWrite: false
});

Confettis.prototype._createGeometry = function() {
  this._geometry = new THREE.BufferGeometry();

  var positions = new Float32Array(3 * this._count);
  var colors = new Float32Array(3 * this._count);
  var scales = new Float32Array(this._count);
  var offsets = new Float32Array(2 * this._count);

  this._velocities = new Float32Array(3 * this._count);

  for(var i = 0, j = 0, k = 0; i < this._count; ++i, j += 3, k += 2) {
    positions[j] = random(this._boundaries.left, this._boundaries.right);
    positions[j + 1] = random(this._boundaries.top, this._boundaries.top + this._size.y / 10);
    positions[j + 2] = random(this._boundaries.front, this._boundaries.back);

    colors[j] = Math.random();
    colors[j + 1] = Math.random();
    colors[j + 2] = Math.random();

    scales[i] = random(1, 2);

    offsets[k] = random(0, Confettis._typesCount - 1, true) * (1 / Confettis._typesCount);
    offsets[k + 1] = 0;

    this._velocities[j] = random(-0.01, 0.01);
    this._velocities[j + 1] = random(-0.03, 0);
    this._velocities[j + 2] = 0;
  }

  this._geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  this._geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
  this._geometry.addAttribute('scale', new THREE.BufferAttribute(scales, 1));
  this._geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2));
};

Confettis.prototype._computeBoundaries = function() {
  var halfX = this._size.x / 2;
  var halfY = this._size.y / 2;
  var halfZ = this._size.z / 2;

  this._boundaries = {
    left: -halfX,
    right: halfX,
    top: halfY,
    bottom: -halfY,
    front: halfZ,
    back: -halfZ
  }
};

Confettis.prototype.update = function() {
  if(!this._isActive) {
    return;
  }

  var positions = this._geometry.attributes.position.array;
  var velocities = this._velocities;

  for(var i = 0; i < positions.length; i += 3) {
    if(positions[i + 1] < this._boundaries.bottom) {
      positions[i + 1] = this._boundaries.top;

      if(positions[i] < this._boundaries.left) {
        positions[i] = this._boundaries.right;
      }
      else if(positions[i] > this._boundaries.right) {
        positions[i] = this._boundaries.left;
      }

      if(positions[i + 2] > this._boundaries.front) {
        positions[i + 2] = this._boundaries.back; 
      }
      else if(positions[i + 2] < this._boundaries.back) {
        positions[i + 2] = this._boundaries.front;
      }
    }

    positions[i] += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
  }

  this._geometry.attributes.position.needsUpdate = true;
};

Confettis.prototype.start = function() {
  this._isActive = true;
};

Confettis.prototype.stop = function() {
  this._isActive = false;
};

Confettis.prototype.dispose = function() {
  if(this.el.parent) {
    this.el.parent.remove(this.el);
  }
};

module.exports = Confettis;
