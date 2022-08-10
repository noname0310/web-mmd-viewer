import { MMDParser } from "three/examples/jsm/libs/mmdparser.module";
import * as THREE from "three/src/Three";

export class MmdCameraAnimationBuilder {
    private readonly _parser = new MMDParser.Parser();
    private readonly _fileLoader = new THREE.FileLoader();

    public loadAnimationFromUrl(
        url: string,
        onLoad: (animation: THREE.AnimationClip) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
    ): void {
        this._fileLoader.setResponseType("arraybuffer");

        this._fileLoader.load(url, buffer => {
            const animation = this.loadAnimation(buffer as ArrayBuffer);
            onLoad(animation);
        }, onProgress, onError);
    }

    public loadAnimation(buffer: ArrayBufferLike): THREE.AnimationClip {
        const vmd = this._parser.parseVmd(buffer, true);
        if (vmd.metadata.cameraCount === 0) {
            throw new Error("VMD does not contain camera animation.");
        }

        function pushVector3(array: number[], vec: THREE.Vector3): void {
            array.push(vec.x);
            array.push(vec.y);
            array.push(vec.z);
        }

        function pushQuaternion(array: number[], q: THREE.Quaternion): void {
            array.push(q.x);
            array.push(q.y);
            array.push(q.z);
            array.push(q.w);
        }

        function pushInterpolation(array: number[], interpolation: number[], index: number): void {
            array.push(interpolation[index * 4 + 0] / 127); // x1
            array.push(interpolation[index * 4 + 1] / 127); // x2
            array.push(interpolation[index * 4 + 2] / 127); // y1
            array.push(interpolation[index * 4 + 3] / 127); // y2
        }

        const frames = vmd.cameras;
        frames.sort((a, b) => a.frameNum - b.frameNum);

        const center = new THREE.Vector3();
        const euler = new THREE.Euler();
        const quaternion = new THREE.Quaternion();

        const times: number[] = [];

        const centerKeyframes: number[] = [];
        const centerKeyframeInterpolations: number[] = [];

        const quaternionKeyframes: number[] = [];
        const quaternionKeyframeInterpolations: number[] = [];

        const distanceKeyframes: number[] = [];
        const distanceKeyframeInterpolations: number[] = [];

        const fovKeyframes: number[] = [];
        const fovKeyframeInterpolations: number[] = [];

        for (let i = 0, il = frames.length; i < il; i++) {
            const frame = frames[i];
            const frameNumber = frame.frameNum;

            times.push(frameNumber / 30);
            
            const aCenter = frame.position;
            center.set(aCenter[0], aCenter[1], aCenter[2]);
            
            const aRotation = frame.rotation;
            euler.set(-aRotation[0], -aRotation[1], -aRotation[2]);
            quaternion.setFromEuler(euler);
            
            const aDistance = frame.distance;

            const aFov = frame.fov;

            pushVector3(centerKeyframes, center);
            pushQuaternion(quaternionKeyframes, quaternion);

            distanceKeyframes.push(0);
            distanceKeyframes.push(0);
            distanceKeyframes.push(-aDistance);

            fovKeyframes.push(aFov);

            for (let j = 0; j < 3; ++j) {
                pushInterpolation(centerKeyframeInterpolations, frame.interpolation, j);
            }

            pushInterpolation(quaternionKeyframeInterpolations, frame.interpolation, 3);
            
            for (let j = 0; j < 3; ++j) {
                pushInterpolation(distanceKeyframeInterpolations, frame.interpolation, j);
            }

            pushInterpolation(fovKeyframeInterpolations, frame.interpolation, 5);
        }

        const tracks: THREE.KeyframeTrack[] = [];
        tracks.push(this.createTrack(".parent.parent.position", THREE.VectorKeyframeTrack, times, centerKeyframes, centerKeyframeInterpolations));
        tracks.push(this.createTrack(".parent.parent.quaternion", THREE.QuaternionKeyframeTrack, times, quaternionKeyframes, quaternionKeyframeInterpolations));
        tracks.push(this.createTrack(".position.z", THREE.VectorKeyframeTrack, times, distanceKeyframes, distanceKeyframeInterpolations));
        tracks.push(this.createTrack(".fov", THREE.NumberKeyframeTrack, times, fovKeyframes, fovKeyframeInterpolations));

        return new THREE.AnimationClip(vmd.metadata.name, -1, tracks);
    }

