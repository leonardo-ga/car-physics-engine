import {
    computeLongitudinalSumFx,
    integratePose,
    setDynamicLoads,
    updateStepOutputForces
} from '../chassis/carChassis';
import {
    computeLateralForces,
    computeLongitudinalForces
} from '../forces/carForces';
import { stepLowSpeedKinematics } from './lowSpeedKinematics';

export function stepDynamicSingleTrackSubstep(physics, dt, steer) {
    const cosDelta = Math.cos(steer);
    const sinDelta = Math.sin(steer);
    const speedAbs = Math.hypot(physics.vx, physics.vy);

    physics.speed = physics.vx;
    const { dragX, dragY, rrX, rrY } = computeLongitudinalForces(physics, speedAbs, dt);
    const longForceEstimate =
        (physics.frontLongitudinalForce * cosDelta)
        + physics.rearLongitudinalForce
        + dragX
        + rrX;
    setDynamicLoads(physics, longForceEstimate / physics.mass);

    if (speedAbs < physics.lowSpeedThreshold) {
        stepLowSpeedKinematics(physics, steer, dt, { dragX, rrX });
        return;
    }

    const { FyFront, FyRear } = computeLateralForces(physics, steer);
    physics.frontLateralForce = FyFront;
    physics.rearLateralForce = FyRear;

    const sumFx = computeLongitudinalSumFx(physics, cosDelta, dragX, rrX);
    const sumFy =
        dragY
        + rrY
        + physics.frontLongitudinalForce * sinDelta
        + FyFront * cosDelta
        + FyRear;

    physics.longitudinalAcceleration = sumFx / physics.mass;
    physics.axBody = physics.longitudinalAcceleration + (physics.omegaYaw * physics.vy);
    physics.ayBody = (sumFy / physics.mass) - (physics.omegaYaw * physics.vx);

    const yawMoment =
        physics.cgToFront * (physics.frontLongitudinalForce * sinDelta + FyFront * cosDelta)
        - physics.cgToRear * FyRear;
    const yawAcceleration = yawMoment / physics.inertiaYaw;

    physics.vx += physics.axBody * dt;
    physics.vy += physics.ayBody * dt;
    physics.omegaYaw += yawAcceleration * dt;

    integratePose(physics, dt);
    updateStepOutputForces(physics, sumFx, sumFy, physics.ayBody);

    setDynamicLoads(physics, physics.longitudinalAcceleration);
}
