import * as THREE from 'three';

export default class CarPhysics {

    constructor(params = {}) {
        const safeMath = params.safeMath || {};

        this.debug = params.debug || { active: false, stats: {} };
        this.time = params.time || { delta: 0 };
        this.inputsActions = params.inputsActions || {};
        this.safeMath = {
            cos: typeof safeMath.cos === 'function' ? safeMath.cos.bind(safeMath) : Math.cos,
            sin: typeof safeMath.sin === 'function' ? safeMath.sin.bind(safeMath) : Math.sin
        };

        this.loadDefaultParameters(params);
        this.initializeCurrentParameters();
        this.loadDebugger();
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
        this.currentGear = 1;
        this.maxGear = 6;
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
        this.setStaticLoads();
        this.syncWorldVelocity();
        this.updateWheelState();
    }

    getCarHeading() {
        return new THREE.Vector3(this.safeMath.cos(this.angle), 0, -this.safeMath.sin(this.angle));
    }

    getCarLeftVector() {
        const heading = this.getCarHeading();
        return new THREE.Vector3(heading.z, 0, -heading.x);
    }

    syncWorldVelocity() {
        const heading = this.getCarHeading();
        const left = this.getCarLeftVector();
        this.vel.copy(heading.multiplyScalar(this.vx).add(left.multiplyScalar(this.vy)));
    }

    update() {
        this.updateControls();
        this.stepDynamics();
        this.updateWheelState();
        this.stabilizeAtLowSpeed();
        this.updateStatsPanel();
    }

    updateControls() {
        this.throttle = 0;
        this.brake = this.inputsActions.brake ? 1 : 0;

        if (this.inputsActions.up && this.speed > -this.errApprox) {
            this.throttle = 1;
            if (this.currentGear === 0) {
                this.currentGear = 1;
            }
        } else if (this.inputsActions.up && this.speed <= -this.errApprox) {
            this.brake = 1;
        }

        if (this.inputsActions.down && this.speed < this.errApprox) {
            this.throttle = 1;
            if (this.currentGear > 0) {
                this.currentGear = 0;
            }
        } else if (this.inputsActions.down && this.speed >= this.errApprox) {
            this.brake = 1;
        }

        if (this.inputsActions.up === this.inputsActions.down) {
            this.throttle = 0;
        }
    }

    stepDynamics() {
        const dt = this.time.delta;
        const steer = THREE.MathUtils.clamp(this.steerAngle, -this.maxSteer, this.maxSteer);
        const cosDelta = Math.cos(steer);
        const sinDelta = Math.sin(steer);
        const speedAbs = Math.hypot(this.vx, this.vy);

        this.speed = this.vx;
        const { dragX, dragY, rrX, rrY } = this.computeLongitudinalForces(speedAbs);
        const longForceEstimate =
            (this.frontLongitudinalForce * cosDelta)
            + this.rearLongitudinalForce
            + dragX
            + rrX;
        this.setDynamicLoads(longForceEstimate / this.mass);

        if (speedAbs < this.lowSpeedThreshold) {
            this.stepLowSpeedKinematics(steer, cosDelta, dragX, rrX, dt);
            return;
        }

        const { FyFront, FyRear } = this.computeLateralForces(steer);
        this.frontLateralForce = FyFront;
        this.rearLateralForce = FyRear;

        const sumFx =
            + dragX
            + rrX
            + this.frontLongitudinalForce * cosDelta
            + this.rearLongitudinalForce;

        const sumFy =
            dragY
            + rrY
            + this.frontLongitudinalForce * sinDelta
            + FyFront * cosDelta
            + FyRear;

        this.longitudinalAcceleration = sumFx / this.mass;
        this.axBody = this.longitudinalAcceleration + (this.omegaYaw * this.vy);
        this.ayBody = (sumFy / this.mass) - (this.omegaYaw * this.vx);

        const yawMoment =
            this.cgToFront * (this.frontLongitudinalForce * sinDelta + FyFront * cosDelta)
            - this.cgToRear * FyRear;
        const yawAcceleration = yawMoment / this.inertiaYaw;

        this.vx += this.axBody * dt;
        this.vy += this.ayBody * dt;
        this.omegaYaw += yawAcceleration * dt;

        this.angle += this.omegaYaw * dt;
        this.syncWorldVelocity();
        this.pos.addScaledVector(this.vel, dt);

        this.speed = this.vx;
        this.longForce = sumFx;
        this.acceleration = this.longitudinalAcceleration;
        this.lateralAcceleration = this.ayBody;

        const heading = this.getCarHeading();
        const left = this.getCarLeftVector();
        this.F_long.copy(heading).multiplyScalar(sumFx);
        this.F_lat.copy(left).multiplyScalar(sumFy);
        this.F_tot.copy(this.F_long).add(this.F_lat);

        this.setDynamicLoads(this.longitudinalAcceleration);
    }

