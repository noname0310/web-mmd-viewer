import { Camera, GameObjectBuilder, Prefab, PrefabRef } from "the-world-engine";
import { AnimationLoopMode } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AnimationControl } from "tw-engine-498tokio/dist/asset/script/AnimationControl";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { ClockCalibrator } from "../script/animation/ClockCalibrator";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdController } from "../script/mmd/MmdController";
import { MmdModel } from "../script/mmd/MmdModel";
import { MmdPlayer } from "../script/mmd/MmdPlayer";
import { Ui } from "../script/Ui";
import { UiController } from "../script/UiController";
import { unsafeIsComponent } from "../unsafeIsComponent";

export class GameManagerPrefab extends Prefab {
    private _orbitCamera = new PrefabRef<Camera>();
    private _camera = new PrefabRef<Camera>();
    private _audioPlayer = new PrefabRef<AudioPlayer>();
    private readonly _mmdModels: PrefabRef<MmdModel>[] = [];
    private _mmdCamera = new PrefabRef<MmdCamera>();
    private _modelAnimationName = new PrefabRef<string>();
    private _cameraAnimationName = new PrefabRef<string>();
    private _useIk = new PrefabRef<boolean>(true);
    private _usePhysics = new PrefabRef<boolean>(true);
    private readonly _useIkMap: { model: PrefabRef<MmdModel>; useIk: boolean }[] = [];
    private readonly _usePhysicsMap: { model: PrefabRef<MmdModel>; usePhysics: boolean }[] = [];
    private _physicsMaximumStepCount = new PrefabRef<number>(1);
    private _forceWaitAnimation = new PrefabRef<boolean>(false);

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

    public withModelLoader(model: PrefabRef<MmdModel>): this {
        this._mmdModels.push(model);
        return this;
    }

    public withCameraLoader(camera: PrefabRef<MmdCamera>): this {
        this._mmdCamera = camera;
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

    public withUseIk(useIk: PrefabRef<boolean>): this {
        this._useIk = useIk;
        return this;
    }

    public withUsePhysics(usePhysics: PrefabRef<boolean>): this {
        this._usePhysics = usePhysics;
        return this;
    }

    public withSpecificUseIk(model: PrefabRef<MmdModel>, useIk: boolean): this {
        this._useIkMap.push({ model, useIk });
        return this;
    }

    public withSpecificUsePhysics(model: PrefabRef<MmdModel>, usePhysics: boolean): this {
        this._usePhysicsMap.push({ model, usePhysics });
        return this;
    }

    public withPhysicsMaximumStepCount(physicsMaximumStepCount: PrefabRef<number>): this {
        this._physicsMaximumStepCount = physicsMaximumStepCount;
        return this;
    }

    public withForceWaitAnimation(forceWaitAnimation: PrefabRef<boolean>): this {
        this._forceWaitAnimation = forceWaitAnimation;
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
                .withComponent(AnimationSequencePlayer, c => {
                    c.animationClock = new ClockCalibrator(this._audioPlayer.ref!);
                    c.loopMode = AnimationLoopMode.None;
                })
                .withComponent(MmdController, c => {
                    c.onLoadComplete.addListener(() => {
                        Ui.getOrCreateLoadingElement().remove();
                        if (this._camera.ref) this._camera.ref.priority = 0;
                    });

                    const models = this._mmdModels;
                    for (let i = 0; i < models.length; ++i) {
                        const mmdModel = models[i].ref;
                        if (mmdModel) {
                            c.addModel(mmdModel);

                            if (!unsafeIsComponent(c)) return;
                            const mmdPlayer = c.gameObject.addComponent(MmdPlayer)!;
                            c.addMmdPlayer(mmdPlayer);
                            mmdPlayer.usePhysics = this._usePhysics.ref!;
                            mmdPlayer.useIk = this._useIk.ref!;

                            const usePhysicsMap = this._usePhysicsMap;
                            for (let j = 0; j < usePhysicsMap.length; ++j) {
                                const { model, usePhysics } = usePhysicsMap[j];
                                if (model.ref === mmdModel) {
                                    mmdPlayer.usePhysics = usePhysics;
                                    break;
                                }
                            }

                            const useIkMap = this._useIkMap;
                            for (let j = 0; j < useIkMap.length; ++j) {
                                const { model, useIk } = useIkMap[j];
                                if (model.ref === mmdModel) {
                                    mmdPlayer.useIk = useIk;
                                    break;
                                }
                            }
                        }
                    }

                    c.mmdCamera = this._mmdCamera.ref;
                    c.physicsMaximumStepCount = this._physicsMaximumStepCount.ref ?? 1;

                    if (this._modelAnimationName.ref) {
                        c.asyncPlay(
                            this._modelAnimationName.ref,
                            this._cameraAnimationName.ref ?? undefined,
                            this._forceWaitAnimation.ref ?? false
                        );
                    }
                })
                .getComponent(AnimationSequencePlayer, this._animationPlayer));
    }
}
