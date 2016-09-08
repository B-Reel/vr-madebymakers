var World3D = require('./view/World3D');

var Main = function(){
  this.world3D = null;
};

Main.prototype.init = function() {
  var container = document.getElementById('container');
  this.world3D = new World3D(container);

  this.addEvents();
  this.onResize(null);
};

Main.prototype.addEvents = function() {
  window.addEventListener('resize', this.onResize.bind(this));
  window.addEventListener('vrdisplaypresentchange', this.onResize.bind(this), true);
};

Main.prototype.onResize = function() {
  var w = window.innerWidth;
  var h = window.innerHeight;

  this.world3D.onResize(w, h);
};

module.exports = Main;
