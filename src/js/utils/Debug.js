import * as dat from 'lil-gui';

export default class Debug {

    constructor() {
        this.active = window.location.hash === '#debug';

        if(this.active) {
            this.ui = new dat.GUI();
            this.stats = {
                speed: 0,
                accel: 0,
                engineForce: 0
            };
            this.statsPanel = document.querySelector('div.statsPanel');
        }
    }

    update() {
        if(this.active) {
            this.statsPanel.innerHTML = (!!this.stats.speed ? `<div>Speed: ${this.stats.speed} km/h</div>` : ``)
                                    + (!!this.stats.accel ? `<div>Acceleration: ${this.stats.accel} m/s²</div>` : ``)
                                    + (!!this.stats.engineForce ? `<div>Engine Force: ${this.stats.engineForce} N</div>` : ``);
        }
    }

}