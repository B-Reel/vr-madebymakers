var THREE = require('three');
var TWEEN = require('tween.js');
var random = require('../utils').random;

function Shape() {
  this._material = Shape._material.clone();
  this._material.uniforms.time.value = 0;
  this._material.uniforms.timeOffset.value = random(0, 1);

  this.el = new THREE.Mesh(Shape._geometry, this._material);
  this.el.visible = false;

  var scale = random(0.05, 1);

  this.el.scale.set(scale, scale, scale);
};

Shape._geometry = new THREE.IcosahedronGeometry(0.2, 2);

Shape._material = new THREE.RawShaderMaterial({
  uniforms: {
    time: { type: 'f', value: 0 },
    timeOffset: { type: 'f', value: 0 },
    speed: { type: 'f', value: 1 },
    growFromTo: { type: 'v2', value: new THREE.Vector2(1, 1) }
  },
  vertexShader: require('./vs-shape.glsl'),
  fragmentShader: require('./fs-shape.glsl')
});

Shape.prototype.fadeIn = function() {
  var targetScale = this.el.scale.x;

  var mesh = this.el;

  new TWEEN.Tween({ scale: 0 })
    .to({ scale: targetScale }, 1000)
    .easing(TWEEN.Easing.Elastic.Out)
    .delay(random(0, 2000))
    .onStart(function() {
      mesh.visible = true;
    })
    .onUpdate(function() {
      mesh.scale.set(this.scale, this.scale, this.scale);
    })
    .start();
};

Shape.prototype.update = function() {
  this._material.uniforms.time.value += 0.01;
};

Shape.prototype.startTripping = function() {
  this._material.uniforms.speed.value = 25;
  this._material.uniforms.growFromTo.value.set(0.5, 2);
};

Shape.prototype.stopTripping = function() {
  this._material.uniforms.speed.value = 1;
  this._material.uniforms.growFromTo.value.set(1, 1);
};

Shape.prototype.dispose = function() {
  if(this.el.parent) {
    this.el.parent(this.el);
  }
};

module.exports = Shape;
