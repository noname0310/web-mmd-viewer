import { Bootstrapper, Camera, EditorCameraController, EditorGridRenderer, SceneBuilder } from "the-world-engine";
import { Vector2 } from "three/src/Three";
import { ScalarHermiteInterpolator } from "tw-engine-498tokio/dist/asset/script/animation/AnimationInterpolator";

import { BezierCurve } from "./script/mmd/interpolation/BezierInterpolator";
import { InterpolateSampler } from "./script/mmd/interpolation/InterpolateSampler";
import { ManualSampler } from "./script/mmd/interpolation/ManualSampler";
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
                .active(false)
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

            .withChild(instantiater.buildGameObject("babylon-hermite-interpolation-test")
                .active(true)
                .withComponent(InterpolateSampler, c => {
                    function hermiteInterpolate(a: number, b: number, tangentA: number, tangentB: number, t: number): number {
                        const squared = t * t;
                        const cubed = t * squared;
                        const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
                        const part2 = -2.0 * cubed + 3.0 * squared;
                        const part3 = cubed - 2.0 * squared + t;
                        const part4 = cubed - squared;

                        return a * part1 + b * part2 + tangentA * part3 + tangentB * part4;
                    }

                    c.sampleColor = "purple";
                    c.interpolator = (t: number): number => {
                        return hermiteInterpolate(0, 2, 3 * 2, 0, t);
                    };
                }))

            .withChild(instantiater.buildGameObject("mmd-interpolation-test")
                .active(true)
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
                .active(false)
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
                .active(false)
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

            .withChild(instantiater.buildGameObject("mmm-interpolation2-test")
                .active(false)
                .withComponent(InterpolateSampler, c => {
                    c.sampleColor = "red";
                    const p1 = new Vector2();
                    const p2 = new Vector2();
                    const p3 = new Vector2();
                    const p4 = new Vector2();
                    c.interpolator = (t: number): number => {
                        p1.set(0, 0);

                        p2.set(1, 0);
                        p3.set(0, 1);

                        p4.set(1, 1);
                        return MmmInterpolator.interpolate2(p1, p2, p3, p4, t, 1);
                    };
                }))

            .withChild(instantiater.buildGameObject("mmd-samples")
                .withComponent(ManualSampler, c => {
                    c.samples = [
                        new Vector2(0, 0),
                        new Vector2(5, 0.1),
                        new Vector2(10, 0.4),
                        new Vector2(15, 0.9),
                        new Vector2(20, 1.7),
                        new Vector2(25, 3.0),
                        new Vector2(30, 4.7),
                        new Vector2(35, 7.3),
                        new Vector2(40, 11.1),
                        new Vector2(45, 17.7),
                        new Vector2(50, 50.9),
                        new Vector2(55, 82.3),
                        new Vector2(60, 88.9),
                        new Vector2(65, 92.7),
                        new Vector2(70, 95.3),
                        new Vector2(75, 97.0),
                        new Vector2(80, 98.3),
                        new Vector2(85, 99.1),
                        new Vector2(90, 99.6),
                        new Vector2(95, 99.9),
                        new Vector2(100, 100)
                    ];

                    c.sampleColor = "blue";
                    c.unitScale = 0.1;
                }))

            .withChild(instantiater.buildGameObject("hermite-interpolation-test")
                .withComponent(InterpolateSampler, c => {
                    c.sampleColor = "red";
                    c.interpolator = (t: number): number => {
                        return ScalarHermiteInterpolator.cubic(0, 1, 90 * Math.PI / 180, 270 * Math.PI / 180, t);
                    };
                    (globalThis as any).updateHermiteInterpolation = (x1: number, y1: number): void => {
                        c.interpolator = (t: number): number => {
                            return ScalarHermiteInterpolator.cubic(0, 2, x1 * Math.PI / 180, y1 * Math.PI / 180, t);
                        };
                    };
                }))
        ;
    }
}
