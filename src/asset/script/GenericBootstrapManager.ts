import { Camera, Component, PrefabRef } from "the-world-engine";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MmdSettings } from "../mmd_scene/MmdGenericBootstrapper";
import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCamera } from "./mmd/MmdCamera";
import { MmdModel } from "./mmd/MmdModel";
import { Ui } from "./Ui";

export class GenericBootstrapManager extends Component {
    public models: {
        modelUrl: string;
        modelMotionUrl: string|string[];
    }[] = [];

    public camera = new PrefabRef<Camera>();
    public orbitCamera = new PrefabRef<Camera>();
    public mmdCameraLoader = new PrefabRef<MmdCamera>();
    public audioPlayer = new PrefabRef<AudioPlayer>();
    public mmdSettings = new PrefabRef<MmdSettings>();

    public awake(): void {
        const models = this.models;
        const modelLoaders: MmdModel[] = [];
        for (let i = 0; i < models.length; ++i) {
            const model = models[i];
            const modelLoader = this.spawnModelLoader(model.modelUrl, model.modelMotionUrl);
            modelLoaders.push(modelLoader);
        }

        const mmdSettings = this.mmdSettings.ref;

        const prefab = this.engine.instantiater.buildPrefab("game-manager", GameManagerPrefab)
            .withCamera(this.camera)
            .withOrbitCamera(this.orbitCamera)
            .withCameraLoader(this.mmdCameraLoader)
            .withAudioPlayer(this.audioPlayer)
            .withCameraAnimationName(new PrefabRef("animation1"))
            .withModelAnimationName(new PrefabRef("animation1"))
            .withUsePhysics(new PrefabRef(mmdSettings?.usePhysics ?? true))
            .withUseIk(new PrefabRef(mmdSettings?.useIk ?? true));

        for (let i = 0; i < modelLoaders.length; ++i) {
            prefab.withModelLoader(new PrefabRef(modelLoaders[i]));
        }

        this.engine.scene.addChildFromBuilder(prefab.make());
    }

    private spawnModelLoader(modelUrl: string, modelMotionUrl: string|string[]): MmdModel {
        const mmdSettings = this.mmdSettings.ref;
        const mmdModelLoader = new PrefabRef<MmdModel>();

        this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("mmd-model")
                .withComponent(MmdModel, c => {
                    c.forceAllInterpolateToCubic = mmdSettings?.forceAllInterpolateToCubic ?? false;

                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    const modelAnimationLoadingText = document.createElement("div");
                    loadingText.appendChild(modelAnimationLoadingText);

                    c.onProgress.addListener((type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            (type === "model" ? modelLoadingText : modelAnimationLoadingText)
                                .innerText = type + ": " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel(modelUrl, model => {
                        modelLoadingText.innerText = "model loaded";
                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.frustumCulled = false;
                            }
                        });
                    });
                    c.asyncLoadAnimation("animation1", modelMotionUrl, () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModel, mmdModelLoader));

        return mmdModelLoader.ref!;
    }
}
