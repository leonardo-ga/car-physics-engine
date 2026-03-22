import * as THREE from 'three';
import CarPhysics from './CarPhysics';
import { stepLowSpeedKinematics } from './dynamics/lowSpeedKinematics';

export default class KinematicCarPhysics extends CarPhysics {

    loadDefaultParameters(params) {
        super.loadDefaultParameters({
            ...params,
            modelId: params.modelId || 'kinematic-bicycle'
        });
    }

    stepDynamics(delta) {
        const steer = THREE.MathUtils.clamp(this.steerAngle, -this.maxSteer, this.maxSteer);
        const speedAbs = Math.abs(this.vx);
        const substeps = speedAbs < this.lowSpeedThreshold ? this.launchSubsteps : 1;
        const subDt = delta / substeps;

        for (let step = 0; step < substeps; step += 1) {
            stepLowSpeedKinematics(this, steer, subDt);
        }
    }
}
