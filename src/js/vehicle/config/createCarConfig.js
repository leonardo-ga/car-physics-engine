export default function createCarConfig() {
    const wheelBase = 2.7;
    const trackWidth = 2;
    const chassisDimensions = {
        width: 3.4,
        height: 1,
        depth: 2,
        wheelBase
    };

    const wheelDimensions = {
        radius: 0.5,
        thickness: 0.5,
        precision: 8
    };

    const initialAngle = Math.PI / 2;

    return {
        initialAngle,
        physicsModel: 'dynamic-single-track',
        visualModel: 'debug-classic',
        chassisDimensions,
        wheelDimensions,
        wheelOffsets: {
            frontX: wheelBase / 2,
            rearX: -wheelBase / 2,
            leftZ: -trackWidth / 2,
            rightZ: trackWidth / 2,
            y: -0.5
        },
        appearance: {
            bodyColor: 0xd4573b,
            accentColor: 0xf2bf63,
            trimColor: 0x23303a,
            glassColor: 0x80b8d8,
            headlightColor: 0xf8f5df,
            taillightColor: 0xd94b3d,
            wheelColor: 0x1f2429,
            wheelWireframe: false,
            lowPolyShading: true,
            bodyRoughness: 0.82,
            bodyMetalness: 0.06
        },
        steering: {
            angleMax: Math.PI / 6,
            speed: Math.PI,
            approximation: 0.001
        },
        driveControls: {
            approximation: 0.05,
            throttleRiseRate: 4,
            throttleFallRate: 6,
            brakeRiseRate: 8,
            brakeFallRate: 10
        },
        simulation: {
            fixedDelta: 1 / 120,
            maxSubsteps: 12
        },
        helpers: {
            enabled: true,
            velocityScale: 0.35,
            forceScale: 0.00045,
            smoothing: 14,
            velocityDeadzone: 0.05,
            forceDeadzone: 75,
            maxVelocityLength: 6,
            maxForceLength: 4
        },
        physics: {
            mass: 1400,
            wheelBase,
            trackWidth,
            cgToFront: wheelBase / 2,
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
            shiftCooldownTime: 0.35,
            launchSubsteps: 8,
            cornerStiffnessFront: 100000,
            cornerStiffnessRear: 100000,
            angle: initialAngle
        }
    };
}
