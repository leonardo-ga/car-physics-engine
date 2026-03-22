import * as THREE from 'three';

export default class CarRenderStateInterpolator {

    constructor(physics) {
        this.previousState = this.createRenderState();
        this.currentState = this.createRenderState();
        this.interpolatedState = this.createRenderState();

        this.reset(physics);
    }

    createRenderState() {
        return {
            pos: new THREE.Vector3(),
            vel: new THREE.Vector3(),
            F_long: new THREE.Vector3(),
            F_lat: new THREE.Vector3(),
            angle: 0,
            steerAngle: 0,
            frontWheelSpinAngle: 0,
            rearWheelSpinAngle: 0
        };
    }

    copyState(target, source) {
        target.pos.copy(source.pos);
        target.vel.copy(source.vel);
        target.F_long.copy(source.F_long);
        target.F_lat.copy(source.F_lat);
        target.angle = source.angle;
        target.steerAngle = source.steerAngle;
        target.frontWheelSpinAngle = source.frontWheelSpinAngle;
        target.rearWheelSpinAngle = source.rearWheelSpinAngle;
    }

    syncFromPhysics(target, physics) {
        target.pos.copy(physics.pos);
        target.vel.copy(physics.vel);
        target.F_long.copy(physics.F_long);
        target.F_lat.copy(physics.F_lat);
        target.angle = physics.angle;
        target.steerAngle = physics.steerAngle;
        target.frontWheelSpinAngle = physics.frontWheelSpinAngle;
        target.rearWheelSpinAngle = physics.rearWheelSpinAngle;
    }

    capturePrevious(physics) {
        this.syncFromPhysics(this.previousState, physics);
    }

    captureCurrent(physics) {
        this.syncFromPhysics(this.currentState, physics);
    }

    reset(physics) {
        this.syncFromPhysics(this.currentState, physics);
        this.copyState(this.previousState, this.currentState);
    }

    get(alpha = 1) {
        const clampedAlpha = THREE.MathUtils.clamp(alpha, 0, 1);

        if (clampedAlpha >= 0.999) {
            return this.currentState;
        }

        this.interpolatedState.pos.copy(this.previousState.pos).lerp(this.currentState.pos, clampedAlpha);
        this.interpolatedState.vel.copy(this.previousState.vel).lerp(this.currentState.vel, clampedAlpha);
        this.interpolatedState.F_long.copy(this.previousState.F_long).lerp(this.currentState.F_long, clampedAlpha);
        this.interpolatedState.F_lat.copy(this.previousState.F_lat).lerp(this.currentState.F_lat, clampedAlpha);
        this.interpolatedState.angle = THREE.MathUtils.lerp(this.previousState.angle, this.currentState.angle, clampedAlpha);
        this.interpolatedState.steerAngle = THREE.MathUtils.lerp(
            this.previousState.steerAngle,
            this.currentState.steerAngle,
            clampedAlpha
        );
        this.interpolatedState.frontWheelSpinAngle = THREE.MathUtils.lerp(
            this.previousState.frontWheelSpinAngle,
            this.currentState.frontWheelSpinAngle,
            clampedAlpha
        );
        this.interpolatedState.rearWheelSpinAngle = THREE.MathUtils.lerp(
            this.previousState.rearWheelSpinAngle,
            this.currentState.rearWheelSpinAngle,
            clampedAlpha
        );

        return this.interpolatedState;
    }
}
