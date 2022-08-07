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
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import { AdaptiveToneMappingPass } from "three/examples/jsm/postprocessing/AdaptiveToneMappingPass";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "./prefab/GameManagerPrefab";
import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { OrbitControls } from "./script/OrbitControls";
import { Ui } from "./script/Ui";
import WaterNormal from "./texture/waternormals.jpg";

export class Bootstrapper3 extends BaseBootstrapper {
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

        const water = new PrefabRef<Object3DContainer<Water>>();
        
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
                    c.near = 1;
                    c.far = 1500;
                    c.priority = -2;
                    c.cameraType = CameraType.Perspective;
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

                    c.asyncLoadAnimation("animation1", "mmd/flos/flos_camera_mod.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(AudioPlayer, c => {
                    c.asyncSetAudioFromUrl("mmd/flos/flos_YuNi.mp3");
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
                        ssaoPass.kernelRadius = 16;
                        ssaoPass.kernelSize = 8;
                        composer.addPass(ssaoPass);

                        const bloomPass = new UnrealBloomPass(new THREE.Vector2(screen.width / 10, screen.height / 10), 0.4, 0.4, 0.9);
                        composer.addPass(bloomPass);

                        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
                        composer.addPass(gammaCorrectionPass);

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
                .withComponent(Object3DContainer, c => c.object3D = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2)))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 70))
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
            
            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(450000))
                .withComponent(Object3DContainer, c => {
                    const sky = new Sky();
                    
                    const skyUniforms = sky.material.uniforms;

                    skyUniforms["turbidity"].value = 10;
                    skyUniforms["rayleigh"].value = 0.3;
                    skyUniforms["mieCoefficient"].value = 0.001;
                    skyUniforms["mieDirectionalG"].value = 1;
    
                    const sun = new THREE.Vector3();
                    const pmremGenerator = new THREE.PMREMGenerator(c.engine.webGL!.webglRenderer!);
                    let renderTarget: THREE.WebGLRenderTarget;
    
                    function updateSun(): void {
                        sun.copy(directionalLight.ref!.transform.localPosition).normalize();
    
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
                    c.asyncLoadAnimation("animation1",
                        [
                            "mmd/flos/flos_model.vmd"//, "mmd/pizzicato_drops/physics_reduce4.vmd"
                        ], () => {
                            modelAnimationLoadingText.innerText = "animation loaded";
                        });

                    c.startCoroutine(function*(): CoroutineIterator {
                        const headPosition = new THREE.Vector3();
                        const cameraNormal = new THREE.Vector3();
                        const tempVector = new THREE.Vector3();

                        yield null;
                        for (; ;) {
                            const container = c.object3DContainer;
                            const cameraUnwrap = c.engine.cameraContainer.camera;
                            if (container && container.object3D && cameraUnwrap) {
                                const model = container.object3D as THREE.SkinnedMesh;

                                const modelHead = model.skeleton.bones.find(b => b.name === "頭")!;
                                headPosition.setFromMatrixPosition(modelHead.matrixWorld);
                                const cameraPosition = cameraUnwrap.transform.position;
                                cameraUnwrap.transform.getForward(cameraNormal).negate();

                                const a = cameraNormal;
                                const b = tempVector.copy(headPosition).sub(cameraPosition);
                                const focusDistance = b.dot(a) / a.dot(a);

                                if (bokehPass) {
                                    const uniforms = bokehPass.uniforms as any;
                                    uniforms["focus"].value = focusDistance;
                                    uniforms["aperture"].value = Math.max(0, (0.0005 - (focusDistance * 0.00001)) / 2);
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
