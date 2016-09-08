var THREE = require("three");
var TWEEN = require("tween.js");
var KeyCodes = require('./utils').KeyCodes;

var that;

/**
 * @param {THREE.Camera} dcamera
 * @param {THREE.Camera} camera
 */
var PhysicsManager = function(dcamera, camera) {
  that = this;

  THREE.EventDispatcher.call(this);

  this.world = new CANNON.World();
  this.world.gravity.set(0, 0, 0); // m/s²

  this.dcamera = dcamera;
  this.camera = camera;
  this.mode = -1;

  this.threeCannon = [];

  // Sphere for the dummyCamera
  var radius = 0.25;

  this.camBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Sphere(radius)
  });

  this.world.addBody(this.camBody);

  // Floor plane
  var groundBody = new CANNON.Body({
    mass: 0
  });

  var groundShape = new CANNON.Plane();

  groundBody.addShape(groundShape);

  this.world.addBody(groundBody);

  this.fixedTimeStep = 1.0 / 60.0;
  this.maxSubSteps = 3;
  this.lastTime = 0;
  this.damping = 0.5;
  this.f = 10; //force

  this.bodyText = [];
  this.springElements = [];

  this.startPh = false;
  this.startSpring = {};
  this.lettersLength = 0;

  window.addEventListener('click', this.onClick.bind(this));
  window.addEventListener('keydown', this.onCursor, true);
};

PhysicsManager.prototype = Object.create(THREE.EventDispatcher.prototype);

PhysicsManager.prototype.onClick = function() {
  this.attractBodiesToPlayer();
};

/**
 * Attract shapes and letters to the player.
 */
PhysicsManager.prototype.attractBodiesToPlayer = function() {
  var vx, vy, vz;

  for(i = 0; i < this.threeCannon.length; i++) {
    if(this.mode === 3) {
      vx = this.camera.position.x - this.threeCannon[i].t.position.x;
      vy = this.camera.position.y - this.threeCannon[i].t.position.y;
      vz = this.camera.position.z - this.threeCannon[i].t.position.z;
    } else {
      vx = this.dcamera.position.x - this.threeCannon[i].t.position.x;
      vy = this.dcamera.position.y - this.threeCannon[i].t.position.y;
      vz = this.dcamera.position.z - this.threeCannon[i].t.position.z;
    }

    var v = new CANNON.Vec3(vx, vz, vy);

    v.normalize();

    if(!this.threeCannon[i].c.isSpringing) {
      this.threeCannon[i].c.applyLocalImpulse(
        v.scale(this.f / 30),
        this.threeCannon[i].c.position
      );

      if(this.threeCannon[i].c.springable) {
        v = v.scale(this.f / 2);
      } else {
        v = v.scale(this.f / 500);
      }

      this.threeCannon[i].c.applyImpulse(v, this.threeCannon[i].c.position);
    }
  }
};

/**
 * Send all letters to their final position.
 */
PhysicsManager.prototype.showMessage = function() {
  for(var i = 0; i < that.threeCannon.length; i++) {
    var body = that.threeCannon[i].c;

    if(!body.isSpringing && body.springable && !body.isStarter) {
      that.addToSpring(that.bodyText[body.springIndex], body);
    }
  }
};

/**
 * @param {Event} e - KeyEvent or Controller event
 */
PhysicsManager.prototype.onCursor = function(e) {
  if(that.startPh) {
    if(e.keyCode === KeyCodes.Q) {
      that.showMessage();
    }

    if(e.keyCode === KeyCodes.SPACE || e === -1) {
      if (that.springElements.length >= that.lettersLength) {
        that.dispatchEvent({
          type: 'messageUnlocked'
        });
      }

      for(var i = 0; i < that.springElements.length; i++) {
        that.springElements[i].bodyB.isSpringing = false;
      }

      that.springElements = [];
    }
  }
};

/**
 * Update all the CANNON.Body and apply changes to attached THREE.Mesh.
 *
 * @param {float} timestamp
 */
