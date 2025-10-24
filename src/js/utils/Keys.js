import Events from "./Events";

export default class Keys extends Events {

    constructor() {
        super();

        // Arrow key controls
        this.keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
        window.addEventListener('keydown', (e) => {
            if (!e.repeat) {
                console.log('Initial press: ' + e.key)
                if (this.keysPressed.hasOwnProperty(e.code)) {
                    this.keysPressed[e.code] = true;
                }
                //this.world.car.turnWheels(keysPressed, e.key);
                this.trigger('keydown', [e.key]);
            } else {
                console.log('Held key repeating: ' + e.key)
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.keysPressed.hasOwnProperty(e.code)) {
                this.keysPressed[e.code] = false;
            }
            //this.world.car.turnWheels(keysPressed, e.key);
            this.trigger('keyup', [e.key]);
        });

    }

}