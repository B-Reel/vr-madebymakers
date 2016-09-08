var THREE = require('three');
var textureLoader = require('../utils').textureLoader;
var jsonLoader = require('../utils').jsonLoader;

/**
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {VREffect} effect
 * @param {PhysicsManager} physics
 */
var MousePad = function(scene, camera, effect, physics) {
  this.raycaster = new THREE.Raycaster();
  this.screenVector = new THREE.Vector2(0, 0);

  this.scene = scene;
  this.camera = camera;

  this.phManager = physics;

  this.intersectPoint = new THREE.Vector3();
  this.intersectPoint2 = new THREE.Vector3();

  var tempHand = new THREE.Mesh(
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1, 1, 1, 1),
    new THREE.MeshNormalMaterial()
  );

  this.h1 = tempHand;

  this._loadModel((function() {
    this._bindMethods();
    this._addListeners();
  }).bind(this));
};

/**
 * @param {() => void} callback
 */
MousePad.prototype._loadModel = function(callback) {
  jsonLoader.load('assets/hand/hand.json', (function (geometry) {
    geometry.scale(0.02, 0.02, 0.02);
    geometry.computeBoundingBox();

    var texture = textureLoader.load('assets/textures/hand_occlusion.jpg');
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    var hand = new THREE.Mesh(geometry, material);
    hand.rotation.y += Math.PI;

    this.h1 = hand;

    this.scene.add(this.h1);
    this.phManager.add3DObject(this.h1, 'cube', true, false);
    
    if(callback) {
      callback();
    }
  }).bind(this));
};

MousePad.prototype._bindMethods = function() {
  this._handleMouseMoveBound = this._handleMouseMove.bind(this);
  this._handleTouchEndBound = this._handleTouchEnd.bind(this);
};

MousePad.prototype._addListeners = function() {
  window.addEventListener('mousemove', this._handleMouseMoveBound);
  window.addEventListener('touchend', this._handleTouchEndBound);
};

MousePad.prototype._removeListeners = function() {
  window.addEventListener('mousemove', this._handleMouseMoveBound);
  window.addEventListener('touchend', this._handleTouchEndBound);
};

MousePad.prototype._handleMouseMove = function( e ){
  this.screenVector.x = (e.clientX / window.innerWidth) * 2 - 1;
  this.screenVector.y = (1 - (e.clientY / window.innerHeight)) * 2 - 1;
};

MousePad.prototype._handleTouchEnd = function( e ){
  this.screenVector.x = 0;
  this.screenVector.y = 0;
};

/**
 * @param {float} time
 * @param {Array<THREE.Object3D>} objs
 */
MousePad.prototype.update = function(time, objs) {
  this.raycaster.setFromCamera(this.screenVector, this.camera);

  var intersects = this.raycaster.intersectObjects(objs);

  if(intersects.length > 0) {
    this.intersectPoint.copy(intersects[0].point);
    this.intersectPoint2.copy(intersects[0].point);
    this.h1.position.copy(intersects[0].point);
  }
};

MousePad.prototype.dispose = function() {
  this._removeListeners();
};

module.exports = MousePad;
