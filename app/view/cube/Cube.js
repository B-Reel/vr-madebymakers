var THREE = require('three');
var textureLoader = require('../utils').textureLoader;

/**
 * @param {float} [size=1]
 */
function Cube(size) {
  size = size || 1;

  var geometry = new THREE.BoxBufferGeometry(size, size, size);

  var material = new THREE.MeshBasicMaterial({
    map: textureLoader.load('assets/textures/breel.png')
  });

  this.el = new THREE.Mesh(geometry, material);
};

Cube.prototype.dispose = function() {
  if(this.el.parent) {
    this.el.remove(this.el);
  }
};

module.exports = Cube;
