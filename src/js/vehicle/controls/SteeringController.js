export default class SteeringController {

    constructor({
        inputs,
        maxAngle,
        speed,
        approximation
    }) {
        this.inputs = inputs;
        this.maxAngle = maxAngle;
        this.speed = speed;
        this.approximation = approximation;

        this.currentAngle = 0;
        this.targetAngle = 0;
    }

    update(delta) {
        const steerInput = (this.inputs.actions.left ? 1 : 0) - (this.inputs.actions.right ? 1 : 0);
        this.targetAngle = steerInput * this.maxAngle;

        if (this.currentAngle === this.targetAngle) {
            return this.currentAngle;
        }

        const diff = this.targetAngle - this.currentAngle;

        if (Math.abs(diff) > this.approximation) {
            const step = this.speed * delta;

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
