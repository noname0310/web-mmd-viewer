import { GameObjectBuilder, Prefab, PrefabRef } from "the-world-engine";

import { MMDToonMaterial } from "../script/mmd/MmdMaterial";
import { MmdModel } from "../script/mmd/MmdModel";
import { Ui } from "../script/Ui";

export class SubtitlePrefab extends Prefab {
    private _mmdModel = new PrefabRef<MmdModel>();
    private _modelUrl = new PrefabRef<string>();
    private _animationUrls = new PrefabRef<string[]>();
    private _aniamtionName = new PrefabRef<string>("animation1");

    public getMmdModel(ref: PrefabRef<MmdModel>): this {
        this._mmdModel = ref;
        return this;
    }

    public withModelUrl(url: PrefabRef<string>): this {
        this._modelUrl = url;
        return this;
    }

    public withAnimationUrls(urls: PrefabRef<string[]>): this {
        this._animationUrls = urls;
        return this;
    }

    public withAnimationName(name: PrefabRef<string>): this {
        this._aniamtionName = name;
        return this;
    }

    public override make(): GameObjectBuilder {
        if (this._modelUrl.ref === null) throw new Error("modelUrl is not set");
        if (this._aniamtionName.ref === null) throw new Error("aniamtionName is not set");
        if (this._animationUrls.ref === null) throw new Error("animationUrls is not set");

        return this.gameObjectBuilder
            .withComponent(MmdModel, c => {
                const loadingText = Ui.getOrCreateLoadingElement();
                const modelLoadingText = document.createElement("div");
                loadingText.appendChild(modelLoadingText);
                const modelAnimationLoadingText = document.createElement("div");
                loadingText.appendChild(modelAnimationLoadingText);

                c.onProgress.addListener((type, e) => {
                    if (e.lengthComputable) {
                        const percentComplete = e.loaded / e.total * 100;
                        (type === "model" ? modelLoadingText : modelAnimationLoadingText)
                            .innerText = "subtitle " + type + ": " + Math.round(percentComplete) + "% loading";
                    }
                });
                c.asyncLoadModel(this._modelUrl.ref!, model => {
                    modelLoadingText.innerText = "subtitle model loaded";
                    model.castShadow = false;
                    model.frustumCulled = false;
                    model.renderOrder = 1;

                    const materials = model.material;

                    for (let i = 0; i < materials.length; ++i) {
                        const material = materials[i] as MMDToonMaterial;
                        material.depthWrite = false;
                    }
                });
                c.asyncLoadAnimation(
                    this._aniamtionName.ref!,
                    this._animationUrls.ref!,
                    () => modelAnimationLoadingText.innerText = "subtitle animation loaded"
                );
            })
            .getComponent(MmdModel, this._mmdModel);
    }
}
