import { Bootstrapper, Camera, EditorCameraController, EditorGridRenderer, SceneBuilder } from "the-world-engine";
import { Vector2 } from "three/src/Three";

import { BezierCurve } from "./script/mmd/interpolation/BezierInterpolator";
import { InterpolateSampler } from "./script/mmd/interpolation/InterpolateSampler";
import { MmdInterpolator } from "./script/mmd/interpolation/MmdInterpolator";
import { MmmInterpolator } from "./script/mmd/interpolation/MmmInterpolator";

export class InterpolationTestBootstrapper extends Bootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera, c => {
                    c.viewSize = 10;
                })
                .withComponent(EditorGridRenderer, c => {
                    c.gridCellWidth = 2;
                    c.gridCellHeight = 2;
                    c.lineWidth = 0.1;
                    c.renderHeight = 30;
                    c.renderWidth = 30;
                })
                .withComponent(EditorCameraController, c => {
                    c.mouseMoveButton = 0;
                }))

            .withChild(instantiater.buildGameObject("babylon-interpolation-test")
                .withComponent(InterpolateSampler, c => {
                    c.interpolator = (t: number): number => {
                        const x1 = 1;
                        const y1 = 0;
                        const x2 = 0;
                        const y2 = 1;
                        return BezierCurve.interpolate(t, x1, y1, x2, y2);
                    };

                    (globalThis as any).updateBabylonInterpolation = (x1: number, y1: number, x2: number, y2: number): void => {
                        c.interpolator = (t: number): number => {
                            return BezierCurve.interpolate(t, x1, y1, x2, y2);
                        };
                    };
                }))

            .withChild(instantiater.buildGameObject("mmd-interpolation-test")
                .withComponent(InterpolateSampler, c => {
                    c.sampleColor = "green";
                    c.interpolator = (t: number): number => {
                        const x1 = 1;
                        const y1 = 0;
                        const x2 = 0;
                        const y2 = 1;
                        return MmdInterpolator.interpolate(x1, x2, y1, y2, t);
                    };
                }))

            .withChild(instantiater.buildGameObject("mmm-interpolation-test")
                .withComponent(InterpolateSampler, c => {
                    c.sampleColor = "blue";
                    const tempVector1 = new Vector2();
                    const tempVector2 = new Vector2();
                    c.interpolator = (t: number): number => {
                        const x1 = 127;
                        const y1 = 0;
                        const x2 = 0;
                        const y2 = 127;
                        const outValue = { out: t };
                        const result = MmmInterpolator.interpolate(tempVector1.set(x1, y1), tempVector2.set(x2, y2), t, 0, 1, outValue);
                        return result;
                    };
                }))

            .withChild(instantiater.buildGameObject("mmm-interpolation-test2")
                .withComponent(InterpolateSampler, c => {
                    c.sampleColor = "yellow";
                    const tempVector1 = new Vector2();
                    const tempVector2 = new Vector2();
                    c.interpolator = (t: number): number => {
                        const x1 = 127;
                        const y1 = 0;
                        const x2 = 0;
                        const y2 = 127;
                        const outValue = { out: t };
                        MmmInterpolator.interpolate(tempVector1.set(x1, y1), tempVector2.set(x2, y2), t, 0, 1, outValue);
                        return outValue.out;
                    };
                }))
        ;
    }
}
