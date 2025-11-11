import * as THREE from 'three'
import Sizes from './utils/Sizes';
import Time from './utils/Time';
import Inputs from './utils/Inputs';
import Renderer from './scene/Renderer';
import Camera from './scene/Camera';
import World from './models/World';
import Debug from './utils/Debug'
import SafeMath from './utils/SafeMath';

// Singleton
let instance = null;

export default class Base {

    constructor(canvas) {

        // Singleton
        if(instance) {
            return instance;
        }
        instance = this;

        // Global access
        window.experience = this;

        // Options
        this.canvas = canvas;
        this.debug = new Debug();
        this.sizes = new Sizes();
        this.time = new Time();
        this.inputs = new Inputs();
        this.SafeMath = new SafeMath();

        this.scene = new THREE.Scene();
        this.world = new World();
        this.camera = new Camera();
        this.renderer = new Renderer();

        // Axes Helper
        //const axesHelper = new THREE.AxesHelper( 5 );
        //scene.add( axesHelper );

        // Logics
        this.loadEvents();
    }

    loadEvents() {
        // Sizes resize event
        this.sizes.on('resize', () => {
            this.resize();  
        })

        // Time tick event
        this.time.on('tick', () => {
            this.update();
        });
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        this.camera.update();
        this.world.update();
        this.debug.update();
        this.renderer.update();
    }

    destroy() {
        this.sizes.off('resize');
        this.time.off('tick');

        // Traverse the whole scene
        this.scene.traverse((child) => {
            if(child instanceof THREE.Mesh) {
                child.geometry.dispose();

                for(const key in child.material) {
                    const value = child.material[key];

                    if(value && typeof value.dispose === 'function') {
                        value.dispose();
                    }
                }
            }
        });
        this.camera.controls.dispose();
        this.renderer.instance.dispose();

        if(this.debug.active) {
            this.debug.ui.destroy();
        }
        // What is left is the canvas with last render...
    }

}