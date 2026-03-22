import * as THREE from 'three';
import {
    addBox,
    addExtrudedProfile,
    addSymmetricBoxes,
    addSymmetricLights,
    createSkinMaterials
} from './skinUtils';

export default function createBoxyHatchSkin({
    chassisDimensions,
    appearance
}) {
    const length = chassisDimensions.width;
    const height = chassisDimensions.height;
    const width = chassisDimensions.depth;
    const group = new THREE.Group();
    const materials = createSkinMaterials(appearance, {
        bodyColor: 0xd4573b,
        accentColor: 0xf2bf63
    });

    addExtrudedProfile(group, [
        [1.50, 0.12],
        [1.60, 0.24],
        [1.48, 0.40],
        [1.12, 0.54],
        [0.68, 0.70],
        [-0.18, 0.82],
        [-0.84, 0.82],
        [-1.28, 0.68],
        [-1.52, 0.46],
        [-1.60, 0.16],
        [-1.48, 0.10]
    ], width * 0.82, materials.body, [0, 0, 0]);

    addBox(group, [length * 0.84, 0.06, width * 0.80], materials.trim, [0, 0.10, 0]);
    addBox(group, [length * 0.12, height * 0.12, width * 0.84], materials.trim, [1.46, 0.18, 0]);
    addBox(group, [length * 0.10, height * 0.18, width * 0.80], materials.trim, [-1.46, 0.22, 0]);
    addBox(group, [length * 0.16, height * 0.06, width * 0.70], materials.accent, [0.98, 0.34, 0], [0, 0, -0.08]);
    addSymmetricBoxes(group, [length * 0.14, height * 0.18, width * 0.12], materials.trim, 0.86, 0.18, width * 0.40);
    addSymmetricBoxes(group, [length * 0.14, height * 0.20, width * 0.12], materials.trim, -0.86, 0.20, width * 0.39);

    addBox(group, [length * 0.20, height * 0.36, width * 0.56], materials.glass, [0.66, 0.50, 0], [0, 0, -0.58]);
    addBox(group, [length * 0.16, height * 0.26, width * 0.52], materials.glass, [-0.82, 0.56, 0], [0, 0, 0.46]);
    addSymmetricBoxes(group, [length * 0.28, height * 0.24, 0.04], materials.glass, 0.16, 0.56, width * 0.37, [0, 0, -0.12]);
    addSymmetricBoxes(group, [length * 0.22, height * 0.20, 0.04], materials.glass, -0.60, 0.58, width * 0.37, [0, 0, 0.10]);

    addSymmetricBoxes(group, [0.04, height * 0.34, 0.05], materials.trim, 0.56, 0.54, width * 0.36, [0, 0, -0.56]);
    addSymmetricBoxes(group, [0.04, height * 0.26, 0.05], materials.trim, -0.10, 0.58, width * 0.36);
    addSymmetricBoxes(group, [0.04, height * 0.24, 0.05], materials.trim, -0.90, 0.56, width * 0.35, [0, 0, 0.42]);
    addBox(group, [length * 0.34, 0.03, width * 0.60], materials.trim, [-0.18, 0.82, 0]);

    addSymmetricLights(group, [0.12, 0.08, 0.18], materials.headlight, 1.55, 0.26, width * 0.29);
    addSymmetricLights(group, [0.12, 0.08, 0.16], materials.taillight, -1.58, 0.26, width * 0.29);

    return group;
}
