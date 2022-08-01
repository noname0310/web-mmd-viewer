import { Camera, GameObjectBuilder, Prefab, PrefabRef } from "the-world-engine";
import { AnimationLoopMode } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AnimationControl } from "tw-engine-498tokio/dist/asset/script/AnimationControl";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { ClockCalibrator } from "../script/ClockCalibrator";
import { MmdCameraLoader } from "../script/MmdCameraLoader";
import { MmdController } from "../script/MmdController";
import { MmdModelLoader } from "../script/MmdModelLoader";
import { MmdPlayer } from "../script/MmdPlayer";
import { Ui } from "../script/Ui";
import { UiController } from "../script/UiController";

export class GameManagerPrefab extends Prefab {
    private _orbitCamera = new PrefabRef<Camera>();
    private _camera = new PrefabRef<Camera>();
    private _audioPlayer = new PrefabRef<AudioPlayer>();
    private _modelLoader = new PrefabRef<MmdModelLoader>();
    private _cameraLoader = new PrefabRef<MmdCameraLoader>();
    private _modelAnimationName = new PrefabRef<string>();
    private _cameraAnimationName = new PrefabRef<string>();

    private _animationPlayer = new PrefabRef<AnimationSequencePlayer>();

    public withOrbitCamera(orbitCamera: PrefabRef<Camera>): this {
        this._orbitCamera = orbitCamera;
        return this;
    }

    public withCamera(camera: PrefabRef<Camera>): this {
        this._camera = camera;
        return this;
    }

    public withAudioPlayer(audioPlayer: PrefabRef<AudioPlayer>): this {
        this._audioPlayer = audioPlayer;
        return this;
    }

    public withModelLoader(modelLoader: PrefabRef<MmdModelLoader>): this {
        this._modelLoader = modelLoader;
        return this;
    }

    public withCameraLoader(cameraLoader: PrefabRef<MmdCameraLoader>): this {
        this._cameraLoader = cameraLoader;
        return this;
    }

    public withModelAnimationName(modelAnimationName: PrefabRef<string>): this {
        this._modelAnimationName = modelAnimationName;
        return this;
    }

    public withCameraAnimationName(cameraAnimationName: PrefabRef<string>): this {
        this._cameraAnimationName = cameraAnimationName;
        return this;
    }

    public getAnimationPlayer(animationPlayer: PrefabRef<AnimationSequencePlayer>): this {
        this._animationPlayer = animationPlayer;
        return this;
    }

    public make(): GameObjectBuilder {
        const instantiater = this.instantiater;

        return this.gameObjectBuilder
            .withChild(instantiater.buildGameObject("game-manager")
                .withComponent(UiController, c => {
                    c.orbitCamera = this._orbitCamera.ref;
                    c.switchCameraButton = document.getElementById("switch-camera-button") as HTMLButtonElement;
                    c.fullscreenButton = document.getElementById("fullscreen_button") as HTMLButtonElement;
                })
                .withComponent(AnimationControl, c => {
                    c.playButton = document.getElementById("play_button")! as HTMLButtonElement;
                    c.frameDisplayText = document.getElementById("frame_display")! as HTMLInputElement;
                    c.player = this._animationPlayer.ref;
                    c.slider = document.getElementById("animation_slider")! as HTMLInputElement;
                    c.slider.value = "0";
                    c.playbackRateSlider = document.getElementById("playback_rate_slider")! as HTMLInputElement;
                    c.playbackRateSlider.value = "1";
                }))
            
            
            .withChild(instantiater.buildGameObject("mmd-player")
                .withComponent(MmdPlayer, c => {
                    c.usePhysics = true;
                })
                .withComponent(AnimationSequencePlayer, c => {
                    c.animationClock = new ClockCalibrator(this._audioPlayer.ref!);
                    c.frameRate = 60;
                    c.loopMode = AnimationLoopMode.None;
                })
                .withComponent(MmdController, c => {
                    c.onLoadComplete.addListener(() => {
                        Ui.getOrCreateLoadingElement().remove();
                        if (this._camera.ref) this._camera.ref.priority = 0;
                    });

                    c.modelLoader = this._modelLoader.ref;
                    c.cameraLoader = this._cameraLoader.ref;
                    c.physicsMaximumStepCount = 10;

                    if (this._modelAnimationName.ref) {
                        c.asyncPlay(
                            this._modelAnimationName.ref,
                            this._cameraAnimationName.ref ?? undefined
                        );
                    }
                })
                .getComponent(AnimationSequencePlayer, this._animationPlayer));
    }
}