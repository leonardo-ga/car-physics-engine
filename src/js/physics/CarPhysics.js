import * as THREE from 'three';
import Base from '../Base';
import SafeMath from '../utils/SafeMath'

export default class CarPhysics {

    constructor(params = {}) {
        this.base = new Base();
        this.scene = this.base.scene;

        this.debug = this.base.debug;
        this.time = this.base.time;
        this.inputs = this.base.inputs;
        this.inputsActions = this.inputs.actions;

        this.SafeMath = this.base.SafeMath;

        this.loadDefaultParameters(params);
        this.initializeCurrentParameters();

        // Debug
        this.loadDebugger();
    }

    loadDefaultParameters(params) {
        this.mass = params.mass || 1200;                    // [kg]
        this.rearWheelMass = params.rearWheelMass || 75;    // [kg]
        this.frontWheelMass = params.frontWheelMass || 75;  // [kg]
        this.wheelBase = params.wheelBase || 2.6; // L = distance between axles [m]
        this.cgToFront = params.cgToFront || 1.3; // b [m] distance from CG to front axle
        this.cgToRear = this.wheelBase - this.cgToFront; // c [m]
        this.cgHeight = params.cgHeight || 0.45; // h [m]
        this.inertiaYaw = params.inertiaYaw || 1500; // approximate yaw moment of inertia [kg*m^2]

        // longitudinal constants
        this.C_drag = params.C_drag || 0.4257; // drag coefficient used in the article example
        this.C_rr = params.C_rr || 12.8;   // rolling resistance approx. 30x drag as article
        this.engineForceMax = params.engineForceMax || 6000; // peak drive force [N], simplified
        this.brakeForceMax = params.brakeForceMax || 10000; // braking force [N]
        this.g = 9.81;

        // for torque
        this.idleRPM = 1000;
        this.minRPM = 2500;
        this.maxRPM = 5500;
        this.currentGear = 1;
        this.maxGear = 6;
        this.gearRatios = new Array(-2.90, 2.66, 1.78, 1.30, 1.00, 0.74, 0.50);// gears: R, 1, 2, 3, 4, 5, 6
        this.diffRatio = 3.42;
        this.transmissionEfficiency = 0.7;
        this.rearWheelAngularVelocity = 0;    // [rad/s] calculated with slip
        this.frontWheelAngularVelocity = 0;   // [rad/s] usually omega
        this.rearWheelAngularAcceleration = 0;

        // for slip
        this.C_t_perWheel = 20000;   // traction constant [N]

        // wheel / tire
        this.rearWheelRadius = params.rearWheelRadius || 0.34;      // [m]
        this.frontWheelRadius = params.frontWheelRadius || 0.34;    // [m]
        this.mu = params.mu || 1.0; // friction coefficient for limiting lateral force
        this.cornerStiffnessFront = params.cornerStiffnessFront || 8000; // [N/rad] per wheel (linear approximation)
        this.cornerStiffnessRear = params.cornerStiffnessRear || 8000;

        // dynamic state (2D)
        this.pos = new THREE.Vector3(0, 1, 0);    // world position [m]
        this.vel = new THREE.Vector3(0, 0, 0);    // velocity in world coords [m/s]
        this.rearWheelRotationMovement = 0;      // Movement for rear wheel spin [m]
        this.frontWheelRotationMovement = 0;     // Movement for front wheel spin [m]
        this.angle = params.angle || 0;     // yaw angle [rad], 0 points along +X
        this.omegaYaw = 0;                     // yaw rate [rad/s]

        // control inputs (set externally)
        this.throttle = 0;      // 0..1
        this.brake = 0;         // 0..1
        this.steerAngle = 0;    // [rad] (front wheel steer angle), limited below
        this.clutch = 1;        // TODO: this is always 1 (could be 0 if we push the clutch)

        // steering limits
        this.maxSteer = 0.6; // [rad] ~34 degrees

        // stats
        this.speed = 0;
        this.longForce = 0;
        this.acceleration = 0;
        this.Wf = 0;
        this.Wr = 0;
        this.engineRPM = 0;

        // For traction and brake torque
        this.Wr_perWheel = 0;
        this.F_norm_perRearWheel_max = 0;

        // For error approximations
        this.errApprox = 0.001;

        // Forces calculated
        this.F_tot = 0;
        this.F_long = new THREE.Vector3(0, 0, 0);    // longitudinal force
        this.F_lat = new THREE.Vector3(0, 0, 0);     // lateral force

        // For turn slip angle
        this.Fy_front = 0;
        this.Fy_rear = 0;
        this.L_rel_front = 0.3;
        this.L_rel_rear  = 0.6;
    }

