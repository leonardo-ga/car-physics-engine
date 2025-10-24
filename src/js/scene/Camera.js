import * as THREE from 'three';
import Sizes from '../utils/sizes';

export default class Camera {

  constructor() {
    this.sizes = new Sizes();
    this.load();
  }

  load() {
    this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
    this.instance.position.set(0, 2, 10);
  }

}