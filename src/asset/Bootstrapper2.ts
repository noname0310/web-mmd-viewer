import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WaitForEndOfFrame,
    WaitUntil
} from "the-world-engine";
import * as THREE from "three/src/Three";

import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { MmdPlayer } from "./script/MmdPlayer";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";
import { UiController } from "./script/UiController";

export class Bootstrapper2 extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.setting.render.webGLRenderer(renderer);

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const audioListener = new PrefabRef<Object3DContainer<THREE.AudioListener>>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModelLoader>();
        const mmdCameraLoader = new PrefabRef<MmdCameraLoader>();
        let video: HTMLVideoElement|null = null;
        
        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("game-manager")
                .withComponent(UiController, c => {
                    c.orbitCamera = orbitCamera.ref;
                    c.switchCameraButton = document.getElementById("switch-camera-button") as HTMLButtonElement;
                }))

            .withChild(instantiater.buildGameObject("orbit-camera", new THREE.Vector3(0, 0, 40))
                .withComponent(Camera, c => {
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.far = 1500;
                    c.priority = -1;
                })
                .withComponent(OrbitControls, c => {
                    c.enabled = true;
                    c.target = new THREE.Vector3(0, 14, 0);
                    c.minDistance = 20;
                    c.maxDistance = 100;
                    c.enableDamping = false;
                })
                .getComponent(Camera, orbitCamera))

            
            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera, c => {
                    c.priority = -2;
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.far = 1500;
                })
                .withComponent(MmdCameraLoader, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const cameraLoadingText = document.createElement("div");
                    loadingText.appendChild(cameraLoadingText);

                    c.onProgress.addListener((e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            cameraLoadingText.innerText = "camera: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadAnimation("mmd/as_you_like_it/TDA Cam.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(Object3DContainer, c => c.object3D = new THREE.AudioListener())
                .getComponent(Camera, camera)
                .getComponent(MmdCameraLoader, mmdCameraLoader)
                .getComponent(Object3DContainer, audioListener)
                
                .withChild(instantiater.buildGameObject("background-video", new THREE.Vector3(0, 0, -500))
                    .withComponent(Object3DContainer, c => {
                        video = document.createElement("video");
                        video.src = encodeURI("mmd/as_you_like_it/Background 30帧_x264.mp4");
                        video.muted = true;
                        
                        const texture = new THREE.VideoTexture(video);
                        const aspect = 1280 / 720;
                        const plane = new THREE.Mesh(
                            new THREE.PlaneBufferGeometry(aspect, 1),
                            new THREE.MeshBasicMaterial({ map: texture })
                        );
                        plane.material.depthTest = true;
                        plane.material.depthWrite = true;

                        c.object3D = plane;

                        const waitForEndOfFrame = new WaitForEndOfFrame();
                        c.startCoroutine(function*(): CoroutineIterator {
                            const mmdCamera = camera.ref!;
                            const scale = c.transform.localScale;
                            let lastFov = 0;
                            for (;;) {
                                if (lastFov !== mmdCamera.fov || lastFov !== mmdCamera.fov) {
                                    scale.setScalar(Math.tan(mmdCamera.fov * THREE.MathUtils.DEG2RAD) * 500);
                                    lastFov = mmdCamera.fov;
                                }
                                yield waitForEndOfFrame;
                            }
                        }());
                    })))
            
            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer, c => c.object3D = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3)))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 100))
                .withComponent(Object3DContainer, c => {
                    const light = new THREE.DirectionalLight(0xffffff, 0.5);
                    light.castShadow = true;
                    light.shadow.mapSize.width = 1024 * 8;
                    light.shadow.mapSize.height = 1024 * 8;
                    const radius = 40;
                    light.shadow.camera.top = radius;
                    light.shadow.camera.bottom = -radius;
                    light.shadow.camera.left = -radius;
                    light.shadow.camera.right = radius;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 400;
                    c.object3D = light;
                })
                .withComponent(Object3DContainer, c => {
                    c.enabled = false;
                    c.object3D = new THREE.CameraHelper(directionalLight.ref!.object3D!.shadow.camera);
                    c.startCoroutine(function*(): CoroutineIterator {
                        for (; ;) {
                            c.updateWorldMatrix();
                            yield null;
                        }
                    }());
                })
                .getComponent(Object3DContainer, directionalLight))

            .withChild(instantiater.buildGameObject("polar-grid-helper")
                .active(false)
                .withComponent(Object3DContainer, c => c.object3D = new THREE.GridHelper(30, 10)))

            .withChild(instantiater.buildGameObject("ground",
                undefined,
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
            )
                .active(false)
                .withComponent(Object3DContainer, c => {
                    const mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1000, 1000),
                        new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false })
                    );
                    mesh.receiveShadow = true;
                    c.object3D = mesh;
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
                .withComponent(MmdModelLoader, c => {
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

                    c.asyncLoadModel("mmd/YYB式改変初音ミクV2_10th デフォ服/YYB式初音ミク_10th デフォ服 FF.pmx", model => {
                        modelLoadingText.innerText = "model loaded";
                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.frustumCulled = false;
                            }
                        });
                    });
                    c.asyncLoadAnimation([ "mmd/as_you_like_it/TDA Motion.vmd" ], () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModelLoader, mmdModelLoader))

            .withChild(instantiater.buildGameObject("mmd-player")
                .withComponent(MmdPlayer, c => {
                    c.startCoroutine(loadAndRun());

                    function *loadAndRun(): CoroutineIterator {
                        const loadingText = Ui.getOrCreateLoadingElement();
                        const audioLoadingText = document.createElement("div");
                        loadingText.appendChild(audioLoadingText);

                        function makeProgressUpdate(title: string, target: HTMLElement) {
                            return function onProgress(xhr: ProgressEvent): void {
                                if (xhr.lengthComputable) {
                                    const percentComplete = xhr.loaded / xhr.total * 100;
                                    target.innerText = title + ": " + Math.round(percentComplete) + "% loading";
                                }
                            };
                        }
                        const audioFile = "mmd/as_you_like_it/as_you_like_it.mp3";

                        let audioBuffer: AudioBuffer|null = null;
                        new THREE.AudioLoader().load(audioFile, buffer => audioBuffer = buffer, makeProgressUpdate("audio", audioLoadingText));
                        yield new WaitUntil(() => audioBuffer !== null);
                        audioLoadingText.innerText = "audio loaded";
                        const audio = new THREE.Audio(audioListener.ref!.object3D!).setBuffer(audioBuffer!);

                        while (mmdModelLoader.ref!.skinnedMesh === null || mmdModelLoader.ref!.isAnimationLoading) yield null;
                        while (mmdCameraLoader.ref!.isAnimationLoading) yield null;

                        const model = mmdModelLoader.ref!.object3DContainer!;
                        const modelAnimation = mmdModelLoader.ref!.animations[0];
                        const cameraLoaderDeRef = mmdCameraLoader.ref!;
                        const cameraAnimation = mmdCameraLoader.ref!.animations[0];

                        c.manualUpdate = true;
                        c.play(
                            model,
                            modelAnimation,
                            cameraLoaderDeRef.threeCamera!,
                            cameraAnimation,
                            audio
                        );

                        loadingText.remove();
                        camera.ref!.priority = 0;
                        yield null;
                        video!.play();
                        video!.loop = true;
                        
                        let elapsedTime = 0;
                        for (; ;) {
                            elapsedTime += c.engine.time.deltaTime;
                            c.process(elapsedTime * 60);
                            if (Math.abs(video!.currentTime - elapsedTime) > 10) {
                                video!.currentTime = elapsedTime;
                            }
                            
                            if (Math.abs(video!.currentTime - elapsedTime) > 0.1) {
                                video!.playbackRate = 1 + (video!.currentTime < elapsedTime ? 0.1 : -0.1);
                            }
                            yield null;
                        }
                    }
                }))
        ;
    }
}
