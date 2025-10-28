import Base from '../Base';

export default class CarPhysics {

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
    // Physical parameters (tweak these)
    this.mass = 1200;                // kg — average car
    this.engineForce = 8000;         // N (Newtons)
    this.reverseForce = 4000;        // N
    this.brakeForce = 12000;         // N
    this.boostMultiplier = 1.5;      // 50% extra acceleration
    this.dragCoefficient = 0.4257;   // air drag constant (N per m/s²)
    this.rollingResistance = 12.8;   // tire resistance
    this.maxSpeed = 60;              // m/s (~216 km/h)
  }

  initializeCurrentParameters() {
    this.speed = 0;
    this.totalForce = 0;
  }

  update() {
    const { up, down, brake, boost } = this.inputsActions;
    const speed = this.speed;
    const dir = Math.sign(speed);
    
    let totalForce = 0;

    // 1. ENGINE FORCE (Throttle)
    if (up && !down) {
      if (speed >= 0) {
        totalForce += this.engineForce * (boost ? this.boostMultiplier : 1);
      } else {
        // braking before reversing direction
        totalForce += this.brakeForce;
      }
    } else if (down && !up) {
      if (speed <= 0) {
        totalForce -= this.reverseForce * (boost ? this.boostMultiplier : 1);
      } else {
        totalForce -= this.brakeForce;
      }
    }

    // 2. BRAKE INPUT
    if (brake) {
      totalForce -= dir * this.brakeForce;
    }

    // 3. DRAG (air resistance)
    const drag = this.dragCoefficient * speed * speed * dir;

    // 4. ROLLING RESISTANCE (tires)
    const rolling = this.rollingResistance * dir;

    // Combine resistance forces
    totalForce -= drag + rolling;

    // 5. ACCELERATION (Newton’s 2nd Law)
    this.acceleration = totalForce / this.mass;
    this.totalForce = totalForce;

    // 6. INTEGRATE VELOCITY
    this.speed += this.acceleration * this.time.delta;

    // Clamp to max speed
    this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.speed, this.maxSpeed));

    // Prevent jitter near zero
    if (Math.abs(this.speed) < 0.01) this.speed = 0;

    // 7. Apply to car position
    //const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.car.quaternion);
    //this.car.position.addScaledVector(forward, this.speed * this.time.delta);

    this.updateStatsPanel();
  }

  updateStatsPanel() {
    if (this.debug.active) {
      this.debug.stats.speed = Number.parseFloat(this.speed).toFixed(2);
      this.debug.stats.accel = Number.parseFloat(this.acceleration).toFixed(2);
      this.debug.stats.engineForce = Number.parseFloat(this.totalForce).toFixed(2);
    }
  }

  loadDebugger(debugFolder) {
    if(this.debug.active) {
      // Folder with real physics
      this.physicsDebugFolder = debugFolder.addFolder('real_physics');
      this.physicsDebugFolder
          .add(this, 'mass')
          .name('mass')
          .min(0).max(5000).step(1);
      this.physicsDebugFolder
          .add(this, 'engineForce')
          .name('engine_force')
          .min(0).max(20000).step(10);
      this.physicsDebugFolder
          .add(this, 'reverseForce')
          .name('reverse_force')
          .min(0).max(20000).step(10);
      this.physicsDebugFolder
          .add(this, 'brakeForce')
          .name('brake_force')
          .min(0).max(20000).step(10);
      this.physicsDebugFolder
          .add(this, 'boostMultiplier')
          .name('boost_multiplier')
          .min(1).max(10).step(0.1);
      this.physicsDebugFolder
          .add(this, 'dragCoefficient')
          .name('drag_coefficient')
          .min(0).max(1).step(0.0001);
      this.physicsDebugFolder
          .add(this, 'rollingResistance')
          .name('rolling_resistance')
          .min(0).max(100).step(0.1);
      this.physicsDebugFolder
          .add(this, 'maxSpeed')
          .name('max_speed')
          .min(10).max(100).step(0.1);
    }
  }

}