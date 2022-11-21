import { Quaternion } from "three/src/Three";

import { MathUtils } from "./MathUtils";

export class QuaternionUtils {
    public static rotationYawPitchRoll(yaw: number, pitch: number, roll: number, out?: Quaternion): Quaternion {
        if (!out) out = new Quaternion();

        const halfRoll = roll * 0.5;
        const halfPitch = pitch * 0.5;
        const halfYaw = yaw * 0.5;

        const sinRoll = Math.sin(halfRoll);
        const cosRoll = Math.cos(halfRoll);
        const sinPitch = Math.sin(halfPitch);
        const cosPitch = Math.cos(halfPitch);
        const sinYaw = Math.sin(halfYaw);
        const cosYaw = Math.cos(halfYaw);

        out.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
        out.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
        out.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
        out.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);

        return out;
    }

    public static dot(left: Quaternion, right: Quaternion): number {
        return (left.x * right.x) + (left.y * right.y) + (left.z * right.z) + (left.w * right.w);
    }

    public static slerp(start: Quaternion, end: Quaternion, amount: number, out?: Quaternion): Quaternion {
        if (!out) out = new Quaternion();

        let opposite;
        let inverse;
        const dot = QuaternionUtils.dot(start, end);

        if (Math.abs(dot) > 1.0 - MathUtils.zeroTolerance) {
            inverse = 1.0 - amount;
            opposite = amount * Math.sign(dot);
        } else {
            const acos = Math.acos(Math.abs(dot));
            const invSin = 1.0 / Math.sin(acos);

            inverse = Math.sin((1.0 - amount) * acos) * invSin;
            opposite = Math.sin(amount * acos) * invSin * Math.sign(dot);
        }

        out.x = (inverse * start.x) + (opposite * end.x);
        out.y = (inverse * start.y) + (opposite * end.y);
        out.z = (inverse * start.z) + (opposite * end.z);
        out.w = (inverse * start.w) + (opposite * end.w);

        return out;
    }

    public static lerp(start: Quaternion, end: Quaternion, amount: number, out?: Quaternion): Quaternion {
        if (!out) out = new Quaternion();

        const inverse = 1.0 - amount;

        if (QuaternionUtils.dot(start, end) >= 0.0) {
            out.x = (inverse * start.x) + (amount * end.x);
            out.y = (inverse * start.y) + (amount * end.y);
            out.z = (inverse * start.z) + (amount * end.z);
            out.w = (inverse * start.w) + (amount * end.w);
        } else {
            out.x = (inverse * start.x) - (amount * end.x);
            out.y = (inverse * start.y) - (amount * end.y);
            out.z = (inverse * start.z) - (amount * end.z);
            out.w = (inverse * start.w) - (amount * end.w);
        }

        out.normalize();

        return out;
    }
}
