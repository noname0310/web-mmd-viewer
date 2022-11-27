import { DepthOfFieldEffect } from "postprocessing";
import { PrefabRef } from "the-world-engine";
import { IUniform } from "three";
import { AnimationClip, AnimationClipBindInfo, AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";

type RemoveReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

export class MelancholicNightDofAnimation {
    private static readonly _focalLengthAnimationClip = new AnimationClip([
        {
            name: "focalLength" as const,
            track: AnimationTrack.createScalarTrack([
                new AnimationKey(0.000, 1.00, InterpolationKind.Step),
                new AnimationKey(3232., 0.03, InterpolationKind.Step),
                new AnimationKey(4144., 1.00, InterpolationKind.Step),
                new AnimationKey(7148., 0.03, InterpolationKind.Step),
                new AnimationKey(8092., 1.00, InterpolationKind.Step),
                new AnimationKey(8992., 0.03, InterpolationKind.Step),
                new AnimationKey(10026, 1.00, InterpolationKind.Step),
                new AnimationKey(10974, 0.03, InterpolationKind.Step),
                new AnimationKey(11900, 1.00, InterpolationKind.Step)
            ])
        }
    ]);

    public static readonly sequence = new AnimationSequence([
        new RangedAnimation(this._focalLengthAnimationClip)
    ]);

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public static createBindInfo(
        depthOfFieldEffect: PrefabRef<DepthOfFieldEffect>
    ) {
        let cachedDepthOfFieldEffect: DepthOfFieldEffect | null = null;
        let uniform: IUniform<number> | null = null;

        const ambientLightClipBindInfo = new AnimationClipBindInfo([
            {
                trackName: "focalLength" as const,
                target: (value: number): void => {
                    if (cachedDepthOfFieldEffect !== depthOfFieldEffect.ref) {
                        cachedDepthOfFieldEffect = depthOfFieldEffect.ref;
                        uniform = depthOfFieldEffect.ref?.circleOfConfusionMaterial.uniforms.focalLength ?? null;
                    }
                    if (uniform !== null) uniform.value = value;
                }
            }
        ]);

        const bindInfo = [
            ambientLightClipBindInfo
        ] as const;
        return bindInfo as RemoveReadonly<typeof bindInfo>;
    }
}
