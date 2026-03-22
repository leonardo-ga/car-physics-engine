import * as THREE from 'three';
import {
    addBox,
    addExtrudedProfile,
    addSymmetricBoxes,
    addSymmetricLights,
    createSkinMaterials
} from './skinUtils';

export default function createSportCoupeSkin({
    chassisDimensions,
    appearance
}) {
    const length = chassisDimensions.width;
    const height = chassisDimensions.height;
    const width = chassisDimensions.depth;
    const group = new THREE.Group();
    const materials = createSkinMaterials(appearance, {
        bodyColor: 0xc6382f,
        accentColor: 0x14191d,
        trimColor: 0x161b1f,
        glassColor: 0x8ab8cf
    });

    addExtrudedProfile(group, [
        [1.64, 0.06],
        [1.68, 0.16],
        [1.54, 0.28],
        [1.18, 0.36],
        [0.84, 0.42],
        [0.26, 0.64],
        [-0.18, 0.78],
        [-0.84, 0.74],
        [-1.28, 0.58],
        [-1.56, 0.34],
        [-1.66, 0.14],
        [-1.48, 0.05]
    ], width * 0.86, materials.body, [0, 0.02, 0]);
    addExtrudedProfile(group, [
        [0.90, 0.08],
        [1.12, 0.18],
        [0.74, 0.34],
        [0.22, 0.54],
        [-0.18, 0.64],
        [-0.66, 0.58],
        [-0.94, 0.38],
        [-0.90, 0.12]
    ], width * 0.54, materials.glass, [0, 0.08, 0]);

    addBox(group, [length * 0.90, 0.04, width * 0.76], materials.trim, [0, 0.07, 0]);
    addBox(group, [length * 0.22, 0.03, width * 0.54], materials.trim, [0.38, 0.18, 0]);
    addBox(group, [length * 0.26, 0.03, width * 0.58], materials.trim, [-0.62, 0.22, 0]);
    addBox(group, [length * 0.12, height * 0.06, width * 0.72], materials.trim, [1.44, 0.14, 0]);
    addBox(group, [length * 0.10, height * 0.08, width * 0.74], materials.trim, [-1.46, 0.18, 0]);
    addBox(group, [length * 0.18, 0.03, width * 0.48], materials.trim, [-0.06, 0.80, 0]);
    addBox(group, [length * 0.12, 0.03, width * 0.72], materials.accent, [1.06, 0.24, 0], [0, 0, -0.10]);
    addBox(group, [length * 0.08, 0.02, width * 0.28], materials.trim, [0.74, 0.40, 0]);

    addSymmetricBoxes(group, [length * 0.16, height * 0.14, width * 0.10], materials.trim, 1.00, 0.14, width * 0.37);
    addSymmetricBoxes(group, [length * 0.18, height * 0.18, width * 0.12], materials.trim, -0.92, 0.18, width * 0.36);
    addSymmetricBoxes(group, [length * 0.08, height * 0.12, width * 0.04], materials.trim, -1.32, 0.70, width * 0.30);
    addBox(group, [length * 0.14, 0.04, width * 0.82], materials.trim, [-1.28, 0.82, 0]);
    addBox(group, [length * 0.10, 0.02, width * 0.92], materials.trim, [-1.48, 0.90, 0]);

    addBox(group, [length * 0.18, 0.03, width * 0.86], materials.accent, [0.22, 0.05, 0]);
    addBox(group, [length * 0.08, 0.08, width * 0.12], materials.accent, [1.34, 0.08, 0]);

    addSymmetricLights(group, [0.12, 0.06, 0.16], materials.headlight, 1.58, 0.24, width * 0.28);
    addSymmetricLights(group, [0.10, 0.07, 0.16], materials.taillight, -1.58, 0.22, width * 0.28);
    addSymmetricLights(group, [0.10, 0.04, 0.14], materials.headlight, 1.48, 0.16, width * 0.12);

    addSymmetricBoxes(group, [0.04, 0.16, 0.04], materials.trim, -1.44, 0.84, width * 0.30);
    addBox(group, [length * 0.08, 0.03, width * 0.78], materials.trim, [-1.56, 0.92, 0]);

    return group;
}
