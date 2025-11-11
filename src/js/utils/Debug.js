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
                // Engine
                engineRPM: 0,
                currentGear: 1,
                // Wheels
                rearWheelAngularAcceleration: 0,
                rearWheelAngularVelocity: 0,
                frontWheelAngularVelocity: 0
            };
        } else {
            this.statsPanel.style.display = 'none';
        }
    }

    update() {
        if(this.active) {
            this.statsPanel.innerHTML = `<h3>----- General -----</h3>`
                                    + (!!this.stats.speed ? `<div>Speed: ${this.stats.speed} m/s = ${this.stats.speedKMH} km/h</div>` : ``)
                                    + (!!this.stats.engineForce ? `<div>Engine Force: ${this.stats.engineForce} N</div>` : ``)
                                    + (!!this.stats.accel ? `<div>Acceleration: ${this.stats.accel} m/s²</div>` : ``)
                                    + (!!this.stats.Wf ? `<div>Front weight: ${this.stats.Wf} N</div>` : ``)
                                    + (!!this.stats.Wr ? `<div>Rear weight: ${this.stats.Wr} N</div>` : ``)
                                    + `<h3>----- Engine -----</h3>`
                                    + (!!this.stats.engineRPM ? `<div>Engine RPM: ${this.stats.engineRPM}</div>` : ``)
                                    + (this.stats.currentGear !== undefined ? `<div>Current gear: ${this.stats.currentGear}</div>` : ``)
                                    + `<h3>----- Wheels -----</h3>`
                                    + (!!this.stats.rearWheelAngularAcceleration ? `<div>Rear angular vel: ${this.stats.rearWheelAngularAcceleration} rad/s</div>` : ``)
                                    + (!!this.stats.rearWheelAngularVelocity ? `<div>Rear angular vel: ${this.stats.rearWheelAngularVelocity} rad/s</div>` : ``)
                                    + (!!this.stats.frontWheelAngularVelocity ? `<div>Front angular vel: ${this.stats.frontWheelAngularVelocity} rad/s</div>` : ``);

        }
    }

}