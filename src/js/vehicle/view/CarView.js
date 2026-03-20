import * as THREE from 'three';

export default class CarView {

    constructor({
        scene,
        debug,
        initialAngle,
        chassisDimensions,
        wheelDimensions,
        wheelOffsets,
        appearance,
        helperForceScale,
        useHelperArrows
    }) {
        this.scene = scene;
        this.debug = debug;

        this.initialAngle = initialAngle;
        this.chassisDimensions = chassisDimensions;
        this.wheelDimensions = wheelDimensions;
        this.wheelOffsets = wheelOffsets;
        this.appearance = appearance;
        this.helperForceScale = helperForceScale;
        this.useHelperArrows = useHelperArrows;

        this.loadModel();
        this.loadHelpers();
        this.loadDebugger();
    }

    loadModel() {
        this.loadChassis();
        this.loadWheels();

        this.model = new THREE.Group();
        this.model.add(this.chassis);
        this.model.add(this.flGroup);
        this.model.add(this.frGroup);
        this.model.add(this.rlGroup);
        this.model.add(this.rrGroup);

        this.model.position.set(0, 1, 0);
        this.model.rotateY(this.initialAngle);

        this.scene.add(this.model);
    }

    loadChassis() {
        const chassisGeometry = new THREE.BoxGeometry(
            this.chassisDimensions.width,
            this.chassisDimensions.height,
            this.chassisDimensions.depth
        );
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: this.appearance.chassisColor,
            wireframe: this.appearance.chassisWireframe
        });

        this.chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        this.chassis.position.set(0, 0, 0);
    }

    loadWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(
            this.wheelDimensions.radius,
            this.wheelDimensions.radius,
            this.wheelDimensions.thickness,
            this.wheelDimensions.precision
        );
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: this.appearance.wheelColor,
            wireframe: this.appearance.wheelWireframe
        });

        this.fl = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.fr = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rl = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rr = new THREE.Mesh(wheelGeometry, wheelMaterial);

        this.flGroup = this.createWheelGroup(this.fl);
        this.frGroup = this.createWheelGroup(this.fr);
        this.rlGroup = this.createWheelGroup(this.rl);
        this.rrGroup = this.createWheelGroup(this.rr);

        this.flGroup.position.set(this.wheelOffsets.frontX, this.wheelOffsets.y, this.wheelOffsets.leftZ);
        this.frGroup.position.set(this.wheelOffsets.frontX, this.wheelOffsets.y, this.wheelOffsets.rightZ);
        this.rlGroup.position.set(this.wheelOffsets.rearX, this.wheelOffsets.y, this.wheelOffsets.leftZ);
        this.rrGroup.position.set(this.wheelOffsets.rearX, this.wheelOffsets.y, this.wheelOffsets.rightZ);

        this.fl.rotateX(-Math.PI / 2);
        this.fr.rotateX(-Math.PI / 2);
        this.rl.rotateX(-Math.PI / 2);
        this.rr.rotateX(-Math.PI / 2);
    }

    createWheelGroup(wheelMesh) {
        const wheelGroup = new THREE.Group();
        const axisHelper = new THREE.AxesHelper(1);
        wheelGroup.add(wheelMesh);
        wheelGroup.add(axisHelper);
        return wheelGroup;
    }

    loadHelpers() {
        this.helperVelocity = new THREE.ArrowHelper();
        this.helperVelocity.setColor(0xff0000);
        this.scene.add(this.helperVelocity);

        this.helperLongitudinalForce = new THREE.ArrowHelper();
        this.helperLongitudinalForce.setColor(0x00ff00);
        this.scene.add(this.helperLongitudinalForce);

        this.helperLateralForce = new THREE.ArrowHelper();
        this.helperLateralForce.setColor(0x0000ff);
        this.scene.add(this.helperLateralForce);
    }

    update(physics, steerAngle) {
        this.setSteerAngle(steerAngle);

        this.model.position.copy(physics.pos);
        this.model.rotation.y = physics.angle;

        this.fl.rotation.y += physics.frontWheelRotationMovement;
        this.fr.rotation.y += physics.frontWheelRotationMovement;
        this.rl.rotation.y += physics.rearWheelRotationMovement;
        this.rr.rotation.y += physics.rearWheelRotationMovement;

        this.updateHelpers(physics);
    }

    setSteerAngle(steerAngle) {
        this.flGroup.rotation.y = steerAngle;
        this.frGroup.rotation.y = steerAngle;
    }

    updateHelpers(physics) {
        this.helperVelocity.visible = this.useHelperArrows;
        this.helperLongitudinalForce.visible = this.useHelperArrows;
        this.helperLateralForce.visible = this.useHelperArrows;

        if (!this.useHelperArrows) {
            return;
        }

        this.updateArrowHelper(this.helperVelocity, physics.vel, this.model.position, 1);
        this.updateArrowHelper(this.helperLongitudinalForce, physics.F_long, this.model.position, this.helperForceScale);
        this.updateArrowHelper(this.helperLateralForce, physics.F_lat, this.model.position, this.helperForceScale);
    }

    updateArrowHelper(helper, vector, origin, scale) {
        const vectorLength = vector.length();

        if (vectorLength > 0.001) {
            helper.setDirection(vector.clone().normalize());
            helper.setLength(vectorLength * scale);
            helper.position.copy(origin);
        } else {
            helper.setLength(0);
        }
    }

    loadDebugger() {
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('car_helpers');
            this.debugFolder.add(this, 'useHelperArrows');
        }
    }
}
