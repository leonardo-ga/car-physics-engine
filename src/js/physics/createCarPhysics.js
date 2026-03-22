import CarPhysics from './CarPhysics';
import KinematicCarPhysics from './KinematicCarPhysics';

const physicsRegistry = {
    'dynamic-single-track': CarPhysics,
    'kinematic-bicycle': KinematicCarPhysics
};

export function getAvailableCarPhysicsModels() {
    return Object.keys(physicsRegistry);
}

export default function createCarPhysics(modelId, params) {
    const PhysicsImplementation = physicsRegistry[modelId] || physicsRegistry['dynamic-single-track'];

    return new PhysicsImplementation({
        ...params,
        modelId: modelId in physicsRegistry ? modelId : 'dynamic-single-track'
    });
}