    initializeCurrentParameters() {//TODO
        this.speed = 0;
        this.totalForce = 0;
    }

    getCarHeading() {
        return new THREE.Vector3(this.SafeMath.cos(this.angle), 0, -this.SafeMath.sin(this.angle));
    }

    update() {
        this.updateControls();
        this.straightLine();

        this.turn();

        // Debug
        this.updateStatsPanel();
    }

    updateControls() {
        //this.throttle = this.inputsActions.up || this.inputsActions.down ? 1 : 0;
        // Brake pedal
        this.brake = this.inputsActions.brake ? 1 : 0;
        // UP input
        if (this.inputsActions.up && this.speed > - this.errApprox) {// If UP and going UP => throttle
            this.throttle = 1;
            if (this.currentGear === 0) {// If was in REVERSE => put 1 gear
                this.currentGear = 1;
            }
        } else if (this.inputsActions.up && this.speed <= - this.errApprox) {// If Up and going DOWN => brake
            this.brake = 1;
        }
        // DOWN input
        if (this.inputsActions.down && this.speed < this.errApprox) {// If DOWN and going DOWN => throttle
            this.throttle = 1;
            if (this.currentGear > 0) {// If whas in forward gear => put REVERSE
                this.currentGear = 0;
            }
        } else if (this.inputsActions.down && this.speed >= this.errApprox) {// If DOWN and going UP => brake
            this.brake = 1;
        }
        // If no UP or DOWN (or both) => no throttle
        if (this.inputsActions.up === this.inputsActions.down) {
            this.throttle = 0;
        }

        //TODO: steering

        //TODO: remove!
        //this.throttle = 1;
    }

    // Curving physics
    turn() {
        // Delta Time //TODO: check if correct
        const dt = this.time.delta;

        // --- 1. Get forward heading and side vector ---
        const heading = this.getCarHeading().normalize(); // forward vector
        const side = new THREE.Vector3(-heading.z, 0, heading.x); // right vector

        // --- 2. Compute speed along heading ---
        const speed = this.vel.dot(heading);
        this.speed = speed;

        // --- 3. Transform velocity into local car coordinates ---
        // So v_local.x is forward and v_local.z is left/right ??
        let v_local = this.transformByAngle(this.vel, - this.angle);
        const vx = v_local.x;   // forward
        const vz = v_local.z;   // lateral

        // --- 4. Compute slip angles ---
        const minSpeedForSlip = 1.0; // avoids noise at zero speed
        let alpha_f = 0;
        let alpha_r = 0;
        if (Math.abs(this.speed) > minSpeedForSlip) {
            alpha_f = Math.atan2(v_local.z + this.omegaYaw * this.cgToFront, Math.abs(v_local.x)) - this.steerAngle * Math.sign(v_local.x);//TODO: check calc
            alpha_r = Math.atan2(v_local.z - this.omegaYaw * this.cgToRear, Math.abs(v_local.x));
        }

        // --- 5. Compute steady-state lateral forces (Pacejka Magic Formula) ---
        const Ff_ss = this.pacejka_formula_slipAngle(alpha_f, 25, 1.8, this.mu * this.Wf, 0.8);
        const Fr_ss = this.pacejka_formula_slipAngle(alpha_r, 25, 1.8, this.mu * this.Wr, 0.8);

        // --- 6. Dynamic (relaxation length) model for transient response ---
        const vx_abs = Math.abs(v_local.x);
        // dFy/dt = (vx / L_rel) * (Fy_ss - Fy)
        const dFy_f = (vx_abs / this.L_rel_front) * (Ff_ss - this.Fy_front);
        const dFy_r = (vx_abs / this.L_rel_rear) * (Fr_ss - this.Fy_rear);

        this.Fy_front += dFy_f * dt;
        this.Fy_rear  += dFy_r * dt;

        const F_f_lat = this.Fy_front;
        const F_r_lat = this.Fy_rear;

        // --- 7. Convert lateral forces to world space ---
        const side_f = side.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.steerAngle);
        const side_r = side.clone();

