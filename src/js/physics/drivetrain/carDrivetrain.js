function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function updateTransmissionState(physics, delta) {
    physics.shiftCooldownRemaining = Math.max(0, physics.shiftCooldownRemaining - delta);

    const gearRatio = physics.gearRatios[physics.currentGear];
    const currentRPM = getWheelDrivenEngineRPM(physics, gearRatio);
    physics.engineRPM = currentRPM;

    if (physics.currentGear === 0 || physics.shiftCooldownRemaining > 0) {
        return;
    }

    const targetGear = chooseGear(physics, currentRPM);

    if (targetGear === physics.currentGear) {
        return;
    }

    physics.currentGear = targetGear;
    physics.shiftCooldownRemaining = physics.shiftCooldownTime;
    physics.engineRPM = getWheelDrivenEngineRPM(physics, physics.gearRatios[physics.currentGear]);
}

export function getDriveTorque(physics) {
    const gearRatio = physics.gearRatios[physics.currentGear];
    const engineRPM = getWheelDrivenEngineRPM(physics, gearRatio);
    const engineTorqueMax = getEngineTorque(engineRPM);
    const engineTorque = physics.throttle * engineTorqueMax;
    const driveTorque =
        engineTorque
        * gearRatio
        * physics.diffRatio
        * physics.transmissionEfficiency
        * physics.clutch;

    physics.engineRPM = engineRPM;

    return driveTorque;
}

export function getWheelDrivenEngineRPM(physics, gearRatio) {
    const engineRPM = physics.rearWheelAngularVelocity * gearRatio * physics.diffRatio * (60 / (2 * Math.PI));
    return Math.max(physics.idleRPM, Math.abs(engineRPM));
}

export function getEngineTorque(rpm, maxTorque = 400, rpmPeak = 3000) {
    const ratio = rpm / rpmPeak;
    return maxTorque * ratio * Math.exp(1 - ratio);
}

export function chooseGear(physics, rpm) {
    if (physics.currentGear === 0) {
        return physics.currentGear;
    }

    if (rpm > physics.maxRPM && physics.currentGear < physics.maxGear) {
        return physics.currentGear + 1;
    }

    if (rpm < physics.minRPM && physics.currentGear > 1) {
        return physics.currentGear - 1;
    }

    return physics.currentGear;
}

export function updateRearWheelDynamics(physics, rearBrakeForceMagnitude, dt) {
    const driveTorque = getDriveTorque(physics);
    const slipRatio = getRearSlipRatio(physics);
    const normalizedTraction = clamp(physics.tractionCurveSlope * slipRatio, -physics.mu, physics.mu);
    const tractionForce = normalizedTraction * physics.Wr;
    const tractionTorque = -tractionForce * physics.rearWheelRadius;
    const brakeTorque = getRearBrakeTorque(physics, rearBrakeForceMagnitude);
    const totalTorque = driveTorque + tractionTorque + brakeTorque;
    const rearAxleInertia = getRearAxleInertia(physics);

    physics.driveTorque = driveTorque;
    physics.slipRatio = slipRatio;
    physics.rearTractionTorque = tractionTorque;
    physics.rearBrakeTorque = brakeTorque;
    physics.rearWheelAngularAcceleration = totalTorque / rearAxleInertia;
    physics.rearWheelAngularVelocity += physics.rearWheelAngularAcceleration * dt;

    return tractionForce;
}

export function getRearSlipRatio(physics) {
    const wheelLinearSpeed = physics.rearWheelAngularVelocity * physics.rearWheelRadius;
    const speedDenominator = Math.max(Math.abs(physics.vx), 1);
    const slipRatio = (wheelLinearSpeed - physics.vx) / speedDenominator;

    return clamp(slipRatio, -2, 2);
}

export function getRearBrakeTorque(physics, rearBrakeForceMagnitude) {
    const rotationSign = getWheelRotationSign(physics);

    if (rotationSign === 0) {
        return 0;
    }

    return -rotationSign * rearBrakeForceMagnitude * physics.rearWheelRadius;
}

export function getWheelRotationSign(physics) {
    if (Math.abs(physics.rearWheelAngularVelocity) > physics.errApprox) {
        return Math.sign(physics.rearWheelAngularVelocity);
    }

    if (Math.abs(physics.vx) > physics.errApprox) {
        return Math.sign(physics.vx);
    }

    const gearRatio = physics.gearRatios[physics.currentGear];

    if (physics.throttle > 0 && gearRatio !== 0) {
        return Math.sign(gearRatio);
    }

    return 0;
}

export function getMotionSign(physics) {
    if (Math.abs(physics.vx) > physics.errApprox) {
        return Math.sign(physics.vx);
    }

    return 0;
}

export function getRearAxleInertia(physics) {
    const wheelInertia =
        (physics.rearWheelMass * physics.rearWheelRadius * physics.rearWheelRadius) / 2;
    const engineInertia = 0.3;
    const driveshaftInertia = 1;
    const gearRatio = Math.abs(physics.gearRatios[physics.currentGear] || 1);
    const reflectedEngineInertia = engineInertia * Math.pow(gearRatio * physics.diffRatio, 2);

    return (2 * wheelInertia) + reflectedEngineInertia + driveshaftInertia;
}
