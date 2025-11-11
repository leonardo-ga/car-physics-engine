import * as THREE from 'three';
import Base from '../Base';
import CarPhysics from '../physics/CarPhysics';

export default class Car {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;
        this.debug = this.base.debug;
        this.time = this.base.time;
        this.inputs = this.base.inputs;
        this.inputsActions = this.inputs.actions;

        this.loadDefaultParameters();
        this.physics = new CarPhysics({//TODO: add fwd/rwd/4x4 setting
            mass: 1400,
            wheelBase: this.chassisDimensions.wheelBase,
            cgToFront: (this.chassisDimensions.wheelBase / 2),
            cgHeight: 0.45,
            inertiaYaw: 1800,
            C_drag: 0.4257,
            C_rr: 12.8,
            engineForceMax: 7000,
            brakeForceMax: 13000,
            rearWheelRadius: this.wheelDimensions.radius,
            frontWheelRadius: this.wheelDimensions.radius,
            mu: 1.0,
            cornerStiffnessFront: 9000,
            cornerStiffnessRear: 9000,
            angle: this.angle //TODO: to redo: this makes CarPhysics point initially in correct direction
        });
        this.loadModel();
        this.loadHelpers();
        this.loadEvents();

        this.loadDebugger();
    }

    loadDefaultParameters() {
        // Chassis
        this.chassisDimensions = {
            width: 3.4,
            height: 1,
            depth: 2,
            wheelBase: 2.7
        }
        // Wheels
        this.wheelDimensions = {
            radius: 0.5,
            thickness: 0.5,
            precision: 8
        }
        // For steering animation
        // For steering: dynamic
        this.currentSteerAngle = 0;
        this.targetSteerAngle = 0;
        // For steering: static
        this.steerAngleMax = Math.PI / 6;
        this.steerSpeed = Math.PI;
        this.steerApproximation = 0.001;
        // Car direction
        this.angle = Math.PI/2;

        // For debugging
        this.useHelperArrows = true;
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

        this.model.rotateY(this.angle);

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
            //metalness: 0.1,
            //roughness: 0.8,
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

        this.flGroup.position.set(1, -0.5, -1);
        this.fl.rotateX(-Math.PI / 2);
        this.frGroup.position.set(1, -0.5, 1);
        this.fr.rotateX(-Math.PI / 2);
        this.rlGroup.position.set(-1, -0.5, -1);
        this.rl.rotateX(-Math.PI / 2);
        this.rrGroup.position.set(-1, -0.5, 1);
        this.rr.rotateX(-Math.PI / 2);
    }

    loadHelpers() {
        this.helper_velocity = new THREE.ArrowHelper();
        this.helper_velocity.setColor(0xff0000);    // Red
        this.scene.add(this.helper_velocity);
        this.helper_F_long = new THREE.ArrowHelper();
        this.helper_F_long.setColor(0x00ff00);      // Green
        this.scene.add(this.helper_F_long);
        this.helper_F_lat = new THREE.ArrowHelper();
        this.helper_F_lat.setColor(0x0000ff);       // Blue
        this.scene.add(this.helper_F_lat);
    }

    loadEvents() {
        // Inputs !keydown/keyup events
        // for single (non repeat) steering without updating on each frame
        this.inputs.on('!keydown', (key) => {
            if (key === 'ArrowLeft' || key === 'KeyA') this.targetSteerAngle += this.steerAngleMax;
            else if (key === 'ArrowRight' || key === 'KeyD') this.targetSteerAngle -= this.steerAngleMax;
        });
        this.inputs.on('keyup', (key) => {
            if (key === 'ArrowLeft' || key === 'KeyA') this.targetSteerAngle -= this.steerAngleMax;
            else if (key === 'ArrowRight' || key === 'KeyD') this.targetSteerAngle += this.steerAngleMax;
        });

        //TODO: remove
        //this.targetSteerAngle += this.steerAngleMax;
    }


    update() {
        this.turnWheels();
        this.physics.steerAngle = this.currentSteerAngle;

        this.physics.update();
        // Update car position
        this.model.position.x = this.physics.pos.x;
        this.model.position.y = this.physics.pos.y;
        this.model.position.z = this.physics.pos.z;
        // Update wheels spin
        this.fl.rotation.y += this.physics.frontWheelRotationMovement;
        this.fr.rotation.y += this.physics.frontWheelRotationMovement;
        this.rl.rotation.y += this.physics.rearWheelRotationMovement;
        this.rr.rotation.y += this.physics.rearWheelRotationMovement;
        // Update car orientation
        this.model.rotation.y = this.physics.angle;

        this.updateHelpers();
    }

    turnWheels() {
        if (!(this.currentSteerAngle === this.targetSteerAngle)) {
            const diff = this.targetSteerAngle - this.currentSteerAngle;
            if (Math.abs(diff) > this.steerApproximation) {
                const step = this.steerSpeed * this.time.delta;

                if (Math.abs(diff) < step) {
                    this.currentSteerAngle = this.targetSteerAngle;
                } else {
                    this.currentSteerAngle += Math.sign(diff) * step;
                }
            } else {
                this.currentSteerAngle = this.targetSteerAngle;
            }
            this.flGroup.rotation.y = this.currentSteerAngle;
            this.frGroup.rotation.y = this.currentSteerAngle;
        }
    }

    updateHelpers() {
        this.helper_velocity.visible = this.useHelperArrows;
        this.helper_F_long.visible = this.useHelperArrows;
        this.helper_F_lat.visible = this.useHelperArrows;
        const helper_force_scale = 0.01;
        if(this.useHelperArrows) {
            // VELOCITY
            const vel = this.physics.vel;
            const velLength = vel.length();

            if (velLength > 0.001) {
                this.helper_velocity.setDirection(vel.clone().normalize());
                this.helper_velocity.setLength(velLength);
                this.helper_velocity.position.copy(this.model.position);
            } else {
                this.helper_velocity.setLength(0);
            }

            // F long
            const F_long = this.physics.F_long;
            const F_long_length = F_long.length();

            if (F_long_length > 0.001) {
                this.helper_F_long.setDirection(F_long.clone().normalize());
                this.helper_F_long.setLength(helper_force_scale * F_long_length);
                this.helper_F_long.position.copy(this.model.position);
            } else {
                this.helper_F_long.setLength(0);
            }

            // F lat
            const F_lat = this.physics.F_lat;
            const F_lat_length = F_lat.length();

            if (F_lat_length > 0.001) {
                this.helper_F_lat.setDirection(F_lat.clone().normalize());
                this.helper_F_lat.setLength(helper_force_scale * F_lat_length);
                this.helper_F_lat.position.copy(this.model.position);
            } else {
                this.helper_F_lat.setLength(0);
            }
        }
    }

    loadDebugger() {
        if (this.debug.active) {
            // Physics debug folder
            this.debugFolder = this.debug.ui.addFolder('car_helpers');
            this.debugFolder
                .add(this, 'useHelperArrows')
            
        }
    }

}