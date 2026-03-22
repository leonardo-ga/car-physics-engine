import * as THREE from 'three';
import createCarSkin, { getAvailableCarSkins } from './skins/createCarSkin';

export default class CarView {

    constructor({
        scene,
        debug,
        initialAngle,
        visualModel,
        chassisDimensions,
        wheelDimensions,
        wheelOffsets,
        appearance,
        helperConfig
    }) {
        this.scene = scene;
        this.debug = debug;

        this.initialAngle = initialAngle;
        this.visualModel = visualModel;
        this.chassisDimensions = chassisDimensions;
        this.wheelDimensions = wheelDimensions;
        this.wheelOffsets = wheelOffsets;
        this.appearance = appearance;
        this.helperConfig = helperConfig;
        this.useHelperArrows = helperConfig.enabled;
        this.showWheelAxes = true;
        this.wheelAxisHelpers = [];
        this.defaultWheelAppearance = {
            color: this.appearance.wheelColor,
            wireframe: this.appearance.wheelWireframe,
            roughness: 0.92,
            metalness: 0.05
        };

        this.loadModel();
        this.loadHelpers();
        this.loadDebugger();
    }

    loadModel() {
        this.loadWheels();

        this.model = new THREE.Group();
        this.bodyRoot = new THREE.Group();
        this.model.add(this.bodyRoot);
        this.model.add(this.flGroup);
        this.model.add(this.frGroup);
        this.model.add(this.rlGroup);
        this.model.add(this.rrGroup);

        this.model.position.set(0, 1, 0);
        this.model.rotateY(this.initialAngle);

        this.scene.add(this.model);
        this.setVisualModel(this.visualModel);
    }

    setVisualModel(modelId) {
        const { skinId, group, wheelAppearance } = createCarSkin(modelId, {
            chassisDimensions: this.chassisDimensions,
            wheelDimensions: this.wheelDimensions,
            appearance: this.appearance
        });

        if (this.activeBodyGroup) {
            this.bodyRoot.remove(this.activeBodyGroup);
            this.disposeGroup(this.activeBodyGroup);
        }

        this.activeBodyGroup = group;
        this.visualModel = skinId;
        this.bodyRoot.add(this.activeBodyGroup);
        this.applyWheelAppearance(wheelAppearance);

        if (this.debugState) {
            this.debugState.visualModel = skinId;
        }
    }

    loadWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(
            this.wheelDimensions.radius,
            this.wheelDimensions.radius,
            this.wheelDimensions.thickness,
            this.wheelDimensions.precision
        );
        const wheelMaterial = new THREE.MeshStandardMaterial(this.defaultWheelAppearance);
        this.wheelMaterial = wheelMaterial;

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
        axisHelper.visible = this.showWheelAxes;
        this.wheelAxisHelpers.push(axisHelper);
        wheelGroup.add(wheelMesh);
        wheelGroup.add(axisHelper);
        return wheelGroup;
    }

    setWheelAxesVisible(isVisible) {
        this.showWheelAxes = isVisible;
        this.wheelAxisHelpers.forEach((axisHelper) => {
            axisHelper.visible = isVisible;
        });
    }

    applyWheelAppearance(overrides = null) {
        if (!this.wheelMaterial) {
            return;
        }

        const wheelAppearance = {
            ...this.defaultWheelAppearance,
            ...(overrides || {})
        };

        this.wheelMaterial.color.setHex(wheelAppearance.color);
        this.wheelMaterial.wireframe = wheelAppearance.wireframe;
        this.wheelMaterial.roughness = wheelAppearance.roughness;
        this.wheelMaterial.metalness = wheelAppearance.metalness;
        this.wheelMaterial.needsUpdate = true;
    }

    disposeGroup(group) {
        group.traverse((child) => {
            if (!child.isMesh) {
                return;
            }

            if (child.geometry) {
                child.geometry.dispose();
            }

            if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
                return;
            }

            if (child.material) {
                child.material.dispose();
            }
        });
    }

    loadHelpers() {
        this.helperVelocity = new THREE.ArrowHelper();
        this.helperVelocity.setColor(0xff0000);
        this.helperVelocity.userData.displayVector = new THREE.Vector3();
        this.scene.add(this.helperVelocity);

        this.helperLongitudinalForce = new THREE.ArrowHelper();
        this.helperLongitudinalForce.setColor(0x00ff00);
        this.helperLongitudinalForce.userData.displayVector = new THREE.Vector3();
        this.scene.add(this.helperLongitudinalForce);

        this.helperLateralForce = new THREE.ArrowHelper();
        this.helperLateralForce.setColor(0x0000ff);
        this.helperLateralForce.userData.displayVector = new THREE.Vector3();
        this.scene.add(this.helperLateralForce);
    }

    update(renderState, delta) {
        this.setSteerAngle(renderState.steerAngle);

        this.model.position.copy(renderState.pos);
        this.model.rotation.y = renderState.angle;

        this.fl.rotation.y = renderState.frontWheelSpinAngle;
        this.fr.rotation.y = renderState.frontWheelSpinAngle;
        this.rl.rotation.y = renderState.rearWheelSpinAngle;
        this.rr.rotation.y = renderState.rearWheelSpinAngle;

        this.updateHelpers(renderState, delta);
    }

    setSteerAngle(steerAngle) {
        this.flGroup.rotation.y = steerAngle;
        this.frGroup.rotation.y = steerAngle;
    }

    updateHelpers(physics, delta) {
        this.helperVelocity.visible = this.useHelperArrows;
        this.helperLongitudinalForce.visible = this.useHelperArrows;
        this.helperLateralForce.visible = this.useHelperArrows;

        if (!this.useHelperArrows) {
            return;
        }

        this.updateArrowHelper(this.helperVelocity, physics.vel, this.model.position, {
            scale: this.helperConfig.velocityScale,
            deadzone: this.helperConfig.velocityDeadzone,
            maxLength: this.helperConfig.maxVelocityLength
        }, delta);
        this.updateArrowHelper(this.helperLongitudinalForce, physics.F_long, this.model.position, {
            scale: this.helperConfig.forceScale,
            deadzone: this.helperConfig.forceDeadzone,
            maxLength: this.helperConfig.maxForceLength
        }, delta);
        this.updateArrowHelper(this.helperLateralForce, physics.F_lat, this.model.position, {
            scale: this.helperConfig.forceScale,
            deadzone: this.helperConfig.forceDeadzone,
            maxLength: this.helperConfig.maxForceLength
        }, delta);
    }

    updateArrowHelper(helper, vector, origin, settings, delta) {
        const displayVector = helper.userData.displayVector;
        const targetVector =
            vector.length() > settings.deadzone
                ? vector
                : new THREE.Vector3(0, 0, 0);
        const smoothingAlpha = 1 - Math.exp(-this.helperConfig.smoothing * delta);

        displayVector.lerp(targetVector, smoothingAlpha);

        const vectorLength = displayVector.length();
        const displayLength = Math.min(vectorLength * settings.scale, settings.maxLength);

        if (displayLength > 0.001) {
            helper.setDirection(displayVector.clone().normalize());
            helper.setLength(displayLength);
            helper.position.copy(origin);
        } else {
            helper.setLength(0);
            displayVector.set(0, 0, 0);
        }
    }

    loadDebugger() {
        if (this.debug.active) {
            this.debugState = {
                visualModel: this.visualModel
            };

            this.visualDebugFolder = this.debug.ui.addFolder('car_visuals');
            this.visualDebugFolder
                .add(this.debugState, 'visualModel', getAvailableCarSkins())
                .name('car_skin')
                .onChange((value) => {
                    this.setVisualModel(value);
                });
            this.visualDebugFolder
                .add(this, 'showWheelAxes')
                .name('show_wheel_axes')
                .onChange((value) => {
                    this.setWheelAxesVisible(value);
                });

            this.debugFolder = this.debug.ui.addFolder('car_helpers');
            this.debugFolder.add(this, 'useHelperArrows');
            this.debugFolder
                .add(this.helperConfig, 'velocityScale')
                .name('velocity_scale')
                .min(0.05).max(2).step(0.01);
            this.debugFolder
                .add(this.helperConfig, 'forceScale')
                .name('force_scale')
                .min(0.0001).max(0.002).step(0.00005);
            this.debugFolder
                .add(this.helperConfig, 'smoothing')
                .name('helper_smoothing')
                .min(1).max(30).step(0.5);
        }
    }
}
