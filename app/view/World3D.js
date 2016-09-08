var THREE = require('three');
var TWEEN = require('tween.js');

var VRControls = require('./../utils/VRControls');
var VREffect = require('./../utils/VREffect');

var GamePads = require('./gamepads/GamePads');
var MousePad = require('./gamepads/MousePad');

var PhysicsManager = require('./PhysicsManager');

var SoundManager = require('./sound/SoundManager');
var AssetsSound = require('./sound/AssetsSound');

var Floor = require('./floor/Floor');
var Cube = require('./cube/Cube');
var Explosion = require('./explosion/Explosion');
var Confettis = require('./confettis/Confettis');
var Letter = require('./letter/Letter');
var Shape = require('./shape/Shape');

var random = require('./utils').random;
var getTextAndColorsFromHash = require('./utils').getTextAndColorsFromHash;

/**
 * @interface ILetterInfos {
 *  char letter;
 *  string color;
 * }
 *
 * @interface ICollisionEvent {
 *  string type;
 *  THREE.Mesh? mesh;
 *  int gamepadIndex;
 * }
 */
 
/**
 * @param {HTMLElement} container
 */
var World3D = function(container) {
  this.boxSize = 20;

  this.container = container;

  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
  this.camera.layers.enable(1);
  this.dummyCamera = new THREE.Object3D();
  this.dummyCamera.add(this.camera);

  this.scene = new THREE.Scene();
  this.renderer = new THREE.WebGLRenderer({ antialias: true });

  this.physicsManager = new PhysicsManager(this.dummyCamera,this.camera);
  this.physicsManager.setClosedArea(this.boxSize, this.boxSize, this.boxSize);

  this.controls = new VRControls(this.camera);
  this.controls.standing = true;

  this.effect = new VREffect(
    this.renderer,
    null,
    null,
    this.onRenderLeft.bind(this),
    this.onRenderRight.bind(this)
  );

  this.manager = new WebVRManager(this.renderer, this.effect, {
    hideButton: false,
    isUndistorted: false
  });

  this.addEvents();

  // plane to raycast
  this.planeCalc = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(100, 100, 2, 2),
    new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0
    })
  );

  this.scene.add(this.dummyCamera);

  // elements
  this.floor = null;
  this.introCube = null;
  this.confettis = null;
  this.letters = [];
  this.shapes = [];

  this.createFloor();
  this.createIntroCube();
  this.createConfettis();
  this.createLetters();
  this.createShapes();

  this.soundManager = new SoundManager();
  this.soundManager.addSoundsFromConfig(AssetsSound.Sounds);
  this.balloonSoundIndex = 0;
  this.isSuccessSoundPlaying = false;

  this.renderBound = this.render.bind(this);
};

World3D.prototype.setup = function() {
  this.renderer.setClearColor('#1a1f27', 1);
  this.container.appendChild(this.renderer.domElement);

  this.positionTouch1 = new THREE.Vector3(0, 100, 0);
  this.positionTouch2 = new THREE.Vector3(0, 100, 0);

  this.render(0);
};

/**
 * @param {int} mode
 */
World3D.prototype.onModeChange = function(mode) {
  this.physicsManager.setMode(mode);

  if(mode === 3) {
    console.log('Passing to VR mode');
  }
};

World3D.prototype.addEvents = function() {
  this.manager.on('initialized', this.onInitializeManager.bind(this));
  this.manager.on('modechange', this.onModeChange.bind(this));

  this.physicsManager.addEventListener('starts', this.onStart.bind(this));
  this.physicsManager.addEventListener('letterHit', this.onLetterHit.bind(this));
  this.physicsManager.addEventListener('messageDone', this.onMessageComplete.bind(this));
  this.physicsManager.addEventListener('messageUnlocked', this.onMessageRelease.bind(this));
};

/**
 * @param {ICollisionEvent} e
 */
