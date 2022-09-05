import Ammo from "ammojs-typed";
import { Bootstrapper, Camera, Component, CoroutineIterator, Game, SceneBuilder } from "the-world-engine";

import { ResourceManagerOverride } from "./mmd/loader/MMDPhysicsOverride";

export class AmmoLeakTest {
    private static dispatchCoroutine(coroutineIterator: CoroutineIterator): void {
        const game = new Game(document.getElementById("game_view")!);
        game.run(class extends Bootstrapper {
            public run(): SceneBuilder {
                return this.sceneBuilder
                    .withChild(this.instantiater.buildGameObject("camera")
                        .withComponent(Camera)
                        .withComponent(class extends Component {
                            public start(): void {
                                this.startCoroutine(function* (): CoroutineIterator {
                                    yield* coroutineIterator;
                                    setTimeout(() => game.dispose(), 0);
                                }());
                            }
                        }));
            }
        });
    }

    private static iterationTest(test: () => void, iterationCount = 10000000): void {
        this.dispatchCoroutine(function* (): CoroutineIterator {
            for (let i = 0; i < iterationCount; i++) {
                test();
                if (i % 10000 === 0) {
                    console.log(i);
                    yield null;
                }
            }
        }());
    }

    public static vectorTest(): void {
        this.iterationTest(() => {
            const v = new Ammo.btVector3(1, 2, 3);
            Ammo.destroy(v);
        });
    }

    public static worldTest(): void {
        this.iterationTest(() => {
            const config = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(config);
            const cache = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();
            const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);
            Ammo.destroy(world);
            Ammo.destroy(solver);
            Ammo.destroy(cache);
            Ammo.destroy(dispatcher);
            Ammo.destroy(config);
        });
    }

    public static getCenterOfMassTransformTest(): void {
        this.iterationTest(() => {
            const config = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(config);
            const cache = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();
            const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);

            const shapeScale = new Ammo.btVector3(1, 1, 1);
            const shape = new Ammo.btBoxShape(shapeScale);
            const motionState = new Ammo.btDefaultMotionState();
            const bodyConstructionInfo = new Ammo.btRigidBodyConstructionInfo(1, motionState, shape);
            const body = new Ammo.btRigidBody(bodyConstructionInfo);
            world.addRigidBody(body);

            const transform = body.getCenterOfMassTransform();
            Ammo.destroy(transform);

            Ammo.destroy(body);
            Ammo.destroy(bodyConstructionInfo);
            Ammo.destroy(motionState);
            Ammo.destroy(shape);
            Ammo.destroy(shapeScale);

            Ammo.destroy(world);
            Ammo.destroy(solver);
            Ammo.destroy(cache);
            Ammo.destroy(dispatcher);
            Ammo.destroy(config);
        });
    }

    public static getBasisTest(): void {
        this.iterationTest(() => {
            const config = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(config);
            const cache = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();
            const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);

            const shapeScale = new Ammo.btVector3(1, 1, 1);
            const shape = new Ammo.btBoxShape(shapeScale);
            const motionState = new Ammo.btDefaultMotionState();
            const bodyConstructionInfo = new Ammo.btRigidBodyConstructionInfo(1, motionState, shape);
            const body = new Ammo.btRigidBody(bodyConstructionInfo);
            world.addRigidBody(body);

            const transform = body.getCenterOfMassTransform();
            const basis = transform.getBasis();
            basis;

            Ammo.destroy(transform);

            Ammo.destroy(body);
            Ammo.destroy(bodyConstructionInfo);
            Ammo.destroy(motionState);
            Ammo.destroy(shape);
            Ammo.destroy(shapeScale);

            Ammo.destroy(world);
            Ammo.destroy(solver);
            Ammo.destroy(cache);
            Ammo.destroy(dispatcher);
            Ammo.destroy(config);
        });
    }

    public static resourceManagerSetIdentityTest(): void {
        const resourceManager = new ResourceManagerOverride();
        this.iterationTest(() => {
            const transform = resourceManager.allocTransform();
            resourceManager.setIdentity(transform);
            resourceManager.freeTransform(transform);
        });

        for (const transform of resourceManager.transforms) Ammo.destroy(transform);
        for (const quaternion of resourceManager.quaternions) Ammo.destroy(quaternion);
        for (const vector of resourceManager.vector3s) Ammo.destroy(vector);
    }

    public static resourceManagerGetBasisTest(): void {
        const resourceManager = new ResourceManagerOverride();
        this.iterationTest(() => {
            const transform = resourceManager.allocTransform();
            const basis = resourceManager.getBasis(transform);
            resourceManager.freeQuaternion(basis);
            resourceManager.freeTransform(transform);
        });

        for (const transform of resourceManager.transforms) Ammo.destroy(transform);
        for (const quaternion of resourceManager.quaternions) Ammo.destroy(quaternion);
        for (const vector of resourceManager.vector3s) Ammo.destroy(vector);
    }

    public static resourceManagerGetBasisAsMatrix3Test(): void {
        const resourceManager = new ResourceManagerOverride();
        this.iterationTest(() => {
            const transform = resourceManager.allocTransform();
            const basis = resourceManager.getBasisAsMatrix3(transform);
            basis;
            resourceManager.freeTransform(transform);
        });

        for (const transform of resourceManager.transforms) Ammo.destroy(transform);
        for (const quaternion of resourceManager.quaternions) Ammo.destroy(quaternion);
        for (const vector of resourceManager.vector3s) Ammo.destroy(vector);
    }

    public static resourceManagerGetOriginTest(): void {
        const resourceManager = new ResourceManagerOverride();
        this.iterationTest(() => {
            const transform = resourceManager.allocTransform();
            const origin = resourceManager.getOrigin(transform);
            origin;
            resourceManager.freeTransform(transform);
        });

        for (const transform of resourceManager.transforms) Ammo.destroy(transform);
        for (const quaternion of resourceManager.quaternions) Ammo.destroy(quaternion);
        for (const vector of resourceManager.vector3s) Ammo.destroy(vector);
    }

    public static mainTest(): void {
        this.resourceManagerGetOriginTest();
    }
}
