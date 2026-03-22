import * as THREE from 'three';

export function createSkinMaterials(appearance, palette = {}) {
    const bodyColor = palette.bodyColor ?? appearance.bodyColor;
    const accentColor = palette.accentColor ?? appearance.accentColor;
    const trimColor = palette.trimColor ?? appearance.trimColor;
    const glassColor = palette.glassColor ?? appearance.glassColor;
    const headlightColor = palette.headlightColor ?? appearance.headlightColor;
    const taillightColor = palette.taillightColor ?? appearance.taillightColor;

    return {
        body: new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: appearance.bodyRoughness,
            metalness: appearance.bodyMetalness,
            flatShading: appearance.lowPolyShading
        }),
        accent: new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.75,
            metalness: 0.08,
            flatShading: appearance.lowPolyShading
        }),
        trim: new THREE.MeshStandardMaterial({
            color: trimColor,
            roughness: 0.92,
            metalness: 0.04,
            flatShading: appearance.lowPolyShading
        }),
        glass: new THREE.MeshStandardMaterial({
            color: glassColor,
            roughness: 0.18,
            metalness: 0.18,
            transparent: true,
            opacity: 0.72
        }),
        headlight: new THREE.MeshStandardMaterial({
            color: headlightColor,
            emissive: headlightColor,
            emissiveIntensity: 0.18,
            roughness: 0.35,
            metalness: 0.15
        }),
        taillight: new THREE.MeshStandardMaterial({
            color: taillightColor,
            emissive: taillightColor,
            emissiveIntensity: 0.16,
            roughness: 0.45,
            metalness: 0.08
        })
    };
}

export function addBox(group, size, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        material
    );

    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return mesh;
}

export function addExtrudedProfile(
    group,
    points,
    depth,
    material,
    position,
    rotation = [0, 0, 0]
) {
    const shape = new THREE.Shape();

    points.forEach(([x, y], index) => {
        if (index === 0) {
            shape.moveTo(x, y);
            return;
        }

        shape.lineTo(x, y);
    });

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1
    });
    geometry.translate(0, 0, -depth / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return mesh;
}

export function addSymmetricBoxes(group, size, material, x, y, zOffset, rotation = [0, 0, 0]) {
    addBox(group, size, material, [x, y, zOffset], rotation);
    addBox(group, size, material, [x, y, -zOffset], rotation);
}

export function addSymmetricLights(group, size, material, x, y, zOffset) {
    addBox(group, size, material, [x, y, -zOffset]);
    addBox(group, size, material, [x, y, zOffset]);
}
