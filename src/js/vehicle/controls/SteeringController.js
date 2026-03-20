export default class SteeringController {

    constructor({
        inputs,
        time,
        maxAngle,
        speed,
        approximation
    }) {
        this.inputs = inputs;
        this.time = time;
        this.maxAngle = maxAngle;
        this.speed = speed;
        this.approximation = approximation;

        this.currentAngle = 0;
        this.targetAngle = 0;

        this.bindInputs();
    }

    bindInputs() {
        this.handleKeyDown = (key) => {
            if (key === 'ArrowLeft' || key === 'KeyA') {
                this.shiftTarget(this.maxAngle);
            } else if (key === 'ArrowRight' || key === 'KeyD') {
                this.shiftTarget(-this.maxAngle);
            }
        };

        this.handleKeyUp = (key) => {
            if (key === 'ArrowLeft' || key === 'KeyA') {
                this.shiftTarget(-this.maxAngle);
            } else if (key === 'ArrowRight' || key === 'KeyD') {
                this.shiftTarget(this.maxAngle);
            }
        };

        this.inputs.on('!keydown', this.handleKeyDown);
        this.inputs.on('keyup', this.handleKeyUp);
    }

    shiftTarget(delta) {
        const nextTarget = this.targetAngle + delta;
        this.targetAngle = Math.min(Math.max(nextTarget, -this.maxAngle), this.maxAngle);
    }

    update() {
        if (this.currentAngle === this.targetAngle) {
            return this.currentAngle;
        }

        const diff = this.targetAngle - this.currentAngle;

        if (Math.abs(diff) > this.approximation) {
            const step = this.speed * this.time.delta;

            if (Math.abs(diff) < step) {
                this.currentAngle = this.targetAngle;
            } else {
                this.currentAngle += Math.sign(diff) * step;
            }
        } else {
            this.currentAngle = this.targetAngle;
        }

        return this.currentAngle;
    }
}
