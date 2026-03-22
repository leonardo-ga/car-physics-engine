export default class DriveCommandController {

    constructor({
        inputs,
        approximation = 0.05,
        throttleRiseRate = 4,
        throttleFallRate = 6,
        brakeRiseRate = 8,
        brakeFallRate = 10
    }) {
        this.inputs = inputs;
        this.approximation = approximation;
        this.throttleRiseRate = throttleRiseRate;
        this.throttleFallRate = throttleFallRate;
        this.brakeRiseRate = brakeRiseRate;
        this.brakeFallRate = brakeFallRate;

        this.commandState = {
            throttle: 0,
            brake: 0,
            steerAngle: 0,
            driveDirection: 1
        };
    }

    update(delta, speed, steerAngle) {
        const wantsForward = this.inputs.actions.up && !this.inputs.actions.down;
        const wantsReverse = this.inputs.actions.down && !this.inputs.actions.up;
        const wantsBrake = this.inputs.actions.brake;

        let throttleTarget = 0;
        let brakeTarget = wantsBrake ? 1 : 0;

        if (wantsForward) {
            this.commandState.driveDirection = 1;

            if (speed < -this.approximation) {
                brakeTarget = 1;
            } else {
                throttleTarget = 1;
            }
        } else if (wantsReverse) {
            this.commandState.driveDirection = -1;

            if (speed > this.approximation) {
                brakeTarget = 1;
            } else {
                throttleTarget = 1;
            }
        }

        this.commandState.throttle = this.moveTowards(
            this.commandState.throttle,
            throttleTarget,
            (throttleTarget > this.commandState.throttle ? this.throttleRiseRate : this.throttleFallRate) * delta
        );

        this.commandState.brake = this.moveTowards(
            this.commandState.brake,
            brakeTarget,
            (brakeTarget > this.commandState.brake ? this.brakeRiseRate : this.brakeFallRate) * delta
        );

        this.commandState.steerAngle = steerAngle;

        return this.commandState;
    }

    moveTowards(current, target, maxDelta) {
        if (Math.abs(target - current) <= maxDelta) {
            return target;
        }

        return current + Math.sign(target - current) * maxDelta;
    }
}
