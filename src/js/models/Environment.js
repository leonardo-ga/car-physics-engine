import * as THREE from 'three';
import Base from '../Base';

export default class Environment {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;
        this.debug = this.base.debug;

        this.setAmbientLight();
        //this.setSunLight();

        this.loadDebugger();
    }

    setAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        this.pointLight = new THREE.PointLight(0xffffff, 1);
        this.pointLight.position.set(5, 5, 5);
        this.scene.add(this.pointLight);
    }

    setSunLight() {
        this.sunLight = new THREE.DirectionalLight('#ffffff', 4)
        this.sunLight.castShadow = true
        this.sunLight.shadow.camera.far = 15
        this.sunLight.shadow.mapSize.set(1024, 1024)
        this.sunLight.shadow.normalBias = 0.05
        this.sunLight.position.set(3.5, 2, - 1.25)
        this.scene.add(this.sunLight)
    }

    loadDebugger() {
        if(this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('environment');

            // ambient and point light debugger
            this.debugFolder
                .add(this.ambientLight, 'intensity')
                .name('ambient_light_intensity')
                .min(0).max(10).step(0.001);

            // sun light debugger
            /*this.debugFolder
                .add(this.sunLight, 'intensity')
                .name('sunLightIntensity')
                .min(0).max(10).step(0.001);
            this.debugFolder
                .add(this.sunLight.position, 'x')
                .name('sunLightX')
                .min(-5).max(5).step(0.001);
            this.debugFolder
                .add(this.sunLight.position, 'y')
                .name('sunLightY')
                .min(-5).max(5).step(0.001);
            this.debugFolder
                .add(this.sunLight.position, 'z')
                .name('sunLightZ')
                .min(-5).max(5).step(0.001);*/
        }
    }

}