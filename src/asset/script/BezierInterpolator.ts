import { Quaternion, Vector2, Vector3 } from "three/src/Three";
import { 
    IAnimationInterpolator,
    ScalarHermiteInterpolator,
    Vector2HermiteInterpolator,
    Vector3HermiteInterpolator,
    QuaternionHermiteInterpolator
} from "tw-engine-498tokio/dist/asset/script/animation/AnimationInterpolator";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ScalarBezierInterpolator = new class implements IAnimationInterpolator<number, Vector2> {
    public lerp = ScalarHermiteInterpolator.lerp;
    public linearTangent = ScalarHermiteInterpolator.linearTangent;

    public cubic(start: number, end: number, inTangent: Vector2, outTangent: Vector2, gradient: number): number {
        const t = gradient;
        const x1 = start;
        const x2 = end;
        const y1 = inTangent.x;
        const y2 = outTangent.x;

        return BezierCurve.interpolate(x1, y1, x2, y2, t);
    }
}; 

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Vector2BezierInterpolator = new class implements IAnimationInterpolator<Vector2, Vector2> {
    public readonly tangentTempInstance = new Vector2();
    public readonly tempInstance = new Vector2();
    public lerp = Vector2HermiteInterpolator.lerp;
    public linearTangent = Vector2HermiteInterpolator.linearTangent;

    public cubic(start: Vector2, end: Vector2, inTangent: Vector2, outTangent: Vector2, gradient: number, out?: Vector2): Vector2 {
        if (!out) out = new Vector2();

        const t = gradient;
        const x1 = start.x;
        const x2 = end.x;
        const y1 = start.y;
        const y2 = end.y;
        const tx1 = inTangent.x;
        const tx2 = outTangent.x;
        const ty1 = inTangent.y;
        const ty2 = outTangent.y;
        const x = BezierCurve.interpolate(x1, tx1, x2, tx2, t);
        const y = BezierCurve.interpolate(y1, ty1, y2, ty2, t);
        return out.set(x, y);
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Vector3BezierInterpolator = new class implements IAnimationInterpolator<Vector3, Vector2> {
    public readonly tangentTempInstance = new Vector3();
    public readonly tempInstance = new Vector3();
    public lerp = Vector3HermiteInterpolator.lerp;
    public linearTangent = Vector3HermiteInterpolator.linearTangent;

    public cubic(start: Vector3, end: Vector3, inTangent: Vector2, outTangent: Vector2, gradient: number, out?: Vector3): Vector3 {
        if (!out) out = new Vector3();
        
        const t = gradient;
        const x1 = start.x;
        const x2 = end.x;
        const y1 = start.y;
        const y2 = end.y;
        const z1 = start.z;
        const z2 = end.z;
        const tx1 = inTangent.x;
        const tx2 = outTangent.x;
        const ty1 = inTangent.y;
        const ty2 = outTangent.y;
        const x = BezierCurve.interpolate(x1, tx1, x2, tx2, t);
        const y = BezierCurve.interpolate(y1, ty1, y2, ty2, t);
        const z = BezierCurve.interpolate(z1, 0, z2, 0, t);
        return out.set(x, y, z);
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const QuaternionBezierInterpolator = new class implements IAnimationInterpolator<Quaternion, Vector2> {
    public readonly tangentTempInstance = new Quaternion();
    public readonly tempInstance = new Quaternion();
    public lerp = QuaternionHermiteInterpolator.lerp;
    public linearTangent = QuaternionHermiteInterpolator.linearTangent;

    public cubic(start: Quaternion, end: Quaternion, inTangent: Vector2, outTangent: Vector2, gradient: number, out?: Quaternion): Quaternion {
        if (!out) out = new Quaternion();

        const t = gradient;
        const x1 = start.x;
        const x2 = end.x;
        const y1 = start.y;
        const y2 = end.y;
        const z1 = start.z;
        const z2 = end.z;
        const w1 = start.w;
        const w2 = end.w;
        const tx1 = inTangent.x;
        const tx2 = outTangent.x;
        const ty1 = inTangent.y;
        const ty2 = outTangent.y;
        const x = BezierCurve.interpolate(x1, tx1, x2, tx2, t);
        const y = BezierCurve.interpolate(y1, ty1, y2, ty2, t);
        const z = BezierCurve.interpolate(z1, 0, z2, 0, t);
        const w = BezierCurve.interpolate(w1, 0, w2, 0, t);
        return out.set(x, y, z, w);
    }
};

/** Class used to represent a Bezier curve */
export class BezierCurve {
    /**
     * Returns the cubic Bezier interpolated value (float) at "t" (float) from the given x1, y1, x2, y2 floats
     * @param t defines the time
     * @param x1 defines the left coordinate on X axis
     * @param y1 defines the left coordinate on Y axis
     * @param x2 defines the right coordinate on X axis
     * @param y2 defines the right coordinate on Y axis
     * @returns the interpolated value
     */
    public static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number {
        // Extract X (which is equal to time here)
        const f0 = 1 - 3 * x2 + 3 * x1;
        const f1 = 3 * x2 - 6 * x1;
        const f2 = 3 * x1;

        let refinedT = t;
        for (let i = 0; i < 5; i++) {
            const refinedT2 = refinedT * refinedT;
            const refinedT3 = refinedT2 * refinedT;

            const x = f0 * refinedT3 + f1 * refinedT2 + f2 * refinedT;
            const slope = 1.0 / (3.0 * f0 * refinedT2 + 2.0 * f1 * refinedT + f2);
            refinedT -= (x - t) * slope;
            refinedT = Math.min(1, Math.max(0, refinedT));
        }

        // Resolve cubic bezier for the given x
        return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 + 3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 + Math.pow(refinedT, 3);
    }
}