    private createTrack(
        node: string,
        typedKeyframeTrack: typeof THREE.KeyframeTrack,
        times: number[],
        values: number[],
        interpolations: number[]
    ): THREE.KeyframeTrack {
        /*
         * optimizes here not to let KeyframeTrackPrototype optimize
         * because KeyframeTrackPrototype optimizes times and values but
         * doesn't optimize interpolations.
         */
        if (times.length > 2) {
            times = times.slice();
            values = values.slice();
            interpolations = interpolations.slice();

            const stride = values.length / times.length;
            const interpolateStride = interpolations.length / times.length;

            let index = 1;

            for (let aheadIndex = 2, endIndex = times.length; aheadIndex < endIndex; aheadIndex++) {
                for (let i = 0; i < stride; i++) {
                    if (values[index * stride + i] !== values[(index - 1) * stride + i] ||
                        values[index * stride + i] !== values[aheadIndex * stride + i]) {

                        index++;
                        break;
                    }
                }

                if (aheadIndex > index) {
                    times[index] = times[aheadIndex];

                    for (let i = 0; i < stride; i++) {
                        values[index * stride + i] = values[aheadIndex * stride + i];
                    }

                    for (let i = 0; i < interpolateStride; i++) {
                        interpolations[index * interpolateStride + i] = interpolations[aheadIndex * interpolateStride + i];
                    }
                }
            }

            times.length = index + 1;
            values.length = (index + 1) * stride;
            interpolations.length = (index + 1) * interpolateStride;
        }

        const track = new typedKeyframeTrack(node, times, values);

        // eslint-disable-next-line @typescript-eslint/naming-convention
        (track as any).createInterpolant = function InterpolantFactoryMethodCubicBezier(result: any): CubicBezierInterpolation {
            return new CubicBezierInterpolation(this.times, this.values, this.getValueSize(), result, new Float32Array(interpolations));
        };

        return track;
    }
}

class CubicBezierInterpolation extends THREE.Interpolant {
    public interpolationParams: Float32Array;

    public constructor(parameterPositions: any, sampleValues: any, sampleSize: number, resultBuffer: any, params: Float32Array) {
        super(parameterPositions, sampleValues, sampleSize, resultBuffer);

        this.interpolationParams = params;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public interpolate_(i1: number, t0: number, t: number, t1: number): number[] {
        const result = this.resultBuffer;
        const values = this.sampleValues;
        const stride = this.valueSize;
        const params = this.interpolationParams;

        const offset1 = i1 * stride;
        const offset0 = offset1 - stride;

        // No interpolation if next key frame is in one frame in 30fps.
        // This is from MMD animation spec.
        // '1.5' is for precision loss. times are Float32 in Three.js Animation system.
        const weight1 = ((t1 - t0) < 1 / 30 * 1.5) ? 0.0 : (t - t0) / (t1 - t0);

        if (stride === 4) { // Quaternion
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            THREE.Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
        } else if (stride === 3) { // Vector3
            for (let i = 0; i !== stride; ++i) {
                const x1 = params[i1 * 12 + i * 4 + 0];
                const x2 = params[i1 * 12 + i * 4 + 1];
                const y1 = params[i1 * 12 + i * 4 + 2];
                const y2 = params[i1 * 12 + i * 4 + 3];

                const ratio = this._calculate(x1, x2, y1, y2, weight1);

                result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
            }
        } else { // Number
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
        }

        return result;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _calculate(x1: number, x2: number, y1: number, y2: number, x: number): number {
        let c = 0.5;
        let t = c;
        let s = 1.0 - t;
        const loop = 15;
        const eps = 1e-5;
        const math = Math;

        let sst3: number, stt3: number, ttt: number;

        for (let i = 0; i < loop; i++) {
            sst3 = 3.0 * s * s * t;
            stt3 = 3.0 * s * t * t;
            ttt = t * t * t;

            const ft = (sst3 * x1) + (stt3 * x2) + (ttt) - x;

            if (math.abs(ft) < eps) break;

            c /= 2.0;

            t += (ft < 0) ? c : - c;
            s = 1.0 - t;
        }
        return (sst3! * y1) + (stt3! * y2) + ttt!;
    }
}
