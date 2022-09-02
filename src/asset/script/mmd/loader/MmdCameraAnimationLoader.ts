import { Camera } from "the-world-engine";
import { MMDParser } from "three/examples/jsm/libs/mmdparser.module";
import * as THREE from "three/src/Three";
import { AnimationClip, AnimationClipBindInfo, AnimationClipInstance, AnimationKey, AnimationTrack, InterpolationKind } from "tw-engine-498tokio";

import { EulerBezierInterpolator, ScalarBezierInterpolator, Vector3IndependentBezierInterpolator } from "../interpolation/BezierInterpolator";
import { QuaternionUtils } from "../QuaternionUtils";

type CameraTrackData = [
    {
        name: "center";
        track: AnimationTrack<THREE.Vector3>;
    },
    {
        name: "rotation";
        track: AnimationTrack<THREE.Euler>;
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
        const frames = [...vmd.cameras];
        frames.sort((a, b) => a.frameNum - b.frameNum);

        const center = new THREE.Vector3();
        const euler = new THREE.Euler();

        const centerKeyframes: AnimationKey<THREE.Vector3, readonly [THREE.Vector2, THREE.Vector2, THREE.Vector2]>[] = [];
        const distanceKeyframes: AnimationKey<number, THREE.Vector2>[] = [];
        const rotationKeyframes: AnimationKey<THREE.Euler, THREE.Vector2>[] = [];
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

            const nonScaledFrameNumber = frame.frameNum;
            const nonScaledNextFrameNumber = i + 1 < il ? frames[i + 1].frameNum : Infinity;
            const nonScaledFrameDiff = nonScaledNextFrameNumber - nonScaledFrameNumber;
            const interpolationKind = nonScaledFrameDiff < 1.0001 ? InterpolationKind.Step : InterpolationKind.Cubic;

            const frameNumber = nonScaledFrameNumber / 30 * this.frameRate;

            const inInterpolation = frame.interpolation;
            const outInterpolation = frames[i + 1]?.interpolation ?? defaultInterpolation;

            {
                const aCenter = frame.position;
                center.set(aCenter[0], aCenter[1], aCenter[2]);

                centerKeyframes.push(new AnimationKey(
                    frameNumber,
                    center,
                    interpolationKind,
                    [
                        new THREE.Vector2(inInterpolation[1] / 127, inInterpolation[3] / 127),
                        new THREE.Vector2(inInterpolation[5] / 127, inInterpolation[7] / 127),
                        new THREE.Vector2(inInterpolation[9] / 127, inInterpolation[11] / 127)
                    ],
                    [
                        new THREE.Vector2(outInterpolation[0] / 127, outInterpolation[2] / 127),
                        new THREE.Vector2(outInterpolation[4] / 127, outInterpolation[6] / 127),
                        new THREE.Vector2(outInterpolation[8] / 127, outInterpolation[10] / 127)
                    ]
                ));
            }

            {
                const aRotation = frame.rotation;
                euler.set(-aRotation[0], -aRotation[1], -aRotation[2]);

                rotationKeyframes.push(new AnimationKey(
                    frameNumber,
                    euler,
                    interpolationKind,
                    new THREE.Vector2(inInterpolation[13] / 127, inInterpolation[15] / 127),
                    new THREE.Vector2(outInterpolation[12] / 127, outInterpolation[14] / 127)
                ));
            }

            {
                distanceKeyframes.push(new AnimationKey(
                    frameNumber,
                    frame.distance,
                    interpolationKind,
                    new THREE.Vector2(inInterpolation[17] / 127, inInterpolation[19] / 127),
                    new THREE.Vector2(outInterpolation[16] / 127, outInterpolation[18] / 127)
                ));
            }

            {
                fovKeyframes.push(new AnimationKey(
                    frameNumber,
                    frame.fov,
                    interpolationKind,
                    new THREE.Vector2(inInterpolation[21] / 127, inInterpolation[23] / 127),
                    new THREE.Vector2(outInterpolation[20] / 127, outInterpolation[22] / 127)
                ));
            }
        }

        return new AnimationClip([
            {
                name: "center",
                track: AnimationTrack.createTrack(centerKeyframes, Vector3IndependentBezierInterpolator, this.frameRate)
            },
            {
                name: "rotation",
                track: AnimationTrack.createTrack(rotationKeyframes, EulerBezierInterpolator, this.frameRate)
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
                trackName: "rotation",
                target: euler => QuaternionUtils.rotationYawPitchRoll(euler.y, euler.x, euler.z, cameraRotation)
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
