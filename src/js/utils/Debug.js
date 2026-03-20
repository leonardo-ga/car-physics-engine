import * as dat from 'lil-gui';

export default class Debug {

    constructor() {
        this.active = window.location.hash === '#debug';
        this.statsPanel = document.querySelector('div.statsPanel');

        if(this.active) {
            this.ui = new dat.GUI();
            this.stats = {
                // General
                speed: 0,
                speedKMH: 0,
                engineForce: 0,
                accel: 0,
                Wf: 0,
                Wr: 0,
                vx: 0,
                vy: 0,
                beta: 0,
                yawRate: 0,
                alphaFront: 0,
                alphaRear: 0,
                slipRatio: 0,
                // Engine
                engineRPM: 0,
                currentGear: 1,
                // Wheels
                rearWheelAngularAcceleration: 0,
                rearWheelAngularVelocity: 0,
                frontWheelAngularVelocity: 0
            };
        } else if(this.statsPanel) {
            this.statsPanel.style.display = 'none';
        }
    }

    update() {
        if(this.active && this.statsPanel) {
            this.statsPanel.innerHTML = [
                `<h3>----- General -----</h3>`,
                `<div>Speed: ${this.stats.speed} m/s = ${this.stats.speedKMH} km/h</div>`,
                `<div>Engine Force: ${this.stats.engineForce} N</div>`,
                `<div>Acceleration: ${this.stats.accel} m/s²</div>`,
                `<div>Front weight: ${this.stats.Wf} N</div>`,
                `<div>Rear weight: ${this.stats.Wr} N</div>`,
                `<div>Local vx: ${this.stats.vx} m/s</div>`,
                `<div>Local vy: ${this.stats.vy} m/s</div>`,
                `<div>Sideslip beta: ${this.stats.beta} rad</div>`,
                `<div>Yaw rate: ${this.stats.yawRate} rad/s</div>`,
                `<div>Slip angle front: ${this.stats.alphaFront} rad</div>`,
                `<div>Slip angle rear: ${this.stats.alphaRear} rad</div>`,
                `<div>Rear slip ratio: ${this.stats.slipRatio}</div>`,
                `<h3>----- Engine -----</h3>`,
                `<div>Engine RPM: ${this.stats.engineRPM}</div>`,
                `<div>Current gear: ${this.stats.currentGear}</div>`,
                `<h3>----- Wheels -----</h3>`,
                `<div>Rear angular accel: ${this.stats.rearWheelAngularAcceleration} rad/s²</div>`,
                `<div>Rear angular vel: ${this.stats.rearWheelAngularVelocity} rad/s</div>`,
                `<div>Front angular vel: ${this.stats.frontWheelAngularVelocity} rad/s</div>`
            ].join('');
        }
    }

}
