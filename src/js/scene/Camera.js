import * as THREE from 'three';
import Sizes from '../utils/Sizes';
import Base from '../Base';
import World from '../models/World';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export default class Camera {

  constructor() {
    this.base = new Base();
    this.scene = this.base.scene;
    this.world = this.base.world;
    this.sizes = this.base.sizes;

    this.load();
    // Per Orbit Controls
    //this.setOrbitControls();
  }

  load() {
    this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
    this.instance.position.set(0, 10, 10);
    this.instance.lookAt(this.world.car.model.position);
    this.scene.add(this.instance);
  }

  setOrbitControls() {// Orbit controls setup
        this.controls = new OrbitControls(this.instance, this.base.canvas);
        this.controls.enableDamping = true;
    }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    // Follow (and look at) car
    this.instance.position.set(this.world.car.model.position.x,
                                this.world.car.model.position.y + 10,
                                this.world.car.model.position.z + 10);
    this.instance.lookAt(this.world.car.model.position);

    // OrbitControls update
    //this.controls.update();
    //this.controls.target.copy(this.world.car.model.position);
  }

}