PhysicsManager.prototype.update = function(timestamp) {
  // Note: CANNON and THREE have the XY coordinates flipped

  if(this.lastTime !== void 0) {
    var dt = (timestamp - this.lastTime) / 1000;
    this.world.step(this.fixedTimeStep, dt, this.maxSubSteps);
  }

  if(this.mode === 3) {
    this.camBody.position.x = this.camera.position.x;
    this.camBody.position.y = this.camera.position.z;
    this.camBody.position.z = this.camera.position.y;
  } else {
    this.camBody.position.x = this.dcamera.position.x;
    this.camBody.position.y = this.dcamera.position.z;
    this.camBody.position.z = this.dcamera.position.y;
  }

  for(var i = 0; i < this.threeCannon.length; i++) {
    if(!this.threeCannon[i].c.isActuator) {
      this.threeCannon[i].t.position.x = this.threeCannon[i].c.position.x;
      this.threeCannon[i].t.position.y = this.threeCannon[i].c.position.z;
      this.threeCannon[i].t.position.z = this.threeCannon[i].c.position.y;

      if(!this.threeCannon[i].c.isSpringing) {
        this.threeCannon[i].t.quaternion.x = this.threeCannon[i].c.quaternion.x;
        this.threeCannon[i].t.quaternion.y = this.threeCannon[i].c.quaternion.z;
        this.threeCannon[i].t.quaternion.z = this.threeCannon[i].c.quaternion.y;
        this.threeCannon[i].t.quaternion.w = this.threeCannon[i].c.quaternion.w;
      } else {
        if(this.threeCannon[i].c.waitsAnimation) {
          this.threeCannon[i].c.waitsAnimation = false;
          this.animateQuaternion(this.threeCannon[i], 2000);
        }

        this.threeCannon[i].c.quaternion.x = this.threeCannon[i].t.quaternion.x;
        this.threeCannon[i].c.quaternion.y = this.threeCannon[i].t.quaternion.z;
        this.threeCannon[i].c.quaternion.z = this.threeCannon[i].t.quaternion.y;
        this.threeCannon[i].c.quaternion.w = this.threeCannon[i].t.quaternion.w;
      }
    } else {
      this.threeCannon[i].c.position.x = this.threeCannon[i].t.position.x;
      this.threeCannon[i].c.position.y = this.threeCannon[i].t.position.z;
      this.threeCannon[i].c.position.z = this.threeCannon[i].t.position.y;
      this.threeCannon[i].c.quaternion.x = this.threeCannon[i].t.quaternion.x;
      this.threeCannon[i].c.quaternion.y = this.threeCannon[i].t.quaternion.z;
      this.threeCannon[i].c.quaternion.z = this.threeCannon[i].t.quaternion.y;
      this.threeCannon[i].c.quaternion.w = this.threeCannon[i].t.quaternion.w;
    }
  }

  if(this.springElements.length > 0 && this.startPh) {
    for(i = 0; i < this.springElements.length; i++) {
      this.springElements[i].applyForce();
    }
  }

  if(this.startSpring !== void 0) {
    this.startSpring.applyForce();
  }

  this.lastTime = timestamp;
};

/**
 * Add the starting cube.
 *
 * @param {THREE.Mesh} obj
 * @param {string} type
 */
PhysicsManager.prototype.addStarterObject = function(obj, type) {
  // Note: CANNON and THREE have the XY coordinates flipped

  var mass = 5;

  if(type === 'cube') {
    var bbox = new THREE.Box3().setFromObject(obj);
    
    var widthX = bbox.max.x - bbox.min.x;
    var widthY = bbox.max.y - bbox.min.y;
    var widthZ = bbox.max.z - bbox.min.z;

    
    var boxShape = new CANNON.Box(new CANNON.Vec3(widthX / 2, widthZ / 2, widthY / 2));

    var boxBody = new CANNON.Body({
      mass: mass,
      angularDamping: 0.3
    });

    boxBody.springable = true;
    boxBody.isStarter = true;
    boxBody.addShape(boxShape);

    boxBody.position.set(obj.position.x, obj.position.z, obj.position.y);

    this.world.addBody(boxBody);

    var radius = 0.1;

    var body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, 0, 1.5),
      shape: new CANNON.Sphere(radius)
    });

    this.startSpring = new CANNON.Spring(body, boxBody, {
      localAnchorA: new CANNON.Vec3(0, 0, -0.4),
      localAnchorB: new CANNON.Vec3(0, 0, 0),
      restLength: 0,
      stiffness: 50,
      damping: 40
    });

    this.threeCannon.push({
      't': obj,
      'c': boxBody
    });
  }
};

