import { Component, EventContainer, IEventContainer, PrefabRef } from "the-world-engine";

import { MmdCamera } from "../MmdCamera";
import { MmdModel } from "../MmdModel";
import { BrowserFileIO } from "./BrowserFileIO";

export class EditorController extends Component {
    private readonly _modelList: MmdModel[] = [];
    private _camera: MmdCamera|null = null;

    private readonly _onModelsUpdatedEvent = new EventContainer<(models: readonly MmdModel[]) => void>();

    public awake(): void {
        if (!this._camera) throw new Error("MmdCamera is not set.");
    }

    public onDestroy(): void {
        const modelList = this._modelList;
        for (let i = 0; i < modelList.length; ++i) {
            modelList[i].destroy();
        }
        modelList.length = 0;
        this._camera = null;
    }

    public initialize(camera: MmdCamera): void {
        this._camera = camera;
    }

    public spawnModel(pmx: File, files: readonly File[]): void {
        if (files.length === 0) throw new Error("No files are specified.");

        const fileIO = new BrowserFileIO();
        fileIO.addFiles("", ...files);

        const mmdModelRef = new PrefabRef<MmdModel>();

        this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject(pmx.name)
                .withComponent(MmdModel, c => {
                    c.setUrlModifier(fileIO.getURLModifier());
                    c.asyncLoadModel(pmx.webkitRelativePath, model => {
                        fileIO.removeAllFiles();
                        if (!c.exists) return;
                        model.castShadow = true;
                        model.receiveShadow = true;
                    });
                })
                .getComponent(MmdModel, mmdModelRef)
        );

        this._modelList.push(mmdModelRef.ref!);
        this._onModelsUpdatedEvent.invoke(this._modelList);
    }

    public removeModel(model: MmdModel): void {
        const modelList = this._modelList;
        const index = modelList.indexOf(model);
        if (index < 0) return;
        model.destroy();
        modelList.splice(index, 1);
        this._onModelsUpdatedEvent.invoke(this._modelList);
    }
    
    public get models(): readonly MmdModel[] {
        return this._modelList;
    }

    public get onModelsUpdated(): IEventContainer<(models: readonly MmdModel[]) => void> {
        return this._onModelsUpdatedEvent;
    }
}
