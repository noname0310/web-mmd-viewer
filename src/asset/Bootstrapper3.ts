import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder
} from "the-world-engine";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import * as THREE from "three/src/Three";
import { AnimationLoopMode } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AnimationControl } from "tw-engine-498tokio/dist/asset/script/AnimationControl";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { ClockCalibrator } from "./script/ClockCalibrator";
import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdController } from "./script/MmdController";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { MmdPlayer } from "./script/MmdPlayer";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";
import { UiController } from "./script/UiController";
import WaterNormal from "./texture/waternormals.jpg";

export class Bootstrapper3 extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //renderer.toneMapping = THREE.CineonToneMapping;
        this.setting.render.webGLRenderer(renderer, renderer.domElement);

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModelLoader>();
        const mmdCameraLoader = new PrefabRef<MmdCameraLoader>();

        const animationPlayer = new PrefabRef<AnimationSequencePlayer>();
        const audioPlayer = new PrefabRef<AudioPlayer>();
        const mmdPlayer = new PrefabRef<MmdPlayer>();

        const water = new PrefabRef<Object3DContainer<Water>>();
        
        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("game-manager")
                .withComponent(UiController, c => {
                    c.orbitCamera = orbitCamera.ref;
                    c.switchCameraButton = document.getElementById("switch-camera-button") as HTMLButtonElement;
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

                    c.asyncLoadAnimation("mmd/flos/flos_camera_mod.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(AudioPlayer, c => {
                    c.asyncSetAudioFromUrl("mmd/flos/flos_YuNi.mp3");
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
                    const radius = 200;
                    light.shadow.camera.top = radius;
                    light.shadow.camera.bottom = -radius;
                    light.shadow.camera.left = -radius;
                    light.shadow.camera.right = radius;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 600;
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

            .withChild(instantiater.buildGameObject("water",
                new THREE.Vector3(0, -20, 0),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
            )
                .withComponent(Object3DContainer, c => {
                    const water = new Water(
                        new THREE.PlaneGeometry( 10000, 10000 ),
                        {
                            textureWidth: 512,
                            textureHeight: 512,
                            waterNormals: new THREE.TextureLoader().load(WaterNormal, (texture) => {
                                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                            }),
                            sunDirection: new THREE.Vector3(),
                            sunColor: 0xffffff,
                            waterColor: 0x001e0f,
                            distortionScale: 3.7,
                            fog: c.engine.scene.unsafeGetThreeScene().fog !== undefined
                        }
                    );

                    c.object3D = water;

                    c.startCoroutine(function*(): CoroutineIterator {
                        for (; ;) {
                            water.material.uniforms["time"].value += 1.0 / 60.0;
                            yield null;
                        }
                    }());
                })
                .getComponent(Object3DContainer, water))
            
            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(1000))
                .withComponent(Object3DContainer, c => {
                    const sky = new Sky();
                    
                    const skyUniforms = sky.material.uniforms;

                    skyUniforms["turbidity"].value = 10;
                    skyUniforms["rayleigh"].value = 2;
                    skyUniforms["mieCoefficient"].value = 0.005;
                    skyUniforms["mieDirectionalG"].value = 0.8;
    
                    const sun = new THREE.Vector3();
                    const pmremGenerator = new THREE.PMREMGenerator( renderer );
                    let renderTarget: THREE.WebGLRenderTarget;
    
                    function updateSun(): void {
                        sun.copy(directionalLight.ref!.transform.localPosition);
    
                        sky.material.uniforms["sunPosition"].value.copy(sun);
                        water.ref!.object3D!.material.uniforms["sunDirection"].value.copy( sun ).normalize();
    
                        if ( renderTarget !== undefined ) renderTarget.dispose();
    
                        renderTarget = pmremGenerator.fromScene(sky as any);
    
                        c.engine.scene.unsafeGetThreeScene().environment = renderTarget.texture;
                    }
    
                    updateSun();

                    c.object3D = sky;
                }))

            .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, 0))
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

                    c.asyncLoadModel("mmd/water house 20200627/water house.pmx", model => {
                        modelLoadingText.innerText = "stage loaded";
                        model.castShadow = true;
                        model.receiveShadow = true;
                        model.frustumCulled = false;

                        model.traverse(object => {
                            if (object.name === "Chair 1") {
                                object.position.y = -100;
                            }
                        });

                        // const materials = model.material as THREE.Material[];
                        // for (let i = 0; i < materials.length; i++) {
                        //     if (materials[i].name == "flooring white") {
                        //         const material = new THREE.MeshStandardMaterial({
                        //             map: new THREE.TextureLoader().load("mmd/water house 20200627/WoodFloor041_8K_Color.jpg", texture => {
                        //                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        //                 texture.repeat.set(0.1, 0.1);
                        //             }),
                        //             aoMap: new THREE.TextureLoader().load("mmd/water house 20200627/WoodFloor041_8K_AmbientOcclusion.jpg", texture => {
                        //                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        //                 texture.repeat.set(0.1, 0.1);
                        //             }),
                        //             //aoMapIntensity?: number | undefined;
                        //             normalMap: new THREE.TextureLoader().load("mmd/water house 20200627/WoodFloor041_8K_Normal.jpg", texture => {
                        //                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        //                 texture.repeat.set(0.1, 0.1);
                        //             }),
                        //             //normalMapType?: NormalMapTypes | undefined;
                        //             //normalScale?: Vector2 | undefined;
                        //             displacementMap: new THREE.TextureLoader().load("mmd/water house 20200627/WoodFloor041_8K_Displacement.jpg", texture => {
                        //                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        //                 texture.repeat.set(0.1, 0.1);
                        //             }),
                        //             // displacementScale?: number | undefined;
                        //             // displacementBias?: number | undefined;
                        //             roughnessMap: new THREE.TextureLoader().load("mmd/water house 20200627/WoodFloor041_8K_Roughness.jpg", texture => {
                        //                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        //                 texture.repeat.set(0.1, 0.1);
                        //             })
                        //             // metalnessMap?: Texture | null | undefined;
                        //             // alphaMap?: Texture | null | undefined;
                        //             // fog?: boolean | undefined;
                        //         });
                        //         materials[i] = material;
                        //     }
                        // }

                        c.object3DContainer!.updateWorldMatrix();
                    });
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
                .active(true)
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
                    c.asyncLoadModel("mmd/yyb_deep_canyons_miku/yyb_deep_canyons_miku_face_forward_bakebone.pmx", model => {
                        modelLoadingText.innerText = "model loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation([
                        "mmd/flos/flos_model.vmd"//, "mmd/pizzicato_drops/physics_reduce4.vmd"
                    ], () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModelLoader, mmdModelLoader))

            
            .withChild(instantiater.buildGameObject("mmd-player")
                .withComponent(MmdPlayer, c => {
                    c.usePhysics = true;
                })
                .withComponent(AnimationSequencePlayer, c => {
                    c.animationClock = new ClockCalibrator(audioPlayer.ref!);
                    c.frameRate = 60;
                    c.loopMode = AnimationLoopMode.None;
                })
                .withComponent(MmdController, c => {
                    c.onLoadComplete.addListener(() => {
                        Ui.getOrCreateLoadingElement().remove();
                        camera.ref!.priority = 0;
                    });

                    c.asyncPlay(mmdModelLoader.ref!, mmdCameraLoader.ref!);
                })
                .getComponent(MmdPlayer, mmdPlayer)
                .getComponent(AnimationSequencePlayer, animationPlayer))
        ;
    }
}