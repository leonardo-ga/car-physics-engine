export default function createCarConfig() {
    const chassisDimensions = {
        width: 3.4,
        height: 1,
        depth: 2,
        wheelBase: 2.7
    };

    const wheelDimensions = {
        radius: 0.5,
        thickness: 0.5,
        precision: 8
    };

    const initialAngle = Math.PI / 2;

    return {
        initialAngle,
        chassisDimensions,
        wheelDimensions,
        wheelOffsets: {
            frontX: 1,
            rearX: -1,
            leftZ: -1,
            rightZ: 1,
            y: -0.5
        },
        appearance: {
            chassisColor: 0x9900ff,
            wheelColor: 0x9900ff,
            chassisWireframe: true,
            wheelWireframe: false
        },
        steering: {
            angleMax: Math.PI / 6,
            speed: Math.PI,
            approximation: 0.001
        },
        helpers: {
            enabled: true,
            forceScale: 0.01
        },
        physics: {
            mass: 1400,
            wheelBase: chassisDimensions.wheelBase,
            cgToFront: chassisDimensions.wheelBase / 2,
            cgHeight: 0.45,
            inertiaYaw: 1800,
            C_drag: 0.4257,
            C_rr: 12.8,
            engineForceMax: 7000,
            brakeForceMax: 13000,
            rearWheelRadius: wheelDimensions.radius,
            frontWheelRadius: wheelDimensions.radius,
            mu: 1.0,
            tractionCurveSlope: 16.5,
            cornerStiffnessFront: 100000,
            cornerStiffnessRear: 100000,
            angle: initialAngle
        }
    };
}
