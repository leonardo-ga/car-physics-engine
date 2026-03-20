import Base from '../Base';
import CarPhysics from '../physics/CarPhysics';
import createCarConfig from '../vehicle/config/createCarConfig';
import SteeringController from '../vehicle/controls/SteeringController';
import CarView from '../vehicle/view/CarView';

export default class Car {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;
        this.debug = this.base.debug;
        this.time = this.base.time;
        this.inputs = this.base.inputs;

        this.config = createCarConfig();
        this.steering = new SteeringController({
            inputs: this.inputs,
            time: this.time,
            maxAngle: this.config.steering.angleMax,
            speed: this.config.steering.speed,
            approximation: this.config.steering.approximation
        });
        this.physics = new CarPhysics({
            ...this.config.physics,
            time: this.time,
            inputsActions: this.inputs.actions,
            debug: this.debug,
            safeMath: this.base.SafeMath
        });
        this.view = new CarView({
            scene: this.scene,
            debug: this.debug,
            initialAngle: this.config.initialAngle,
            chassisDimensions: this.config.chassisDimensions,
            wheelDimensions: this.config.wheelDimensions,
            wheelOffsets: this.config.wheelOffsets,
            appearance: this.config.appearance,
            helperForceScale: this.config.helpers.forceScale,
            useHelperArrows: this.config.helpers.enabled
        });

        this.model = this.view.model;
    }

    update() {
        const steerAngle = this.steering.update();
        this.physics.steerAngle = steerAngle;
        this.physics.update();
        this.view.update(this.physics, steerAngle);
    }

    get useHelperArrows() {
        return this.view.useHelperArrows;
    }

    set useHelperArrows(value) {
        this.view.useHelperArrows = value;
    }
}
