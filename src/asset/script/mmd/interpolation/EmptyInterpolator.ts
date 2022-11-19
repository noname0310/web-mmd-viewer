import { IAnimationInterpolator } from "tw-engine-498tokio";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const EmptyBooleanInterpolator = new class implements IAnimationInterpolator<boolean, void> {
    public readonly linearTangent = undefined;
    public lerp(): boolean {
        throw new Error("Method not implemented.");
    }

    public cubic(): boolean {
        throw new Error("Method not implemented.");
    }
}; 