    stepLowSpeedKinematics(steer, cosDelta, dragX, rrX, dt) {
        const sumFx =
            dragX
            + rrX
            + this.frontLongitudinalForce * cosDelta
            + this.rearLongitudinalForce;

        this.longitudinalAcceleration = sumFx / this.mass;
        this.axBody = this.longitudinalAcceleration;
        this.ayBody = 0;
        this.vx += this.axBody * dt;
        this.vy = 0;
        this.beta = 0;
        this.alphaFront = 0;
        this.alphaRear = 0;
        this.frontLateralForce = 0;
        this.rearLateralForce = 0;

        this.omegaYaw =
            Math.abs(steer) > this.errApprox
                ? (this.vx / this.wheelBase) * Math.tan(steer)
                : 0;

        this.angle += this.omegaYaw * dt;
        this.syncWorldVelocity();
        this.pos.addScaledVector(this.vel, dt);

        this.speed = this.vx;
        this.longForce = sumFx;
        this.acceleration = this.longitudinalAcceleration;
        this.lateralAcceleration = 0;

        const heading = this.getCarHeading();
        this.F_long.copy(heading).multiplyScalar(sumFx);
        this.F_lat.set(0, 0, 0);
        this.F_tot.copy(this.F_long);

        this.setDynamicLoads(this.longitudinalAcceleration);
    }

    computeLongitudinalForces(speedAbs) {
        const motionSign = this.getMotionSign();
        const frontBrakeForceMagnitude = this.brake * this.brakeForceMax * this.brakeBiasFront;
        const rearBrakeForceMagnitude = this.brake * this.brakeForceMax * (1 - this.brakeBiasFront);

        this.frontLongitudinalForce =
            motionSign === 0
                ? 0
                : -motionSign * frontBrakeForceMagnitude;
        this.rearLongitudinalForce = this.updateRearWheelDynamics(rearBrakeForceMagnitude);

        const dragX = -this.C_drag * this.vx * speedAbs;
        const dragY = -this.C_drag * this.vy * speedAbs;
        const rrX = Math.abs(this.vx) > this.errApprox ? -this.C_rr * this.vx : 0;
        const rrY = Math.abs(this.vy) > this.errApprox ? -this.C_rr * this.vy : 0;

        this.dragForce = dragX;
        this.rollingResistanceForce = rrX;

        return { dragX, dragY, rrX, rrY };
    }

    computeLateralForces(steer) {
        if (Math.abs(this.vx) < this.lowSpeedThreshold) {
            this.beta = 0;
            this.alphaFront = 0;
            this.alphaRear = 0;
            return { FyFront: 0, FyRear: 0 };
        }

        const vxAbs = Math.max(Math.abs(this.vx), this.lowSpeedThreshold);
        const directionSign = Math.sign(this.vx || 1);
        this.beta = Math.atan2(this.vy, vxAbs);

        this.alphaFront =
            directionSign * steer - Math.atan2(this.vy + this.cgToFront * this.omegaYaw, vxAbs);
        this.alphaRear =
            -Math.atan2(this.vy - this.cgToRear * this.omegaYaw, vxAbs);

        const frontLoadScale = this.staticWf > 0 ? this.Wf / this.staticWf : 1;
        const rearLoadScale = this.staticWr > 0 ? this.Wr / this.staticWr : 1;

        let FyFront = this.cornerStiffnessFront * frontLoadScale * this.alphaFront;
        let FyRear = this.cornerStiffnessRear * rearLoadScale * this.alphaRear;

        const frontLimit = this.mu * this.Wf;
        const rearLimit = this.mu * this.Wr;
        FyFront = THREE.MathUtils.clamp(FyFront, -frontLimit, frontLimit);
        FyRear = THREE.MathUtils.clamp(FyRear, -rearLimit, rearLimit);

        return { FyFront, FyRear };
    }

    getDriveTorque() {
        let gearRatio = this.gearRatios[this.currentGear];
        let engineRPM = this.getWheelDrivenEngineRPM(gearRatio);

        this.shiftGear(engineRPM);

        gearRatio = this.gearRatios[this.currentGear];
        engineRPM = this.getWheelDrivenEngineRPM(gearRatio);

        const engineTorqueMax = this.getEngineTorque(engineRPM);
        const engineTorque = this.throttle * engineTorqueMax;
        const driveTorque = engineTorque * gearRatio * this.diffRatio * this.transmissionEfficiency * this.clutch;

        this.engineRPM = engineRPM;
        return driveTorque;
    }

    getWheelDrivenEngineRPM(gearRatio) {
        const engineRPM = this.rearWheelAngularVelocity * gearRatio * this.diffRatio * (60 / (2 * Math.PI));
        return Math.max(this.idleRPM, Math.abs(engineRPM));
    }

