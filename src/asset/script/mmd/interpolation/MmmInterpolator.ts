import { Vector2 } from "three/src/Three";

// MMM(Miku Miku Moving) Bezier interpolation

export class MmmInterpolator {
    public static range = 0.001;

    /**
     * interpolate a bezier curve
     * @param _p2 0..127 range integer
     * @param _p3 0..127 range integer
     * @param interop
     * @param start
     * @param framediff
     * @param t
     * @returns
     */
    public static interpolate(_p2: Vector2, _p3: Vector2, interop: number, start: number, framediff: number, t: {out: number}): number {
        if (interop == 0) {
            t.out = 0;
            return 0;
        }
        if (interop == 1) {
            t.out = 1;
            return 1;
        }
        if (_p2.x == _p2.y && _p3.x == _p3.y) {
            t.out = interop;
            return interop;
        }
        const vector = new Vector2(_p2.x / 127, _p2.y / 127);
        const vector2 = new Vector2(_p3.x / 127, _p3.y / 127);
        t.out = MmmInterpolator.recursiveInterop(vector.x, vector2.x, start, 1, interop, framediff);
        return 3.0 * (Math.pow(1.0 - t.out, 2.0) * t.out * vector.y + (1.0 - t.out) * Math.pow(t.out, 2.0) * vector2.y) + Math.pow(t.out, 3.0);
    }

    private static recursiveInterop(p2x: number, p3x: number, min: number, max: number, interop: number, framediff: number): number {
        const num = (max + min) / 2;
        const num2 = (3.0 * (Math.pow(1.0 - num, 2.0) * num * p2x + (1.0 - num) * Math.pow(num, 2.0) * p3x) + Math.pow(num, 3.0));
        if (interop >= num2) {
            if (framediff >= MmmInterpolator.range) {
                if (interop - num2 >= MmmInterpolator.range) {
                    if (min != max) {
                        return MmmInterpolator.recursiveInterop(p2x, p3x, num, max, interop, framediff / 2.0);
                    }
                }
            }
            return num;
        }
        if (framediff < MmmInterpolator.range || num2 - interop < MmmInterpolator.range || min == max) {
            return num;
        }
        return MmmInterpolator.recursiveInterop(p2x, p3x, min, num, interop, framediff / 2.0);
    }

    public static interpolate2(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2, interop: number, framediff: number): number {
        if (interop == 0) return 0;
        if (interop == 1) return 1;

        if (p2.x == p2.y) {
            if (p3.x == p3.y) {
                return p1.y + (p4.y - p1.y) * interop;
            }
        }
        const num = MmmInterpolator.recursiveInterop(p2.x, p3.x, 0, 1, interop, framediff);
        return Math.pow(1.0 - num, 3.0) * p1.y + 3.0 * (Math.pow(1.0 - num, 2.0) * num * p2.y + (1.0 - num) * Math.pow(num, 2.0) * p3.y) + Math.pow(num, 3.0) * p4.y;
    }
}
