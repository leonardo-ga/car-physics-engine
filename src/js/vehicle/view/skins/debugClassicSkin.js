import * as THREE from 'three';

export default function createDebugClassicSkin({
    chassisDimensions
}) {
    const group = new THREE.Group();
    const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(
            chassisDimensions.width,
            chassisDimensions.height,
            chassisDimensions.depth
        ),
        new THREE.MeshStandardMaterial({
            color: 0x9900ff,
            wireframe: true
        })
    );

    chassis.position.set(0, 0, 0);
    group.add(chassis);

    return {
        group,
        wheelAppearance: {
            color: 0x9900ff,
            wireframe: false,
            roughness: 1,
            metalness: 0
        }
    };
}
