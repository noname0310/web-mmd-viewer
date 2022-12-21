import { Camera, CameraType, Color, GameObjectBuilder, InitializeComponent, Prefab, PrefabRef } from "the-world-engine";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MmdCamera } from "../script/mmd/MmdCamera";

export class MmdCameraPrefab extends Prefab {
    private _cameraInitializer: ((c: InitializeComponent<Camera>) => void)|null = null;
    private _cameraLoaderInitializer: ((c: InitializeComponent<MmdCamera>) => void)|null = null;
    private _audioUrl = new PrefabRef<string>();
    private _cameraChildBuilder: GameObjectBuilder|null = null;

    private _cameraLoader = new PrefabRef<MmdCamera>();
    private _camera = new PrefabRef<Camera>();
    private _audioPlayer = new PrefabRef<AudioPlayer>();

    public withCameraInitializer(initializer: (c: InitializeComponent<Camera>) => void): this {
        if (this._cameraInitializer !== null) throw new Error("cameraInitializer is already set");
        this._cameraInitializer = initializer;
        return this;
    }

    public withCameraLoaderInitializer(initializer: (c: InitializeComponent<MmdCamera>) => void): this {
        if (this._cameraLoaderInitializer !== null) throw new Error("cameraLoaderInitializer is already set");
        this._cameraLoaderInitializer = initializer;
        return this;
    }

    public withAudioUrl(url: PrefabRef<string>): this {
        this._audioUrl = url;
        return this;
    }

    public withCameraChild(childBuilder: GameObjectBuilder): this {
        if (this._cameraChildBuilder !== null) throw new Error("cameraChildBuilder is already set");
        this._cameraChildBuilder = childBuilder;
        return this;
    }

    public getCameraLoader(cameraLoader: PrefabRef<MmdCamera>): this {
        this._cameraLoader = cameraLoader;
        return this;
    }

    public getCamera(camera: PrefabRef<Camera>): this {
        this._camera = camera;
        return this;
    }

    public getAudioPlayer(audioPlayer: PrefabRef<AudioPlayer>): this {
        this._audioPlayer = audioPlayer;
        return this;
    }

    public make(): GameObjectBuilder {
        const instantiater = this.instantiater;

        const cameraBuilder = instantiater.buildGameObject("camera")
            .withComponent(Camera, c => {
                c.near = 1;
                c.far = 1000;
                c.priority = -2;
                c.cameraType = CameraType.Perspective;
                c.backgroundColor = new Color(1, 1, 1, 1);
                this._cameraInitializer?.(c);
            })
            .withComponent(MmdCamera, c => {
                this._cameraLoaderInitializer?.(c);
            })
            .withComponent(AudioPlayer, c => {
                if (this._audioUrl.ref) c.asyncSetAudioFromUrl(this._audioUrl.ref);
                c.gain = -0.6;
            })
            .getComponent(Camera, this._camera)
            .getComponent(MmdCamera, this._cameraLoader)
            .getComponent(AudioPlayer, this._audioPlayer);

        if (this._cameraChildBuilder !== null) {
            cameraBuilder.withChild(this._cameraChildBuilder);
        }

        return this.gameObjectBuilder
            .withChild(cameraBuilder);
    }
}
