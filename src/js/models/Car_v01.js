import * as THREE from 'three';
import Base from '../Base';
import CarPhysics_v02 from '../physics/CarPhysics_v02';
import CarPhysics_v01 from '../physics/CarPhysics_v01';

/**
 * @deprecated The class Car_v01 was a basic Car model that has been replaced.
 */
export default class Car_v01 {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.debug = this.base.debug;
    this.time = this.base.time;
    this.inputs = this.base.inputs;
    this.inputsActions = this.inputs.actions;

    this.carPhysics_v01 = new CarPhysics_v01();
    this.carPhysics_v02 = new CarPhysics_v02();

    this.loadDefaultParameters();
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
    /**
     * THIS IS TOO MUCH!!!!!!!!!
     */
    this.turnRotationLoss = 5;
    // For steering: dynamic
    this.currentSteeringAngle = 0;
    this.targetSteeringAngle = 0;
    // For steering: static
    this.steeringAngle = Math.PI / 6;
    this.steeringSpeed = Math.PI;
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
    let speed = 0;
    if(this.isRealPhysics) {
      this.carPhysics_v02.update();
      speed = this.carPhysics_v02.speed;
    } else {
      this.carPhysics_v01.update();
      speed = this.carPhysics_v01.speed;
    }
    // Calculate distance
    const distance = speed * this.time.delta;
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

      this.carPhysics_v01.loadDebugger(this.debugFolder);
      this.carPhysics_v02.loadDebugger(this.debugFolder);
      this.updateCarFolder();
    }
  }

  updateCarFolder(isRealPhysics) {
      // Restore parameter values
      this.carPhysics_v01.initializeCurrentParameters();
      this.carPhysics_v02.initializeCurrentParameters();
    if (isRealPhysics) {
      // Show physics folder, hide normal one
      this.carPhysics_v01.arcadeDebugFolder.domElement.style.display = 'none';
      this.carPhysics_v02.physicsDebugFolder.domElement.style.display = '';
    } else {
      // Show normal folder, hide physics one
      this.carPhysics_v01.arcadeDebugFolder.domElement.style.display = '';
      this.carPhysics_v02.physicsDebugFolder.domElement.style.display = 'none';    }
  }

}