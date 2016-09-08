var THREE = require('three');
var textureLoader = require('../utils').textureLoader;
var jsonLoader = require('../utils').jsonLoader;

/**
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {VREffect} effect
 * @param {PhysicsManager} physics
 */
var GamePads = function(scene, camera, effect , physics) {
  window.gamePads = this;

  this.scene = scene;
  this.camera = camera;
  this.effect = effect;
  this.phManager = physics;

  this.intersectPoint = new THREE.Vector3();
  this.intersectPoint2 = new THREE.Vector3();
  this.sTSMat = new THREE.Matrix4();

  var tempHand = new THREE.Mesh(
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1, 1, 1, 1),
    new THREE.MeshNormalMaterial()
  );

  this.h1 = tempHand;
  this.h2 = tempHand;
  this.handlers = [this.h1, this.h2];

  this.cursorlocked = [];
  this.cursorlocked[0] = false;
  this.cursorlocked[1] = false;
  this.triggerlocked = [];
  this.triggerlocked[0] = false;
  this.triggerlocked[1] = false;

  this._loadModel();
};

GamePads.prototype._loadModel = function() {
  jsonLoader.load('assets/hand/hand.json', (function (geometry) {
    geometry.scale(0.01, 0.01, 0.01);
    geometry.rotateY(Math.PI);
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
    var hand2 = new THREE.Mesh(hand.geometry.clone(), hand.material.clone());
    hand2.geometry.scale(-1, 1, 1);

    this.h1 = hand;
    this.h2 = hand2;
    this.h1.gamepadIndex = 0;
    this.h2.gamepadIndex = 1;

    this.h1.matrixAutoUpdate = false;
    this.h2.matrixAutoUpdate = false;

    this.handlers[0] = this.h1;
    this.handlers[1] = this.h2;

    this.scene.add(this.h1);
    this.scene.add(this.h2);
    this.phManager.add3DObject(this.h1, 'cube', true, false);
    this.phManager.add3DObject(this.h2, 'cube', true, false);
  }).bind(this));
};

/**
 * @param {float} time
 */
GamePads.prototype.update = function(time) {
  // Loop over every gamepad and if we find any that has a pose use it.
  var vrGamepads = [];
  var gamepads = navigator.getGamepads();

  if(this.effect.getHMD()) {
    if(this.effect.getHMD().stageParameters) {
      this.sTSMat.fromArray(this.effect.getHMD().stageParameters.sittingToStandingTransform);
    }
  }

  for(var i = 0; i < gamepads.length; ++i) {
    var gamepad = gamepads[i];

    // The array may contain undefined gamepads, so check for that as
    // well as a non-null pose.
    if(gamepad && gamepad.pose) {
      vrGamepads.push(gamepad);

      this.handlers[i].position.fromArray(gamepad.pose.position);

      this.handlers[i].quaternion.fromArray(gamepad.pose.orientation);
      this.handlers[i].updateMatrix();
      this.handlers[i].applyMatrix(this.sTSMat);

      this.intersectPoint.copy(this.handlers[0].position);
      this.intersectPoint2.copy(this.handlers[1].position);

      if(gamepad.buttons[0].pressed) {
        if(this.cursorlocked[i] === false){
          this.cursorlocked[i] = true;
          this.phManager.onCursor(-1);

          console.log('cursor locked');
        }
      }
      else{
        if(this.cursorlocked[i] === true){
          this.cursorlocked[i] = false;

          console.log('cursor unlocked');
        }
      }
      //Trigger
      if(gamepad.buttons[1].pressed) {
        if(this.triggerlocked[i] === false){
          this.triggerlocked[i] = true;
          this.phManager.onClick();

          console.log('trigger locked');
        }
      }
      else{
        if(this.triggerlocked[i] === true){
          this.triggerlocked[i] = false;

          console.log('trigger unlocked');
        }
      }
    }
  }
};

/**
 * @param {int} gamepadIndex
 */
GamePads.prototype.vibrate = function(gamepadIndex) {
  var gamepads = navigator.getGamepads();

  if(!gamepads || !gamepads.length) {
    return;
  }

  if(gamepads && gamepads.length && gamepads.length > gamepadIndex) {
    var gamepad = gamepads[gamepadIndex];

    if(gamepad && 'haptics' in gamepad && gamepad.haptics.length > 0) {
      gamepad.haptics[0].vibrate(1, 200);
    }
  }
};

module.exports = GamePads;
