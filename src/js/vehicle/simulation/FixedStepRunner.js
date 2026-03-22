export default class FixedStepRunner {

    constructor({
        fixedDelta = 1 / 120,
        maxSubsteps = 12
    } = {}) {
        this.fixedDelta = fixedDelta;
        this.maxSubsteps = maxSubsteps;
        this.accumulator = 0;
    }

    advance(frameDelta, stepFn) {
        const maxAccumulatedTime = this.fixedDelta * this.maxSubsteps;
        this.accumulator = Math.min(this.accumulator + frameDelta, maxAccumulatedTime);

        let steps = 0;

        while (this.accumulator >= this.fixedDelta && steps < this.maxSubsteps) {
            stepFn(this.fixedDelta);
            this.accumulator -= this.fixedDelta;
            steps += 1;
        }

        return {
            steps,
            alpha: this.fixedDelta > 0 ? this.accumulator / this.fixedDelta : 0
        };
    }

    reset() {
        this.accumulator = 0;
    }
}
