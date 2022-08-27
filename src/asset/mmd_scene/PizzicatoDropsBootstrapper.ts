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
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three/src/Three";
import { AudioPlayer } from "tw-engine-498tokio/dist/asset/script/audio/AudioPlayer";

import { GameManagerPrefab } from "../prefab/GameManagerPrefab";
import { MmdCameraPrefab } from "../prefab/MmdCameraPrefab";
import { MmdCamera } from "../script/mmd/MmdCamera";
import { MmdModel } from "../script/mmd/MmdModel";
import { OrbitControls } from "../script/OrbitControls";
import { Ui } from "../script/Ui";

export class PizzicatoDropsBootstrapper extends BaseBootstrapper {
    public override run(): SceneBuilder {
        this.setting.render.useCss3DRenderer(false);
        this.setting.render.webGLRendererLoader(WebGLRendererLoader);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        this.setting.render.webGLRenderer(() => {
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // renderer.outputEncoding = THREE.sRGBEncoding;
            // renderer.toneMapping = THREE.ACESFilmicToneMapping;
            // renderer.toneMappingExposure = 0.5;
            return [new OutlineEffect(renderer), renderer.domElement] as const;
        });

        const instantiater = this.instantiater;

        const camera = new PrefabRef<Camera>();
        const orbitCamera = new PrefabRef<Camera>();
        const directionalLight = new PrefabRef<Object3DContainer<THREE.DirectionalLight>>();

        const mmdModelLoader = new PrefabRef<MmdModel>();
        const mmdCameraLoader = new PrefabRef<MmdCamera>();

        const audioPlayer = new PrefabRef<AudioPlayer>();
        
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
                    c.backgroundColor = new Color(1, 1, 1, 1);
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
                .withAudioUrl(new PrefabRef("mmd/pizzicato_drops/pizzicato_drops.mp3"))
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

                    c.asyncLoadAnimation("animation1", "mmd/pizzicato_drops/camera.vmd", () => {
                        cameraLoadingText.innerText = "camera loaded";
                    });
                })
                .getCamera(camera)
                .getCameraLoader(mmdCameraLoader)
                .getAudioPlayer(audioPlayer)
                .make())
                
            .withChild(instantiater.buildGameObject("ambient-light")
                .withComponent(Object3DContainer<THREE.HemisphereLight>, c => {
                    c.setObject3D(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3), object3D => object3D.dispose());
                }))

            .withChild(instantiater.buildGameObject("directional-light", new THREE.Vector3(-20, 30, 100))
                .withComponent(Object3DContainer<THREE.DirectionalLight>, c => {
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

            
            .withChild(instantiater.buildGameObject("sky", undefined, undefined, new THREE.Vector3().setScalar(1000))
                .active(false)
                .withComponent(Object3DContainer<Sky>, c => {
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
                    c.setObject3D(sky, object3D => {
                        object3D.geometry.dispose();
                        object3D.material.dispose();
                    });
                }))

            .withChild(instantiater.buildGameObject("mmd-stage", new THREE.Vector3(0, 0, -30))
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

                    c.asyncLoadModel("mmd/Stage36/Stage36.pmx", () => {
                        modelLoadingText.innerText = "stage loaded";
                    });
                }))

            .withChild(instantiater.buildGameObject("mmd-model")
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
                    c.asyncLoadAnimation("animation1", 
                        [
                            "mmd/pizzicato_drops/model.vmd"//, "mmd/pizzicato_drops/physics_reduce4.vmd"
                        ], () => {
                            modelAnimationLoadingText.innerText = "animation loaded";
                        });
                })
                .getComponent(MmdModel, mmdModelLoader))
        ;
    }
}
