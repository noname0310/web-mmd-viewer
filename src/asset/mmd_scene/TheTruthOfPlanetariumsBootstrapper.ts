import { 
    BlendFunction,
    BloomEffect,
    BrightnessContrastEffect,
    DepthOfFieldEffect,
    EdgeDetectionMode,
    EffectPass,
    SMAAEffect,
    SMAAPreset,
    TextureEffect,
    ToneMappingEffect,
    ToneMappingMode
} from "postprocessing";
import {
    Bootstrapper as BaseBootstrapper,
    Camera,
    CameraType,
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
import { GlobalAssetManager } from "../script/GlobalAssetManager";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdMaterialUtils, MMDToonMaterial } from "../script/mmd/MmdMaterialUtils";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { WebGLGlobalPostProcessVolume } from "../script/render/WebGLGlobalPostProcessVolume";
import { Ui } from "../script/Ui";
import FabricNormal from "../texture/fabric02.png";

export class TheTruthOfPlanetariumsBootstrapper extends BaseBootstrapper {
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
            renderer.outputEncoding = THREE.sRGBEncoding;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const audioPlayer = new PrefabRef<AudioPlayer>();
        
        let depthOfFieldEffect: DepthOfFieldEffect|null = null;

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
                .withUsePhysics(new PrefabRef(false))
                .make())

            .withChild(instantiater.buildGameObject("asset-manager")
                .withComponent(GlobalAssetManager, c => {
                    const nightSkyDome = new THREE.TextureLoader().load("mmd/skydome/night.jpg");
                    nightSkyDome.mapping = THREE.EquirectangularReflectionMapping;
                    c.addAsset("nightSkyDome", nightSkyDome);

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
                    c.backgroundColor = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;
                })
                .withComponent(OrbitControls, c => {
                    c.enabled = true;
                    c.target = new THREE.Vector3(0, 14, 0);
                    c.minDistance = 3;
                    c.maxDistance = 100;
                    c.enableDamping = false;
                })
                .getComponent(Camera, orbitCamera))
            
            .withChild(instantiater.buildGameObject("root", undefined, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2))
                .withChild(instantiater.buildGameObject("orbit-camera", new THREE.Vector3(0, 0, 40))
                
                .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab)
                    .withAudioUrl(new PrefabRef("mmd/the_truth_of_planetariums/the truth of planetariums.mp3"))
                    .withCameraInitializer(c => {
                        c.backgroundColor = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;
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

                        c.asyncLoadAnimation("animation1", "mmd/the_truth_of_planetariums/camera.vmd", () => {
                            cameraLoadingText.innerText = "camera loaded";
                        });
                    })
                    .getCamera(camera)
                    .getCameraLoader(mmdCameraLoader)
                    .getAudioPlayer(audioPlayer)
                    .make())

                .withChild(instantiater.buildGameObject("post-process-volume")
                    .withComponent(WebGLGlobalPostProcessVolume, c => {
                        c.initializer((_scene, camera, _screen) => {
                            const bloomEffect = new BloomEffect({
                                blendFunction: BlendFunction.ADD,
                                luminanceThreshold: 0.55,
                                luminanceSmoothing: 0.7,
                                intensity: 0.8,
                                kernelSize: 8
                            });

                            depthOfFieldEffect = new DepthOfFieldEffect(camera, {
                                focusDistance: 0.0,
                                focalLength: 0.0447,
                                worldFocusRange: 70,
                                bokehScale: 4.0,
                                height: 480
                            });

                            const cocTextureEffect = new TextureEffect({
                                blendFunction: BlendFunction.SKIP,
                                texture: (depthOfFieldEffect as any).cocTexture
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
                                depthOfFieldEffect,
                                cocTextureEffect,
                                smaaEffect,
                                toneMappingEffect,
                                contrastEffect
                            );
                            
                            return [[effectPass]];
                        });
                    }))
                
                .withChild(instantiater.buildGameObject("ambient-light")
                    .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                        c.setObject3D(new THREE.HemisphereLight(0xdfd7ff, 0xffffff, 0.220), object3D => object3D.dispose());
                    }))

                .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 70))
                    .withComponent(Object3DContainer<THREE.DirectionalLight>, c => {
                        const light = new THREE.DirectionalLight(0xdfd7ff, 0.2);
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
                        c.startCoroutine(function*(): CoroutineIterator {
                            for (; ;) {
                                c.updateWorldMatrix();
                                yield null;
                            }
                        }());
                    })
                    .getComponent(Object3DContainer, directionalLight))

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

                        c.asyncLoadModel("mmd/a_spherical_structure_stage/model.pmx", model => {
                            modelLoadingText.innerText = "stage loaded";
                            model.geometry.name = c.gameObject.name + "-geometry";
                            model.castShadow = true;
                            model.receiveShadow = true;
                            model.frustumCulled = false;

                            const materials = (model.material instanceof Array ? model.material : [model.material]);
                            for (let i = 0; i < materials.length; ++i) {
                                materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                            }

                            const converted = materials as THREE.MeshStandardMaterial[];
                            {
                                const glass = converted.find(m => m.name === "床")!;
                                glass.emissive = new THREE.Color().setRGB(-0.1, -0.1, -0.1);
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
                            model.geometry.name = c.gameObject.name + "-geometry";
                            model.castShadow = true;
                            model.frustumCulled = false;

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
                                eyes.envMap = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;
                                eyes.needsUpdate = true;
                            }

                            {
                                const eyeball = converted.find(m => m.name === "eyeball")!;
                                eyeball.emissive = new THREE.Color().setRGB(0.1, 0.1, 0.1);
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
                                    hair.envMap = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;
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
                                shoes.envMap = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;
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
                            "mmd/the_truth_of_planetariums/motion.vmd",
                            "mmd/the_truth_of_planetariums/physics_reduce4.vmd"
                        ], () => {
                            modelAnimationLoadingText.innerText = "animation loaded";
                        });

                        c.startCoroutine(function*(): CoroutineIterator {
                            const headPosition = new THREE.Vector3();
                            const cameraNormal = new THREE.Vector3();
                            const tempVector = new THREE.Vector3();

                            function linearize(depth: number, camera: Camera): number {
                                const zfar = camera.far;
                                const znear = camera.near;
                                return - zfar * znear / (depth * (zfar - znear) - zfar);
                            }

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

                                        if (depthOfFieldEffect) {
                                            const ldistance = linearize(focusDistance, cameraUnwrap);
                                            const cocMaterial = depthOfFieldEffect.circleOfConfusionMaterial;
                                            cocMaterial.focusDistance = 1 + ldistance;
                                        }
                                        yield null;
                                    }
                                }
                                yield null;
                            }
                        }());
                    })
                    .getComponent(MmdModel, mmdModelLoader)))
        ;
    }
}
