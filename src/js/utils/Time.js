import Events from "./Events";

export default class Time extends Events {

    constructor() {
        super();

        // Setup
        this.start = performance.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 0.016;// we wait one thick... maybe for some probles
        this.isPaused = false;

        this.loadEvents();
        
        this._tickBound = this.tick.bind(this);
        this.rafId = requestAnimationFrame(this._tickBound);
    }

    tick() {
        const currentTime = performance.now();
        this.delta = Math.min((currentTime - this.current) / 1000, 0.1);// max 0.1: prevents huge physics jumps when resuming from a paused or backgrounded tab.
        this.current = currentTime;
        this.elapsed = this.current - this.start;

        if (!this.isPaused) this.trigger('tick');

        this.rafId = requestAnimationFrame(this._tickBound);
    }

    loadEvents() {
        // Handle tab visibility
        this.handleVisibilityChange = () => {
            if (document.hidden) {
                this.isPaused = true;
            } else {
                this.start = performance.now();
                this.current = this.start;
                this.isPaused = false;
            }
        };

        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Handle focus loss
        /*window.addEventListener('blur', () => {
            this.isPaused = true;
        });

        window.addEventListener('focus', () => {
            this.start = performance.now();
            this.isPaused = false;
        });*/
    }

    destroy() {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        cancelAnimationFrame(this.rafId);
    }

}
