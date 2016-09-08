var THREE = require('three');
var TWEEN = require('tween.js');
var Rebound = require('rebound');
var random = require('../utils').random;
var textureLoader = require('../utils').textureLoader;
var jsonLoader = require('../utils').jsonLoader;

/**
 * @param {char} letter
 * @param {string} [color='silver'] gold or silver
 */
function Letter(letter, color) {
  this.el = new THREE.Mesh();
  this.el.visible = false;

  this._material = Letter._material.clone();
  this.el.material = this._material;

  this._isMatCapReady = false;
  this._isGeometryReady = false;
  this.isReady = this.isMatCapReady && this.isGeometryReady;

  Letter._loadMatCap(color || 'silver', (function(texture) {
    this._material.uniforms.normalMap.value = texture;
    this._material.uniforms.textureMap.value = texture;
    this._material.needsUpdate = true;

    this._isMatCapReady = true;
    this._checkIfReady();
  }).bind(this));

  Letter._loadModel(letter, (function(geometry) {
    this.el.geometry = geometry;

    this._isGeometryReady = true;
    this._checkIfReady();
  }).bind(this));

  this._inflateSpring = Letter._springSystem.createSpring(40, 3);
  this._inflateSpring.setEndValue(1).setAtRest();

  this._inflateTimeoutId = null;
  this._inflateLoopIntervalId = null;

  this._addListeners();
};

Letter._material = new THREE.RawShaderMaterial({
  uniforms: {
    normalMap: { type: 't', value: null },
    textureMap: { type: 't', value: null },
    inflation: { type: 'f', value: 0 },
    opacity: { type: 'f', value: 0 }
  },
  vertexShader: require('./vs-letter.glsl'),
  fragmentShader: require('./fs-letter.glsl'),
  transparent: true
});

Letter._springSystem = new Rebound.SpringSystem();

Letter._matCaps = {};

Letter._models = {};

Letter.prototype = Object.create(THREE.EventDispatcher.prototype);

Letter.prototype._checkIfReady = function() {
  if(this.isReady) {
    return;
  }

  this.isReady = this._isMatCapReady && this._isGeometryReady;

  if(this.isReady) {
    this.dispatchEvent({ type: 'ready' });
  }
};

Letter.prototype._addListeners = function() {
  this._inflateSpring.addListener({
    onSpringUpdate: this._onInflateSpringUpdate.bind(this)
  })
};

Letter.prototype._removeListeners = function() {
  this._inflateSpring.removeAllListeners();
};

/**
 * @param {Rebound.Spring} spring
 */
Letter.prototype._onInflateSpringUpdate = function(spring) {
  this._material.uniforms.inflation.value = spring.getCurrentValue();
};

/**
 * @param {char} name
 * @param {(THREE.Geometry) => void} callback
 */
Letter._loadModel = function(name, callback) {
  var cache = Letter._models[name];

  if(cache === void 0) {
    cache = {
      state: 'loading',
      waiters: [callback],
      model: null
    }

    Letter._models[name] = cache;

    var url = 'assets/letters/' + name + '.json';

    jsonLoader.load(url, function(geometry, materials) {
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      cache.state = 'loaded';
      cache.model = geometry;

      for(var i = 0; i < cache.waiters.length; ++i) {
        cache.waiters[i](geometry);
      }

      cache.waiters.length = 0;
    });
  }
  else if(cache.state === 'loading') {
    cache.waiters.push(callback);
  }
  else if(cache.state === 'loaded') {
    callback(cache.model);
  }
};

/**
 * @param {string} name
 * @param {(THREE.Texture) => void} callback
 */
Letter._loadMatCap = function(name, callback) {
  if(Letter._matCaps[name] === void 0) {
    var url = 'assets/textures/' + name + '.jpg';

    Letter._matCaps[name] = textureLoader.load(url);
  }

  callback(Letter._matCaps[name]);
};

Letter.prototype.fadeIn = function() {
  var material = this._material;

  new TWEEN.Tween({ opacity: 0 })
    .to({ opacity: 1 })
    .delay(random(1000, 3000))
    .onStart((function() {
      this.el.visible = true;
    }).bind(this))
    .onUpdate(function() {
      material.uniforms.opacity.value = this.opacity; 
    })
    .start();
};

Letter.prototype.inflate = function() {
  if(this._inflateTimeoutId) {
    window.clearTimeout(this._inflateTimeoutId);
    this._inflateTimeoutId = null;
  }

  this._inflateSpring.setEndValue(0.09);

  this._inflateTimeoutId = window.setTimeout((function() {
    this._inflateSpring.setEndValue(0);
  }).bind(this), 300);
};

/**
 * @param {float} [interval=2000]
 */
Letter.prototype.startInflateLoop = function(interval) {
  this._inflateLoopIntervalId = window.setInterval((function() {
    this.inflate();
  }).bind(this), interval);
};

Letter.prototype.stopInflateLoop = function() {
  if(this._inflateLoopIntervalId === null) {
    return;
  }

  window.clearInterval(this._inflateLoopIntervalId);

  this._inflateLoopIntervalId = null;
};

Letter.prototype.dispose = function() {
  this._removeListeners();

  if(this.el.parent) {
    this.el.parent.remove(this.el);
  }
};

module.exports = Letter;