World3D.prototype.onStart = function(e) {
  var gamepadIndex = e.gamepadIndex;

  this.soundManager.play(AssetsSound.BACKGROUND_NORMAL);

  for(var i = 0; i < this.shapes.length; ++i) {
    this.shapes[i].fadeIn();
  }

  for(var i = 0; i < this.letters.length; ++i) {
    this.letters[i].fadeIn();
  }

  this.physicsManager.attractBodiesToPlayer();

  if(gamepadIndex !== void 0 && this.gamePads.vibrate) {
    this.gamePads.vibrate(gamepadIndex);
  }
};

World3D.prototype.onMessageComplete = function() {
  this.soundManager.fadeOut(AssetsSound.BACKGROUND_NORMAL);

  if(this.isSuccessSoundPlaying) {
    this.soundManager.fadeIn(AssetsSound.BACKGROUND_SUCCESS);
  }
  else {
    this.soundManager.play(AssetsSound.BACKGROUND_SUCCESS);
    this.isSuccessSoundPlaying = true;
  }

  if(!this.confettis.el.parent) {
    this.scene.add(this.confettis.el);
  }

  this.confettis.start();

  for(var i = 0; i < this.shapes.length; ++i) {
    this.shapes[i].startTripping();
  }

  for(var j = 0; j < this.letters.length; ++j) {
    this.letters[j].startInflateLoop(random(1000, 5000));
  }
};

World3D.prototype.onMessageRelease = function() {
  this.soundManager.fadeIn(AssetsSound.BACKGROUND_NORMAL);
  this.soundManager.fadeOut(AssetsSound.BACKGROUND_SUCCESS);

  for(var i = 0; i < this.shapes.length; ++i) {
    this.shapes[i].stopTripping();
  }

  for(var j = 0; j < this.letters.length; ++j) {
    this.letters[j].stopInflateLoop();
  }
};

/**
 * @param {ICollisionEvent} e
 */
World3D.prototype.onLetterHit = function(e) {
  var gamepadIndex = e.gamepadIndex; // left: 0, right: 1
  var mesh = e.mesh;
  var letter = mesh.letter;

  var explosion = Explosion.pool.length
    ? Explosion.pool.pop()
    : new Explosion();

  explosion.setParent(this.scene);
  explosion.el.position.copy(mesh.position);

  new TWEEN.Tween({ progress: 0 })
    .to({ progress: 1 }, 400)
    .onUpdate(function() {
      explosion.setProgress(this.progress);
    })
    .onComplete(function() {
      Explosion.pool.push(explosion);
      explosion.setParent(null);
    })
    .start();

  letter.inflate();

  // sound
  this.balloonSoundIndex++;

  if(this.balloonSoundIndex >= 4) {
    this.balloonSoundIndex = 0;
  }

  this.soundManager.play(AssetsSound['BALLOON_' + (this.balloonSoundIndex + 1)]);

  if(gamepadIndex !== void 0 && this.gamePads.vibrate) {
    this.gamePads.vibrate(gamepadIndex);  
  }
};

World3D.prototype.onInitializeManager = function(n, o) {
  if(!this.manager.isVRCompatible || typeof window.orientation !== 'undefined') {
    this.gamePads = new MousePad(this.scene, this.camera, this.effect, this.physicsManager);
    this.dummyCamera.position.z = 5;
    this.dummyCamera.position.y = 0.5;
  } else {
    this.gamePads = new GamePads(this.scene, this.camera, this.effect, this.physicsManager);
  }

  if(this.gamePads.h2 !== void 0) {
    this.physicsManager.add3DObject(this.gamePads.h2, 'cube', true, false);
  }

  this.setup();
};

/**
 * @returns {{x:float, y:float, z:float}}
 */
World3D.prototype.getRandomCoordinatesInBox = function() {
  var x = random(-this.boxSize / 2, this.boxSize / 2);
  var y = random(-this.boxSize / 2, this.boxSize / 2);
  var z = random(-this.boxSize / 2, this.boxSize / 2);

  return {
    x: x,
    y: y,
    z: z
  }
};

