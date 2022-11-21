import {
    BlendFunction,
    BloomEffect,
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
    Color,
    CoroutineIterator,
    Object3DContainer,
    PrefabRef,
    ReadonlyVector3,
    SceneBuilder,
    WebGLRendererLoader
} from "the-world-engine";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCameraPrefab } from "../prefab/MmdCameraPrefab";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { WebGLGlobalPostProcessVolume } from "../script/render/WebGLGlobalPostProcessVolume";
import { Ui } from "../script/Ui";
import WaterNormal from "../texture/waternormals.jpg";
import { unsafeIsComponent } from "../unsafeIsComponent";

export class NotitleBootstrapper extends BaseBootstrapper {
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
            renderer.toneMappingExposure = 1.5;
            return renderer;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader1 = new PrefabRef<MmdModel>();
        const mmdModelLoader2 = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const audioPlayer = new PrefabRef<AudioPlayer>();

        const water = new PrefabRef<Object3DContainer<Water>>();

        let depthOfFieldEffect: DepthOfFieldEffect | null = null;

        const sunVector: ReadonlyVector3 = new THREE.Vector3(5, 5, -50);

        return this.sceneBuilder
            .withChild(instantiater.buildPrefab("game-manager", GameManagerPrefab)
                .withCamera(camera)
                .withOrbitCamera(orbitCamera)
                .withModelLoader(mmdModelLoader1)
                .withModelLoader(mmdModelLoader2)
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
                    c.far = 2000;
                    c.priority = -1;
                    c.backgroundColor = Color.fromHex("#a9caeb");
                })
                .withComponent(OrbitControls, c => {
                    c.enabled = true;
                    c.target = new THREE.Vector3(0, 14, 0);
                    c.minDistance = 20;
                    c.maxDistance = 100;
                    c.enableDamping = false;
                })
                .getComponent(Camera, orbitCamera))

            .withChild(instantiater.buildPrefab("mmd-camera", MmdCameraPrefab)
                .withAudioUrl(new PrefabRef("mmd/notitle/REOL - No title.mp3"))
                .withCameraInitializer(c => {
                    c.near = 1;
                    c.far = 2000;
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

                    c.asyncLoadAnimation("animation1", "mmd/notitle/camera.vmd", () => {
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
                            luminanceThreshold: 0.8,
                            luminanceSmoothing: 0.3,
                            intensity: 0.6,
                            kernelSize: KernelSize.MEDIUM
                        });

                        depthOfFieldEffect = new DepthOfFieldEffect(camera, {
                            focusDistance: 0.0,
                            focalLength: 0.0447,
                            worldFocusRange: 150,
                            bokehScale: 16.0,
                            height: 480
                        });

                        const cocTextureEffect = new TextureEffect({
                            blendFunction: BlendFunction.SKIP,
                            texture: (depthOfFieldEffect as any).cocTexture
                        });
                        cocTextureEffect;

                        const smaaEffect = new SMAAEffect({
                            preset: SMAAPreset.HIGH,
                            edgeDetectionMode: EdgeDetectionMode.DEPTH
                        });

                        smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.01;

                        const toneMappingEffect = new ToneMappingEffect({
                            mode: ToneMappingMode.ACES_FILMIC,
                            resolution: 256,
                            whitePoint: 16.0,
                            middleGrey: 0.13,
                            minLuminance: 0.01,
                            averageLuminance: 0.01,
                            adaptationRate: 1.0
                        });

                        const effectPass = new EffectPass(camera, bloomEffect, depthOfFieldEffect, cocTextureEffect, smaaEffect, toneMappingEffect);

                        return [effectPass];
                    });
                }))

            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.7), object3D => object3D.dispose());
                }))

            .withChild(instantiater.buildGameObject("directional-light", sunVector)
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
                new THREE.Vector3(0, 0, 0),
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

                    c.setObject3D(water, object3D => {
                        object3D.geometry.dispose();
                        object3D.material.dispose();
                    });

                    c.startCoroutine(function* (): CoroutineIterator {
                        for (; ;) {
                            water.material.uniforms["time"].value += c.engine.time.deltaTime / 2;
                            yield null;
                        }
                    }());
                })
                .getComponent(Object3DContainer, water))

            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(450000))
                .active(true)
                .withComponent(Object3DContainer<Sky>, c => {
                    const sky = new Sky();

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

            .withChild(instantiater.buildGameObject("mmd-model1")
                .active(true)
                .withComponent(MmdModel, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    const modelAnimationLoadingText = document.createElement("div");
                    loadingText.appendChild(modelAnimationLoadingText);

                    c.onProgress.addListener((type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            (type === "model" ? modelLoadingText : modelAnimationLoadingText)
                                .innerText = type + "1: " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/YYB Vintage Hatsune Miku/YYBMiku.pmx", model => {
                        modelLoadingText.innerText = "model1 loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation("animation1", "mmd/notitle/notitle_1.vmd", () => {
                        modelAnimationLoadingText.innerText = "animation1 loaded";
                    });
                })
                .getComponent(MmdModel, mmdModelLoader1))

            .withChild(instantiater.buildGameObject("mmd-model2")
                .active(true)
                .withComponent(MmdModel, c => {
                    const loadingText = Ui.getOrCreateLoadingElement();
                    const modelLoadingText = document.createElement("div");
                    loadingText.appendChild(modelLoadingText);
                    const modelAnimationLoadingText = document.createElement("div");
                    loadingText.appendChild(modelAnimationLoadingText);

                    c.onProgress.addListener((type, e) => {
                        if (e.lengthComputable) {
                            const percentComplete = e.loaded / e.total * 100;
                            (type === "model" ? modelLoadingText : modelAnimationLoadingText)
                                .innerText = type + "2: " + Math.round(percentComplete) + "% loading";
                        }
                    });
                    c.asyncLoadModel("mmd/YYB Hatsune Miku_10th - faceforward/YYB Hatsune Miku_10th_v1.02 - faceforward.pmx", model => {
                        modelLoadingText.innerText = "model2 loaded";
                        model.castShadow = true;
                        model.frustumCulled = false;
                    });
                    c.asyncLoadAnimation("animation1", "mmd/notitle/notitle_2.vmd", () => {
                        modelAnimationLoadingText.innerText = "animation2 loaded";
                    });
                })
                .getComponent(MmdModel, mmdModelLoader2))

            .withChild(instantiater.buildGameObject("mmd-camera-focus-controller")
                .withComponent(Object3DContainer, c => {
                    if (!unsafeIsComponent(c)) return;
                    c.startCoroutine(function* (): CoroutineIterator {
                        const headPosition1 = new THREE.Vector3();
                        const headPosition2 = new THREE.Vector3();
                        const cameraNormal = new THREE.Vector3();
                        const tempVector = new THREE.Vector3();

                        function linearize(depth: number, camera: Camera): number {
                            const zfar = camera.far;
                            const znear = camera.near;
                            return -zfar * znear / (depth * (zfar - znear) - zfar);
                        }

                        yield null;
                        for (; ;) {
                            const container1 = mmdModelLoader1.ref!.object3DContainer;
                            const container2 = mmdModelLoader2.ref!.object3DContainer;
                            if (container1 && container1.object3D && container2 && container2.object3D) {
                                const model1 = container1.object3D as THREE.SkinnedMesh;
                                const model1Head = model1.skeleton.bones.find(b => b.name === "頭")!;
                                const model2 = container2.object3D as THREE.SkinnedMesh;
                                const model2Head = model2.skeleton.bones.find(b => b.name === "頭")!;

                                for (; ;) {
                                    const cameraUnwrap = c.engine.cameraContainer.camera;
                                    if (!cameraUnwrap) {
                                        yield null;
                                        continue;
                                    }

                                    headPosition1.setFromMatrixPosition(model1Head.matrixWorld);
                                    headPosition2.setFromMatrixPosition(model2Head.matrixWorld);

                                    const cameraPosition = cameraUnwrap.transform.position;
                                    cameraUnwrap.transform.getForward(cameraNormal).negate();

                                    const a1 = cameraNormal;
                                    const b1 = tempVector.copy(headPosition1).sub(cameraPosition);
                                    const focusDistance1 = b1.dot(a1) / a1.dot(a1);

                                    const a2 = cameraNormal;
                                    const b2 = tempVector.copy(headPosition2).sub(cameraPosition);
                                    const focusDistance2 = b2.dot(a2) / a2.dot(a2);

                                    if (depthOfFieldEffect) {
                                        const ldistance = linearize(Math.min(focusDistance1, focusDistance2), cameraUnwrap);
                                        const cocMaterial = depthOfFieldEffect.circleOfConfusionMaterial;
                                        cocMaterial.focusDistance = 1 + ldistance;
                                    }
                                    yield null;
                                }
                            }
                            yield null;
                        }
                    }());
                }))
        ;
    }
}
