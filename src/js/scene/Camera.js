import * as THREE from 'three';
import Base from '../Base';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class Camera {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.world = this.base.world;
    this.car = this.world.car;
    this.sizes = this.base.sizes;
    this.keys = this.base.keys;

    this.loadParameters();
    this.loadCamera();
    // For Orbit Controls
    this.setOrbitControls();
  }

  loadParameters() {
    this.followOffset = new THREE.Vector3(0, 10, 10);
    this.desiredPos = new THREE.Vector3();
    this.carWorldPos = new THREE.Vector3();
    this.lerpFactor = 0.1;
    this.isStillMoving = false;
    this.cameraPosApproximation = 0.1;
  }

  loadCamera() {
    this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
    this.instance.position.set(0, 10, 10);
    this.instance.lookAt(this.world.car.model.position);
    this.scene.add(this.instance);
  }

  setOrbitControls() {// Orbit controls setup
    this.controls = new OrbitControls(this.instance, this.base.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    // Follow (and look at) car
    let isMoving = this.keys.keysPressed.ArrowUp || this.keys.keysPressed.ArrowDown;
    this.car.model.getWorldPosition(this.carWorldPos);
    if (isMoving || this.isStillMoving) {
      // Compute desired camera position (position only)
      this.desiredPos.copy(this.carWorldPos).add(this.followOffset);

      // Smoothly move the camera toward that position
      this.instance.position.lerp(this.desiredPos, this.lerpFactor);

      // Smoothly move the controls target toward the box
      this.controls.target.lerp(this.carWorldPos, this.lerpFactor);

      // Calculate if camera is in desired position
      this.isStillMoving = !(this.instance.position.distanceTo(this.desiredPos) < this.cameraPosApproximation);
    }

    // OrbitControls update
    this.controls.update();
  }

}