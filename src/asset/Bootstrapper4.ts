import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WebGLGlobalPostProcessVolume,
    WebGLRendererLoader
} from "the-world-engine";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { AdaptiveToneMappingPass } from "three/examples/jsm/postprocessing/AdaptiveToneMappingPass";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "./prefab/GameManagerPrefab";
import { GlobalAssetManager } from "./script/GlobalAssetManager";
import { MmdCameraLoader } from "./script/MmdCameraLoader";
import { MmdMaterialUtils, MMDToonMaterial } from "./script/MmdMaterialUtils";
import { MmdModelLoader } from "./script/MmdModelLoader";
import { OrbitControls } from "./script/OrbitControls";
import { PostProcessDisposer } from "./script/PostProcessDisposer";
import { Ui } from "./script/Ui";
import EntranceHallHdr from "./texture/entrance_hall_1k.hdr";

export class Bootstrapper4 extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        this.setting.render.webGLRenderer(() => {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
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

        const assetManager = new PrefabRef<GlobalAssetManager>();
        
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

                
            .withChild(instantiater.buildGameObject("asset-manager")
                .withComponent(GlobalAssetManager, c => {
                    const env = new RGBELoader().load(EntranceHallHdr, () => {/*do nothing*/});
                    env.mapping = THREE.EquirectangularReflectionMapping;
                    env.encoding = THREE.sRGBEncoding;
                    c.addAsset("env", env);
                })
                .getComponent(GlobalAssetManager, assetManager))
            
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
                    c.initializer((scene, camera, screen) => {
                        const adaptiveTonemappingPass = new AdaptiveToneMappingPass(true, 256);
                        adaptiveTonemappingPass.setMiddleGrey(8);

                        const smaaPass = new SMAAPass(screen.width, screen.height);

                        const aoPass = new SAOPass(scene, camera);
                        aoPass.params.saoIntensity = 0.01;
                        aoPass.params.saoScale = 20;
                        (globalThis as any).ssaoPass = aoPass;

                        const bloomPass = new UnrealBloomPass(new THREE.Vector2(screen.width, screen.height), 0.4, 0.4, 0.9);

                        bokehPass = new BokehPass(scene, camera, {
                            aperture: 0,
                            maxblur: 0.02
                        });
                        
                        return [[adaptiveTonemappingPass, smaaPass, aoPass, bloomPass, bokehPass], (): void => {
                            PostProcessDisposer.disposePass(adaptiveTonemappingPass);
                            PostProcessDisposer.disposePass(smaaPass);
                            PostProcessDisposer.disposePass(aoPass);
                            PostProcessDisposer.disposePass(bloomPass);
                            PostProcessDisposer.disposePass(bokehPass!);
                        }];
                    });
                }))
            
            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5), object3D => object3D.dispose());
                }))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-5, 30, 100))
                .withComponent(Object3DContainer<THREE.DirectionalLight>, c => {
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
                .withComponent(Object3DContainer<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhongMaterial>>, c => {
                    const mesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1000, 1000),
                        new THREE.MeshPhongMaterial({ color: 0xffffff, depthWrite: true, emissive: "rgb(50, 50, 50)" })
                    );
                    mesh.receiveShadow = true;
                    c.setObject3D(mesh, object3D => {
                        object3D.geometry.dispose();
                        object3D.material.dispose();
                    });
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

                        const materials = model!.material instanceof Array ? model!.material : [model!.material];

                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i];
                            const name = material.name;
                            if (name !== "金1" &&
                            name !== "金の三つ編み　1" &&
                            name !== "金の三つ編み　2" &&
                            name !== "宝石" &&
                            name !== "金の王冠") continue;

                            const standardMaterial = materials[i] = MmdMaterialUtils.convert(material as MMDToonMaterial);
                            standardMaterial.roughness = 0;
                            standardMaterial.metalness = 0.9;
                            standardMaterial.envMap?.dispose();
                            standardMaterial.envMap = assetManager.ref!.assets.get("env") as THREE.Texture;
                            standardMaterial.envMapIntensity = 0.5;
                            standardMaterial.lightMapIntensity = 0.5;
                        }
                        
                        {
                            const eyeMatIndex = materials.findIndex(m => m.name === "eyes");
                            const eyes = MmdMaterialUtils.convert(materials[eyeMatIndex] as MMDToonMaterial);
                            eyes.roughness = 0;
                            eyes.metalness = 0.8;
                            eyes.envMapIntensity = 0.5;
                            eyes.lightMapIntensity = 0.5;
                            eyes.envMap?.dispose();
                            eyes.envMap = assetManager.ref!.assets.get("env") as THREE.Texture;
                            eyes.needsUpdate = true;
                        }

                        {
                            const hairs = ["髪　01", "髪　02", "髪　03"];
                            for (let i = 0; i < hairs.length; ++i) {
                                const hairIndex = materials.findIndex(m => m.name === hairs[i]);
                                const hair = MmdMaterialUtils.convert(materials[hairIndex] as MMDToonMaterial);
                                hair.roughness = 0.2;
                                hair.metalness = 0.0;
                                hair.envMapIntensity = 0.1;
                                hair.lightMapIntensity = 0.9;
                                hair.envMap?.dispose();
                                hair.envMap = assetManager.ref!.assets.get("env") as THREE.Texture;
                                hair.needsUpdate = true;
                            }
                        }

                        const eyeball = materials.find(m => m.name === "白い目")! as THREE.MeshStandardMaterial;
                        eyeball.emissive = new THREE.Color(0.5, 0.5, 0.5);
                    });
                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
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
