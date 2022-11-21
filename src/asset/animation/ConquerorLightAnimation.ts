import { Object3DContainer } from "the-world-engine";
import { AnimationClip, AnimationClipBindInfo, AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";

type RemoveReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

export class ConquerorLightAnimation {
    private static readonly _ambientLightAnimationClip = new AnimationClip([
        {
            name: "ambientLight_intensity" as const,
            track: AnimationTrack.createScalarTrack([
                new AnimationKey(0.00, 0.900, InterpolationKind.Linear),
                new AnimationKey(3906, 0.900, InterpolationKind.Linear),
                new AnimationKey(4053, 0.150, InterpolationKind.Linear),
                new AnimationKey(4151, 0.150, InterpolationKind.Linear),
                new AnimationKey(4252, 0.900, InterpolationKind.Linear),
                new AnimationKey(6041, 0.900, InterpolationKind.Linear),
                new AnimationKey(6068, 0.150, InterpolationKind.Linear),
                new AnimationKey(6506, 0.150, InterpolationKind.Linear),
                new AnimationKey(6522, 0.900, InterpolationKind.Linear),
                new AnimationKey(8241, 0.900, InterpolationKind.Linear),
                new AnimationKey(8357, 0.150, InterpolationKind.Linear),
                new AnimationKey(8467, 0.150, InterpolationKind.Linear),
                new AnimationKey(8532, 0.900, InterpolationKind.Linear),
                new AnimationKey(10404, 0.900, InterpolationKind.Linear),
                new AnimationKey(10538, 0.150, InterpolationKind.Linear),
                new AnimationKey(11203, 0.150, InterpolationKind.Linear),
                new AnimationKey(11218, 0.800, InterpolationKind.Linear),
                new AnimationKey(13339, 0.800, InterpolationKind.Linear),
                new AnimationKey(13473, 0.200, InterpolationKind.Linear)
            ])
        }
    ]);

    private static readonly _spotLightAnimationClip = new AnimationClip([
        {
            name: "spotLight_intensity" as const,
            track: AnimationTrack.createScalarTrack([
                new AnimationKey(0.00, 0.000, InterpolationKind.Linear),
                new AnimationKey(3906, 0.000, InterpolationKind.Linear),
                new AnimationKey(4053, 7.000, InterpolationKind.Linear),
                new AnimationKey(4151, 7.000, InterpolationKind.Linear),
                new AnimationKey(4151, 0.000, InterpolationKind.Step),
                new AnimationKey(6041, 0.000, InterpolationKind.Linear),
                new AnimationKey(6068, 7.000, InterpolationKind.Linear),
                new AnimationKey(6506, 7.000, InterpolationKind.Linear),
                new AnimationKey(6522, 0.000, InterpolationKind.Linear),
                new AnimationKey(8241, 0.000, InterpolationKind.Linear),
                new AnimationKey(8357, 7.000, InterpolationKind.Linear),
                new AnimationKey(8467, 7.000, InterpolationKind.Linear),
                new AnimationKey(8467, 0.000, InterpolationKind.Step),
                new AnimationKey(10404, 0.000, InterpolationKind.Linear),
                new AnimationKey(10538, 7.000, InterpolationKind.Linear),
                new AnimationKey(11203, 7.000, InterpolationKind.Linear),
                new AnimationKey(11218, 0.000, InterpolationKind.Linear),
                new AnimationKey(13339, 0.000, InterpolationKind.Linear),
                new AnimationKey(13473, 0.000, InterpolationKind.Linear)
            ])
        }
    ]);

    private static readonly _stageAnimationClip = new AnimationClip([
        {
            name: "stage_activation" as const,
            track: AnimationTrack.createScalarTrack([
                new AnimationKey(11203, 1.000, InterpolationKind.Linear),
                new AnimationKey(11218, 0.000, InterpolationKind.Linear)
            ])
        }
    ]);

    public static readonly sequence = new AnimationSequence([
        new RangedAnimation(this._ambientLightAnimationClip),
        new RangedAnimation(this._spotLightAnimationClip),
        new RangedAnimation(this._stageAnimationClip)
    ]);

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public static createBindInfo(
        ambientLight: THREE.Light,
        spotLight: THREE.Light,
        stage: Object3DContainer<THREE.Object3D>[]
    ) {
        const ambientLightClipBindInfo = new AnimationClipBindInfo([
            {
                trackName: "ambientLight_intensity" as const,
                target: (value: number): void => {
                    ambientLight.intensity = value;
                }
            }
        ]);

        const spotLightClipBindInfo = new AnimationClipBindInfo([
            {
                trackName: "spotLight_intensity" as const,
                target: (value: number): void => {
                    spotLight.intensity = value;
                }
            }
        ]);

        const stageClipBindInfo = new AnimationClipBindInfo([
            {
                trackName: "stage_activation" as const,
                target: (value: number): void => {
                    stage[0].enabled = value > 0;
                    stage[1].enabled = value > 0;
                }
            }
        ]);

        const bindInfo = [
            ambientLightClipBindInfo,
            spotLightClipBindInfo,
            stageClipBindInfo
        ] as const;
        return bindInfo as RemoveReadonly<typeof bindInfo>;
    }
}
