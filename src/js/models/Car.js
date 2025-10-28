import * as THREE from 'three';
import Base from '../Base';
import CarPhysics from '../physics/CarPhysics';

export default class Car {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.debug = this.base.debug;
    this.time = this.base.time;
    this.inputs = this.base.inputs;
    this.inputsActions = this.inputs.actions;

    this.carPhysics = new CarPhysics();

    this.loadDefaultParameters();
    this.initializeCurrentParameters();
    this.loadModel();
    this.loadEvents();
    this.loadDebugger();
  }

  loadDefaultParameters() {
    /**
     * Meta-parameters
     */
    this.isRealPhysics = false;

    /**
     * Model
     */
    this.maxSpeed = 30;             // max velocity
    this.accelRate = 15;            // how fast it accelerates (m/s^2)
    this.brakeRate = 20;            // braking rate
    this.reverseAccelRate = 10;     // acceleration rate in reverse (m/s^2)
    this.friction = 5;              // natural slowdown (m/s^2)
    this.boostAccelMultiplier = 1.5   // when boost, accelRate gets multiplied by this
    this.turnRotationLoss = 5;
    /**
     * Chassis
     */
    this.chassisDimensions = {
      width: 2,
      height: 1,
      depth: 3,
    }
    /**
     * Wheels
     */
    this.wheelDimensions = {
      radius: 0.5,
      thickness: 0.5,
      precision: 8
    }
    // For steering
    this.steeringAngle = Math.PI/6;
    this.steeringSpeed = Math.PI;
    this.steerApproximation = 0.001;
  }

  initializeCurrentParameters() {
    // For movement
    this.speed = 0;                 // current velocity (m/s)
    this.wheelSpinSpeed = 0;        // current wheel spin velocity
    this.acceleration = 0;          // current acceleration (m/s^2)

    // For steering
    this.currentSteeringAngle = 0;
    this.targetSteeringAngle = 0;
  }

  loadModel() {
    this.loadChassis();
    this.loadWheels();
    // Group (model)
    this.model = new THREE.Group();
    this.model.add(this.chassis);
    this.model.add(this.flGroup);
    this.model.add(this.frGroup);
    this.model.add(this.rlGroup);
    this.model.add(this.rrGroup);

    this.model.position.set(0, 1, 0);

    this.scene.add(this.model);
  }

  loadChassis() {
    // Chassis
    const chassisGeometry = new THREE.BoxGeometry(this.chassisDimensions.width, 
                                                  this.chassisDimensions.height, 
                                                  this.chassisDimensions.depth);
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      wireframe: true
    });
    this.chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    this.chassis.position.set(0, 0, 0);
  }

  loadWheels() {
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(this.wheelDimensions.radius,
                                                      this.wheelDimensions.radius,
                                                      this.wheelDimensions.thickness,
                                                      this.wheelDimensions.precision);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      wireframe: false
    });

    this.fl = new THREE.Mesh(wheelGeometry, wheelMaterial);
    const flAxisHelper = new THREE.AxesHelper(1);
    this.flGroup = new THREE.Group();
    this.flGroup.add(this.fl);
    this.flGroup.add(flAxisHelper);

    this.fr = new THREE.Mesh(wheelGeometry, wheelMaterial);
    const frAxisHelper = new THREE.AxesHelper(1);
    this.frGroup = new THREE.Group();
    this.frGroup.add(this.fr);
    this.frGroup.add(frAxisHelper);

    this.rl = new THREE.Mesh(wheelGeometry, wheelMaterial);
    const rlAxisHelper = new THREE.AxesHelper(1);
    this.rlGroup = new THREE.Group();
    this.rlGroup.add(this.rl);
    this.rlGroup.add(rlAxisHelper);

    this.rr = new THREE.Mesh(wheelGeometry, wheelMaterial);
    const rrAxisHelper = new THREE.AxesHelper(1);
    this.rrGroup = new THREE.Group();
    this.rrGroup.add(this.rr);
    this.rrGroup.add(rrAxisHelper);

    this.flGroup.position.set(-1, -0.5, -1);
    this.fl.rotateZ(Math.PI/2);
    this.frGroup.position.set(1, -0.5, -1);
    this.fr.rotateZ(-Math.PI/2);
    this.rlGroup.position.set(-1, -0.5, 1);
    this.rl.rotateZ(Math.PI/2);
    this.rrGroup.position.set(1, -0.5, 1);
    this.rr.rotateZ(-Math.PI/2);
  }

  loadEvents() {
    // Inputs !keydown/keyup events
    // for single (non repeat) steering without updating on each frame
    this.inputs.on('!keydown', (key) => {
      if(key === 'ArrowLeft' || key === 'KeyA') this.targetSteeringAngle += this.steeringAngle;
      else if(key === 'ArrowRight' || key === 'KeyD') this.targetSteeringAngle -= this.steeringAngle;
    });
    this.inputs.on('keyup', (key) => {
      if(key === 'ArrowLeft' || key === 'KeyA') this.targetSteeringAngle -= this.steeringAngle;
      else if(key === 'ArrowRight' || key === 'KeyD') this.targetSteeringAngle += this.steeringAngle;
    });
  }

  calculateAcc() {
    if (this.inputsActions.brake) {
      // BRAKE has priority over other actions
      if (this.speed > 0) {
        this.acceleration = -this.brakeRate;
      } else if (this.speed < 0) {
        this.acceleration = this.brakeRate;
      } else {
        this.acceleration = 0;
      }
    } else if (this.inputsActions.up && !this.inputsActions.down) {
      // Only UP is activated
      if (this.speed >= 0) {
        this.acceleration = this.accelRate;   // accelerate forward
        if (this.inputsActions.boost) this.acceleration *= this.boostAccelMultiplier;
      } else {
        this.acceleration = this.brakeRate; 
      }
    } else if (this.inputsActions.down && !this.inputsActions.up) {
      // Only DOWN is activated
      if (this.speed <= 0) {
        this.acceleration = -this.reverseAccelRate;
        if (this.inputsActions.boost) this.acceleration *= this.boostAccelMultiplier;
      } else {
        this.acceleration = -this.brakeRate;  // accelerate backward (brake/reverse)
      }
    } else {
      // No inputs: apply friction toward 0 velocity
      if (this.speed > 0) {
        this.acceleration = -this.friction;
      } else if (this.speed < 0) {
        this.acceleration = this.friction;
      } else {
        this.acceleration = 0;
      }
    }
  }

  calculateSpeed() {
    // 2.1. Update velocity (integrate acceleration)
    this.speed += this.acceleration * this.time.delta;
    // 2.2. Clamp to limits
    let maxSpeedBoost = this.maxSpeed;
    if (this.inputsActions.boost) maxSpeedBoost *= this.boostAccelMultiplier;
    this.speed = Math.min(Math.max(this.speed, -maxSpeedBoost), maxSpeedBoost);
    // 2.3. Prevent small jitter when nearly stopped
    if (Math.abs(this.speed) < 0.001) this.speed = 0;
  }

  move(distance) {
    // 4.1. Determine steering rotation (how much to turn when moving)
    const turnRotation = this.flGroup.rotation.y * distance / this.turnRotationLoss;
    this.model.rotation.y += turnRotation;
    // 4.2. Move according to velocity
    const angle = this.model.rotation.y;
    this.model.position.x -= Math.sin(angle) * distance;
    this.model.position.z -= Math.cos(angle) * distance;
    // 4.3. Spin the wheels according to movement
    this.wheelSpinSpeed = distance;
    this.fl.rotation.x -= this.wheelSpinSpeed;
    this.fr.rotation.x -= this.wheelSpinSpeed;
    this.rl.rotation.x -= this.wheelSpinSpeed;
    this.rr.rotation.x -= this.wheelSpinSpeed;
  }

  turnWheels() {
    if (!(this.currentSteeringAngle === this.targetSteeringAngle)) {
      const diff = this.targetSteeringAngle - this.currentSteeringAngle;
      if (Math.abs(diff) > this.steerApproximation) {
        const step = this.steeringSpeed * this.time.delta;

        if (Math.abs(diff) < step) {
          this.currentSteeringAngle = this.targetSteeringAngle;
        } else {
          this.currentSteeringAngle += Math.sign(diff) * step;
        }
      } else {
        this.currentSteeringAngle = this.targetSteeringAngle;
      }
      this.flGroup.rotation.y = this.currentSteeringAngle;
      this.frGroup.rotation.y = this.currentSteeringAngle;
    }
  }

  update() {
    if (!this.model) return;
    // Handle input to set acceleration and speed
    if(this.isRealPhysics) {
      this.carPhysics.update();
      this.speed = this.carPhysics.speed;
    } else {
      this.calculateAcc();
      this.calculateSpeed();
      // Update stats to display
      this.updateStatsPanel();
    }
    // Calculate distance
    const distance = this.speed * this.time.delta;
    // Move car
    this.move(distance);
    // Steer wheels
    this.turnWheels();
  }

  /**
   * For debug purposes
   */

  loadDebugger() {
    if(this.debug.active) {
      // Main car debug folder
      this.debugFolder = this.debug.ui.addFolder('car_general');
      this.debugFolder
          .add(this, 'isRealPhysics')
          .name('is_real_physics').onChange((value) => {
            this.updateCarFolder(value);
          });
      
      // Folder with arcade like physics
      this.arcadeDebugFolder = this.debugFolder.addFolder('arcade_physics');
      this.arcadeDebugFolder
          .add(this, 'maxSpeed')
          .name('max_speed')
          .min(5).max(30).step(0.1);
      this.arcadeDebugFolder
          .add(this, 'accelRate')
          .name('acceleration')
          .min(1).max(50).step(0.1);
      this.arcadeDebugFolder
          .add(this, 'brakeRate')
          .name('braking')
          .min(1).max(75).step(0.1);
      this.arcadeDebugFolder
          .add(this, 'friction')
          .name('friction')
          .min(0).max(50).step(0.1);
      this.arcadeDebugFolder
          .add(this, 'turnRotationLoss')
          .name('turn_\"friction\"')
          .min(0.1).max(10).step(0.1);
      this.arcadeDebugFolder
          .add(this, 'steeringAngle')
          .name('max_steering_angle')
          .min(0).max(Math.PI/2).step(0.01);
      this.arcadeDebugFolder
          .add(this, 'steeringSpeed')
          .name('steering_animation_speed')
          .min(0.1).max(10).step(0.1);

      this.carPhysics.loadDebugger(this.debugFolder);
      this.updateCarFolder();
    }
  }

  updateCarFolder(isRealPhysics) {
      // Restore parameter values
      this.initializeCurrentParameters();
      this.carPhysics.initializeCurrentParameters();
    if (isRealPhysics) {
      // Show physics folder, hide normal one
      this.arcadeDebugFolder.domElement.style.display = 'none';
      this.carPhysics.physicsDebugFolder.domElement.style.display = '';
    } else {
      // Show normal folder, hide physics one
      this.carPhysics.physicsDebugFolder.domElement.style.display = 'none';
      this.arcadeDebugFolder.domElement.style.display = '';
    }
  }

  updateStatsPanel() {
    if (this.debug.active) {
      this.debug.stats.speed = Number.parseFloat(this.speed).toFixed(2);
      this.debug.stats.accel = Number.parseFloat(this.acceleration).toFixed(2);
      this.debug.stats.engineForce = undefined;
    }
  }

}