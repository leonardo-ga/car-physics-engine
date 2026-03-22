import {
    computeLongitudinalSumFx,
    integratePose,
    resetLateralState,
    setDynamicLoads,
    updateStepOutputForces
} from '../chassis/carChassis';
import { computeLongitudinalForces } from '../forces/carForces';

export function stepLowSpeedKinematics(physics, steer, dt, precomputedForces = null) {
    const cosDelta = Math.cos(steer);
    const { dragX, rrX } =
        precomputedForces ?? computeLongitudinalForces(physics, Math.abs(physics.vx), dt);
    const sumFx = computeLongitudinalSumFx(physics, cosDelta, dragX, rrX);

    physics.longitudinalAcceleration = sumFx / physics.mass;
    physics.axBody = physics.longitudinalAcceleration;
    physics.vx += physics.axBody * dt;
    resetLateralState(physics);

    physics.omegaYaw =
        Math.abs(steer) > physics.errApprox
            ? (physics.vx / physics.wheelBase) * Math.tan(steer)
            : 0;

    integratePose(physics, dt);
    updateStepOutputForces(physics, sumFx, 0, 0);

    setDynamicLoads(physics, physics.longitudinalAcceleration);
}
