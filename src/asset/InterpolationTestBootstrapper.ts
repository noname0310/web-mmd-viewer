import { Bootstrapper, Camera, SceneBuilder } from "the-world-engine";
import { CssImageTrace } from "./script/render/CssImageTrace";

export class InterpolationTestBootstrapper extends Bootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera))

            .withChild(instantiater.buildGameObject("babylon-interpolation-test")
                .withComponent(CssImageTrace));
        ;
    }
}
