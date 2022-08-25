import * as THREE from "three/src/Three";

export class QuaternionUtils {
    public static rotationYawPitchRoll(yaw: number, pitch: number, roll: number, out?: THREE.Quaternion): THREE.Quaternion {
        if (!out) out = new THREE.Quaternion();
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
}
