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
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";
import * as THREE from "three/src/Three";

import { OrbitControls } from "./script/OrbitControls";

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
        let video: HTMLVideoElement|null = null;

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

                        c.startCoroutine(function*(): CoroutineIterator {
                            const mmdCamera = camera.ref!;
                            const scale = c.transform.localScale;
                            let lastFov = 0;
                            for (;;) {
                                if (lastFov !== mmdCamera.fov || lastFov !== mmdCamera.fov) {
                                    scale.setScalar(Math.tan(mmdCamera.fov * THREE.MathUtils.DEG2RAD) * 500);
                                    lastFov = mmdCamera.fov;
                                }
                                yield null;
                            }
                        }());
                    })))

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

                        const modelFile = "mmd/YYB式改変初音ミクV2_10th デフォ服/YYB式初音ミク_10th デフォ服 FF.pmx";
                        const vmdFiles = [
                            "mmd/as_you_like_it/TDA Motion.vmd"
                        ];
                        const cameraFile = "mmd/as_you_like_it/TDA Cam.vmd";
                        const audioFile = "mmd/as_you_like_it/as_you_like_it.mp3";
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
                        video!.play();
                        video!.loop = true;
                        for (; ;) {
                            helper.update(c.engine.time.deltaTime);
                            if (Math.abs(video!.currentTime - helper.audioManager.currentTime) > 10) {
                                video!.currentTime = helper.audioManager.currentTime;
                            }
                            
                            if (Math.abs(video!.currentTime - helper.audioManager.currentTime) > 0.1) {
                                video!.playbackRate = 1 + (video!.currentTime < helper.audioManager.currentTime ? 0.1 : -0.1);
                            }
                            c.updateWorldMatrix();
                            yield null;
                        }
                    }
                }))
        ;
    }
}
