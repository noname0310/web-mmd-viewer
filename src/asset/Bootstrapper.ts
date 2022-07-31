import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder
} from "the-world-engine";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three/src/Three";
import { AnimationLoopMode } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AnimationControl } from "tw-engine-498tokio/dist/asset/script/AnimationControl";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdController } from "./script/MmdController";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { MmdPlayer } from "./script/MmdPlayer";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";
import { UiController } from "./script/UiController";

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
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModelLoader>();
        const mmdCameraLoader = new PrefabRef<MmdCameraLoader>();

        const animationControl = new PrefabRef<AnimationControl>();
        const audioPlayer = new PrefabRef<AudioPlayer>();
        const mmdPlayer = new PrefabRef<MmdPlayer>();
        
        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("game-manager")
                .withComponent(UiController, c => {
                    c.orbitCamera = orbitCamera.ref;
                    c.switchCameraButton = document.getElementById("switch-camera-button") as HTMLButtonElement;
                })
                .withComponent(AnimationControl, c => {
                    c.playButton = document.getElementById("play_button")! as HTMLButtonElement;
                    c.frameDisplayText = document.getElementById("frame_display")! as HTMLInputElement;
                })
                .getComponent(AnimationControl, animationControl))
                
            
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

                    c.asyncLoadAnimation("mmd/pizzicato_drops/camera.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(AudioPlayer, c => {
                    c.asyncSetAudioFromUrl("mmd/pizzicato_drops/pizzicato_drops.mp3");
                })
                .getComponent(Camera, camera)
                .getComponent(MmdCameraLoader, mmdCameraLoader)
                .getComponent(AudioPlayer, audioPlayer))
            
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
                .withComponent(MmdModelLoader, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    c.onProgress.addListener((_type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            modelLoadingText.innerText = "stage: " + Math.round(percentComplete) + "% loading";
                        }
                    });

                    c.asyncLoadModel("mmd/Stage36/Stage36.pmx", () => {
                        modelLoadingText.innerText = "stage loaded";
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
                    c.asyncLoadModel("mmd/YYB 元气少女/Miku.pmx", model => {
                        modelLoadingText.innerText = "model loaded";
                        model!.traverse(object => {
                            if ((object as THREE.Mesh).isMesh) {
                                object.castShadow = true;
                                object.frustumCulled = false;
                            }
                        });
                    });
                    c.asyncLoadAnimation([
                        "mmd/pizzicato_drops/model.vmd", "mmd/pizzicato_drops/physics_reduce4.vmd"
                    ], () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModelLoader, mmdModelLoader))

            
            .withChild(instantiater.buildGameObject("mmd-player")
                .withComponent(MmdPlayer, c => {
                    c.usePhysics = false;
                })
                .withComponent(AnimationSequencePlayer, c => {
                    c.animationClock = audioPlayer.ref!;
                    c.frameRate = 60;
                    c.loopMode = AnimationLoopMode.None;
                })
                .withComponent(MmdController, c => {
                    c.onLoadComplete.addListener(() => {
                        Ui.getOrCreateLoadingElement().remove();
                        camera.ref!.priority = 0;
                        animationControl.ref!.player = c.gameObject.getComponent(AnimationSequencePlayer)!;
                        animationControl.ref!.slider = document.getElementById("animation_slider")! as HTMLInputElement;
                        animationControl.ref!.slider.value = "0";
                    });

                    c.asyncPlay(mmdModelLoader.ref!, mmdCameraLoader.ref!);
                })
                .getComponent(MmdPlayer, mmdPlayer))
        ;
    }
}
