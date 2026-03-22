import * as THREE from 'three';

export function getCarHeading(physics) {
    return new THREE.Vector3(
        physics.safeMath.cos(physics.angle),
        0,
        -physics.safeMath.sin(physics.angle)
    );
}

export function getCarLeftVector(physics) {
    const heading = getCarHeading(physics);
    return new THREE.Vector3(heading.z, 0, -heading.x);
}

export function syncWorldVelocity(physics) {
    const heading = getCarHeading(physics);
    const left = new THREE.Vector3(heading.z, 0, -heading.x);
    physics.vel.copy(heading.multiplyScalar(physics.vx).add(left.multiplyScalar(physics.vy)));
}

export function computeLongitudinalSumFx(physics, cosDelta, dragX, rrX) {
    return dragX + rrX + (physics.frontLongitudinalForce * cosDelta) + physics.rearLongitudinalForce;
}

export function resetLateralState(physics) {
    physics.ayBody = 0;
    physics.vy = 0;
    physics.beta = 0;
    physics.alphaFront = 0;
    physics.alphaRear = 0;
    physics.frontLateralForce = 0;
    physics.rearLateralForce = 0;
}

export function integratePose(physics, dt) {
    physics.angle += physics.omegaYaw * dt;
    syncWorldVelocity(physics);
    physics.pos.addScaledVector(physics.vel, dt);
}

export function updateStepOutputForces(physics, sumFx, sumFy, lateralAcceleration) {
    physics.speed = physics.vx;
    physics.longForce = sumFx;
    physics.acceleration = physics.longitudinalAcceleration;
    physics.lateralAcceleration = lateralAcceleration;

    const heading = getCarHeading(physics);
    const left = new THREE.Vector3(heading.z, 0, -heading.x);
    physics.F_long.copy(heading).multiplyScalar(sumFx);
    physics.F_lat.copy(left).multiplyScalar(sumFy);
    physics.F_tot.copy(physics.F_long).add(physics.F_lat);
}

export function setStaticLoads(physics) {
    const totalWeight = physics.mass * physics.g;
    physics.staticWf = (physics.cgToRear / physics.wheelBase) * totalWeight;
    physics.staticWr = (physics.cgToFront / physics.wheelBase) * totalWeight;
    physics.Wf = physics.staticWf;
    physics.Wr = physics.staticWr;
}

export function setDynamicLoads(
    physics,
    longitudinalAcceleration = physics.longitudinalAcceleration
) {
    const totalWeight = physics.mass * physics.g;
    const transfer =
        (physics.cgHeight / physics.wheelBase) * physics.mass * longitudinalAcceleration;

    physics.Wf = THREE.MathUtils.clamp(physics.staticWf - transfer, 0, totalWeight);
    physics.Wr = THREE.MathUtils.clamp(totalWeight - physics.Wf, 0, totalWeight);
}

export function updateWheelState(physics, dt) {
    physics.rearWheelRotationMovement = physics.rearWheelAngularVelocity * dt;
    physics.rearWheelSpinAngle += physics.rearWheelRotationMovement;

    physics.frontWheelAngularVelocity = physics.vx / physics.frontWheelRadius;
    physics.frontWheelRotationMovement = physics.frontWheelAngularVelocity * dt;
    physics.frontWheelSpinAngle += physics.frontWheelRotationMovement;
}

export function stabilizeAtLowSpeed(physics) {
    const isNearlyStill =
        Math.abs(physics.vx) < physics.errApprox &&
        Math.abs(physics.vy) < physics.errApprox &&
        Math.abs(physics.omegaYaw) < physics.errApprox;

    if (isNearlyStill && physics.throttle === 0) {
        physics.vx = 0;
        physics.vy = 0;
        physics.speed = 0;
        physics.omegaYaw = 0;
        physics.axBody = 0;
        physics.ayBody = 0;
        physics.longitudinalAcceleration = 0;
        physics.frontLateralForce = 0;
        physics.rearLateralForce = 0;
        physics.frontLongitudinalForce = 0;
        physics.rearLongitudinalForce = 0;
        physics.longForce = 0;
        physics.acceleration = 0;
        physics.lateralAcceleration = 0;
        physics.dragForce = 0;
        physics.rollingResistanceForce = 0;
        physics.beta = 0;
        physics.alphaFront = 0;
        physics.alphaRear = 0;
        physics.slipRatio = 0;
        physics.driveTorque = 0;
        physics.rearTractionTorque = 0;
        physics.rearBrakeTorque = 0;

        physics.vel.set(0, 0, 0);
        physics.F_long.set(0, 0, 0);
        physics.F_lat.set(0, 0, 0);
        physics.F_tot.set(0, 0, 0);

        physics.rearWheelAngularAcceleration = 0;
        physics.rearWheelAngularVelocity = 0;
        physics.frontWheelAngularVelocity = 0;
        physics.rearWheelRotationMovement = 0;
        physics.frontWheelRotationMovement = 0;
    }
}
