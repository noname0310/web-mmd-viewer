import {
    BlendFunction,
    BloomEffect,
    BrightnessContrastEffect,
    DepthOfFieldEffect,
    EdgeDetectionMode,
    EffectPass,
    KernelSize,
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
    Component,
    CoroutineIterator,
    GameObject,
    Object3DContainer,
    PrefabRef,
    SceneBuilder,
    WebGLRendererLoader
} from "the-world-engine";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GroundProjectedEnv } from "three/examples/jsm/objects/GroundProjectedEnv";
import { ShadowMesh } from "three/examples/jsm/objects/ShadowMesh";
import * as THREE from "three/src/Three";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { MelancholicNightDofAnimation } from "../animation/MelancholicNightDofAnimation";
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
import { unsafeIsComponent } from "../unsafeIsComponent";

export class MelancholicNightBootstrapper extends BaseBootstrapper {
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
        const environment = new PrefabRef<GameObject>();

        const mmdModelLoader = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const audioPlayer = new PrefabRef<AudioPlayer>();
        const animationPlayer = new PrefabRef<AnimationSequencePlayer>();

        const depthOfFieldEffect = new PrefabRef<DepthOfFieldEffect>();

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
                .withUsePhysics(new PrefabRef(true))
                .getAnimationPlayer(animationPlayer)
                .make())


            .withChild(instantiater.buildGameObject("custom-animation-override")
                .withComponent(class extends Component {
                    public start(): void {
                        const lightAnimationInstance = MelancholicNightDofAnimation.sequence.createInstance(
                            MelancholicNightDofAnimation.createBindInfo(depthOfFieldEffect)
                        );

                        animationPlayer.ref!.onAnimationProcess.addListener((frameTime) => {
                            lightAnimationInstance.process(frameTime);
                        });
                    }
                }))

            .withChild(instantiater.buildGameObject("asset-manager")
                .withComponent(GlobalAssetManager, c => {
                    const nightSkyDome = new RGBELoader()
                        .load(
                            "mmd_public/env/st_peters_square/st_peters_square_night_4k.hdr",
                            dataTexture => {
                                dataTexture.mapping = THREE.EquirectangularReflectionMapping;
                                environment.ref!.activeSelf = true;
                            }
                        );
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

            .withChild(instantiater.buildGameObject("environment")
                .active(false)
                .withComponent(class extends Component {
                    public onEnable(): void {
                        const env = new GroundProjectedEnv(
                            assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture,
                            {
                                height: 50,
                                radius: 500
                            }
                        );
                        env.scale.setScalar(120);
                        env.frustumCulled = false;
                        env.material.side = THREE.BackSide;

                        const envContainer = this.gameObject.addComponent(Object3DContainer<GroundProjectedEnv>)!;
                        envContainer.setObject3D(env, object3D => {
                            object3D.geometry.dispose();
                            object3D.material.dispose();
                        });
                    }
                })
                .getGameObject(environment))

            .withChild(instantiater.buildGameObject("root", undefined, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 1.5))

                .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab)
                    .withAudioUrl(new PrefabRef("mmd_public/motion/melancholic_night/melancholic_night.mp3"))
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

                        c.asyncLoadAnimation("animation1", "mmd/melancholic_night/camera.vmd", () => {
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

                            const dofEffect = depthOfFieldEffect.ref = new DepthOfFieldEffect(camera, {
                                focusDistance: 0.0,
                                focalLength: 0.04,
                                worldFocusRange: 1000,
                                bokehScale: 100.0,
                                height: 480
                            });

                            (globalThis as any).depthOfFieldEffect = dofEffect;

                            const cocTextureEffect = new TextureEffect({
                                blendFunction: BlendFunction.SKIP,
                                texture: (dofEffect as any).cocTexture
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
                                middleGrey: 0.05,
                                minLuminance: 0.01,
                                averageLuminance: 0.01,
                                adaptationRate: 1.0
                            });

                            (globalThis as any).toneMappingEffect = toneMappingEffect;

                            const contrastEffect = new BrightnessContrastEffect({
                                brightness: 0.0,
                                contrast: 0.25
                            });

                            const effectPass = new EffectPass(camera,
                                bloomEffect,
                                dofEffect,
                                cocTextureEffect,
                                smaaEffect,
                                toneMappingEffect,
                                contrastEffect
                            );

                            return [effectPass];
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
                        const radius = 50;
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
                        c.startCoroutine(function*(): CoroutineIterator {
                            for (; ;) {
                                c.updateWorldMatrix();
                                yield null;
                            }
                        }());
                    })
                    .getComponent(Object3DContainer, directionalLight))

                .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, 0))
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

                        c.asyncLoadModel("mmd/a_spherical_structure_stage/model.pmx", model => {
                            modelLoadingText.innerText = "stage loaded";
                            if (!unsafeIsComponent(c)) return;
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

                .withChild(instantiater.buildGameObject("mmd-model", new THREE.Vector3(0, 0, 0))
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
                        c.asyncLoadModel("mmd_public/model/yyb_hatsune_miku_10th_ff/yyb_hatsune_miku_10th_v1.02.pmx", model => {
                            if (!unsafeIsComponent(c)) return;
                            modelLoadingText.innerText = "model loaded";
                            model.geometry.name = c.gameObject.name + "-geometry";
                            model.castShadow = true;
                            model.receiveShadow = true;
                            model.frustumCulled = false;

                            const materials = (model.material instanceof Array ? model.material : [model.material]);
                            for (let i = 0; i < materials.length; ++i) {
                                materials[i] = MmdMaterialUtils.convert(materials[i] as MMDToonMaterial);
                            }

                            const converted = materials as THREE.MeshStandardMaterial[];

                            const envMap = assetManager.ref!.assets.get("nightSkyDome") as THREE.Texture;

                            for (let i = 0; i < converted.length; ++i) {
                                const material = converted[i];
                                material.envMap?.dispose();
                                material.envMap = envMap;
                                material.envMapIntensity = 0.1;
                                material.needsUpdate = true;
                            }

                            {
                                const eyes = converted.find(m => m.name === "eyes")!;
                                eyes.roughness = 0;
                                eyes.metalness = 0.4;
                                eyes.envMapIntensity = 0.5;
                                eyes.lightMapIntensity = 0.5;
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
                                    hair.needsUpdate = true;
                                }
                            }

                            {
                                const clearcoatCloths = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "q201", "q202"];
                                for (let i = 0; i < clearcoatCloths.length; ++i) {
                                    const cloth = converted.find(m => m.name === clearcoatCloths[i])!;
                                    cloth.roughness = 0.1;
                                    cloth.metalness = 0.0;
                                    cloth.envMapIntensity = 0.2;
                                    cloth.lightMapIntensity = 0.8;
                                    cloth.needsUpdate = true;
                                }
                            }
                            {
                                const clothes = ["q01", "q02", "q03", "q04"];
                                for (let i = 0; i < clothes.length; ++i) {
                                    const cloth = converted.find(m => m.name === clothes[i])!;
                                    cloth.roughness = 0.8;
                                    cloth.normalMapType = THREE.TangentSpaceNormalMap;
                                    cloth.normalMap?.dispose();
                                    cloth.normalMap = assetManager.ref!.assets.get("fabricNormal") as THREE.Texture;
                                    cloth.normalScale = new THREE.Vector2(0.5, 0.5);
                                    cloth.needsUpdate = true;
                                }
                            }
                            {
                                const glowCloths = ["q301", "q302"];
                                for (let i = 0; i < glowCloths.length; ++i) {
                                    const cloth = converted.find(m => m.name === glowCloths[i])!;
                                    cloth.emissive = new THREE.Color().setRGB(0.3, 0.3, 0.3);
                                }
                            }

                            const shadowMesh = new (ShadowMesh as any)(mmdModelLoader.ref!.skinnedMesh!) as ShadowMesh;
                            const shadowMeshComponent = c.gameObject.addComponent(Object3DContainer<ShadowMesh>)!;
                            shadowMeshComponent.setObject3D(shadowMesh, object3D => {
                                object3D.geometry.dispose();
                                (object3D.material as THREE.Material).dispose();
                            });
                            shadowMeshComponent.enabled = false;

                            c.gameObject.addComponent(class ShadowMeshUpdater extends Component {
                                private readonly _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.01);
                                private readonly _lightPosition = new THREE.Vector4(-20, 30, 70, 0.9);

                                public update(): void {
                                    shadowMesh.update(this._plane, this._lightPosition);
                                }
                            });
                        });

                        c.onDisposeObject3D.addListener(mesh => {
                            const materials = mesh.material instanceof Array ? mesh.material : [mesh.material];
                            for (let i = 0; i < materials.length; ++i) {
                                MmdMaterialUtils.disposeConvertedMaterialTexture(materials[i] as THREE.MeshStandardMaterial);
                            }
                        });

                        c.asyncLoadAnimation("animation1", [
                            "mmd/melancholic_night/motion.vmd",
                            "mmd/melancholic_night/lip.vmd",
                            "mmd/melancholic_night/facial.vmd"
                        ], () => {
                            modelAnimationLoadingText.innerText = "animation loaded";
                        });

                        if (!unsafeIsComponent(c)) return;
                        c.startCoroutine(function*(): CoroutineIterator {
                            const headPosition = new THREE.Vector3();
                            const cameraNormal = new THREE.Vector3();
                            const tempVector = new THREE.Vector3();

                            function linearize(depth: number, camera: Camera): number {
                                const zfar = camera.far;
                                const znear = camera.near;
                                return -zfar * znear / (depth * (zfar - znear) - zfar);
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

                                        if (depthOfFieldEffect.ref) {
                                            const ldistance = linearize(focusDistance, cameraUnwrap);
                                            const cocMaterial = depthOfFieldEffect.ref.circleOfConfusionMaterial;
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
