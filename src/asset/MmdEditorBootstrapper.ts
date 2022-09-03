import {
    Bootstrapper,
    Camera,
    CameraType,
    Color,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WebGLRendererLoader
} from "the-world-engine";
import * as THREE from "three/src/Three";
import { AnimationLoopMode } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AnimationControl } from "tw-engine-498tokio/dist/asset/script/AnimationControl";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MmdCameraPrefab } from "./prefab/MmdCameraPrefab";
import { ClockCalibrator } from "./script/animation/ClockCalibrator";
import { EditorController } from "./script/mmd/editor/EditorController";
import { EditorUi } from "./script/mmd/editor/EditorUi";
import { MmdCamera } from "./script/mmd/MmdCamera";
import { MmdController } from "./script/mmd/MmdController";
import { OrbitControls } from "./script/OrbitControls";
import { UiController } from "./script/UiController";

export class MmdEditorBootstrapper extends Bootstrapper {
    public run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        this.setting.render.webGLRenderer(() => {
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdCameraLoader = new PrefabRef<MmdCamera>();
        const audioPlayer = new PrefabRef<AudioPlayer>();
        const animationPlayer = new PrefabRef<AnimationSequencePlayer>();

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("editor-object")
                .withComponent(EditorController, c => {
                    c.initialize(mmdCameraLoader.ref!, audioPlayer.ref!);
                })
                .withComponent(EditorUi))

            .withChild(instantiater.buildGameObject("game-manager")
                .withComponent(UiController, c => {
                    c.orbitCamera = orbitCamera.ref;
                    c.switchCameraButton = document.getElementById("switch-camera-button") as HTMLButtonElement;
                    c.fullscreenButton = document.getElementById("fullscreen_button") as HTMLButtonElement;
                })
                .withComponent(AnimationControl, c => {
                    c.playButton = document.getElementById("play_button")! as HTMLButtonElement;
                    c.frameDisplayText = document.getElementById("frame_display")! as HTMLInputElement;
                    c.player = animationPlayer.ref;
                    c.slider = document.getElementById("animation_slider")! as HTMLInputElement;
                    c.slider.value = "0";
                    c.playbackRateSlider = document.getElementById("playback_rate_slider")! as HTMLInputElement;
                    c.playbackRateSlider.value = "1";
                }))
            
            .withChild(instantiater.buildGameObject("mmd-player")
                .withComponent(AnimationSequencePlayer, c => {
                    c.animationClock = new ClockCalibrator(audioPlayer.ref!);
                    c.loopMode = AnimationLoopMode.None;
                })
                .withComponent(MmdController, c => {
                    c;
                    // const modelLoaders = this._modelLoaders;
                    // for (let i = 0; i < modelLoaders.length; ++i) {
                    //     if(modelLoaders[i].ref) {
                    //         c.addModelLoader(modelLoaders[i].ref!);
                
                    //         const mmdPlayer = c.gameObject.addComponent(MmdPlayer)!;
                    //         c.addMmdPlayer(mmdPlayer);
                    //         mmdPlayer.usePhysics = this._usePhysics.ref!;
                    //         mmdPlayer.useIk = this._useIk.ref!;
                    //     }
                    // }
                
                    // c.cameraLoader = this._cameraLoader.ref;
                    // c.physicsMaximumStepCount = 1;
                
                    // if (this._modelAnimationName.ref) {
                    //     c.asyncPlay(
                    //         this._modelAnimationName.ref,
                    //         this._cameraAnimationName.ref ?? undefined
                    //     );
                    // }
                })
                .getComponent(AnimationSequencePlayer, animationPlayer))

            .withChild(instantiater.buildGameObject("orbit-camera", new THREE.Vector3(0, 0, 40))
                .withComponent(Camera, c => {
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.near = 1;
                    c.far = 1500;
                    c.priority = -1;
                    c.backgroundColor = new Color(1, 1, 1, 1);
                })
                .withComponent(OrbitControls, c => {
                    c.enabled = true;
                    c.target = new THREE.Vector3(0, 14, 0);
                    c.minDistance = 20;
                    c.maxDistance = 100;
                    c.enableDamping = false;
                })
                .getComponent(Camera, orbitCamera))
            
            .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab, new THREE.Vector3(0, 15, 20))
                .withCameraInitializer(c => {
                    c.priority = 0;
                })
                .getCamera(camera)
                .getCameraLoader(mmdCameraLoader)
                .getAudioPlayer(audioPlayer)
                .make())
            
            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3), object3D => object3D.dispose());
                }))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 100))
                .withComponent(Object3DContainer<THREE.DirectionalLight>, c => {
                    const light = new THREE.DirectionalLight(0xffffff, 0.5);
                    light.castShadow = true;
                    light.shadow.mapSize.width = 1024 * 8;
                    light.shadow.mapSize.height = 1024 * 8;
                    const radius = 200;
                    light.shadow.camera.top = radius;
                    light.shadow.camera.bottom = -radius;
                    light.shadow.camera.left = -radius;
                    light.shadow.camera.right = radius;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 400;
                    c.setObject3D(light, object3D => object3D.dispose());
                })
                .withComponent(Object3DContainer<THREE.CameraHelper>, c => {
                    c.enabled = false;
                    c.setObject3D(new THREE.CameraHelper(directionalLight.ref!.object3D!.shadow.camera), object3D => object3D.dispose());
                    c.startCoroutine(function*(): CoroutineIterator {
                        for (; ;) {
                            c.updateWorldMatrix();
                            yield null;
                        }
                    }());
                })
                .getComponent(Object3DContainer, directionalLight))
        ;
    }
}