        let F_lat_world = side_f.clone().multiplyScalar(F_f_lat).add(side_r.clone().multiplyScalar(F_r_lat));

        // ---- Stats ----
        this.f_lat = F_lat_world;

        // --- 8. Update car velocity (world space) ---
        const a_lat = F_lat_world.clone().divideScalar(this.mass);
        this.vel.addScaledVector(a_lat, dt);

        // --- 9. Update yaw ---
        const torqueYaw = F_f_lat * this.cgToFront * Math.cos(this.steerAngle) - F_r_lat * this.cgToRear;
        const alphaYaw = torqueYaw / this.inertiaYaw;
        this.omegaYaw += alphaYaw * dt;
        this.angle += this.omegaYaw * dt;

        // --- 10. Longitudinal acceleration ---
        const ax = (this.F_long.dot(heading) / this.mass) - this.omegaYaw * v_local.z;

        // update local velocity with longitudinal acceleration
        v_local = this.transformByAngle(this.vel, -this.angle); // recalc local velocity
        v_local.x += ax * dt;
        //v_local.z += az * dt;
        this.vel = this.transformByAngle(v_local, this.angle);

        // --- 11. Update position ---
        this.pos.addScaledVector(this.vel, dt);

    }

    transformByAngle(v, angle) {
        // Create rotation matrix from car yaw (angle)
        const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
        let v_local = v.clone().applyMatrix4(rotationMatrix);
        v_local = this.SafeMath.sanitize_vec(v_local);
        return v_local;
    }

    pacejka_formula_slipAngle(x, B = 25, C = 1.8, D = 6325, E = 0.8) {
        return D * Math.sin(C * Math.atan(B * (1 - E) * x + E * Math.atan(B * x)));
    }

    // Straight line physics w/out longitudinal slip
    straightLine() {
        // Delta Time //TODO: check if correct
        const dt = this.time.delta;
        // Car heading //TODO: check calc
        const heading = this.getCarHeading();

        // Speed (vel magnitude)
        const speed = this.vel.dot(heading);
        this.speed = speed;

        // Drag
        const F_drag = this.vel.clone().multiplyScalar(- this.C_drag * speed);//TODO: modulo di this.vel
        // Rolling resistance
        const F_rr = this.vel.clone().multiplyScalar(- this.C_rr);//TODO: this.vel.dot(h) * h, where h = (dir_front + dir_rear).normalize()

        // Traction
        const driveForce = this.getDriveForce();
        const F_trac = heading.clone().multiplyScalar(driveForce);
        // Braking
        let brakeForce = this.brake * this.brakeForceMax * Math.sign(this.speed);
        const F_brake = heading.clone().multiplyScalar(- brakeForce);

        // Total Longitudinal
        this.F_tot = F_trac.clone().add(F_brake).add(F_drag).add(F_rr);
        this.F_long = heading.clone().multiplyScalar(this.F_tot.dot(heading));
        //this.F_lat.subVectors(this.F_tot, this.F_long);

        // Acceleration
        let a_long = this.F_long.clone().divideScalar(this.mass);

        // Velocity
        this.vel.addScaledVector(a_long, dt);
        // Position
        this.pos.addScaledVector(this.vel, dt);

        // ----- Stats -----
        this.speed = speed;
        this.longForce = this.F_long.dot(heading);
        this.acceleration = a_long.dot(heading);

        // Weight transfer
        this.setWeightTransfer();

        // Rear wheel velocity
        this.rearWheelAngularVelocity = this.speed / this.rearWheelRadius;
        this.rearWheelRotationMovement = this.rearWheelAngularVelocity * dt;
        // Front wheel rotation
        this.frontWheelAngularVelocity = this.speed / this.frontWheelRadius;
        this.frontWheelRotationMovement = this.frontWheelAngularVelocity * dt;

        // Check fo accuracy
        //TODO: check in needed
        if (Math.abs(this.longForce) < this.errApprox) {
            this.F_long = new THREE.Vector3(0, 0, 0);
            this.longForce = 0;
            a_long = new THREE.Vector3(0, 0, 0);
            this.acceleration = 0;
        }
        if (Math.abs(this.speed) < this.errApprox && this.brake) {
            this.vel = new THREE.Vector3(0, 0, 0);
            this.speed = 0;
        }
    }

    // Straight line physics w/ slip
    /**
     * @todo
     */
    straightLineWithSlip() {
        // Delta Time //TODO: check if correct
        const dt = this.time.delta;
        // Car heading //TODO: check calc
        const heading = this.getCarHeading();

        // Speed (vel magnitude)
        const speed = this.vel.dot(heading);
        this.speed = speed;


        // Torque approach
        const driveTorque = this.getDriveTorque();
        const totTractionTorque = false ? 0 : this.getTractionTorque();//TODO: put definitive version
        const brakeTorque = this.getBrakeTorque();
        const totTorque = driveTorque - totTractionTorque - brakeTorque;

        const totInertia = this.getRearWheelsInertia();

        this.rearWheelAngularAcceleration = totTorque / totInertia;
        this.rearWheelAngularVelocity += this.rearWheelAngularAcceleration * dt;
        this.rearWheelRotationMovement = this.rearWheelAngularVelocity * dt;

        const F_long_module = totTorque / this.rearWheelRadius;

        // Dra
        const F_drag = this.vel.clone().multiplyScalar(- this.C_drag * speed);
        // Rolling resistance
        const F_rr = this.vel.clone().multiplyScalar(- this.C_rr);

        let F_long = heading.clone().multiplyScalar(F_long_module);
        F_long.add(F_drag).add(F_rr);
        this.longForce = F_long.dot(heading);

        let a_long = F_long.clone().divideScalar(this.mass);
        this.acceleration = a_long.dot(heading);

        // Weight transfer
        this.setWeightTransfer();

        this.vel.addScaledVector(heading, this.acceleration * dt);
        this.pos.addScaledVector(this.vel, dt);
        this.speed = this.vel.dot(heading);

        // Front wheel rotation
        this.frontWheelAngularVelocity = this.speed / this.frontWheelRadius;
        this.frontWheelRotationMovement = this.frontWheelAngularVelocity * dt;

        // Check fo accuracy
        //TODO: check in needed
        if (Math.abs(this.longForce) < this.errApprox) {
            F_long = new THREE.Vector3(0, 0, 0);
            this.longForce = 0;
            a_long = new THREE.Vector3(0, 0, 0);
            this.acceleration = 0;
        }
        if (Math.abs(this.speed) < this.errApprox && this.brake) {
            this.vel = new THREE.Vector3(0, 0, 0);
            this.speed = 0;
        }
    }

    /**
     * @deprecated First simple engineForge calculator... replaced by getEngineForce().
     */
    getEngineForce() {
        const engineForce = this.throttle * this.engineForceMax;
        return engineForce;
    }

    getDriveForce() {
        const driveTorque = this.getDriveTorque();
        const driveForce = driveTorque / this.rearWheelRadius;
        return driveForce;
    }

    getDriveTorque() {
        const gearRatio = this.gearRatios[this.currentGear];
        let engineRPM = this.rearWheelAngularVelocity * gearRatio * this.diffRatio * (60 / (2 * Math.PI));
        engineRPM = Math.max(this.idleRPM, Math.abs(engineRPM));//TODO: check calc (I puth .abs() to consider 'reverse' RPM)
        // Shift up/down
        this.shiftGear(engineRPM);
        // Calc torque
        const engineTorqueMax = this.getEngineTorque(engineRPM);
        const engineTorque = this.throttle * engineTorqueMax;
        const driveTorque = engineTorque * gearRatio * this.diffRatio * this.transmissionEfficiency * this.clutch;
        // ----- Stats -----
        this.engineRPM = engineRPM;
        // Return value
        return driveTorque;
    }

    getEngineTorque(rpm, T_max = 400, RPM_peak = 3000) {
        const ratio = rpm / RPM_peak;
        return T_max * ratio * Math.exp(1 - ratio);
    }

    shiftGear(rpm) {
        if (this.currentGear === 0)
            return;
        if (rpm > this.maxRPM && this.currentGear < this.maxGear)
            this.currentGear += 1;
        if (rpm < this.minRPM && this.currentGear > 1)
            this.currentGear -= 1;
    }

    getTractionTorque() {
        const minAbsSpeed = Math.max(Math.abs(this.speed), 0.1);
        let slipRatio = (this.rearWheelAngularVelocity * this.rearWheelRadius - this.speed) / minAbsSpeed;
        // Clamp slip for numerical stability
        slipRatio = THREE.MathUtils.clamp(slipRatio, -1.0, 1.0);

        const F_long_traction = this.pacejka_formula(slipRatio) * this.mu * this.Wr_perWheel;
        const T_long_traction = (2 * F_long_traction) * this.rearWheelRadius;
        return T_long_traction;
    }

    pacejka_formula(x, B = 0.714, C = 1.40, D = 1.00, E = - 0.20) {
        return D * Math.sin(C * Math.atan(B * (1 - E) * x + E * Math.atan(B * x)));
    }

    getBrakeTorque() {
        let brakeForce = this.brake * this.brakeForceMax;
        brakeForce = THREE.MathUtils.clamp(brakeForce,
            -this.F_norm_perRearWheel_max,
            this.F_norm_perRearWheel_max);
        const brakeTorque = brakeForce * this.rearWheelRadius * Math.sign(this.speed);
        return brakeTorque;
    }

    getRearWheelsInertia() {
        const rearWheelInertia = (this.rearWheelMass * this.rearWheelRadius * this.rearWheelRadius) / 2;
        const engineInertia = 0.4; // 0.2-0.4 [kg m^2]
        const reflectedInertia = engineInertia * Math.pow(this.gearRatios[this.currentGear] * this.diffRatio, 2);
        const driveshaftInertia = 2; // 1-2 [kg m^2]
        const totInertia = 2 * rearWheelInertia + reflectedInertia + driveshaftInertia;
        return totInertia;
    }

    setWeightTransfer() {
        const W = this.mass * this.g;
        const Wf = (this.cgToRear / this.wheelBase) * W - (this.cgHeight / this.wheelBase) * this.mass * this.acceleration;
        const Wr = (this.cgToFront / this.wheelBase) * W + (this.cgHeight / this.wheelBase) * this.mass * this.acceleration;
        // Suppose that the car is rear wheel drive
        this.Wr_perWheel = Wr / 2;
        this.F_norm_perRearWheel_max = this.mu * this.Wr_perWheel;

        // ----- Stats -----
        this.Wf = Wf;
        this.Wr = Wr;
    }

    /**
     * DEBUG
     */

    updateStatsPanel() {
        if (this.debug.active) {
            // General
            this.debug.stats.speed = Number.parseFloat(this.speed).toFixed(2);
            this.debug.stats.speedKMH = Number.parseFloat(this.speed * 3.6).toFixed(0);
            this.debug.stats.engineForce = Number.parseFloat(this.longForce).toFixed(2);
            this.debug.stats.accel = Number.parseFloat(this.acceleration).toFixed(2);
            this.debug.stats.Wf = Number.parseFloat(this.Wf).toFixed(2);
            this.debug.stats.Wr = Number.parseFloat(this.Wr).toFixed(2);
            // Engine
            this.debug.stats.engineRPM = Number.parseFloat(this.engineRPM).toFixed(0);
            this.debug.stats.currentGear = (this.speed === 0) ? 'N' : ((this.currentGear === 0) ? 'R' : this.currentGear);
            // Wheels
            this.debug.stats.rearWheelAngularAcceleration = Number.parseFloat(this.rearWheelAngularAcceleration).toFixed(2);
            this.debug.stats.rearWheelAngularVelocity = Number.parseFloat(this.rearWheelAngularVelocity).toFixed(2);
            this.debug.stats.frontWheelAngularVelocity = Number.parseFloat(this.frontWheelAngularVelocity).toFixed(2);
        }
    }

    loadDebugger() {
        if (this.debug.active) {
            // Physics debug folder
            this.debugFolder = this.debug.ui.addFolder('car_physics');
            this.debugFolder
                .add(this, 'mass')
                .name('mass')
                .min(1).max(5000).step(1);
            this.debugFolder
                .add(this, 'rearWheelMass')
                .name('rear_wheel_mass')
                .min(1).max(50000).step(1);
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
            //this.debugFolder
            //    .add(this, 'C_t_perWheel')
            //    .name('Ct_per_wheel')
            //    .min(0).max(100000).step(100);
            this.debugFolder
                .add(this, 'mu')
                .name('mu-friction_coeff')
                .min(0).max(5).step(0.01);
            this.debugFolder
                .add(this, 'errApprox')
                .name('error_approx')
                .min(0).max(0.1).step(0.001);
        }
    }
}