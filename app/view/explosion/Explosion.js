var THREE = require('three');

var vertexShader = require('./vs-explosion.glsl');
var fragmentShader = require('./fs-explosion.glsl');

/**
 * @param {float} radius
 * @param {int} divisions
 */
function Explosion(radius, divisions) {
  this._radius = radius = 1;
  this._divisions = divisions || 12;

  this.el = new THREE.Object3D();

  this._material = Explosion._material.clone();

  this._createLines();
};

Explosion._material = new THREE.RawShaderMaterial({
  uniforms: {
    progress: { type: 'f', value: 0 }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  transparent: true,
  depthWrite: false,
  linewidth: 2
});

Explosion.pool = [];

Explosion.prototype._createLines = function() {
  var sphereGeometry = new THREE.SphereGeometry(
    this._radius,
    this._divisions,
    this._divisions
  );

  for(var i = 0; i < sphereGeometry.vertices.length; ++i) {
    var vertice = sphereGeometry.vertices[i];

    var endOffset = Math.random() * 2;

    var endX = vertice.x * endOffset;
    var endY = vertice.y * endOffset;
    var endZ = vertice.z * endOffset;

    var startOffset = Math.random() * 0.5 + 2;

    var startX = endX * startOffset;
    var startY = endY * startOffset;
    var startZ = endZ * startOffset;

    var positions = new Float32Array([
      startX, startY, startZ,
      endX, endY, endZ
    ]);

    var influences = new Float32Array([
      1,
      0
    ]);

    var tints = new Float32Array([
      Math.random(), Math.random(), Math.random(),
      Math.random(), Math.random(), Math.random()
    ]);

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('influence', new THREE.BufferAttribute(influences, 1));
    geometry.addAttribute('tint', new THREE.BufferAttribute(tints, 3));

    var line = new THREE.Line(geometry, this._material);
    this.el.add(line);
  }
};

/**
 * @param {THREE.Object3D} parent
 */
Explosion.prototype.setParent = function(parent) {
  if(this.el.parent) {
    this.el.parent.remove(this.el);
  }

  if(parent) {
    parent.add(this.el);
  }
};

/**
 * @param {float} value from 0 to 1
 */
Explosion.prototype.setProgress = function(value) {
  this._material.uniforms.progress.value = value;
};

Explosion.prototype.dispose = function() {
  if(this.el.parent) {
    this.el.parent.remove(this.el);
  }
};

module.exports = Explosion;
