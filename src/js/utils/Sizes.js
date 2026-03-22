import Events from './Events';

export default class Sizes extends Events {

    constructor() {
        super();
        // Setup
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);

        this.handleResize = () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.pixelRatio = Math.min(window.devicePixelRatio, 2);

            this.trigger('resize');
        };

        window.addEventListener('resize', this.handleResize);
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }

}
