import * as THREE from 'three';
import Base from '../Base';

export default class Car {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.time = this.base.time;
    this.keys = this.base.keys;
    this.keysPressed = this.keys.keysPressed;

    this.loadParameters();
    this.loadModel();
    this.loadEvents();
  }

  loadParameters() {
    /**
     * Model
     */
    this.speed = 0.3;
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
    //this.wheelSpinSpeed = this.speed / (2 * Math.PI * this.wheelDimensions.radius);
    this.wheelSpinSpeed = this.speed;
    // For steering
    this.steeringAngle = Math.PI/6;
    this.steeringSpeed = Math.PI;
    this.currentSteeringAngle = 0;
    this.targetSteeringAngle = 0;
    this.steerApproximation = 0.001;

    // other
    this.direction = {
      x: 1,
      y: 0,
      z: 0
    }
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
    // Keys keydown/keyup events
    this.keys.on('keydown', (key) => {
      if(key === "ArrowLeft") this.targetSteeringAngle += this.steeringAngle;
      else if(key === "ArrowRight") this.targetSteeringAngle -= this.steeringAngle;
    });
    this.keys.on('keyup', (key) => {
      if(key === "ArrowLeft") this.targetSteeringAngle -= this.steeringAngle;
      else if(key === "ArrowRight") this.targetSteeringAngle += this.steeringAngle;
    });
  }

  turnWheels() {
    const diff = this.targetSteeringAngle - this.currentSteeringAngle;
    if (Math.abs(diff) > this.steerApproximation) {
      const step = this.steeringSpeed * this.time.delta / 1000;

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

  move(dx, dy, dz, dir) {
    // Model movement
    this.model.position.x += dx;
    this.model.position.y += dy;
    this.model.position.z += dz;
    // Wheel spin
    this.fl.rotation.x += dir * this.wheelSpinSpeed;
    this.fr.rotation.x += dir * this.wheelSpinSpeed;
    this.rl.rotation.x += dir * this.wheelSpinSpeed;
    this.rr.rotation.x += dir * this.wheelSpinSpeed;
  }

  update() {//TODO: see what I can do about the '-' sign
    if (!this.model) {
      return;
    }
    // For drive and reverse
    const turnRotation = this.flGroup.rotation.y * this.speed / this.turnRotationLoss;
    if (this.keysPressed.ArrowUp) {
      this.model.rotation.y += turnRotation;
      this.move(-Math.sin(this.model.rotation.y) * this.speed, 0 , -Math.cos(this.model.rotation.y) * this.speed, -1)
    }
    if (this.keysPressed.ArrowDown) {
      this.model.rotation.y -= turnRotation;
      this.move(Math.sin(this.model.rotation.y) * this.speed, 0 , Math.cos(this.model.rotation.y) * this.speed, 1)
    }
    // For turning
    if (!(this.currentSteeringAngle === this.targetSteeringAngle)) {
      this.turnWheels();
    }
  }

}