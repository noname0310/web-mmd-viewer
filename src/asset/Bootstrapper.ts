import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    CoroutineIterator,
    DuckThreeCamera,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WaitUntil
} from "the-world-engine";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three/src/Three";

import { OrbitControls } from "./script/OrbitControls";

export class Bootstrapper extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 0.5;
        this.setting.render.webGLRenderer(new OutlineEffect(renderer), renderer.domElement);

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const audioListener = new PrefabRef<Object3DContainer<THREE.AudioListener>>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        document.getElementById("switch-camera-button")!.onclick = (): void => {
            if (orbitCamera.ref === null) return;

            orbitCamera.ref.priority = orbitCamera.ref.priority === -1 ? 1 : -1;
        };
        
        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("camera")
                .withComponent(Camera, c => {
                    c.priority = -2;
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.far = 1500;
                })
                .withComponent(Object3DContainer, c => c.object3D = new THREE.AudioListener())
                .getComponent(Camera, camera)
                .getComponent(Object3DContainer, audioListener))

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

            
            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(1000))
                .active(false)
                .withComponent(Object3DContainer, c => {
                    const sky = new Sky();
                    
                    const sun = new THREE.Vector3();
                    const effectController = {
                        turbidity: 10,
                        rayleigh: 3,
                        mieCoefficient: 0.005,
                        mieDirectionalG: 0.7,
                        elevation: 2,
                        azimuth: 180,
                        exposure: renderer.toneMappingExposure
                    };
    
                    function guiChanged(): void {
    
                        const uniforms = sky.material.uniforms;
                        uniforms[ "turbidity" ].value = effectController.turbidity;
                        uniforms[ "rayleigh" ].value = effectController.rayleigh;
                        uniforms[ "mieCoefficient" ].value = effectController.mieCoefficient;
                        uniforms[ "mieDirectionalG" ].value = effectController.mieDirectionalG;
    
                        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
                        const theta = THREE.MathUtils.degToRad( effectController.azimuth );
    
                        sun.setFromSphericalCoords( 1, phi, theta );
    
                        uniforms[ "sunPosition" ].value.copy( sun );
    
                        renderer.toneMappingExposure = effectController.exposure;
                    }

                    guiChanged();
                    c.object3D = sky;
                }))

            .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, -30))
                .withComponent(Object3DContainer, c => {
                    c.startCoroutine(loadAndRun());

                    function *loadAndRun(): CoroutineIterator {
                        let loadingText = document.getElementById("load-progress");
                        if (!loadingText) {
                            loadingText = document.createElement("div");
                            loadingText.id = "load-progress";
                            loadingText.style.position = "absolute";
                            loadingText.style.top = "0";
                            loadingText.style.left = "0";
                            loadingText.style.margin = "10px";
                            document.body.appendChild(loadingText);
                        }

                        const modelLoadingText = document.createElement("div");
                        loadingText.appendChild(modelLoadingText);

                        function makeProgressUpdate(title: string, target: HTMLElement) {
                            return function onProgress(xhr: ProgressEvent): void {
                                if (xhr.lengthComputable) {
                                    const percentComplete = xhr.loaded / xhr.total * 100;
                                    target.innerText = title + ": " + Math.round(percentComplete) + "% loading";
                                }
                            };
                        }

                        const modelFile = "mmd/Stage36/Stage36.pmx";

                        const loader = new MMDLoader();

                        let model: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>|null = null;
                        loader.load(modelFile, object => model = object, makeProgressUpdate("stage", modelLoadingText));
                        yield new WaitUntil(() => model !== null);
                        modelLoadingText.innerText = "stage loaded";

                        c.object3D = model;

                        // //replace all materials with phong materials
                        // const materials = model!.material as THREE.Material[];
                        // for (let i = 0; i < materials.length; i++) {
                        //     materials[i] = new THREE.MeshPhongMaterial(materials[i].userData);
                        // }

                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.receiveShadow = true;
                            }
                        });
                    }
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
                .withComponent(Object3DContainer, c => {
                    c.startCoroutine(loadAndRun());

                    function *loadAndRun(): CoroutineIterator {
                        let loadingText = document.getElementById("load-progress");
                        if (!loadingText) {
                            loadingText = document.createElement("div");
                            loadingText.id = "load-progress";
                            loadingText.style.position = "absolute";
                            loadingText.style.top = "0";
                            loadingText.style.left = "0";
                            loadingText.style.margin = "10px";
                            document.body.appendChild(loadingText);
                        }
                        const modelLoadingText = document.createElement("div");
                        loadingText.appendChild(modelLoadingText);
                        const modelAnimationLoadingText = document.createElement("div");
                        loadingText.appendChild(modelAnimationLoadingText);
                        const cameraLoadingText = document.createElement("div");
                        loadingText.appendChild(cameraLoadingText);
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

                        // const modelFile = "mmd/yyb_deep_canyons_miku/yyb_deep_canyons_miku_face_forward_bakebone.pmx";
                        // const vmdFiles = [
                        //     "mmd/flos/flos_model.vmd", "mmd/flos/flos_physics.vmd"
                        // ];
                        // const cameraFile = "mmd/flos/flos_camera_mod.vmd";
                        // const audioFile = "mmd/flos/flos_YuNi.mp3";
                        // const audioParams = { delayTime: 0 }; //delayTime: 160 * 1 / 30 };

                        const modelFile = "mmd/YYB 元气少女/Miku.pmx";
                        const vmdFiles = [
                            "mmd/pizzicato_drops/model.vmd"
                        ];
                        const cameraFile = "mmd/pizzicato_drops/camera.vmd";
                        const audioFile = "mmd/pizzicato_drops/pizzicato_drops.mp3";
                        const audioParams = { delayTime: 0 }; //delayTime: 160 * 1 / 30 };

                        const loader = new MMDLoader();

                        let model: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>|null = null;
                        loader.load(modelFile, object => model = object, makeProgressUpdate("model", modelLoadingText));
                        yield new WaitUntil(() => model !== null);
                        modelLoadingText.innerText = "model loaded";

                        c.object3D = model;
                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.frustumCulled = false;
                            }
                        });

                        const threeCamera = DuckThreeCamera.createInterface(camera.ref!, false).toThreeCamera();
                        
                        let modelAnimation: THREE.AnimationClip|null = null;
                        loader.loadAnimation(vmdFiles as any, model!,
                            object => modelAnimation = object as THREE.AnimationClip, makeProgressUpdate("model animation", modelAnimationLoadingText));
                        yield new WaitUntil(() => modelAnimation !== null);
                        modelAnimationLoadingText.innerText = "model animation loaded";

                        let cameraAnimation: THREE.AnimationClip|null = null;
                        loader.loadAnimation(cameraFile, threeCamera,
                            object => cameraAnimation = object as THREE.AnimationClip, makeProgressUpdate("camera motion", cameraLoadingText));
                        yield new WaitUntil(() => cameraAnimation !== null);
                        cameraLoadingText.innerText = "camera loaded";

                        const useAudio = true;
                        let audioBuffer: AudioBuffer|null = null;
                        if (useAudio) {
                            new THREE.AudioLoader().load(audioFile, buffer => audioBuffer = buffer, makeProgressUpdate("audio", audioLoadingText));
                            yield new WaitUntil(() => audioBuffer !== null);
                            audioLoadingText.innerText = "audio loaded";
                        }
                        const audio = new THREE.Audio(audioListener.ref!.object3D!).setBuffer(audioBuffer!);

                        const helper = new MMDAnimationHelper()
                            .enable("physics", vmdFiles.length < 2)
                            .enable("cameraAnimation", true)
                            .add(model!, { animation: modelAnimation! })
                            .add(threeCamera, { animation: cameraAnimation! });

                        if (useAudio) {
                            helper.add(audio, audioParams);
                        }

                        loadingText.remove();
                        camera.ref!.priority = 0;
                        yield null;
                        for (; ;) {
                            helper.update(c.engine.time.deltaTime);
                            c.updateWorldMatrix();
                            yield null;
                        }
                    }
                }))
        ;
    }
}
