import { Camera } from "the-world-engine";
import { MMDParser } from "three/examples/jsm/libs/mmdparser.module";
import * as THREE from "three/src/Three";
import { AnimationClip, AnimationClipBindInfo, AnimationClipInstance, AnimationKey, AnimationTrack, InferedAnimationClipBindData, InterpolationKind } from "tw-engine-498tokio";

type CameraTrackData = [
    {
        name: "center";
        track: AnimationTrack<THREE.Vector3>;
    },
    {
        name: "quaternion";
        track: AnimationTrack<THREE.Quaternion>;
    },
    {
        name: "distance";
        track: AnimationTrack<number>;
    },
    {
        name: "fov";
        track: AnimationTrack<number>;
    }
];

export type MmdCameraAnimationClip = AnimationClip<CameraTrackData, InferedAnimationClipBindData<CameraTrackData>>;

export type MmdCameraAnimationClipInstance = AnimationClipInstance<CameraTrackData, InferedAnimationClipBindData<CameraTrackData>>;

export class MmdCameraAnimationBuilder {
    private readonly _parser = new MMDParser.Parser();
    private readonly _fileLoader = new THREE.FileLoader();
    public frameRate = 60;

    public loadAnimationFromUrl(
        url: string,
        onLoad: (animation: MmdCameraAnimationClip) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
    ): void {
        this._fileLoader.setResponseType("arraybuffer");

        this._fileLoader.load(url, buffer => {
            const animation = this.loadAnimation(buffer as ArrayBuffer);
            onLoad(animation);
        }, onProgress, onError);
    }

    public loadAnimation(buffer: ArrayBufferLike): MmdCameraAnimationClip {
        const vmd = this._parser.parseVmd(buffer, true);
        if (vmd.metadata.cameraCount === 0) {
            throw new Error("VMD does not contain camera animation.");
        }
        const frames = vmd.cameras;

        const center = new THREE.Vector3();
        const euler = new THREE.Euler();
        const quaternion = new THREE.Quaternion();

        const centerKeyframes: AnimationKey<THREE.Vector3>[] = [];
        const quaternionKeyframes: AnimationKey<THREE.Quaternion>[] = [];
        const distanceKeyframes: AnimationKey<number>[] = [];
        const fovKeyframes: AnimationKey<number>[] = [];

        function vectorToTangent(x: number, y: number): number {
            const norm = Math.sqrt(x * x + y * y);
            return norm === 0 ? 0 : y / norm;
        }

        for (let i = 0, il = frames.length; i < il; i++) {
            const frame = frames[i];
            const frameNumber = frame.frameNum / 30 * this.frameRate;

            const interpolation = frame.interpolation;

            {
                const aCenter = frame.position;
                center.set(aCenter[0], aCenter[1], aCenter[2]);

                const xComponentxTangent = vectorToTangent(interpolation[0], interpolation[1]);
                const xComponentyTangent = vectorToTangent(interpolation[2], interpolation[3]);
                const yComponentxTangent = vectorToTangent(interpolation[4], interpolation[5]);
                const yComponentyTangent = vectorToTangent(interpolation[6], interpolation[7]);
                const zComponentxTangent = vectorToTangent(interpolation[8], interpolation[9]);
                const zComponentyTangent = vectorToTangent(interpolation[10], interpolation[11]);

                centerKeyframes.push(AnimationKey.createRefType(
                    frameNumber,
                    center,
                    InterpolationKind.Cubic,
                    new THREE.Vector3(xComponentxTangent, yComponentxTangent, zComponentxTangent),
                    new THREE.Vector3(xComponentyTangent, yComponentyTangent, zComponentyTangent)
                ));
            }

            {
                const aRotation = frame.rotation;
                euler.set(-aRotation[0], -aRotation[1], -aRotation[2]);
                quaternion.setFromEuler(euler);

                // const xTangent = vectorToTangent(interpolation[12], interpolation[13]);
                // const yTangent = vectorToTangent(interpolation[14], interpolation[15]);

                quaternionKeyframes.push(AnimationKey.createRefType(
                    frameNumber,
                    quaternion,
                    InterpolationKind.Linear
                ));
            }

            {
                const xTangent = vectorToTangent(interpolation[16], interpolation[17]);
                const yTangent = vectorToTangent(interpolation[18], interpolation[19]);

                distanceKeyframes.push(AnimationKey.createValueType(
                    frameNumber,
                    frame.distance,
                    InterpolationKind.Cubic,
                    xTangent,
                    yTangent
                ));
            }

            {
                const xTangent = vectorToTangent(interpolation[20], interpolation[21]);
                const yTangent = vectorToTangent(interpolation[22], interpolation[23]);

                fovKeyframes.push(AnimationKey.createValueType(
                    frameNumber,
                    frame.fov,
                    InterpolationKind.Cubic,
                    xTangent,
                    yTangent
                ));
            }
        }

        centerKeyframes.sort((a, b) => a.frame - b.frame);
        quaternionKeyframes.sort((a, b) => a.frame - b.frame);
        distanceKeyframes.sort((a, b) => a.frame - b.frame);
        fovKeyframes.sort((a, b) => a.frame - b.frame);

        return new AnimationClip([
            {
                name: "center",
                track: AnimationTrack.createVector3Track(centerKeyframes)
            },
            {
                name: "quaternion",
                track: AnimationTrack.createQuaternionTrack(quaternionKeyframes)
            },
            {
                name: "distance",
                track: AnimationTrack.createScalarTrack(distanceKeyframes)
            },
            {
                name: "fov",
                track: AnimationTrack.createScalarTrack(fovKeyframes)
            }
        ]);
    }

