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
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCameraPrefab } from "../prefab/MmdCameraPrefab";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { Ui } from "../script/Ui";
import { unsafeIsComponent } from "../unsafeIsComponent";

export class LemonBootstrapper extends Bootstrapper {
    public override run(): SceneBuilder {
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
        const mmdModelLoader1 = new PrefabRef<MmdModel>();
        const mmdModelLoader2 = new PrefabRef<MmdModel>();
        const mmdModelLoader3 = new PrefabRef<MmdModel>();
        const mmdModelLoader4 = new PrefabRef<MmdModel>();

        const audioPlayer = new PrefabRef<AudioPlayer>();

        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModelLoader1)
                .withModelLoader(mmdModelLoader2)
                .withModelLoader(mmdModelLoader3)
                .withModelLoader(mmdModelLoader4)
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
                .withAudioUrl(new PrefabRef("mmd/lemon/lemon.mp3"))
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

                    c.asyncLoadAnimation("animation1", "mmd/lemon/camera.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
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

            .withChild(instantiater.buildGameObject("ground",
                undefined,
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
            )
                .active(true)
                .withComponent(Object3DContainer<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhongMaterial>>, c => {
                    const mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1000, 1000),
                        new THREE.MeshPhongMaterial({ color: 0xffffff, depthWrite: true, emissive: "rgb(140, 140, 140)" })
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
                                .innerText = "luo_tian_yi " + type + ": " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/yyb_deep_canyons_miku/yyb_deep_canyons_miku_face_forward_bakebone.pmx", model => {
                        modelLoadingText.innerText = "luo_tian_yi model loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation(
                        "animation1",
                        [ "mmd/lemon/luo_tian_yi.vmd" ],
                        () => modelAnimationLoadingText.innerText = "luo_tian_yi animation loaded"
                    );
                })
                .getComponent(MmdModel, mmdModelLoader1))

            .withChild(instantiater.buildGameObject("mmd-model-2")
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
                                .innerText = "fukase " + type + ": " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/YYB 元气少女/Miku.pmx", model => {
                        modelLoadingText.innerText = "fukase model loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation(
                        "animation1",
                        [ "mmd/lemon/fukase.vmd" ],
                        () => modelAnimationLoadingText.innerText = "fukase animation loaded"
                    );
                })
                .getComponent(MmdModel, mmdModelLoader2))


            .withChild(instantiater.buildGameObject("mmd-model-lemon")
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
                                .innerText = "lemon " + type + ": " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/lemon/lemon_prop/lemon.pmx", model => {
                        modelLoadingText.innerText = "lemon model loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation(
                        "animation1",
                        [ "mmd/lemon/lemon_prop.vmd" ],
                        () => modelAnimationLoadingText.innerText = "lemon animation loaded"
                    );
                })
                .getComponent(MmdModel, mmdModelLoader3))

            .withChild(instantiater.buildGameObject("mmd-model-subtitle")
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
                    c.asyncLoadModel("mmd/lemon/The subtitle pmx/1.pmx", model => {
                        modelLoadingText.innerText = "subtitle model loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation(
                        "animation1",
                        [ "mmd/lemon/subtitles.vmd" ],
                        () => modelAnimationLoadingText.innerText = "subtitle animation loaded"
                    );
                })
                .getComponent(MmdModel, mmdModelLoader4))
        ;
    }
}
