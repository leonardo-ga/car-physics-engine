import * as THREE from 'three'
import Base from '../Base';

export default class Floor {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;
        this.debug = this.base.debug;

        this.setGeometry();
        this.setMaterial();
        this.setMesh();
        this.loadDebugger();
    }

    setGeometry() {
        this.geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    }

    setMaterial() {
        this.material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            wireframe: true
        });
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.x = - Math.PI * 0.5
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    loadDebugger() {
        if(this.debug.active) {
        this.debugFolder = this.debug.ui.addFolder('floor');

        this.debugFolder
            .add(this.material, 'wireframe');
        }
    }

}