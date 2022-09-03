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

import { MmdCameraPrefab } from "./prefab/MmdCameraPrefab";
import { EditorController } from "./script/mmd/editor/EditorController";
import { EditorUi } from "./script/mmd/editor/EditorUi";
import { MmdCamera } from "./script/mmd/MmdCamera";
import { MmdModel } from "./script/mmd/MmdModel";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";

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

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("editor-object")
                .withComponent(EditorController, c => {
                    c.initialize(mmdCameraLoader.ref!);
                })
                .withComponent(EditorUi))

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
                // .withCameraLoaderInitializer(c => {
                //     const loadingText = Ui.getOrCreateLoadingElement();
                //     const cameraLoadingText = document.createElement("div");
                //     loadingText.appendChild(cameraLoadingText);
                //
                //     c.onProgress.addListener((e) => {
                //         if (e.lengthComputable) {
                //             const percentComplete = e.loaded / e.total * 100;
                //             cameraLoadingText.innerText = "camera: " + Math.round(percentComplete) + "% loading";
                //         }
                //     });
                // })
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

            .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, -30))
                .active(false)
                .withComponent(MmdModel, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    c.onProgress.addListener((_type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            modelLoadingText.innerText = "stage: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadModel("mmd/Stage36/Stage36.pmx", model => {
                        model.castShadow = true;
                        model.receiveShadow = true;
                        modelLoadingText.innerText = "stage loaded";
                        loadingText.remove();
                    });

                    loadingText.remove();
                }))
        ;
    }
}
