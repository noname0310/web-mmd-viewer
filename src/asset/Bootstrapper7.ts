import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    Component,
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
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { ConquerorLightAnimation } from "./animation/ConquerorLightAnimation";
import { GameManagerPrefab } from "./prefab/GameManagerPrefab";
import { GlobalAssetManager } from "./script/GlobalAssetManager";
import { MmdCameraLoader } from "./script/mmd/MmdCameraLoader";
import { MmdMaterialUtils, MMDToonMaterial } from "./script/mmd/MmdMaterialUtils";
import { MmdModelLoader } from "./script/mmd/MmdModelLoader";
import { OrbitControls } from "./script/OrbitControls";
import { PostProcessDisposer } from "./script/render/PostProcessDisposer";
import { SSRPassOverride } from "./script/render/SSRPassOverride";
//import { SSRPass } from "./script/screenSpaceReflectionsPass/src/SSRPass";
import { Ui } from "./script/Ui";
import EntranceHallHdr from "./texture/entrance_hall_1k.hdr";

export class Bootstrapper7 extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        this.setting.render.webGLRenderer(() => {
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                precision: "highp"
            });
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

        const ssrPassSelects: THREE.Mesh[] = [];

        const animationPlayer = new PrefabRef<AnimationSequencePlayer>();
        const ambientLight = new PrefabRef<Object3DContainer<THREE.HemisphereLight>>();
        const spotLight = new PrefabRef<Object3DContainer<THREE.SpotLight>>();
        const stageLoader = new PrefabRef<MmdModelLoader[]>();
        
        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModelLoader)
                .withCameraLoader(mmdCameraLoader)
                .withAudioPlayer(audioPlayer)
                .withCameraAnimationName(new PrefabRef("animation1"))
                .withModelAnimationName(new PrefabRef("animation1"))
                .withUseIk(new PrefabRef(false))
                .withUsePhysics(new PrefabRef(false))
                .getAnimationPlayer(animationPlayer)
                .make())

            .withChild(instantiater.buildGameObject("custom-animation-override")
                .withComponent(class extends Component {
                    public start(): void {
                        const stage = stageLoader.ref!.map(loader => loader.object3DContainer!);
                        
                        const lightAnimationInstance = ConquerorLightAnimation.sequence.createInstance(
                            ConquerorLightAnimation.createBindInfo(ambientLight.ref!.object3D!, spotLight.ref!.object3D!, stage)
                        );

                        animationPlayer.ref!.onAnimationProcess.addListener((frameTime) => {
                            lightAnimationInstance.process(frameTime);
                        });
                    }
                }))
                
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
                    c.far = 500;
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
                    c.far = 500;
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

                    c.asyncLoadAnimation("animation1", "mmd/conqueror/camera.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .withComponent(AudioPlayer, c => {
                    c.asyncSetAudioFromUrl("mmd/conqueror/MMDConquerorIA.mp3");
                })
                .getComponent(Camera, camera)
                .getComponent(MmdCameraLoader, mmdCameraLoader)
                .getComponent(AudioPlayer, audioPlayer))

            .withChild(instantiater.buildGameObject("post-process-volume")
                .withComponent(WebGLGlobalPostProcessVolume, c => {
                    c.initializer((scene, camera, screen) => {
                        const ssrPass = new SSRPassOverride(/*scene, camera*/ {
                            renderer: c.engine.webGL!.webglRenderer!,
                            scene: scene,
                            camera: camera,
                            width: screen.width,
                            height: screen.height,
                            groundReflector: null,
                            selects: ssrPassSelects,
                            isPerspectiveCamera: true,
                            isBouncing: false
                        });
                        ssrPass.maxDistance = 100;
                        // ssrPass.raymarchTargetScale = 1;
                        // ssrPass.renderTargetScale = 1;
                        // ssrPass.stride = 60;
                        (globalThis as any).ssrPass = ssrPass;

                        const adaptiveTonemappingPass = new AdaptiveToneMappingPass(false, 256);
                        adaptiveTonemappingPass.setMiddleGrey(8);

                        const smaaPass = new SMAAPass(screen.width, screen.height);

                        const aoPass = new SAOPass(scene, camera);
                        aoPass.params.saoIntensity = 0.01;
                        aoPass.params.saoScale = 20;

                        const bloomPass = new UnrealBloomPass(new THREE.Vector2(screen.width, screen.height), 0.4, 0.4, 0.9);

                        bokehPass = new BokehPass(scene, camera, {
                            aperture: 0,
                            maxblur: 0.02
                        });
                        
                        return [[ssrPass, adaptiveTonemappingPass, smaaPass, aoPass, bloomPass, bokehPass], (): void => {
                            PostProcessDisposer.disposePass(ssrPass);
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
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9), object3D => object3D.dispose());
                })
                .getComponent(Object3DContainer<THREE.HemisphereLight>, ambientLight))

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

            .withChild(instantiater.buildGameObject("spot-light", new THREE.Vector3(24, 22.600, -25.950))
                .withComponent(Object3DContainer<THREE.SpotLight>, c => {
                    const light = new THREE.SpotLight(0xffffff, 0.5);
                    light.castShadow = true;
                    light.shadow.mapSize.width = 1024 * 8;
                    light.shadow.mapSize.height = 1024 * 8;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 400;
                    light.power = 12;
                    light.intensity = 7;
                    c.setObject3D(light, object3D => object3D.dispose());
                })
                .getComponent(Object3DContainer, spotLight))

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

                        const materials = model!.material instanceof Array ? model!.material : [model!.material];
                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                            material.emissive = new THREE.Color(0.1, 0.1, 0.1);
                        }
                    });
                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
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

                        model.castShadow = false; const materials = model!.material instanceof Array ? model!.material : [model!.material];
                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                            material.emissive = new THREE.Color(0.1, 0.1, 0.1);
                        }
                    });
                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
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
                        const materials = model!.material instanceof Array ? model!.material : [model!.material];
                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                            material.emissive = new THREE.Color(0.1, 0.1, 0.1);
                        }
                        ssrPassSelects.push(model);
                    });
                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
                    });
                })
                .getComponents(stageLoader, MmdModelLoader))

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
                                object.receiveShadow = true;
                                object.frustumCulled = false;
                            }
                        });

                        const materials = model!.material instanceof Array ? model!.material : [model!.material];
                        for (let i = 0; i < materials.length; ++i) {
                            materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                        }

                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i];
                            const name = material.name;
                            if (name !== "金1" &&
                            name !== "金の三つ編み　1" &&
                            name !== "金の三つ編み　2" &&
                            name !== "金の王冠" &&
                            name !== "金　3" &&
                            name !== "ボタン") continue;

                            const standardMaterial = materials[i] as THREE.MeshStandardMaterial;
                            standardMaterial.roughness = 0;
                            standardMaterial.metalness = 0.9;
                            standardMaterial.envMap?.dispose();
                            standardMaterial.envMap = assetManager.ref!.assets.get("env") as THREE.Texture;
                            standardMaterial.envMapIntensity = 0.5;
                            standardMaterial.lightMapIntensity = 0.5;
                        }

                        for (let i = 0; i < materials.length; ++i) {
                            const material = materials[i];
                            const name = material.name;
                            if (name !== "宝石" &&
                            name !== "銀の王冠" && 
                            name !== "銀1") continue;

                            const standardMaterial = materials[i] as THREE.MeshStandardMaterial;
                            standardMaterial.roughness = 0;
                            standardMaterial.metalness = 0.4;
                            standardMaterial.envMap?.dispose();
                            standardMaterial.envMap = assetManager.ref!.assets.get("env") as THREE.Texture;
                            standardMaterial.envMapIntensity = 0.5;
                            standardMaterial.lightMapIntensity = 0.5;
                        }

                        // for (let i = 0; i < materials.length; ++i) {
                        //     const material = materials[i];
                        //     const name = material.name;
                        //     if (name !== "黒い" &&
                        //     name !== "クローク" &&
                        //     name !== "ショーツ" &&
                        //     name !== "上着" &&
                        //     name !== "上着の中") continue;

                        //     materials[i] = MmdMaterialUtils.convert(material as MMDToonMaterial);
                        // }

                        {
                            const eyeMatIndex = materials.findIndex(m => m.name === "eyes");
                            const eyes = materials[eyeMatIndex] as THREE.MeshStandardMaterial;
                            eyes.roughness = 0;
                            eyes.metalness = 0.3;
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
                                const hair = materials[hairIndex] as THREE.MeshStandardMaterial;
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
                        eyeball.emissive = new THREE.Color(0.1, 0.1, 0.1);
                    });
                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
                    });
                    c.asyncLoadAnimation("animation1", 
                        [
                            "mmd/conqueror/model.vmd",
                            "mmd/conqueror/physics_reduce2.vmd"
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
