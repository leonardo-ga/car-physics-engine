import Base from "../Base";
import Car from "./Car";
import Environment from "./Environment";
import Floor from './Floor';

export default class World {

    constructor() {
        this.base = new Base();
        this.scene = this.base.scene;

        // Setup
        this.floor = new Floor();
        this.car = new Car();
        this.environment = new Environment();
    }

    update() {
        this.car.update();
    }

}