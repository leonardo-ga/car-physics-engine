import {
    syncWorldVelocity,
    updateWheelState
} from '../../physics/chassis/carChassis';

export function captureCarPhysicsSnapshot(physics) {
    return {
        pos: physics.pos.clone(),
        vel: physics.vel.clone(),
        angle: physics.angle,
        omegaYaw: physics.omegaYaw,
        vx: physics.vx,
        vy: physics.vy,
        speed: physics.speed,
        throttle: physics.throttle,
        brake: physics.brake,
        steerAngle: physics.steerAngle,
        currentGear: physics.currentGear,
        shiftCooldownRemaining: physics.shiftCooldownRemaining,
        engineRPM: physics.engineRPM,
        rearWheelAngularVelocity: physics.rearWheelAngularVelocity,
        frontWheelAngularVelocity: physics.frontWheelAngularVelocity,
        rearWheelAngularAcceleration: physics.rearWheelAngularAcceleration,
        rearWheelSpinAngle: physics.rearWheelSpinAngle,
        frontWheelSpinAngle: physics.frontWheelSpinAngle,
        rearWheelRotationMovement: physics.rearWheelRotationMovement,
        frontWheelRotationMovement: physics.frontWheelRotationMovement
    };
}

export function restoreCarPhysicsSnapshot(physics, snapshot = {}) {
    if (snapshot.pos) {
        physics.pos.copy(snapshot.pos);
    }

    if (snapshot.vel) {
        physics.vel.copy(snapshot.vel);
    }

    physics.angle = snapshot.angle ?? physics.angle;
    physics.omegaYaw = snapshot.omegaYaw ?? physics.omegaYaw;
    physics.vx = snapshot.vx ?? physics.vx;
    physics.vy = snapshot.vy ?? physics.vy;
    physics.speed = snapshot.speed ?? physics.speed;
    physics.throttle = snapshot.throttle ?? physics.throttle;
    physics.brake = snapshot.brake ?? physics.brake;
    physics.steerAngle = snapshot.steerAngle ?? physics.steerAngle;
    physics.currentGear = snapshot.currentGear ?? physics.currentGear;
    physics.shiftCooldownRemaining = snapshot.shiftCooldownRemaining ?? physics.shiftCooldownRemaining;
    physics.engineRPM = snapshot.engineRPM ?? physics.engineRPM;
    physics.rearWheelAngularVelocity = snapshot.rearWheelAngularVelocity ?? physics.rearWheelAngularVelocity;
    physics.frontWheelAngularVelocity = snapshot.frontWheelAngularVelocity ?? physics.frontWheelAngularVelocity;
    physics.rearWheelAngularAcceleration = snapshot.rearWheelAngularAcceleration ?? physics.rearWheelAngularAcceleration;
    physics.rearWheelSpinAngle = snapshot.rearWheelSpinAngle ?? physics.rearWheelSpinAngle;
    physics.frontWheelSpinAngle = snapshot.frontWheelSpinAngle ?? physics.frontWheelSpinAngle;
    physics.rearWheelRotationMovement = snapshot.rearWheelRotationMovement ?? physics.rearWheelRotationMovement;
    physics.frontWheelRotationMovement = snapshot.frontWheelRotationMovement ?? physics.frontWheelRotationMovement;

    syncWorldVelocity(physics);
    updateWheelState(physics, 0);
}
