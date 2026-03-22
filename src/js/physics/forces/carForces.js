import {
    getMotionSign,
    updateRearWheelDynamics
} from '../drivetrain/carDrivetrain';

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function computeLongitudinalForces(physics, speedAbs, dt) {
    const motionSign = getMotionSign(physics);
    const frontBrakeForceMagnitude = physics.brake * physics.brakeForceMax * physics.brakeBiasFront;
    const rearBrakeForceMagnitude =
        physics.brake * physics.brakeForceMax * (1 - physics.brakeBiasFront);

    physics.frontLongitudinalForce =
        motionSign === 0
            ? 0
            : -motionSign * frontBrakeForceMagnitude;
    physics.rearLongitudinalForce = updateRearWheelDynamics(
        physics,
        rearBrakeForceMagnitude,
        dt
    );

    const dragX = -physics.C_drag * physics.vx * speedAbs;
    const dragY = -physics.C_drag * physics.vy * speedAbs;
    const rrX = Math.abs(physics.vx) > physics.errApprox ? -physics.C_rr * physics.vx : 0;
    const rrY = Math.abs(physics.vy) > physics.errApprox ? -physics.C_rr * physics.vy : 0;

    physics.dragForce = dragX;
    physics.rollingResistanceForce = rrX;

    return { dragX, dragY, rrX, rrY };
}

export function computeLateralForces(physics, steer) {
    if (Math.abs(physics.vx) < physics.lowSpeedThreshold) {
        physics.beta = 0;
        physics.alphaFront = 0;
        physics.alphaRear = 0;
        return { FyFront: 0, FyRear: 0 };
    }

    const vxAbs = Math.max(Math.abs(physics.vx), physics.lowSpeedThreshold);
    const directionSign = Math.sign(physics.vx || 1);
    physics.beta = Math.atan2(physics.vy, vxAbs);

    physics.alphaFront =
        directionSign * steer
        - Math.atan2(physics.vy + physics.cgToFront * physics.omegaYaw, vxAbs);
    physics.alphaRear =
        -Math.atan2(physics.vy - physics.cgToRear * physics.omegaYaw, vxAbs);

    const frontLoadScale = physics.staticWf > 0 ? physics.Wf / physics.staticWf : 1;
    const rearLoadScale = physics.staticWr > 0 ? physics.Wr / physics.staticWr : 1;

    let FyFront = physics.cornerStiffnessFront * frontLoadScale * physics.alphaFront;
    let FyRear = physics.cornerStiffnessRear * rearLoadScale * physics.alphaRear;

    const frontLimit = physics.mu * physics.Wf;
    const rearLimit = physics.mu * physics.Wr;
    FyFront = clamp(FyFront, -frontLimit, frontLimit);
    FyRear = clamp(FyRear, -rearLimit, rearLimit);

    return { FyFront, FyRear };
}
