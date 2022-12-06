import { DepthOfFieldEffect } from "postprocessing";
import { GameObject, PrefabRef } from "the-world-engine";
import { IUniform } from "three";
import { AnimationClip, AnimationClipBindInfo, AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";

import { EmptyBooleanInterpolator } from "../script/mmd/interpolation/EmptyInterpolator";

type RemoveReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

export class MelancholicNightStageAnimation {
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

    private static readonly _creditTogglingAnimationClip = new AnimationClip([
        {
            name: "creditToggling" as const,
            track: AnimationTrack.createTrack([
                new AnimationKey(0.000, false, InterpolationKind.Step),
                new AnimationKey(12114, true, InterpolationKind.Step)
            ], EmptyBooleanInterpolator)
        }
    ]);

    public static readonly sequence = new AnimationSequence([
        new RangedAnimation(this._focalLengthAnimationClip),
        new RangedAnimation(this._creditTogglingAnimationClip)
    ]);

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public static createBindInfo(
        depthOfFieldEffect: PrefabRef<DepthOfFieldEffect>,
        creditObject: PrefabRef<GameObject>
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

        const creditTogglingClipBindInfo = new AnimationClipBindInfo([
            {
                trackName: "creditToggling" as const,
                target: (value: boolean): void => {
                    if (creditObject.ref) creditObject.ref.activeSelf = value;
                }
            }
        ]);

        const bindInfo = [
            ambientLightClipBindInfo,
            creditTogglingClipBindInfo
        ] as const;
        return bindInfo as RemoveReadonly<typeof bindInfo>;
    }
}