    getEngineTorque(rpm, T_max = 400, RPM_peak = 3000) {
        const ratio = rpm / RPM_peak;
        return T_max * ratio * Math.exp(1 - ratio);
    }

    shiftGear(rpm) {
        if (this.currentGear === 0) {
            return;
        }
        if (rpm > this.maxRPM && this.currentGear < this.maxGear) {
            this.currentGear += 1;
        }
        if (rpm < this.minRPM && this.currentGear > 1) {
            this.currentGear -= 1;
        }
    }

    setStaticLoads() {
        const totalWeight = this.mass * this.g;
        this.staticWf = (this.cgToRear / this.wheelBase) * totalWeight;
        this.staticWr = (this.cgToFront / this.wheelBase) * totalWeight;
        this.Wf = this.staticWf;
        this.Wr = this.staticWr;
    }

    setDynamicLoads(longitudinalAcceleration = this.longitudinalAcceleration) {
        const totalWeight = this.mass * this.g;
        const transfer = (this.cgHeight / this.wheelBase) * this.mass * longitudinalAcceleration;

        this.Wf = THREE.MathUtils.clamp(this.staticWf - transfer, 0, totalWeight);
        this.Wr = THREE.MathUtils.clamp(totalWeight - this.Wf, 0, totalWeight);
    }

    updateWheelState() {
        const dt = this.time.delta;

        this.rearWheelRotationMovement = this.rearWheelAngularVelocity * dt;

        this.frontWheelAngularVelocity = this.vx / this.frontWheelRadius;
        this.frontWheelRotationMovement = this.frontWheelAngularVelocity * dt;
    }

    updateRearWheelDynamics(rearBrakeForceMagnitude) {
        const driveTorque = this.getDriveTorque();
        const slipRatio = this.getRearSlipRatio();
        const normalizedTraction =
            THREE.MathUtils.clamp(this.tractionCurveSlope * slipRatio, -this.mu, this.mu);
        const tractionForce = normalizedTraction * this.Wr;
        const tractionTorque = -tractionForce * this.rearWheelRadius;
        const brakeTorque = this.getRearBrakeTorque(rearBrakeForceMagnitude);
        const totalTorque = driveTorque + tractionTorque + brakeTorque;
        const rearAxleInertia = this.getRearAxleInertia();

        this.driveTorque = driveTorque;
        this.slipRatio = slipRatio;
        this.rearTractionTorque = tractionTorque;
        this.rearBrakeTorque = brakeTorque;
        this.rearWheelAngularAcceleration = totalTorque / rearAxleInertia;
        this.rearWheelAngularVelocity += this.rearWheelAngularAcceleration * this.time.delta;

        return tractionForce;
    }

    getRearSlipRatio() {
        const wheelLinearSpeed = this.rearWheelAngularVelocity * this.rearWheelRadius;
        const speedDenominator = Math.max(Math.abs(this.vx), 1);
        const slipRatio = (wheelLinearSpeed - this.vx) / speedDenominator;

        return THREE.MathUtils.clamp(slipRatio, -2, 2);
    }

    getRearBrakeTorque(rearBrakeForceMagnitude) {
        const rotationSign = this.getWheelRotationSign();

        if (rotationSign === 0) {
            return 0;
        }

        return -rotationSign * rearBrakeForceMagnitude * this.rearWheelRadius;
    }

    getWheelRotationSign() {
        if (Math.abs(this.rearWheelAngularVelocity) > this.errApprox) {
            return Math.sign(this.rearWheelAngularVelocity);
        }

        if (Math.abs(this.vx) > this.errApprox) {
            return Math.sign(this.vx);
        }

        const gearRatio = this.gearRatios[this.currentGear];

        if (this.throttle > 0 && gearRatio !== 0) {
            return Math.sign(gearRatio);
        }

        return 0;
    }

    getMotionSign() {
        if (Math.abs(this.vx) > this.errApprox) {
            return Math.sign(this.vx);
        }

        return 0;
    }

    getRearAxleInertia() {
        const wheelInertia = (this.rearWheelMass * this.rearWheelRadius * this.rearWheelRadius) / 2;
        const engineInertia = 0.3;
        const driveshaftInertia = 1;
        const gearRatio = Math.abs(this.gearRatios[this.currentGear] || 1);
        const reflectedEngineInertia = engineInertia * Math.pow(gearRatio * this.diffRatio, 2);

        return (2 * wheelInertia) + reflectedEngineInertia + driveshaftInertia;
    }

