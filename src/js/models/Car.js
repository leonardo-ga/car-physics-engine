import * as THREE from 'three';
import Base from '../Base';

export default class Car {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.debug = this.base.debug;
    this.time = this.base.time;
    this.inputs = this.base.inputs;
    this.inputsActions = this.inputs.actions;

    this.loadParameters();
    this.loadModel();
    this.loadEvents();
    this.loadDebugger();
  }

  loadParameters() {
    /**
     * Model
     */
    this.speed = 0;           // current velocity (m/s)
    this.wheelSpinSpeed = 0;  // current wheel spin velocity
    this.acceleration = 0;    // current acceleration (m/s^2)
    this.maxSpeed = 10;       // max velocity
    this.accelRate = 10;      // how fast it accelerates (m/s^2)
    this.decelRate = 15;      // braking rate
    this.friction = 2;        // natural slowdown (m/s^2)
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
    this.currentSteeringAngle = 0;
    this.targetSteeringAngle = 0;
    this.steerApproximation = 0.001;
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
    if (this.inputsActions.up) {
      this.acceleration = this.accelRate;   // accelerate forward
    } else if (this.inputsActions.down) {
      this.acceleration = -this.decelRate;  // accelerate backward (brake/reverse)
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
    this.speed += this.acceleration * (this.time.delta/1000);
    // 2.2. Clamp to limits
    this.speed = Math.min(Math.max(this.speed, -this.maxSpeed), this.maxSpeed);
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
        const step = this.steeringSpeed * (this.time.delta / 1000);

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
    // 1. Handle input to set acceleration
    this.calculateAcc();
    // 2. Calculate speed
    this.calculateSpeed();
    // 3. Calculate distance
    const distance = this.speed * (this.time.delta/1000);
    // 4. Move car
    this.move(distance);
    // 5. Steer wheels
    this.turnWheels();
  }

  loadDebugger() {
    if(this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('car');

      this.debugFolder
          .add(this, 'maxSpeed')
          .name('max_speed')
          .min(5).max(30).step(0.1);
      this.debugFolder
          .add(this, 'accelRate')
          .name('acceleration')
          .min(1).max(50).step(0.1);
      this.debugFolder
          .add(this, 'decelRate')
          .name('braking')
          .min(1).max(75).step(0.1);
      this.debugFolder
          .add(this, 'friction')
          .name('friction')
          .min(0).max(50).step(0.1);
      this.debugFolder
          .add(this, 'turnRotationLoss')
          .name('turn_\"friction\"')
          .min(0.1).max(10).step(0.1);
      this.debugFolder
          .add(this, 'steeringAngle')
          .name('max_steering_angle')
          .min(0).max(Math.PI/2).step(0.01);
      this.debugFolder
          .add(this, 'steeringSpeed')
          .name('steering_animation_speed')
          .min(0.1).max(10).step(0.1);
    }
  }

}