import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraContainer,
    CameraType,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WebGLGlobalPostProcessVolume,
    WebGLRendererLoader
} from "the-world-engine";
import { AdaptiveToneMappingPass } from "three/examples/jsm/postprocessing/AdaptiveToneMappingPass";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "./prefab/GameManagerPrefab";
import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";

export class Bootstrapper4 extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        this.setting.render.webGLRenderer(() => {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModelLoader>();
        const mmdCameraLoader = new PrefabRef<MmdCameraLoader>();

        const audioPlayer = new PrefabRef<AudioPlayer>();

        let bokehPass: BokehPass | null = null;
        
        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModelLoader)
                .withCameraLoader(mmdCameraLoader)
                .withAudioPlayer(audioPlayer)
                .withCameraAnimationName(new PrefabRef("animation1"))
                .withModelAnimationName(new PrefabRef("animation1"))
                .make())
            
            .withChild(instantiater.buildGameObject("orbit-camera", new THREE.Vector3(0, 0, 40))
                .withComponent(Camera, c => {
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.near = 1;
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
                    c.near = 1;
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

                    c.asyncLoadAnimation("animation1", "mmd/ruse/camera.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(AudioPlayer, c => {
                    c.asyncSetAudioFromUrl("mmd/ruse/ruse.mp3");
                })
                .getComponent(Camera, camera)
                .getComponent(MmdCameraLoader, mmdCameraLoader)
                .getComponent(AudioPlayer, audioPlayer))

            .withChild(instantiater.buildGameObject("post-process-volume")
                .withComponent(WebGLGlobalPostProcessVolume, c => {
                    c.initializer((composer, scene, camera, screen): void => {
                        const adaptiveTonemappingPass = new AdaptiveToneMappingPass(true, 256);
                        composer.addPass(adaptiveTonemappingPass);

                        const smaaPass = new SMAAPass(screen.width, screen.height);
                        composer.addPass(smaaPass);

                        const ssaoPass = new SSAOPass(scene, camera);
                        ssaoPass.kernelRadius = 8;
                        composer.addPass(ssaoPass);

                        const bloomPass = new UnrealBloomPass(new THREE.Vector2(screen.width, screen.height), 0.4, 0.4, 0.9);
                        composer.addPass(bloomPass);

                        bokehPass = new BokehPass(scene, camera, {
                            aperture: 0,
                            maxblur: 0.02
                        });
                        composer.addPass(bokehPass);
                        (globalThis as any).bokehPass = bokehPass;
                        
                        (c.engine.cameraContainer as CameraContainer).onCameraChanged.addListener(camera => {
                            ssaoPass.camera = (camera as any).threeCamera;
                            bokehPass!.camera = (camera as any).threeCamera;
                        });
                    });
                }))
            
            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer, c => c.object3D = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5)))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-5, 30, 100))
                .withComponent(Object3DContainer, c => {
                    const light = new THREE.DirectionalLight(0xffffff, 0.2);
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
                        new THREE.MeshPhongMaterial({ color: 0xffffff, depthWrite: true, emissive: "rgb(50, 50, 50)" })
                    );
                    mesh.receiveShadow = true;
                    c.object3D = mesh;
                }))

            .withChild(instantiater.buildGameObject("mmd-stage",
                new THREE.Vector3(0, 0, 0), 
                new THREE.Quaternion()//.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)
            )
                .withComponent(MmdModelLoader, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    c.onProgress.addListener((_type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            modelLoadingText.innerText = "stage1: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadModel("mmd/舞踏会風ステージVer2/舞踏会風ステージ.pmx", model => {
                        modelLoadingText.innerText = "stage1 loaded";
                        model.receiveShadow = true;
                        model.castShadow = false;
                    });
                })
                .withComponent(MmdModelLoader, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    c.onProgress.addListener((_type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            modelLoadingText.innerText = "stage2: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadModel("mmd/舞踏会風ステージVer2/タペストリー.pmx", model => {
                        modelLoadingText.innerText = "stage2 loaded";
                        model.receiveShadow = true;
                        model.castShadow = false;
                    });
                })
                .withComponent(MmdModelLoader, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    c.onProgress.addListener((_type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            modelLoadingText.innerText = "stage3: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadModel("mmd/舞踏会風ステージVer2/床.pmx", model => {
                        modelLoadingText.innerText = "stage3 loaded";
                        model.receiveShadow = true;
                        model.castShadow = false;
                    });
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
                    c.asyncLoadModel("mmd/YYB miku Crown Knight/YYB miku Crown Knight.pmx", model => {
                        modelLoadingText.innerText = "model loaded";
                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.frustumCulled = false;
                            }
                        });
                    });
                    c.asyncLoadAnimation("animation1", 
                        [
                            "mmd/ruse/model.vmd"
                        ], () => {
                            modelAnimationLoadingText.innerText = "animation loaded";
                        });

                    c.startCoroutine(function*(): CoroutineIterator {
                        const headPosition = new THREE.Vector3();
                        const cameraNormal = new THREE.Vector3();
                        const tempVector = new THREE.Vector3();

                        // let offset = 0;
                        // const slider = document.createElement("input");
                        // slider.type = "range";
                        // slider.min = "0";
                        // slider.max = "0.000001";
                        // slider.step = "0.0000000001";
                        // slider.value = "0";
                        // slider.style.position = "absolute";
                        // slider.style.left = "0";
                        // slider.style.top = "0";
                        // slider.style.width = "1000px";
                        // document.body.appendChild(slider);
                        // slider.addEventListener("input", () => {
                        //     offset = parseFloat(slider.value);
                        //     console.log(offset);
                        // });

                        yield null;
                        for (; ;) {
                            const container = c.object3DContainer;
                            if (container && container.object3D) {
                                const model = container.object3D as THREE.SkinnedMesh;
                                const modelHead = model.skeleton.bones.find(b => b.name === "頭")!;
                                for (; ;) {
                                    const cameraUnwrap = c.engine.cameraContainer.camera;
                                    if (!cameraUnwrap) {
                                        yield null;
                                        continue;
                                    }
                                    headPosition.setFromMatrixPosition(modelHead.matrixWorld);
                                    const cameraPosition = cameraUnwrap.transform.position;
                                    cameraUnwrap.transform.getForward(cameraNormal).negate();

                                    const a = cameraNormal;
                                    const b = tempVector.copy(headPosition).sub(cameraPosition);
                                    const focusDistance = b.dot(a) / a.dot(a);

                                    if (bokehPass) {
                                        const uniforms = bokehPass.uniforms as any;
                                        uniforms["focus"].value = focusDistance;

                                        const ratio = Math.max(0, 21 - Math.tan(cameraUnwrap.fov / 2 * THREE.MathUtils.DEG2RAD) * focusDistance);
                                        uniforms["aperture"].value = ratio * ratio * ratio * 6.1e-9;
                                    }
                                    yield null;
                                }
                            }
                            yield null;
                        }
                    }());
                })
                .getComponent(MmdModelLoader, mmdModelLoader))
        ;
    }
}
