import { Bootstrapper, Camera, EditorCameraController, EditorGridRenderer, SceneBuilder } from "the-world-engine";

import { BezierCurve } from "./script/mmd/interpolation/BezierInterpolator";
import { InterpolateSampler } from "./script/mmd/interpolation/InterpolateSampler";

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
                        const y1 = 1;
                        const x2 = 2;
                        const y2 = 2;
                        return BezierCurve.interpolate(t, x1, y1, x2, y2);
                    };
                }))
        ;
    }
}
