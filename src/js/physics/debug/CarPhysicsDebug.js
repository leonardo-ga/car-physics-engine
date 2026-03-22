export default class CarPhysicsDebug {

    constructor({
        physics,
        debug
    }) {
        this.physics = physics;
        this.debug = debug;

        this.loadDebugger();
    }

    update() {
        if (!this.debug.active) {
            return;
        }

        this.debug.stats.physicsModel = this.physics.modelId;
        this.debug.stats.speed = Number.parseFloat(this.physics.speed).toFixed(2);
        this.debug.stats.speedKMH = Number.parseFloat(this.physics.speed * 3.6).toFixed(0);
        this.debug.stats.engineForce = Number.parseFloat(this.physics.longForce).toFixed(2);
        this.debug.stats.accel = Number.parseFloat(this.physics.acceleration).toFixed(2);
        this.debug.stats.Wf = Number.parseFloat(this.physics.Wf).toFixed(2);
        this.debug.stats.Wr = Number.parseFloat(this.physics.Wr).toFixed(2);
        this.debug.stats.vx = Number.parseFloat(this.physics.vx).toFixed(2);
        this.debug.stats.vy = Number.parseFloat(this.physics.vy).toFixed(2);
        this.debug.stats.beta = Number.parseFloat(this.physics.beta).toFixed(3);
        this.debug.stats.yawRate = Number.parseFloat(this.physics.omegaYaw).toFixed(3);
        this.debug.stats.alphaFront = Number.parseFloat(this.physics.alphaFront).toFixed(3);
        this.debug.stats.alphaRear = Number.parseFloat(this.physics.alphaRear).toFixed(3);
        this.debug.stats.slipRatio = Number.parseFloat(this.physics.slipRatio).toFixed(3);
        this.debug.stats.engineRPM = Number.parseFloat(this.physics.engineRPM).toFixed(0);
        this.debug.stats.currentGear =
            this.physics.speed === 0
                ? 'N'
                : ((this.physics.currentGear === 0) ? 'R' : this.physics.currentGear);
        this.debug.stats.rearWheelAngularAcceleration = Number.parseFloat(this.physics.rearWheelAngularAcceleration).toFixed(2);
        this.debug.stats.rearWheelAngularVelocity = Number.parseFloat(this.physics.rearWheelAngularVelocity).toFixed(2);
        this.debug.stats.frontWheelAngularVelocity = Number.parseFloat(this.physics.frontWheelAngularVelocity).toFixed(2);
    }

    loadDebugger() {
        if (!this.debug.active) {
            return;
        }

        this.debugFolder = this.debug.ui.addFolder('car_physics');

        [
            ['mass', 'mass', 1, 5000, 1],
            ['brakeForceMax', 'brake_force_max', 0, 20000, 10],
            ['idleRPM', 'idle_RPM', 1, 2000, 1],
            ['minRPM', 'min_RPM', 1, 6000, 1],
            ['maxRPM', 'max_RPM', 1, 10000, 1],
            ['shiftCooldownTime', 'shift_cooldown', 0, 1, 0.01],
            ['transmissionEfficiency', 'trans_effic', 0, 1, 0.01],
            ['mu', 'mu-friction_coeff', 0, 5, 0.01],
            ['tractionCurveSlope', 'traction_curve', 1, 40, 0.1],
            ['launchSubsteps', 'launch_substeps', 1, 16, 1],
            ['cornerStiffnessFront', 'corner_stiff_front', 1000, 100000, 100],
            ['cornerStiffnessRear', 'corner_stiff_rear', 1000, 100000, 100],
            ['errApprox', 'error_approx', 0, 0.1, 0.001]
        ].forEach(([key, label, min, max, step]) => {
            this.debugFolder
                .add(this.physics, key)
                .name(label)
                .min(min)
                .max(max)
                .step(step);
        });
    }

    destroy() {
        if (this.debugFolder) {
            this.debugFolder.destroy();
            this.debugFolder = null;
        }
    }
}
