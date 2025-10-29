import Base from '../Base';

/**
 * @deprecated The class CarPhysics_v01 was a basic Physics model that has been replaced.
 */
export default class CarPhysics_v01 {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;

        this.debug = this.base.debug;
        this.time = this.base.time;
        this.inputs = this.base.inputs;
        this.inputsActions = this.inputs.actions;

        this.loadDefaultParameters();
        this.initializeCurrentParameters();
    }

    loadDefaultParameters() {
        /**
         * Model
         */
        this.maxSpeed = 30;             // max velocity
        this.accelRate = 15;            // how fast it accelerates (m/s^2)
        this.brakeRate = 20;            // braking rate
        this.reverseAccelRate = 10;     // acceleration rate in reverse (m/s^2)
        this.friction = 5;              // natural slowdown (m/s^2)
        this.boostAccelMultiplier = 1.5   // when boost, accelRate gets multiplied by this
        this.turnRotationLoss = 5;
    }

    initializeCurrentParameters() {
        // For movement
        this.speed = 0;                 // current velocity (m/s)
        this.wheelSpinSpeed = 0;        // current wheel spin velocity
        this.acceleration = 0;          // current acceleration (m/s^2)
    }

    calculateAcc() {
        if (this.inputsActions.brake) {
            // BRAKE has priority over other actions
            if (this.speed > 0) {
                this.acceleration = -this.brakeRate;
            } else if (this.speed < 0) {
                this.acceleration = this.brakeRate;
            } else {
                this.acceleration = 0;
            }
        } else if (this.inputsActions.up && !this.inputsActions.down) {
            // Only UP is activated
            if (this.speed >= 0) {
                this.acceleration = this.accelRate;   // accelerate forward
                if (this.inputsActions.boost) this.acceleration *= this.boostAccelMultiplier;
            } else {
                this.acceleration = this.brakeRate;
            }
        } else if (this.inputsActions.down && !this.inputsActions.up) {
            // Only DOWN is activated
            if (this.speed <= 0) {
                this.acceleration = -this.reverseAccelRate;
                if (this.inputsActions.boost) this.acceleration *= this.boostAccelMultiplier;
            } else {
                this.acceleration = -this.brakeRate;  // accelerate backward (brake/reverse)
            }
        } else {
            // No inputs: apply friction toward 0 velocity
            if (this.speed > 0) {
                this.acceleration = -this.friction;
            } else if (this.speed < 0) {
                this.acceleration = this.friction;
            } else {
                this.acceleration = 0;
            }
        }
    }

    calculateSpeed() {
        // 2.1. Update velocity (integrate acceleration)
        this.speed += this.acceleration * this.time.delta;
        // 2.2. Clamp to limits
        let maxSpeedBoost = this.maxSpeed;
        if (this.inputsActions.boost) maxSpeedBoost *= this.boostAccelMultiplier;
        this.speed = Math.min(Math.max(this.speed, -maxSpeedBoost), maxSpeedBoost);
        // 2.3. Prevent small jitter when nearly stopped
        if (Math.abs(this.speed) < 0.001) this.speed = 0;
    }

    update() {
        this.calculateAcc();
        this.calculateSpeed();

        this.updateStatsPanel();
    }

    loadDebugger(debugFolder) {
        if (this.debug.active) {
            // Folder with arcade like physics
            this.arcadeDebugFolder = debugFolder.addFolder('arcade_physics');
            this.arcadeDebugFolder
                .add(this, 'maxSpeed')
                .name('max_speed')
                .min(5).max(30).step(0.1);
            this.arcadeDebugFolder
                .add(this, 'accelRate')
                .name('acceleration')
                .min(1).max(50).step(0.1);
            this.arcadeDebugFolder
                .add(this, 'brakeRate')
                .name('braking')
                .min(1).max(75).step(0.1);
            this.arcadeDebugFolder
                .add(this, 'friction')
                .name('friction')
                .min(0).max(50).step(0.1);
        }
    }

    updateStatsPanel() {
        if (this.debug.active) {
            this.debug.stats.speed = Number.parseFloat(this.speed).toFixed(2);
            this.debug.stats.accel = Number.parseFloat(this.acceleration).toFixed(2);
            this.debug.stats.engineForce = undefined;
        }
    }

}