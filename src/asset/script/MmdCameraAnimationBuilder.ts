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

export type MmdCameraAnimationClipInstance = AnimationClipInstance<CameraTrackData, InferedAnimationClipBindData<CameraTrackData>>;

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
        const distanceKeyframes: AnimationKey<number>[] = [];
        const quaternionKeyframes: AnimationKey<THREE.Quaternion>[] = [];
        const fovKeyframes: AnimationKey<number>[] = [];

        for (let i = 0, il = frames.length; i < il; i++) {
            const frame = frames[i];
            const frameNumber = frame.frameNum / 30 * this.frameRate;

            {
                const aCenter = frame.position;
                center.set(aCenter[0], aCenter[1], aCenter[2]);

                centerKeyframes.push(AnimationKey.createRefType(
                    frameNumber,
                    center,
                    InterpolationKind.Step
                ));
            }

            {
                distanceKeyframes.push(AnimationKey.createValueType(
                    frameNumber,
                    frame.distance,
                    InterpolationKind.Step
                ));
            }

            {
                const aRotation = frame.rotation;
                euler.set(-aRotation[0], -aRotation[1], -aRotation[2]);
                quaternion.setFromEuler(euler);

                quaternionKeyframes.push(AnimationKey.createRefType(
                    frameNumber,
                    quaternion,
                    InterpolationKind.Step
                ));
            }

            {
                fovKeyframes.push(AnimationKey.createValueType(
                    frameNumber,
                    frame.fov,
                    InterpolationKind.Linear
                ));
            }
        }

        centerKeyframes.sort((a, b) => a.frame - b.frame);
        distanceKeyframes.sort((a, b) => a.frame - b.frame);
        quaternionKeyframes.sort((a, b) => a.frame - b.frame);
        fovKeyframes.sort((a, b) => a.frame - b.frame);

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
                trackName: "distance",
                target: value => cameraPosition.z = -value
            },
            {
                trackName: "quaternion",
                target: quaternion => cameraRotation.copy(quaternion)
            },
            {
                trackName: "fov",
                target: fov => camera.fov = fov
            }
        ]));
    }
}
