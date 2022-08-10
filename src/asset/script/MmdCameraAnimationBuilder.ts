import { MMDParser } from "three/examples/jsm/libs/mmdparser.module";
import * as THREE from "three/src/Three";
import { AnimationClip, AnimationKey, AnimationTrack, InferedAnimationClipBindData, InterpolationKind } from "tw-engine-498tokio";

type CameraTrackData = [
    {
        name: "center";
        track: AnimationTrack<THREE.Vector3>;
    },
    {
        name: "distance";
        track: AnimationTrack<number>;
    },
    {
        name: "quaternion";
        track: AnimationTrack<THREE.Quaternion>;
    },
    {
        name: "fov";
        track: AnimationTrack<number>;
    }
];

export type MmdCameraAnimationClip = AnimationClip<CameraTrackData, InferedAnimationClipBindData<CameraTrackData>>;

// export class CubicBezierInterpolator implements IAnimationInterpolator<number> {
//     public lerp(): number {
//         throw new Error("Method not implemented.");
//     }
//     public hermite(start: T, end: T, inTangent: T, outTangent: T, gradient: number, out?: T): T {
//         throw new Error("Method not implemented.");
//     }
//     public linearTangent(start: T, end: T, out?: T): T {
//         throw new Error("Method not implemented.");
//     }
// }

export class MmdCameraAnimationBuilder {
    private readonly _parser = new MMDParser.Parser();
    private readonly _fileLoader = new THREE.FileLoader();

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
        const distanceKeyframes: AnimationKey<number>[] = [];
        const quaternionKeyframes: AnimationKey<THREE.Quaternion>[] = [];
        const fovKeyframes: AnimationKey<number>[] = [];

        for (let i = 0, il = frames.length; i < il; i++) {
            const frame = frames[i];

            {
                const aCenter = frame.position;
                center.set(aCenter[0], aCenter[1], aCenter[2]);

                centerKeyframes.push(AnimationKey.createRefType(
                    frame.frameNum,
                    center,
                    InterpolationKind.Cubic,
                    new THREE.Vector3(),
                    new THREE.Vector3()
                ));
            }

            {
                distanceKeyframes.push(AnimationKey.createValueType(
                    frame.frameNum,
                    frame.distance,
                    InterpolationKind.Cubic,
                    0,
                    0
                ));
            }

            {
                const aRotation = frame.rotation;
                euler.set(-aRotation[0], -aRotation[1], -aRotation[2]);
                quaternion.setFromEuler(euler);

                quaternionKeyframes.push(AnimationKey.createRefType(
                    frame.frameNum,
                    quaternion,
                    InterpolationKind.Cubic,
                    new THREE.Quaternion(),
                    new THREE.Quaternion()
                ));
            }

            {
                fovKeyframes.push(AnimationKey.createValueType(
                    frame.frameNum,
                    frame.fov,
                    InterpolationKind.Linear
                ));
            }
        }

        return new AnimationClip([
            {
                name: "center",
                track: AnimationTrack.createVector3Track(centerKeyframes)
            },
            {
                name: "distance",
                track: AnimationTrack.createScalarTrack(distanceKeyframes)
            },
            {
                name: "quaternion",
                track: AnimationTrack.createQuaternionTrack(quaternionKeyframes)
            },
            {
                name: "fov",
                track: AnimationTrack.createScalarTrack(fovKeyframes)
            }
        ]);
    }
}
