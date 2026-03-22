import createBoxyHatchSkin from './boxyHatchSkin';
import createDebugClassicSkin from './debugClassicSkin';
import createSportCoupeSkin from './sportCoupeSkin';
import createUtilityPickupSkin from './utilityPickupSkin';

const skinRegistry = {
    'debug-classic': createDebugClassicSkin,
    'boxy-hatch': createBoxyHatchSkin,
    'sport-coupe': createSportCoupeSkin,
    'utility-pickup': createUtilityPickupSkin
};

export function getAvailableCarSkins() {
    return Object.keys(skinRegistry);
}

export default function createCarSkin(skinId, options) {
    const buildSkin = skinRegistry[skinId] || skinRegistry['boxy-hatch'];
    const resolvedSkinId = skinId in skinRegistry ? skinId : 'boxy-hatch';
    const result = buildSkin(options);

    if (result?.isObject3D) {
        return {
            skinId: resolvedSkinId,
            group: result,
            wheelAppearance: null
        };
    }

    return {
        skinId: resolvedSkinId,
        group: result.group,
        wheelAppearance: result.wheelAppearance || null
    };
}
