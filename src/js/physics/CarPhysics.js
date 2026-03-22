import * as THREE from 'three';
import {
    setStaticLoads,
    stabilizeAtLowSpeed,
    syncWorldVelocity,
    updateWheelState
} from './chassis/carChassis';
import {
    updateTransmissionState
} from './drivetrain/carDrivetrain';
import { stepDynamicSingleTrackSubstep } from './dynamics/dynamicSingleTrack';

export default class CarPhysics {

    constructor(params = {}) {
        const safeMath = params.safeMath || {};

        this.safeMath = {
            cos: typeof safeMath.cos === 'function' ? safeMath.cos.bind(safeMath) : Math.cos,
            sin: typeof safeMath.sin === 'function' ? safeMath.sin.bind(safeMath) : Math.sin
        };

        this.loadDefaultParameters(params);
        this.initializeCurrentParameters();
    }

    loadDefaultParameters(params) {
        this.mass = params.mass || 1200;
        this.rearWheelMass = params.rearWheelMass || 75;
        this.frontWheelMass = params.frontWheelMass || 75;
        this.wheelBase = params.wheelBase || 2.6;
        this.cgToFront = params.cgToFront || 1.3;
        this.cgToRear = this.wheelBase - this.cgToFront;
        this.cgHeight = params.cgHeight || 0.45;
        this.inertiaYaw = params.inertiaYaw || 1500;

        this.C_drag = params.C_drag || 0.4257;
        this.C_rr = params.C_rr || 12.8;
        this.engineForceMax = params.engineForceMax || 6000;
        this.brakeForceMax = params.brakeForceMax || 10000;
        this.brakeBiasFront = params.brakeBiasFront || 0.62;
        this.g = 9.81;

        this.idleRPM = 1000;
        this.minRPM = 2500;
        this.maxRPM = 5500;
        this.modelId = params.modelId || 'dynamic-single-track';
        this.currentGear = 1;
        this.maxGear = 6;
        this.shiftCooldownTime = params.shiftCooldownTime || 0.35;
        this.shiftCooldownRemaining = 0;
        this.gearRatios = [-2.90, 2.66, 1.78, 1.30, 1.00, 0.74, 0.50];
        this.diffRatio = 3.42;
        this.transmissionEfficiency = 0.7;

        this.rearWheelRadius = params.rearWheelRadius || 0.34;
        this.frontWheelRadius = params.frontWheelRadius || 0.34;
        this.mu = params.mu || 1.0;
        this.tractionCurveSlope = params.tractionCurveSlope || 16.5;
        this.cornerStiffnessFront = params.cornerStiffnessFront || 40000;
        this.cornerStiffnessRear = params.cornerStiffnessRear || 40000;
        this.maxSteer = params.maxSteer || 0.6;
        this.launchSubsteps = params.launchSubsteps || 8;

        this.pos = new THREE.Vector3(0, 1, 0);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.angle = params.angle || 0;
        this.omegaYaw = 0;

        // Body-frame velocities.
        this.vx = 0;
        this.vy = 0;

        this.rearWheelAngularVelocity = 0;
        this.frontWheelAngularVelocity = 0;
        this.rearWheelAngularAcceleration = 0;
        this.rearWheelSpinAngle = 0;
        this.frontWheelSpinAngle = 0;
        this.rearWheelRotationMovement = 0;
        this.frontWheelRotationMovement = 0;

        this.throttle = 0;
        this.brake = 0;
        this.steerAngle = 0;
        this.clutch = 1;

        this.speed = 0;
        this.longForce = 0;
        this.acceleration = 0;
        this.longitudinalAcceleration = 0;
        this.lateralAcceleration = 0;
        this.Wf = 0;
        this.Wr = 0;
        this.staticWf = 0;
        this.staticWr = 0;
        this.engineRPM = 0;
        this.beta = 0;
        this.alphaFront = 0;
        this.alphaRear = 0;
        this.slipRatio = 0;
        this.driveTorque = 0;
        this.rearTractionTorque = 0;
        this.rearBrakeTorque = 0;

        this.F_tot = new THREE.Vector3(0, 0, 0);
        this.F_long = new THREE.Vector3(0, 0, 0);
        this.F_lat = new THREE.Vector3(0, 0, 0);

        this.axBody = 0;
        this.ayBody = 0;
        this.frontLongitudinalForce = 0;
        this.rearLongitudinalForce = 0;
        this.frontLateralForce = 0;
        this.rearLateralForce = 0;
        this.dragForce = 0;
        this.rollingResistanceForce = 0;

        this.errApprox = 0.001;
        this.lowSpeedThreshold = 2.0;
    }

    initializeCurrentParameters() {
        setStaticLoads(this);
        syncWorldVelocity(this);
        updateWheelState(this, 0);
    }

    update(delta, commandState = {}) {
        this.applyCommandState(commandState);
        updateTransmissionState(this, delta);
        this.stepDynamics(delta);
        updateWheelState(this, delta);
        stabilizeAtLowSpeed(this);
    }

    applyCommandState(commandState) {
        this.throttle = THREE.MathUtils.clamp(commandState.throttle || 0, 0, 1);
        this.brake = THREE.MathUtils.clamp(commandState.brake || 0, 0, 1);
        this.steerAngle = THREE.MathUtils.clamp(commandState.steerAngle || 0, -this.maxSteer, this.maxSteer);

        const desiredDirection = commandState.driveDirection === -1 ? -1 : 1;

        if (this.throttle <= this.errApprox) {
            return;
        }

        if (desiredDirection < 0) {
            if (this.speed < this.errApprox) {
                this.currentGear = 0;
            } else {
                this.brake = Math.max(this.brake, this.throttle);
                this.throttle = 0;
            }

            return;
        }

        if (this.speed > -this.errApprox) {
            if (this.currentGear === 0) {
                this.currentGear = 1;
            }
        } else {
            this.brake = Math.max(this.brake, this.throttle);
            this.throttle = 0;
        }
    }

    stepDynamics(delta) {
        const steer = THREE.MathUtils.clamp(this.steerAngle, -this.maxSteer, this.maxSteer);
        const speedAbs = Math.hypot(this.vx, this.vy);
        const substeps = speedAbs < this.lowSpeedThreshold ? this.launchSubsteps : 1;
        const subDt = delta / substeps;

        for (let step = 0; step < substeps; step += 1) {
            stepDynamicSingleTrackSubstep(this, subDt, steer);
        }
    }

    destroy() {
        // Reserved for future model-specific cleanup hooks.
    }
}