    stabilizeAtLowSpeed() {
        const isNearlyStill =
            Math.abs(this.vx) < this.errApprox &&
            Math.abs(this.vy) < this.errApprox &&
            Math.abs(this.omegaYaw) < this.errApprox;

        if (isNearlyStill && this.throttle === 0) {
            this.vx = 0;
            this.vy = 0;
            this.speed = 0;
            this.omegaYaw = 0;
            this.axBody = 0;
            this.ayBody = 0;
            this.longitudinalAcceleration = 0;
            this.frontLateralForce = 0;
            this.rearLateralForce = 0;
            this.frontLongitudinalForce = 0;
            this.rearLongitudinalForce = 0;
            this.longForce = 0;
            this.acceleration = 0;
            this.lateralAcceleration = 0;
            this.dragForce = 0;
            this.rollingResistanceForce = 0;
            this.beta = 0;
            this.alphaFront = 0;
            this.alphaRear = 0;
            this.slipRatio = 0;
            this.driveTorque = 0;
            this.rearTractionTorque = 0;
            this.rearBrakeTorque = 0;

            this.vel.set(0, 0, 0);
            this.F_long.set(0, 0, 0);
            this.F_lat.set(0, 0, 0);
            this.F_tot.set(0, 0, 0);

            this.rearWheelAngularAcceleration = 0;
            this.rearWheelAngularVelocity = 0;
            this.frontWheelAngularVelocity = 0;
            this.rearWheelRotationMovement = 0;
            this.frontWheelRotationMovement = 0;
        }
    }

    updateStatsPanel() {
        if (this.debug.active) {
            this.debug.stats.speed = Number.parseFloat(this.speed).toFixed(2);
            this.debug.stats.speedKMH = Number.parseFloat(this.speed * 3.6).toFixed(0);
            this.debug.stats.engineForce = Number.parseFloat(this.longForce).toFixed(2);
            this.debug.stats.accel = Number.parseFloat(this.acceleration).toFixed(2);
            this.debug.stats.Wf = Number.parseFloat(this.Wf).toFixed(2);
            this.debug.stats.Wr = Number.parseFloat(this.Wr).toFixed(2);
            this.debug.stats.vx = Number.parseFloat(this.vx).toFixed(2);
            this.debug.stats.vy = Number.parseFloat(this.vy).toFixed(2);
            this.debug.stats.beta = Number.parseFloat(this.beta).toFixed(3);
            this.debug.stats.yawRate = Number.parseFloat(this.omegaYaw).toFixed(3);
            this.debug.stats.alphaFront = Number.parseFloat(this.alphaFront).toFixed(3);
            this.debug.stats.alphaRear = Number.parseFloat(this.alphaRear).toFixed(3);
            this.debug.stats.slipRatio = Number.parseFloat(this.slipRatio).toFixed(3);

            this.debug.stats.engineRPM = Number.parseFloat(this.engineRPM).toFixed(0);
            this.debug.stats.currentGear = (this.speed === 0) ? 'N' : ((this.currentGear === 0) ? 'R' : this.currentGear);

            this.debug.stats.rearWheelAngularAcceleration = Number.parseFloat(this.rearWheelAngularAcceleration).toFixed(2);
            this.debug.stats.rearWheelAngularVelocity = Number.parseFloat(this.rearWheelAngularVelocity).toFixed(2);
            this.debug.stats.frontWheelAngularVelocity = Number.parseFloat(this.frontWheelAngularVelocity).toFixed(2);
        }
    }

    loadDebugger() {
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('car_physics');
            this.debugFolder
                .add(this, 'mass')
                .name('mass')
                .min(1).max(5000).step(1);
            this.debugFolder
                .add(this, 'brakeForceMax')
                .name('brake_force_max')
                .min(0).max(20000).step(10);
            this.debugFolder
                .add(this, 'idleRPM')
                .name('idle_RPM')
                .min(1).max(2000).step(1);
            this.debugFolder
                .add(this, 'minRPM')
                .name('min_RPM')
                .min(1).max(6000).step(1);
            this.debugFolder
                .add(this, 'maxRPM')
                .name('max_RPM')
                .min(1).max(10000).step(1);
            this.debugFolder
                .add(this, 'transmissionEfficiency')
                .name('trans_effic')
                .min(0).max(1).step(0.01);
            this.debugFolder
                .add(this, 'mu')
                .name('mu-friction_coeff')
                .min(0).max(5).step(0.01);
            this.debugFolder
                .add(this, 'tractionCurveSlope')
                .name('traction_curve')
                .min(1).max(40).step(0.1);
            this.debugFolder
                .add(this, 'cornerStiffnessFront')
                .name('corner_stiff_front')
                .min(1000).max(100000).step(100);
            this.debugFolder
                .add(this, 'cornerStiffnessRear')
                .name('corner_stiff_rear')
                .min(1000).max(100000).step(100);
            this.debugFolder
                .add(this, 'errApprox')
                .name('error_approx')
                .min(0).max(0.1).step(0.001);
        }
    }
}
