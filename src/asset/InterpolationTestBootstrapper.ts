import { Bootstrapper, Camera, SceneBuilder } from "the-world-engine";

export class InterpolationTestBootstrapper extends Bootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera))
        ;
    }
}
