import * as THREE from 'three';
import Base from '../Base';

export default class Car {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.keys = this.base.keys;
    this.keysPressed = this.keys.keysPressed;

    this.loadParameters();
    this.loadModel();

    // Keys keydown/keyup events
    this.keys.on('keydown', (key) => {
        this.turnWheels(key);
    });
    this.keys.on('keyup', (key) => {
        this.turnWheels(key);
    });
  }

  loadParameters() {
    // model
    this.speed = 0.3;
    this.turnRotationLoss = 5;

    // chassis
    this.chassisDimensions = {
      width: 2,
      height: 1,
      depth: 3,
    }

    // wheels
    this.wheelDimensions = {
      radius: 0.5,
      thickness: 0.5,
      precision: 8
    }
    //this.wheelSpin = this.speed / (2 * Math.PI * this.wheelDimensions.radius);
    this.wheelSpin = this.speed;

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

  turnWheels(key) {
    let dir = 0;
    if ((key === "ArrowLeft" && this.keysPressed[key])
      || (key === "ArrowRight" && !this.keysPressed[key])) {
      dir = 1;
    } else if ((key === "ArrowLeft" && !this.keysPressed[key])
              || (key === "ArrowRight" && this.keysPressed[key])) {
      dir = -1;
    }
    else {
      console.log("A non-turning key has ben pressed.");
    }
    this.flGroup.rotateY(dir * Math.PI/6);
    this.frGroup.rotateY(dir * Math.PI/6);
  }

  move(dx, dy, dz, dir) {
    this.model.position.x += dx;
    this.model.position.y += dy;
    this.model.position.z += dz;
    //this.speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
    //this.wheelSpin = this.speed * 5;
    this.fl.rotation.x += dir * this.wheelSpin;
    this.fr.rotation.x += dir * this.wheelSpin;
    this.rl.rotation.x += dir * this.wheelSpin;
    this.rr.rotation.x += dir * this.wheelSpin;
  }

  update() {//TODO: see what I can do about the '-' sign
    if (!this.model) {
      return;
    }
    const turnRotation = this.flGroup.rotation.y * this.speed / this.turnRotationLoss;
    if (this.keysPressed.ArrowUp) {
      this.model.rotation.y += turnRotation;
      this.move(-Math.sin(this.model.rotation.y) * this.speed, 0 , -Math.cos(this.model.rotation.y) * this.speed, -1)
    }
    if (this.keysPressed.ArrowDown) {
      this.model.rotation.y -= turnRotation;
      this.move(Math.sin(this.model.rotation.y) * this.speed, 0 , Math.cos(this.model.rotation.y) * this.speed, 1)
    }
    if (this.keysPressed.ArrowLeft) {
      //this.model.rotation.y += this.turnSpeed;
    }
    if (this.keysPressed.ArrowRight) {
      //this.model.rotation.y -= this.turnSpeed;
    }
  }

}