/**
 * Fade the opacity of the starting cube, then remove it.
 */
PhysicsManager.prototype.deleteStarterObject = function() {
  var cbody = that.startSpring.bodyB;
  var mesh = that.getThreeMeshFromCannonBody(this.startSpring.bodyB);
  mesh.material.transparent = true;

  new TWEEN.Tween({
      opacity: mesh.material.opacity
    }).to({
      opacity: 0
    }, 1000)
    .onUpdate(function() {
      mesh.material.opacity = this.opacity;
    })
    .onComplete(function() {
      mesh.visible = false;
      cbody.sleep();
    })
    .start();

  this.startSpring = undefined;
};

/**
 * Add a new CANNON.Body to a THREE.Mesh.
 *
 * @param {THREE.Mesh} obj
 * @param {string} type
 * @param {boolean} actuator - aka object used for interaction.
 * @param {boolean} springable
 * @param {Object} options
 */
PhysicsManager.prototype.add3DObject = function(obj, type, actuator, springable, options) {
  // Note: CANNON and THREE have the XY coordinates flipped

  var mass, bbox, widthX, widthY, widthZ, boxShape, boxBody;

  if(actuator) {
    mass = 0;
  } else {
    mass = 5;
  }

  switch(type) {
    case 'cube':
      bbox = new THREE.Box3().setFromObject(obj);

      widthX = bbox.max.x - bbox.min.x;
      widthY = bbox.max.y - bbox.min.y;
      widthZ = bbox.max.z - bbox.min.z;

      boxShape = new CANNON.Box(new CANNON.Vec3(widthX / 2, widthZ / 2, widthY / 2));

      if(options) {
        boxBody = new CANNON.Body(options);
      } else {
        boxBody = new CANNON.Body({
          mass: mass,
          angularDamping: 0.3
        });
      }

      boxBody.addShape(boxShape);
          
      boxBody.position.set(obj.position.x, obj.position.z, obj.position.y);
      this.world.addBody(boxBody);
      boxBody.springable = springable;
      boxBody.isActuator = actuator;
      boxBody.isSpringing = false;
      boxBody.springIndex = obj.springIndex;

      if(actuator) {
        boxBody.addEventListener('collide', function(e) {
          if(!that.startPh && e.body.isStarter && that.lastTime > 1000) {
            that.dispatchEvent({
              type: 'starts',
              gamepadIndex: obj.gamepadIndex
            });

            that.startPh = true;
            that.deleteStarterObject();
          }
          if(e.body.springable && !e.body.isSpringing && that.startPh) {
            if(e.body.springIndex !== void 0) {
              that.addToSpring(that.bodyText[e.body.springIndex], e.body);
              that.dispatchEvent({
                type: 'letterHit',
                mesh: that.getThreeMeshFromCannonBody(e.body),
                gamepadIndex: obj.gamepadIndex
              });
            }
          }
        });
      }

      this.threeCannon.push({
        't': obj,
        'c': boxBody
      });

      break;

    case 'sphere':
      bbox = new THREE.Box3().setFromObject(obj);

      var radius = bbox.max.x - bbox.min.x;
      boxShape = new CANNON.Sphere(radius / 2);

      if(options) {
        boxBody = new CANNON.Body(options);
      } else {
        boxBody = new CANNON.Body({
          mass: mass,
          angularDamping: 0.3
        });
      }

      boxBody.addShape(boxShape);
      boxBody.position.set(obj.position.x, obj.position.z, obj.position.y);
      this.world.addBody(boxBody);
      boxBody.springable = springable;
      boxBody.isActuator = actuator;
      boxBody.springIndex = obj.springIndex;

      // if (actuator) {
      //   boxBody.addEventListener("collide", function(e) {});
      // }

      this.threeCannon.push({
        't': obj,
        'c': boxBody
      });

      break;

    case 'convex':
      bbox = new THREE.Box3().setFromObject(obj);

      widthX = bbox.max.x - bbox.min.x;
      widthY = bbox.max.y - bbox.min.y;
      widthZ = bbox.max.z - bbox.min.z;

      var verts = [];

      for(var i = 0; i < obj.geometry.vertices.length; i++) {
        verts.push(new CANNON.Vec3(obj.geometry.vertices[i].x, obj.geometry.vertices[i].z, obj.geometry.vertices[i].y));
      }

      var faces = [];

      for(var i = 0; i < obj.geometry.faces.length; i++) {
        faces.push([obj.geometry.faces[i].a, obj.geometry.faces[i].b, obj.geometry.faces[i].c]);
      }

      boxShape = new CANNON.Trimesh(verts, faces);

      if(options) {
        boxBody = new CANNON.Body(options);
      } else {
        boxBody = new CANNON.Body({
          mass: mass,
          angularDamping: 0.3
        });
      }

      boxBody.addShape(boxShape);
      boxBody.position.set(obj.position.x, obj.position.z, obj.position.y);
      this.world.addBody(boxBody);
      boxBody.springable = springable;
      boxBody.isActuator = actuator;
      boxBody.isSpringing = false;
      boxBody.springIndex = obj.springIndex;

      if(actuator) {
        boxBody.addEventListener('collide', function(e) {
          if(e.body.springable && !e.body.isSpringing) {
            if(e.body.springIndex !== void 0) {
              that.addToSpring(that.bodyText[e.body.springIndex], e.body);
              that.dispatchEvent({
                type: 'letterHit',
                mesh: that.getThreeMeshFromCannonBody(e.body)
              });
            }
          }
        });  
      }

      this.threeCannon.push({
        't': obj,
        'c': boxBody
      });

      break;

    default:
      break;
  }
};

