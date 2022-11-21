import { Component, EventContainer, IEventContainer, PrefabRef } from "the-world-engine";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MmdCamera } from "../MmdCamera";
import { MmdController } from "../MmdController";
import { MmdModel } from "../MmdModel";
import { BrowserFileIO } from "./BrowserFileIO";

export class EditorController extends Component {
    private readonly _modelList: MmdModel[] = [];
    private _camera: MmdCamera|null = null;
    private _audioPlayer: AudioPlayer|null = null;
    private _mmdController: MmdController|null = null;
    private _animationPlayer: AnimationSequencePlayer|null = null;

    private readonly _onModelsUpdatedEvent = new EventContainer<(models: readonly MmdModel[]) => void>();

    public awake(): void {
        if (!this._camera) throw new Error("MmdCamera is not set.");
        if (!this._audioPlayer) throw new Error("AudioPlayer is not set.");
    }

    public onDestroy(): void {
        const modelList = this._modelList;
        for (let i = 0; i < modelList.length; ++i) {
            modelList[i].destroy();
        }
        modelList.length = 0;
        this._camera = null;
    }

    public initialize(camera: MmdCamera, audioPlayer: AudioPlayer, mmdController: MmdController): void {
        this._camera = camera;
        this._audioPlayer = audioPlayer;
        this._mmdController = mmdController;
        this._animationPlayer = mmdController.gameObject.getComponent(AnimationSequencePlayer)!;
    }

    public spawnModel(pmx: File, files: readonly File[]): void {
        if (files.length === 0) throw new Error("No files are specified.");

        const fileIO = new BrowserFileIO();
        fileIO.addFiles("", ...files);

        const mmdModelRef = new PrefabRef<MmdModel>();

        this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject(pmx.name)
                .withComponent(MmdModel, c => {
                    c.forceAllInterpolateToCubic = true;
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
        model.gameObject.destroy();
        modelList.splice(index, 1);
        this._onModelsUpdatedEvent.invoke(this._modelList);
    }

    public get models(): readonly MmdModel[] {
        return this._modelList;
    }

    public get camera(): MmdCamera {
        if (!this._camera) throw new Error("MmdCamera is not set.");
        return this._camera;
    }

    public get audioPlayer(): AudioPlayer {
        if (!this._audioPlayer) throw new Error("AudioPlayer is not set.");
        return this._audioPlayer;
    }

    public get mmdController(): MmdController {
        if (!this._mmdController) throw new Error("MmdController is not set.");
        return this._mmdController;
    }

    public get animationPlayer(): AnimationSequencePlayer {
        if (!this._animationPlayer) throw new Error("AnimationSequencePlayer is not set.");
        return this._animationPlayer;
    }

    public get onModelsUpdated(): IEventContainer<(models: readonly MmdModel[]) => void> {
        return this._onModelsUpdatedEvent;
    }
}