World3D.prototype.createFloor = function() {
  this.floor = new Floor();
  this.scene.add(this.floor.el);
};

World3D.prototype.createIntroCube = function() {
  this.introCube = new Cube(1);
  this.introCube.el.position.y = 0.5;
  this.scene.add(this.introCube.el);
  this.physicsManager.addStarterObject(this.introCube.el,"cube");
};

World3D.prototype.createConfettis = function() {
  this.confettis = new Confettis(new THREE.Vector3(10, 10, 10), 1200, false);
  this.confettis.el.position.y += 5;
};

World3D.prototype.createShapes = function() {
  for(var i = 0; i < 100; ++i) {
    var shape = new Shape();

    var coordinates = this.getRandomCoordinatesInBox();
    shape.el.position.set(coordinates.x, coordinates.y, coordinates.z);

    this.shapes.push(shape);
    this.scene.add(shape.el);
    this.physicsManager.add3DObject(shape.el, 'sphere', false, false);
  }
};

/**
 * @param {string} text
 * @param {colors} colors
 * @param {{[key:string]:string}} colorsTable
 * @returns {Array<IletterInfos>}
 */
World3D.prototype.getLettersInfos = function(text, colors, colorsTable) {
  var letters = text.replace(/\\N/g, ' ').split('');

  var lettersInfos = [];

  for(var i = 0; i < letters.length; ++i) {
    var letter = letters[i];

    if(letter === ' ') {
      continue;
    }

    var letterInfos = {
      letter: letter,
      color: colorsTable[colors[i]]
    }

    lettersInfos.push(letterInfos);
  }

  return lettersInfos;
};

World3D.prototype.createLetters = function() {
  var textInfos = getTextAndColorsFromHash();

  var lettersInfos = this.getLettersInfos(
    textInfos.text,
    textInfos.colors,
    {
      S: 'silver',
      G: 'gold'
    }
  );

  this.physicsManager.setLettersLength(lettersInfos.length);
  var indices = this.physicsManager.setBodyText(textInfos.text);

  for(var i = 0; i < lettersInfos.length; i++ ){
    var letterInfos = lettersInfos[i];

    var letter = new Letter(letterInfos.letter, letterInfos.color);

    // attach letter to el
    // that way we can access back the Letter onLetterHit
    letter.el.letter = letter;

    var coordinates = this.getRandomCoordinatesInBox();
    letter.el.position.set(coordinates.x, coordinates.y, coordinates.z);

    letter.el.springIndex = indices[i];

    this.letters.push(letter);
    this.scene.add(letter.el);

    var addToPhysicSimulation = (function(letter) {
      this.physicsManager.add3DObject(letter.el, 'cube', false, true);
      letter.removeEventListener(addToPhysicSimulation);
    }).bind(this, letter);

    if(letter.isReady) {
      addToPhysicSimulation();
    }
    else {
      letter.addEventListener('ready', addToPhysicSimulation);
    }
  }
};

World3D.prototype.onRenderLeft = function() {};

World3D.prototype.onRenderRight = function() {};

/**
 * @param {float} timestamp
 */
World3D.prototype.render = function(timestamp) {
  window.requestAnimationFrame(this.renderBound);

  TWEEN.update();

  for(var i = 0; i < this.shapes.length; ++i) {
    this.shapes[i].update();
  }

  this.confettis.update();

  this.planeCalc.lookAt(this.dummyCamera.position);
  this.gamePads.update(timestamp, [this.planeCalc]);

  this.physicsManager.update(timestamp);

  this.controls.update();

  this.manager.render(this.scene, this.camera, timestamp);
};

/**
 * @param {float} w
 * @param {float} h
 */
World3D.prototype.onResize = function(w, h) {
  this.renderer.setPixelRatio(window.devicePixelRatio);
  this.effect.setSize(w, h);
  this.camera.aspect = w / h;
  this.camera.updateProjectionMatrix();
};

module.exports = World3D;
