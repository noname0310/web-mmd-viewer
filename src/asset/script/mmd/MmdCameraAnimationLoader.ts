import { Camera } from "the-world-engine";
import { MMDParser } from "three/examples/jsm/libs/mmdparser.module";
import * as THREE from "three/src/Three";
import { AnimationClip, AnimationClipBindInfo, AnimationClipInstance, AnimationKey, AnimationTrack, InterpolationKind } from "tw-engine-498tokio";
import { QuaternionBezierInterpolator, ScalarBezierInterpolator, Vector3IndependentBezierInterpolator } from "./interpolation/BezierInterpolator";
import { QuaternionUtils } from "./QuaternionUtils";

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

export type MmdCameraAnimationClip = AnimationClip<CameraTrackData>;

export type MmdCameraAnimationClipInstance = AnimationClipInstance<CameraTrackData>;

export class MmdCameraAnimationLoader {
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
        const quaternion = new THREE.Quaternion();

        const centerKeyframes: AnimationKey<THREE.Vector3, readonly [THREE.Vector2, THREE.Vector2, THREE.Vector2]>[] = [];
        const distanceKeyframes: AnimationKey<number, THREE.Vector2>[] = [];
        const quaternionKeyframes: AnimationKey<THREE.Quaternion, THREE.Vector2>[] = [];
        const fovKeyframes: AnimationKey<number, THREE.Vector2>[] = [];

        const defaultInterpolation = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ];

        for (let i = 0, il = frames.length; i < il; i++) {
            const frame = frames[i];
            const frameNumber = frame.frameNum / 30 * this.frameRate;

            const inInterpolation = frame.interpolation;
            const outInterpolation = frames[i + 1]?.interpolation ?? defaultInterpolation;

            {
                const aCenter = frame.position;
                center.set(aCenter[0], aCenter[1], aCenter[2]);

                centerKeyframes.push(new AnimationKey(
                    frameNumber,
                    center,
                    InterpolationKind.Cubic,
                    [
                        new THREE.Vector2(inInterpolation[2], inInterpolation[3]),
                        new THREE.Vector2(inInterpolation[6], inInterpolation[7]),
                        new THREE.Vector2(inInterpolation[10], inInterpolation[11])
                    ],
                    [
                        new THREE.Vector2(outInterpolation[0], outInterpolation[1]),
                        new THREE.Vector2(outInterpolation[4], outInterpolation[5]),
                        new THREE.Vector2(outInterpolation[8], outInterpolation[9])
                    ]
                ));
            }

            {
                const aRotation = frame.rotation;
                QuaternionUtils.rotationYawPitchRoll(-aRotation[1], -aRotation[0], -aRotation[2], quaternion);

                quaternionKeyframes.push(new AnimationKey(
                    frameNumber,
                    quaternion,
                    InterpolationKind.Cubic,
                    new THREE.Vector2(inInterpolation[14], inInterpolation[15]),
                    new THREE.Vector2(outInterpolation[12], outInterpolation[13])
                ));
            }

            {
                distanceKeyframes.push(new AnimationKey(
                    frameNumber,
                    frame.distance,
                    InterpolationKind.Cubic,
                    new THREE.Vector2(inInterpolation[18], inInterpolation[19]),
                    new THREE.Vector2(outInterpolation[16], outInterpolation[17])
                ));
            }

            {
                fovKeyframes.push(new AnimationKey(
                    frameNumber,
                    frame.fov,
                    InterpolationKind.Cubic,
                    new THREE.Vector2(inInterpolation[22], inInterpolation[23]),
                    new THREE.Vector2(outInterpolation[20], outInterpolation[21])
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
                track: AnimationTrack.createTrack(centerKeyframes, Vector3IndependentBezierInterpolator, this.frameRate)
            },
            {
                name: "quaternion",
                track: AnimationTrack.createTrack(quaternionKeyframes, QuaternionBezierInterpolator, this.frameRate)
            },
            {
                name: "distance",
                track: AnimationTrack.createTrack(distanceKeyframes, ScalarBezierInterpolator, this.frameRate)
            },
            {
                name: "fov",
                track: AnimationTrack.createTrack(fovKeyframes, ScalarBezierInterpolator, this.frameRate)
            }
        ], undefined, undefined, this.frameRate);
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
