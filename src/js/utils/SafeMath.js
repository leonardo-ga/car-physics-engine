import { Vector3 } from "three";

export default class SafeMath {

    constructor() {
        this.EPSILON = 1e-10;
    }

    sanitize(value, eps = this.EPSILON, decimals = 12) {
        if (Math.abs(value) < eps) return 0;
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    sanitize_vec(v = new Vector3(0, 0, 0), eps = this.EPSILON, decimals = 12) {
        const v_sanitized = new Vector3(0, 0, 0);
        v_sanitized.x = this.sanitize(v.x);
        v_sanitized.y = this.sanitize(v.y);
        v_sanitized.z = this.sanitize(v.z);
        return v_sanitized;
    }

    cos(x) { return this.sanitize(Math.cos(x)); }
    sin(x) { return this.sanitize(Math.sin(x)); }
    tan(x) { return this.sanitize(Math.tan(x)); }
    atan2(y, x) { return this.sanitize(Math.atan2(y, x)); }
    round(x) { return this.sanitize(x); }
    clamp(x, min, max) { return Math.min(Math.max(x, min), max); }

}