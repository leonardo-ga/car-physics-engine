import * as THREE from 'three';
import {
    addBox,
    addExtrudedProfile,
    addSymmetricBoxes,
    addSymmetricLights,
    createSkinMaterials
} from './skinUtils';

export default function createUtilityPickupSkin({
    chassisDimensions,
    appearance
}) {
    const length = chassisDimensions.width;
    const height = chassisDimensions.height;
    const width = chassisDimensions.depth;
    const group = new THREE.Group();
    const materials = createSkinMaterials(appearance, {
        bodyColor: 0x2e7c74,
        accentColor: 0xbed8d4
    });

    addExtrudedProfile(group, [
        [1.54, 0.10],
        [1.60, 0.20],
        [1.46, 0.34],
        [0.82, 0.46],
        [0.22, 0.50],
        [0.04, 0.76],
        [-0.72, 0.82],
        [-1.06, 0.62],
        [-1.08, 0.38],
        [-1.02, 0.12]
    ], width * 0.82, materials.body, [0.28, 0, 0]);
    addBox(group, [length * 0.38, height * 0.16, width * 0.88], materials.body, [-1.06, 0.20, 0]);
    addBox(group, [length * 0.28, height * 0.14, 0.06], materials.body, [-1.12, 0.34, width * 0.44]);
    addBox(group, [length * 0.28, height * 0.14, 0.06], materials.body, [-1.12, 0.34, -width * 0.44]);
    addBox(group, [0.06, height * 0.16, width * 0.90], materials.body, [-1.56, 0.34, 0]);
    addExtrudedProfile(group, [
        [0.02, 0.08],
        [0.20, 0.24],
        [-0.18, 0.54],
        [-0.86, 0.58],
        [-1.00, 0.24],
        [-0.94, 0.08]
    ], width * 0.56, materials.glass, [0, 0.08, 0]);

    addBox(group, [length * 0.60, 0.05, width * 0.78], materials.trim, [0.10, 0.08, 0]);
    addBox(group, [length * 0.18, height * 0.08, width * 0.84], materials.trim, [1.36, 0.18, 0]);
    addBox(group, [length * 0.20, 0.05, width * 0.64], materials.trim, [-0.62, 0.84, 0]);
    addBox(group, [length * 0.12, height * 0.04, width * 0.84], materials.accent, [1.04, 0.32, 0]);
    addBox(group, [length * 0.28, 0.03, width * 0.82], materials.trim, [-1.12, 0.52, 0]);
    addSymmetricBoxes(group, [length * 0.16, height * 0.20, width * 0.10], materials.trim, 0.92, 0.18, width * 0.38);
    addSymmetricBoxes(group, [length * 0.10, height * 0.18, width * 0.10], materials.trim, -0.98, 0.20, width * 0.38);

    addSymmetricLights(group, [0.12, 0.08, 0.16], materials.headlight, 1.55, 0.24, width * 0.28);
    addSymmetricLights(group, [0.10, 0.07, 0.16], materials.taillight, -1.55, 0.26, width * 0.28);

    return group;
}