/**
 * Returns the THREE.Mesh attached to a CANNON.Body.
 *
 * @param {CANNON.Body} body
 * @returns {THREE.Mesh}
 */
PhysicsManager.prototype.getThreeMeshFromCannonBody = function(body) {
  for(var i = 0; i < this.threeCannon.length; i++) {
    if(body.id === this.threeCannon[i].c.id) {
      return this.threeCannon[i].t;
    }
  }

  return {};
};

/**
 * Generates a bounding box made of CANNON.Plane.
 *
 * @param {float} x
 * @param {float} y
 * @param {float} z
 */
PhysicsManager.prototype.setClosedArea = function(x, y, z) {
  var widthX = x;
  var widthY = y;
  var widthZ = z;

  // Left
  var groundBody = new CANNON.Body({ mass: 0 });
  var groundShape = new CANNON.Plane(widthZ, widthY);
  groundBody.addShape(groundShape);
  var rot = new CANNON.Vec3(0, 1, 0);
  groundBody.quaternion.setFromAxisAngle(rot, (Math.PI / 2));
  groundBody.position.set(-widthX / 2, 0, widthY / 2);
  this.world.addBody(groundBody);

  // Right
  groundBody = new CANNON.Body({ mass: 0 });
  groundShape = new CANNON.Plane(widthZ, widthY);
  groundBody.addShape(groundShape);
  rot = new CANNON.Vec3(0, 1, 0);
  groundBody.quaternion.setFromAxisAngle(rot, -(Math.PI / 2));
  groundBody.position.set(widthX / 2, 0, widthY / 2);
  this.world.addBody(groundBody);

  // Front
  groundBody = new CANNON.Body({ mass: 0 });
  groundShape = new CANNON.Plane(widthX, widthY);
  groundBody.addShape(groundShape);
  rot = new CANNON.Vec3(1, 0, 0);
  groundBody.quaternion.setFromAxisAngle(rot, -(Math.PI / 2));
  groundBody.position.set(0, -widthZ / 2, widthY / 2);
  this.world.addBody(groundBody);

  // Back
  groundBody = new CANNON.Body({ mass: 0 });
  groundShape = new CANNON.Plane(widthX, widthY);
  groundBody.addShape(groundShape);
  rot = new CANNON.Vec3(1, 0, 0);
  groundBody.quaternion.setFromAxisAngle(rot, (Math.PI / 2));
  groundBody.position.set(0, widthZ / 2, widthY / 2);
  this.world.addBody(groundBody);

  // Top
  groundBody = new CANNON.Body({ mass: 0 });
  groundShape = new CANNON.Plane(widthX, widthZ);
  groundBody.addShape(groundShape);
  rot = new CANNON.Vec3(0, 1, 0);
  groundBody.quaternion.setFromAxisAngle(rot, (Math.PI));
  groundBody.position.set(0, 0, widthY);
  this.world.addBody(groundBody);
};

