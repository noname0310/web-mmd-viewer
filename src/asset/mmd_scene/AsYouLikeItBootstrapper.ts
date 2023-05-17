import {
    Bootstrapper as BaseBootstrapper,
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
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCameraPrefab } from "../prefab/MmdCameraPrefab";
import { VideoAnimationInstance } from "../script/animation/VideoAnimationInstance";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { Ui } from "../script/Ui";
import { unsafeIsComponent } from "../unsafeIsComponent";

export class AsYouLikeItBootstrapper extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        this.setting.render.webGLRenderer(() => {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputColorSpace = THREE.NoColorSpace;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const animationPlayer = new PrefabRef<AnimationSequencePlayer>();
        const audioPlayer = new PrefabRef<AudioPlayer>();

        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModelLoader)
                .withCameraLoader(mmdCameraLoader)
                .withAudioPlayer(audioPlayer)
                .withCameraAnimationName(new PrefabRef("animation1"))
                .withModelAnimationName(new PrefabRef("animation1"))
                .getAnimationPlayer(animationPlayer)
                .make())

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

            .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab)
                .withAudioUrl(new PrefabRef("mmd/as_you_like_it/as_you_like_it.mp3"))
                .withCameraLoaderInitializer(c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const cameraLoadingText = document.createElement("div");
                    loadingText.appendChild(cameraLoadingText);

                    c.onProgress.addListener((e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            cameraLoadingText.innerText = "camera: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadAnimation("animation1", "mmd/as_you_like_it/TDA Cam.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .getCamera(camera)
                .getCameraLoader(mmdCameraLoader)
                .getAudioPlayer(audioPlayer)
                .withCameraChild(
                    instantiater.buildGameObject("background-video", new THREE.Vector3(0, 0, -500))
                        .withComponent(Object3DContainer<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>, c => {
                            const video = new VideoAnimationInstance(document.createElement("video"));
                            animationPlayer.ref!.onAnimationStart.addListener(() => {
                                video.htmlVideo.play();
                            });
                            animationPlayer.ref!.onAnimationPaused.addListener(() => {
                                video.htmlVideo.pause();
                            });
                            animationPlayer.ref!.onAnimationProcess.addListener(frame => {
                                video.process(frame, audioPlayer.ref!.playbackRate);
                            });

                            const videoElement = video.htmlVideo;
                            videoElement.autoplay = false;
                            videoElement.src = encodeURI("mmd/as_you_like_it/Background 30帧_x264.mp4");
                            videoElement.muted = true;

                            const texture = new THREE.VideoTexture(videoElement);
                            const aspect = 1280 / 720;
                            const plane = new THREE.Mesh(
                                new THREE.PlaneGeometry(aspect, 1),
                                new THREE.MeshBasicMaterial({ map: texture })
                            );
                            plane.material.depthTest = true;
                            plane.material.depthWrite = true;

                            c.setObject3D(plane, object3D => {
                                object3D.geometry.dispose();
                                object3D.material.dispose();
                            });

                            if (!unsafeIsComponent(c)) return;
                            c.startCoroutine(function*(): CoroutineIterator {
                                const mmdCamera = camera.ref!;
                                const scale = c.transform.localScale;
                                let lastFov = 0;
                                for (;;) {
                                    if (lastFov !== mmdCamera.fov || lastFov !== mmdCamera.fov) {
                                        scale.setScalar(Math.tan(mmdCamera.fov / 2 * THREE.MathUtils.DEG2RAD) * 2 * 500);
                                        lastFov = mmdCamera.fov;
                                    }
                                    yield null;
                                }
                            }());
                        }))
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
                    const radius = 40;
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
                    if (!unsafeIsComponent(c)) return;
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
                .withComponent(Object3DContainer<THREE.GridHelper>, c => {
                    c.setObject3D(new THREE.GridHelper(30, 10), object3D => {
                        object3D.geometry.dispose();
                        if (object3D.material instanceof Array) {
                            const materials = object3D.material;
                            for (let i = 0; i < materials.length; ++i) {
                                materials[i].dispose();
                            }
                        } else {
                            object3D.material.dispose();
                        }
                    });
                }))

            .withChild(instantiater.buildGameObject("ground",
                undefined,
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
            )
                .active(false)
                .withComponent(Object3DContainer<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>, c => {
                    const mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1000, 1000),
                        new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false })
                    );
                    mesh.receiveShadow = true;
                    c.setObject3D(mesh, object3D => {
                        object3D.geometry.dispose();
                        object3D.material.dispose();
                    });
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
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
                    c.asyncLoadAnimation("animation1", [ "mmd/as_you_like_it/TDA Motion.vmd" ], () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModel, mmdModelLoader))
        ;
    }
}
