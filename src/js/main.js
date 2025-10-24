import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Car from './models/Car';
import Camera from './scene/Camera';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight };

// Scene
const scene = new THREE.Scene();

// Axes Helper
//const axesHelper = new THREE.AxesHelper( 5 );
//scene.add( axesHelper );

// Plane
const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    wireframe: false
});
const plane = new THREE.Mesh(geometry, material);
plane.position.set(0, 0, 0);
plane.rotation.x = Math.PI * 1.5;
scene.add(plane);

// Car
const car = new Car();
//car.model.rotation.y = -Math.PI/2;
scene.add(car.model);

// Arrow key controls
const keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
window.addEventListener('keydown', (e) => {
    if (!e.repeat) {
        console.log('Initial press: ' + e.key)
        if (keysPressed.hasOwnProperty(e.code)) {
            keysPressed[e.code] = true;
        }
        car.turnWheels(keysPressed, e.key);
    } else {
        console.log('Held key repeating: ' + e.key)
    }
});
window.addEventListener('keyup', (e) => {
    if (keysPressed.hasOwnProperty(e.code)) {
        keysPressed[e.code] = false;
    }
    car.turnWheels(keysPressed, e.key);
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Camera
const camera = new Camera();
scene.add(camera.instance);

// Controls
const controls = new OrbitControls(camera.instance, canvas);
controls.enableDamping = true

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Track scroll
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// Animate
function animate() {
    requestAnimationFrame(animate);

    // Update orbit controls
    controls.update()

    //update Car controls
    car.updateCar(keysPressed);

    renderer.render(scene, camera.instance);
}

animate();

// Resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.instance.aspect = sizes.width / sizes.height;
    camera.instance.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
});