    public static createInstance(camera: Camera, animation: MmdCameraAnimationClip): MmdCameraAnimationClipInstance {
        const cameraCenterPositon = camera.transform.parent!.localPosition;
        const cameraPosition = camera.transform.localPosition;
        const cameraRotation = camera.transform.parent!.localRotation;

        return animation.createInstance(new AnimationClipBindInfo([
            {
                trackName: "center",
                target: position => cameraCenterPositon.copy(position)
            },
            {
                trackName: "quaternion",
                target: quaternion => cameraRotation.copy(quaternion)
            },
            {
                trackName: "distance",
                target: value => cameraPosition.z = -value
            },
            {
                trackName: "fov",
                target: fov => camera.fov = fov
            }
        ]));
    }
}

// class CubicBezierInterpolation extends THREE.Interpolant {
//     public interpolationParams: Float32Array;

//     public constructor(parameterPositions: any, sampleValues: any, sampleSize: number, resultBuffer: any, params: Float32Array) {
//         super(parameterPositions, sampleValues, sampleSize, resultBuffer);

//         this.interpolationParams = params;
//     }

//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     public interpolate_(i1: number, t0: number, t: number, t1: number): number[] {
//         const result = this.resultBuffer;
//         const values = this.sampleValues;
//         const stride = this.valueSize;
//         const params = this.interpolationParams;

//         const offset1 = i1 * stride;
//         const offset0 = offset1 - stride;

//         // No interpolation if next key frame is in one frame in 30fps.
//         // This is from MMD animation spec.
//         // '1.5' is for precision loss. times are Float32 in Three.js Animation system.
//         const weight1 = ((t1 - t0) < 1 / 30 * 1.5) ? 0.0 : (t - t0) / (t1 - t0);

//         if (stride === 4) { // Quaternion
//             const x1 = params[i1 * 4 + 0];
//             const x2 = params[i1 * 4 + 1];
//             const y1 = params[i1 * 4 + 2];
//             const y2 = params[i1 * 4 + 3];

//             const ratio = this._calculate(x1, x2, y1, y2, weight1);

//             THREE.Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
//         } else if (stride === 3) { // Vector3
//             for (let i = 0; i !== stride; ++i) {
//                 const x1 = params[i1 * 12 + i * 4 + 0];
//                 const x2 = params[i1 * 12 + i * 4 + 1];
//                 const y1 = params[i1 * 12 + i * 4 + 2];
//                 const y2 = params[i1 * 12 + i * 4 + 3];

//                 const ratio = this._calculate(x1, x2, y1, y2, weight1);

//                 result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
//             }
//         } else { // Number
//             const x1 = params[i1 * 4 + 0];
//             const x2 = params[i1 * 4 + 1];
//             const y1 = params[i1 * 4 + 2];
//             const y2 = params[i1 * 4 + 3];

//             const ratio = this._calculate(x1, x2, y1, y2, weight1);

//             result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
//         }

//         return result;
//     }

//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     private _calculate(x1: number, x2: number, y1: number, y2: number, x: number): number {
//         let c = 0.5;
//         let t = c;
//         let s = 1.0 - t;
//         const loop = 15;
//         const eps = 1e-5;
//         const math = Math;

//         let sst3: number, stt3: number, ttt: number;

//         for (let i = 0; i < loop; i++) {
//             sst3 = 3.0 * s * s * t;
//             stt3 = 3.0 * s * t * t;
//             ttt = t * t * t;

//             const ft = (sst3 * x1) + (stt3 * x2) + (ttt) - x;

//             if (math.abs(ft) < eps) break;

//             c /= 2.0;

//             t += (ft < 0) ? c : - c;
//             s = 1.0 - t;
//         }
//         return (sst3! * y1) + (stt3! * y2) + ttt!;
//     }
// }
