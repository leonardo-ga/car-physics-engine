import * as THREE from 'three';
import Base from '../Base';

export default class Renderer {

    constructor() {
        this.base = new Base();
        this.canvas = this.base.canvas;
        this.sizes = this.base.sizes;
        this.scene = this.base.scene;
        this.camera = this.base.camera;

        this.setInstance();
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        //this.instance.useLegacyLights = false
        //this.instance.toneMapping = THREE.CineonToneMapping
        //this.instance.toneMappingExposure = 1.75
        //this.instance.shadowMap.enabled = true
        //this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        //this.instance.setClearColor('#211d20')
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    update() {
        this.instance.render(this.scene, this.camera.instance);
    }

}