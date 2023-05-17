import {
    BlendFunction,
    BloomEffect,
    BrightnessContrastEffect,
    ChromaticAberrationEffect,
    EdgeDetectionMode,
    EffectPass,
    KernelSize,
    SMAAEffect,
    SMAAPreset,
    ToneMappingEffect,
    ToneMappingMode
} from "postprocessing";
import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
    Color,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WebGLRendererLoader
} from "the-world-engine";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCameraPrefab } from "../prefab/MmdCameraPrefab";
import { SubtitlePrefab } from "../prefab/SubtitlePrefab";
import { GlobalAssetManager } from "../script/GlobalAssetManager";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MMDToonMaterial } from "../script/mmd/MmdMaterial";
import { MmdMaterialUtils } from "../script/mmd/MmdMaterialUtils";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { WebGLGlobalPostProcessVolume } from "../script/render/WebGLGlobalPostProcessVolume";
import { Ui } from "../script/Ui";
import FabricNormal from "../texture/fabric02.png";
import WaterHouseMatcap from "../texture/waterhouse_matcap.png";
import WaterNormal from "../texture/waternormals.jpg";
import { unsafeIsComponent } from "../unsafeIsComponent";

export class FlosWithSubtitleBootstrapper extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        this.setting.render.webGLRenderer(() => {
            const renderer = new THREE.WebGLRenderer({
                powerPreference: "high-performance",
                antialias: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModel = new PrefabRef<MmdModel>();
        const mmdModelSubtitle1 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle2 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle3 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle4 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle5 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle6 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle7 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle8 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle9 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle10 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle11 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle12 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle13 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle14 = new PrefabRef<MmdModel>();
        const mmdModelSubtitle15 = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const audioPlayer = new PrefabRef<AudioPlayer>();

        const water = new PrefabRef<Object3DContainer<Water>>();

        const assetManager = new PrefabRef<GlobalAssetManager>();

        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModel)
                .withModelLoader(mmdModelSubtitle1)
                .withModelLoader(mmdModelSubtitle2)
                .withModelLoader(mmdModelSubtitle3)
                .withModelLoader(mmdModelSubtitle4)
                .withModelLoader(mmdModelSubtitle5)
                .withModelLoader(mmdModelSubtitle6)
                .withModelLoader(mmdModelSubtitle7)
                .withModelLoader(mmdModelSubtitle8)
                .withModelLoader(mmdModelSubtitle9)
                .withModelLoader(mmdModelSubtitle10)
                .withModelLoader(mmdModelSubtitle11)
                .withModelLoader(mmdModelSubtitle12)
                .withModelLoader(mmdModelSubtitle13)
                .withModelLoader(mmdModelSubtitle14)
                .withModelLoader(mmdModelSubtitle15)
                .withCameraLoader(mmdCameraLoader)
                .withAudioPlayer(audioPlayer)
                .withCameraAnimationName(new PrefabRef("animation1"))
                .withModelAnimationName(new PrefabRef("animation1"))
                .withUsePhysics(new PrefabRef(false))
                .make())

            .withChild(instantiater.buildGameObject("asset-manager")
                .withComponent(GlobalAssetManager, c => {
                    const waterHouseEnv = new THREE.TextureLoader().load(WaterHouseMatcap);
                    waterHouseEnv.mapping = THREE.EquirectangularReflectionMapping;
                    waterHouseEnv.encoding = THREE.sRGBEncoding;
                    c.addAsset("waterHouseEnv", waterHouseEnv);

                    const fabricNormal = new THREE.TextureLoader().load(FabricNormal);
                    fabricNormal.wrapS = fabricNormal.wrapT = THREE.RepeatWrapping;
                    c.addAsset("fabricNormal", fabricNormal);
                })
                .getComponent(GlobalAssetManager, assetManager))

            .withChild(instantiater.buildGameObject("orbit-camera", new THREE.Vector3(0, 0, 40))
                .withComponent(Camera, c => {
                    c.cameraType = CameraType.Perspective;
                    c.fov = 60;
                    c.near = 1;
                    c.far = 1500;
                    c.priority = -1;
                    c.backgroundColor = Color.fromHex("#a9caeb");
                })
                .withComponent(OrbitControls, c => {
                    c.enabled = true;
                    c.target = new THREE.Vector3(0, 14, 0);
                    c.minDistance = 3;
                    c.maxDistance = 100;
                    c.enableDamping = false;
                })
                .getComponent(Camera, orbitCamera))

            .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab)
                .withAudioUrl(new PrefabRef("mmd/flos/flos_YuNi.mp3"))
                .withCameraInitializer(c => {
                    c.backgroundColor = Color.fromHex("#a9caeb");
                })
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

                    c.asyncLoadAnimation("animation1", "mmd/flos/flos_camera_mod2.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .getCamera(camera)
                .getCameraLoader(mmdCameraLoader)
                .getAudioPlayer(audioPlayer)
                .make())

            .withChild(instantiater.buildGameObject("post-process-volume")
                .withComponent(WebGLGlobalPostProcessVolume, c => {
                    c.reinitializeWhenScreenSizeChanged = false;

                    c.initializer((_scene, camera, _screen) => {
                        const bloomEffect = new BloomEffect({
                            blendFunction: BlendFunction.ADD,
                            luminanceThreshold: 0.55,
                            luminanceSmoothing: 0.7,
                            intensity: 0.8,
                            kernelSize: KernelSize.MEDIUM
                        });

                        const smaaEffect = new SMAAEffect({
                            preset: SMAAPreset.HIGH,
                            edgeDetectionMode: EdgeDetectionMode.DEPTH
                        });

                        smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.01;

                        const toneMappingEffect = new ToneMappingEffect({
                            mode: ToneMappingMode.REINHARD2,
                            resolution: 256,
                            whitePoint: 16.0,
                            middleGrey: 0.13,
                            minLuminance: 0.01,
                            averageLuminance: 0.01,
                            adaptationRate: 1.0
                        });

                        const contrastEffect = new BrightnessContrastEffect({
                            brightness: -0.05,
                            contrast: 0.25
                        });

                        const effectPass = new EffectPass(camera,
                            bloomEffect,
                            smaaEffect,
                            toneMappingEffect,
                            contrastEffect
                        );

                        const chromaticAberrationEffect = new ChromaticAberrationEffect({
                            offset: new THREE.Vector2(1e-3, 5e-4).multiplyScalar(0.5),
                            radialModulation: false,
                            modulationOffset: 0.15
                        });

                        const chromaticAberrationPass = new EffectPass(camera, chromaticAberrationEffect);

                        return [effectPass, chromaticAberrationPass];
                    });
                }))

            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6), object3D => object3D.dispose());
                }))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 70))
                .withComponent(Object3DContainer<THREE.DirectionalLight>, c => {
                    const light = new THREE.DirectionalLight(0xffffff, 0.1);
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
                    c.setObject3D(light, object3D => object3D.dispose());
                })
                .withComponent(Object3DContainer<THREE.CameraHelper>, c => {
                    c.enabled = false;
                    c.setObject3D(new THREE.CameraHelper(directionalLight.ref!.object3D!.shadow.camera), object3D => object3D.dispose());
                    if (!unsafeIsComponent(c)) return;
                    c.startCoroutine(function* (): CoroutineIterator {
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
                .withComponent(Object3DContainer<Water>, c => {
                    if (!unsafeIsComponent(c)) return;
                    const water = new Water(
                        new THREE.PlaneGeometry(10000, 10000),
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
                    water.geometry.name = "water-geometry";

                    c.setObject3D(water, object3D => {
                        object3D.material.dispose();
                        object3D.geometry.dispose();
                    });

                    c.startCoroutine(function* (): CoroutineIterator {
                        for (; ;) {
                            water.material.uniforms["time"].value += 1.0 / 60.0;
                            yield null;
                        }
                    }());
                })
                .getComponent(Object3DContainer, water))

            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(450000))
                .active(true)
                .withComponent(Object3DContainer<Sky>, c => {
                    const sky = new Sky();
                    sky.geometry.name = "sky-geometry";

                    const skyUniforms = sky.material.uniforms;

                    skyUniforms["turbidity"].value = 40;
                    skyUniforms["rayleigh"].value = 1;
                    skyUniforms["mieCoefficient"].value = 0.002;
                    skyUniforms["mieDirectionalG"].value = 1;

                    const sun = new THREE.Vector3();
                    if (!unsafeIsComponent(c)) return;
                    const pmremGenerator = new THREE.PMREMGenerator(c.engine.webGL!.webglRenderer!);
                    let renderTarget: THREE.WebGLRenderTarget;

                    function updateSun(): void {
                        sun.copy(directionalLight.ref!.transform.localPosition).normalize();

                        sky.material.uniforms["sunPosition"].value.copy(sun);
                        water.ref!.object3D!.material.uniforms["sunDirection"].value.copy(sun).normalize();

                        if (renderTarget !== undefined) renderTarget.dispose();

                        renderTarget = pmremGenerator.fromScene(sky as any);

                        if (!unsafeIsComponent(c)) return;
                        c.engine.scene.unsafeGetThreeScene().environment = renderTarget.texture;
                    }

                    updateSun();

                    c.setObject3D(sky, object3D => {
                        object3D.material.dispose();
                        object3D.geometry.dispose();
                        pmremGenerator.dispose();
                        renderTarget.dispose();
                    });
                }))

            .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, 0))
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

                    c.asyncLoadModel("mmd/water house 20200627/water house.pmx", model => {
                        modelLoadingText.innerText = "stage loaded";
                        if (!unsafeIsComponent(c)) return;
                        model.geometry.name = c.gameObject.name + "-geometry";
                        model.castShadow = true;
                        model.receiveShadow = true;
                        model.frustumCulled = false;

                        model.traverse(object => {
                            if (object.name === "Chair 1") {
                                object.position.y = -100;
                            }
                        });

                        c.object3DContainer!.updateWorldMatrix();

                        const materials = (model.material instanceof Array ? model.material : [model.material]);
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
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
                .active(true)
                .withComponent(MmdModel, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    const modelAnimationLoadingText = document.createElement("div");
                    loadingText.appendChild(modelAnimationLoadingText);

                    c.forceAllInterpolateToCubic = true;

                    c.onProgress.addListener((type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            (type === "model" ? modelLoadingText : modelAnimationLoadingText)
                                .innerText = type + ": " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/yyb_deep_canyons_miku/yyb_deep_canyons_miku_face_forward_bakebone.pmx", model => {
                        modelLoadingText.innerText = "model loaded";
                        if (!unsafeIsComponent(c)) return;
                        model.geometry.name = c.gameObject.name + "-geometry";
                        model.castShadow = true;
                        model.receiveShadow = true;
                        model.frustumCulled = false;
                        model.renderOrder = 1;

                        const materials = (model.material instanceof Array ? model.material : [model.material]);
                        for (let i = 0; i < materials.length; ++i) {
                            materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                        }

                        const converted = materials as THREE.MeshStandardMaterial[];
                        {
                            const eyes = converted.find(m => m.name === "eyes")!;
                            eyes.roughness = 0;
                            eyes.metalness = 0.4;
                            eyes.envMapIntensity = 0.5;
                            eyes.lightMapIntensity = 0.5;
                            eyes.envMap?.dispose();
                            eyes.envMap = assetManager.ref!.assets.get("waterHouseEnv") as THREE.Texture;
                            eyes.needsUpdate = true;
                        }
                        {
                            const hairs = ["Hair01", "Hair02", "Hair03"];
                            for (let i = 0; i < hairs.length; ++i) {
                                const hair = converted.find(m => m.name === hairs[i])!;
                                hair.roughness = 0.2;
                                hair.metalness = 0.0;
                                hair.envMapIntensity = 0.1;
                                hair.lightMapIntensity = 0.9;
                                hair.envMap?.dispose();
                                hair.envMap = assetManager.ref!.assets.get("waterHouseEnv") as THREE.Texture;
                                hair.needsUpdate = true;
                            }
                        }
                        {
                            const shoes = converted.find(m => m.name === "Shoes")!;
                            shoes.roughness = 0;
                            shoes.metalness = 0.6;
                            shoes.envMapIntensity = 0.8;
                            shoes.lightMapIntensity = 0.2;
                            shoes.envMap?.dispose();
                            shoes.envMap = assetManager.ref!.assets.get("waterHouseEnv") as THREE.Texture;
                            shoes.needsUpdate = true;
                        }
                        {
                            const clothes = ["Derss", "Top"];
                            for (let i = 0; i < clothes.length; ++i) {
                                const cloth = converted.find(m => m.name === clothes[i])!;
                                cloth.roughness = 0.8;
                                cloth.normalMapType = THREE.TangentSpaceNormalMap;
                                cloth.normalMap?.dispose();
                                cloth.normalMap = assetManager.ref!.assets.get("fabricNormal") as THREE.Texture;
                                cloth.normalScale = new THREE.Vector2(1, 1);
                                cloth.needsUpdate = true;
                            }
                        }
                    });

                    c.onDisposeObject3D.addListener(mesh => {
                        const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                        for (let i = 0; i < materials.length; ++i) {
                            MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                        }
                    });

                    c.asyncLoadAnimation("animation1", [
                        "mmd/flos/flos_model.vmd",
                        "mmd/flos/flos_physics reduce 4.vmd"
                        // "mmd/flos/combined.vmd"
                    ], () => {
                        modelAnimationLoadingText.innerText = "animation loaded";
                    });
                })
                .getComponent(MmdModel, mmdModel))

            .withChild(instantiater.buildPrefab("subtitle1-daphne", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle1)
                .withModelUrl(new PrefabRef("mmd/flos/text models/1 - Daphne/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/1.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle2-ficus", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle2)
                .withModelUrl(new PrefabRef("mmd/flos/text models/2 - Ficus/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/2.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle3-iris", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle3)
                .withModelUrl(new PrefabRef("mmd/flos/text models/3 - Iris/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/3.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle4-maackia", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle4)
                .withModelUrl(new PrefabRef("mmd/flos/text models/4 - Maackia/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/4.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle5-lythrum", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle5)
                .withModelUrl(new PrefabRef("mmd/flos/text models/5 - Lythrum/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/5.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle6-myrica", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle6)
                .withModelUrl(new PrefabRef("mmd/flos/text models/6 - Myrica/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/6.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle7-sabia", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle7)
                .withModelUrl(new PrefabRef("mmd/flos/text models/7 - Sabia/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/7.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle8-flos", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle8)
                .withModelUrl(new PrefabRef("mmd/flos/text models/8 - Flos/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/8.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle9-thymus", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle9)
                .withModelUrl(new PrefabRef("mmd/flos/text models/9 - Thymus/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/9.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle10-ribes", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle10)
                .withModelUrl(new PrefabRef("mmd/flos/text models/10 - Ribes/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/10.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle11-abelia", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle11)
                .withModelUrl(new PrefabRef("mmd/flos/text models/11 - Abelia/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/11.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle12-sedum", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle12)
                .withModelUrl(new PrefabRef("mmd/flos/text models/12 - Sedum/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/12.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle13-felicia", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle13)
                .withModelUrl(new PrefabRef("mmd/flos/text models/13 - Felicia/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/13.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle14-ochna", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle14)
                .withModelUrl(new PrefabRef("mmd/flos/text models/14 - Ochna/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/14.vmd"]))
                .make())

            .withChild(instantiater.buildPrefab("subtitle15-lychnis", SubtitlePrefab)
                .getMmdModel(mmdModelSubtitle15)
                .withModelUrl(new PrefabRef("mmd/flos/text models/15 - Lychnis/TextModel.pmx"))
                .withAnimationUrls(new PrefabRef(["mmd/flos/text models/15.vmd"]))
                .make())
        ;
    }
}