/**
 * Create CANNON.Spring between the two CANNON.Body.
 *
 * @param {CANNON.Body} bodyA
 * @param {CANNON.Body} bodyB
 */
PhysicsManager.prototype.addToSpring = function(bodyA, bodyB) {
  // Distance between the bodies
  var dx = bodyA.position.x - bodyB.position.x;
  var dy = bodyA.position.y - bodyB.position.y;
  var dz = bodyA.position.z - bodyB.position.z;
  var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));

  bodyB.isSpringing = true;
  bodyB.waitsAnimation = true;

  var spring = new CANNON.Spring(bodyA, bodyB, {
    localAnchorA: new CANNON.Vec3(0, 0, -0.4),
    localAnchorB: new CANNON.Vec3(0, 0, 0),
    restLength: dist,
    stiffness: 50,
    damping: 40
  });

  that.springElements.push(spring);
  
  if(that.springElements.length >= that.lettersLength) {
    that.dispatchEvent({
      type: 'messageDone'
    });
  }

  // Shrink the spring resting lenght to 0
  new TWEEN.Tween({
      length: spring.restLength
    }).to({
      length: 0
    }, 2000)
    .easing(TWEEN.Easing.Exponential.InOut)
    .onUpdate(function() {
      spring.restLength = this.length;
    })
    .start();
};

/**
 * Setting up the VR Mode.
 *
 * @param {int} mode
 */
PhysicsManager.prototype.setMode = function(mode) {
  this.mode = mode;
};

/**
 * Add a CANNON.Body for each letter, and returns an array of the CANNON.Spring indices.
 *
 * @param {string} text
 * @returns {Array<int>}
 */
PhysicsManager.prototype.setBodyText = function(text) {
  var boundingSphere = new CANNON.Sphere(0.1);

  var letterWidth = 1.3;
  var letterHeight = 2;

  // with CANNON, y and z axis are swapped
  var x = 0;
  var y = 5;
  var z = -9;

  var indices = [];

  var lines = text.split('\\N');

  var offsetY = (lines.length * letterHeight) / 2;

  for(var i = 0; i < lines.length; ++i) {
    var line = lines[i];

    var offsetX = (line.length * letterWidth) / 2;

    for(var j = 0; j < line.length; ++j) {
      var letter = line[j];

      if(letter !== ' ') {
        this.bodyText.push(new CANNON.Body({
          mass: 0,
          position: new CANNON.Vec3(x - offsetX, z, y + offsetY),
          shape: boundingSphere
        }));

        indices.push(this.bodyText.length - 1);
      }

      x += letterWidth;
    }

    x = 0;
    y -= letterHeight;
  }

  return indices;
};

/**
 * Animate a quaternion to his resting position.
 *
 * @param {any} obj
 * @param {float} duration
 */
PhysicsManager.prototype.animateQuaternion = function(obj, duration) {
  var startQuaternion = new THREE.Quaternion().copy(obj.t.quaternion).normalize();
  var endQuaternion = new THREE.Quaternion().set(0, 0, 0, 1).normalize();

  new TWEEN.Tween({
      progress: 0
    }).to({
      progress: 1
    }, duration).onUpdate(function() {
      THREE.Quaternion.slerp(
        startQuaternion, 
        endQuaternion,
        obj.t.quaternion,
        this.progress
      );
    }).start();
};

/**
 * Setting up the length of the message.
 * This will allow us to know when all the letters have been hit.
 *
 * @param {int} duration
 */
PhysicsManager.prototype.setLettersLength = function(value) {
  this.lettersLength = value;
};

module.exports = PhysicsManager;
