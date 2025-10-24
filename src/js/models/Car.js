import * as THREE from 'three';

export default class Car {

  constructor() {
    this.loadModel();

    this.speed = 0.03;
    this.turnSpeed = 0.1;
    this.wheelSpin = 5 * this.speed;
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
  }

  loadChassis() {
    // Chassis
    const chassisGeometry = new THREE.BoxGeometry(2, 0.5, 3);
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      wireframe: true
    });
    this.chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    this.chassis.position.set(0, 0, 0);
  }

  loadWheels() {
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
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

    this.flGroup.position.set(-1, 0, -1);
    this.fl.rotateZ(Math.PI/2);
    this.frGroup.position.set(1, 0, -1);
    this.fr.rotateZ(-Math.PI/2);
    this.rlGroup.position.set(-1, 0, 1);
    this.rl.rotateZ(Math.PI/2);
    this.rrGroup.position.set(1, 0, 1);
    this.rr.rotateZ(-Math.PI/2);
  }

  turnWheels(keysPressed, key) {
    let dir = 0;
    if ((key === "ArrowLeft" && keysPressed[key])
      || (key === "ArrowRight" && !keysPressed[key])) {
      dir = 1;
    } else if ((key === "ArrowLeft" && !keysPressed[key])
              || (key === "ArrowRight" && keysPressed[key])) {
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

  updateCar(keysPressed) {//TODO: see what I can do about the '-' sign
    if (!this.model) {
      return;
    }
    if (keysPressed.ArrowUp) {
      this.model.rotation.y += this.flGroup.rotation.y * this.speed;
      this.move(-Math.sin(this.model.rotation.y) * this.speed, 0 , -Math.cos(this.model.rotation.y) * this.speed, -1)
    }
    if (keysPressed.ArrowDown) {
      this.model.rotation.y -= this.flGroup.rotation.y * this.speed;
      this.move(Math.sin(this.model.rotation.y) * this.speed, 0 , Math.cos(this.model.rotation.y) * this.speed, 1)
    }
    if (keysPressed.ArrowLeft) {
      //this.model.rotation.y += this.turnSpeed;
    }
    if (keysPressed.ArrowRight) {
      //this.model.rotation.y -= this.turnSpeed;
    }
  }

}