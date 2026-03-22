import Base from '../Base';
import createCarConfig from '../vehicle/config/createCarConfig';
import createCarPhysics, { getAvailableCarPhysicsModels } from '../physics/createCarPhysics';
import CarPhysicsDebug from '../physics/debug/CarPhysicsDebug';
import DriveCommandController from '../vehicle/controls/DriveCommandController';
import SteeringController from '../vehicle/controls/SteeringController';
import CarRenderStateInterpolator from '../vehicle/simulation/CarRenderStateInterpolator';
import { captureCarPhysicsSnapshot, restoreCarPhysicsSnapshot } from '../vehicle/simulation/CarPhysicsState';
import FixedStepRunner from '../vehicle/simulation/FixedStepRunner';
import CarView from '../vehicle/view/CarView';

export default class Car {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;
        this.debug = this.base.debug;
        this.time = this.base.time;
        this.inputs = this.base.inputs;

        this.config = createCarConfig();
        this.physicsModel = this.config.physicsModel;
        this.steering = new SteeringController({
            inputs: this.inputs,
            maxAngle: this.config.steering.angleMax,
            speed: this.config.steering.speed,
            approximation: this.config.steering.approximation
        });
        this.driveCommands = new DriveCommandController({
            inputs: this.inputs,
            approximation: this.config.driveControls.approximation,
            throttleRiseRate: this.config.driveControls.throttleRiseRate,
            throttleFallRate: this.config.driveControls.throttleFallRate,
            brakeRiseRate: this.config.driveControls.brakeRiseRate,
            brakeFallRate: this.config.driveControls.brakeFallRate
        });
        this.fixedStepRunner = new FixedStepRunner(this.config.simulation);
        this.physics = this.createPhysics(this.physicsModel);
        this.renderStateInterpolator = new CarRenderStateInterpolator(this.physics);
        this.physicsDebug = this.createPhysicsDebug(this.physics);
        this.view = new CarView({
            scene: this.scene,
            debug: this.debug,
            initialAngle: this.config.initialAngle,
            visualModel: this.config.visualModel,
            chassisDimensions: this.config.chassisDimensions,
            wheelDimensions: this.config.wheelDimensions,
            wheelOffsets: this.config.wheelOffsets,
            appearance: this.config.appearance,
            helperConfig: this.config.helpers
        });

        this.model = this.view.model;
        this.loadDebugger();
    }

    update() {
        const simulationState = this.fixedStepRunner.advance(this.time.delta, (fixedDelta) => {
            this.renderStateInterpolator.capturePrevious(this.physics);
            const steerAngle = this.steering.update(fixedDelta);
            const commands = this.driveCommands.update(fixedDelta, this.physics.speed, steerAngle);
            this.physics.update(fixedDelta, commands);
            this.renderStateInterpolator.captureCurrent(this.physics);
        });

        if (this.physicsDebug) {
            this.physicsDebug.update();
        }

        this.view.update(this.renderStateInterpolator.get(simulationState.alpha), this.time.delta);
    }

    get useHelperArrows() {
        return this.view.useHelperArrows;
    }

    set useHelperArrows(value) {
        this.view.useHelperArrows = value;
    }

    createPhysics(modelId, snapshot = null) {
        const physics = createCarPhysics(modelId, {
            ...this.config.physics,
            safeMath: this.base.SafeMath
        });

        if (snapshot) {
            restoreCarPhysicsSnapshot(physics, snapshot);
        }

        if (this.debug.active) {
            this.debug.stats.physicsModel = physics.modelId;
        }

        return physics;
    }

    createPhysicsDebug(physics) {
        if (!this.debug.active) {
            return null;
        }

        return new CarPhysicsDebug({
            physics,
            debug: this.debug
        });
    }

    switchPhysics(modelId) {
        if (modelId === this.physicsModel) {
            return;
        }

        const snapshot = this.physics ? captureCarPhysicsSnapshot(this.physics) : null;

        if (this.physicsDebug) {
            this.physicsDebug.destroy();
            this.physicsDebug = null;
        }

        if (this.physics) {
            this.physics.destroy();
        }

        this.physicsModel = modelId;
        this.physics = this.createPhysics(modelId, snapshot);
        this.renderStateInterpolator.reset(this.physics);
        this.physicsDebug = this.createPhysicsDebug(this.physics);
        this.fixedStepRunner.reset();

        if (this.debugState) {
            this.debugState.physicsModel = modelId;
        }
    }

    loadDebugger() {
        if (!this.debug.active) {
            return;
        }

        this.debugState = {
            physicsModel: this.physicsModel
        };

        this.debugFolder = this.debug.ui.addFolder('car_simulation');
        this.debugFolder
            .add(this.debugState, 'physicsModel', getAvailableCarPhysicsModels())
            .name('physics_model')
            .onChange((value) => {
                this.switchPhysics(value);
            });
    }
}
