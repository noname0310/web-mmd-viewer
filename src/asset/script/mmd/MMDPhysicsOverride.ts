import Ammo from "ammojs-typed";
import { MMDPhysics, ResourceManager } from "three/examples/jsm/animation/MMDPhysics";
import * as THREE from "three/src/Three";

export class MMdPhysicsOverride extends MMDPhysics {
    public override setGravity(gravity: THREE.Vector3): this {
        const ammoVector3 = new Ammo.btVector3(gravity.x, gravity.y, gravity.z);
        (this.world as unknown as Ammo.btDiscreteDynamicsWorld).setGravity(ammoVector3);
        this.gravity.copy(gravity);
        Ammo.destroy(ammoVector3);
        return this;
    }

    //override private methods

    private _createWorldDisposeList?: any[];

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _createWorld(): Ammo.btDiscreteDynamicsWorld {
        if (this._createWorldDisposeList === undefined) {
            this._createWorldDisposeList = [];
        }

        const createWorldDisposeList = this._createWorldDisposeList;
        for (let i = 0; i < createWorldDisposeList.length; ++i) {
            Ammo.destroy(createWorldDisposeList[i]);
        }
        createWorldDisposeList.length = 0;

        const config = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(config);
        const cache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);

        this._createWorldDisposeList.push(config, dispatcher, cache, solver, world);

        return world;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _initRigidBodies(rigidBodies: any[]): void {
        for (let i = 0, il = rigidBodies.length; i < il; i++) {
            this.bodies.push(new RigidBody(
                this.mesh, this.world as any, rigidBodies[i], this.manager));
        }
    }

    public dispose(): void {
        const resourceManager = this.manager;
        const transforms = resourceManager.transforms as Ammo.btTransform[];
        for (let i = 0; i < transforms.length; ++i) {
            Ammo.destroy(transforms[i]);
        }

        const quaternions = resourceManager.quaternions as Ammo.btQuaternion[];
        for (let i = 0; i < quaternions.length; ++i) {
            Ammo.destroy(quaternions[i]);
        }

        const vector3s = resourceManager.vector3s as Ammo.btVector3[];
        for (let i = 0; i < vector3s.length; ++i) {
            Ammo.destroy(vector3s[i]);
        }

        const world = this.world as unknown as Ammo.btDiscreteDynamicsWorld;

        const bodies = this.bodies;
        for (let i = 0; i < bodies.length; ++i) {
            world.removeRigidBody(bodies[i].body as Ammo.btRigidBody);
            (bodies[i] as RigidBody).dispose();
        }

        const constraints = this.constraints;
        for (let i = 0; i < constraints.length; ++i) {
            world.removeConstraint((constraints[i] as any).constraint as Ammo.btTypedConstraint);
            Ammo.destroy((constraints[i] as any).constraint);
        }

        const createWorldDisposeList = this._createWorldDisposeList;
        if (createWorldDisposeList) {
            for (let i = 0; i < createWorldDisposeList.length; ++i) {
                Ammo.destroy(createWorldDisposeList[i]);
            }
            createWorldDisposeList.length = 0;
        }
    }
}

/**
 * @param {THREE.SkinnedMesh} mesh
 * @param {Ammo.btDiscreteDynamicsWorld} world
 * @param {Object} params
 * @param {ResourceManager} manager
 */
class RigidBody {
    public mesh: THREE.SkinnedMesh;
    public world: Ammo.btDiscreteDynamicsWorld;
    public params: any;
    public manager: ResourceManager;

    public body: Ammo.btRigidBody;
    public bone: THREE.Bone;
    public boneOffsetForm: Ammo.btTransform;
    public boneOffsetFormInverse: Ammo.btTransform;

    private readonly _disposeList: any[];

    public constructor(
        mesh: THREE.SkinnedMesh,
        world: Ammo.btDiscreteDynamicsWorld,
        params: any,
        manager: ResourceManager
    ) {
        this.mesh = mesh;
        this.world = world;
        this.params = params;
        this.manager = manager;

        this.body = null!;
        this.bone = null!;
        this.boneOffsetForm = null!;
        this.boneOffsetFormInverse = null!;

        this._disposeList = [];

        this._init();
    }

    /**
     * Resets rigid body transform to the current bone's.
     *
     * @return {RigidBody}
     */
    public reset(): RigidBody {
        this._setTransformFromBone();
        return this;
    }

    /**
     * Updates rigid body's transform from the current bone.
     *
     * @return {RidigBody}
     */
    public updateFromBone(): RigidBody {
        if (this.params.boneIndex !== - 1 && this.params.type === 0) {
            this._setTransformFromBone();
        }

        return this;
    }

    /**
     * Updates bone from the current ridid body's transform.
     *
     * @return {RidigBody}
     */
    public updateBone(): RigidBody {
        if (this.params.type === 0 || this.params.boneIndex === - 1) {
            return this;
        }

        this._updateBoneRotation();

        if (this.params.type === 1) {
            this._updateBonePosition();
        }

        this.bone.updateMatrixWorld(true);

        if (this.params.type === 2) {
            this._setPositionFromBone();
        }

        return this;
    }

    // private method

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _init(): void {
        function generateShape(p: any, disposeList: any[]): Ammo.btSphereShape | Ammo.btBoxShape | Ammo.btCapsuleShape {
            switch (p.shapeType) {
            case 0: {
                const shape = new Ammo.btSphereShape(p.width);
                disposeList.push(shape);
                return shape;
            }
            case 1: {
                const vector3 = new Ammo.btVector3(p.width, p.height, p.depth);
                const shape = new Ammo.btBoxShape(vector3);
                disposeList.push(vector3, shape);
                return shape;
            }
            case 2: {
                const shape = new Ammo.btCapsuleShape(p.width, p.height);
                disposeList.push(shape);
                return shape;
            }
            default:
                throw new Error("unknown shape type " + p.shapeType);
            }
        }

        const manager = this.manager;
        const params = (this as any).params;
        const bones = this.mesh.skeleton.bones;
        const bone = (params.boneIndex === - 1)
            ? new THREE.Bone()
            : bones[params.boneIndex];

        const shape = generateShape(params, this._disposeList);
        const weight = (params.type === 0) ? 0 : params.weight;
        const localInertia = manager.allocVector3() as unknown as Ammo.btVector3;
        localInertia.setValue(0, 0, 0);

        if (weight !== 0) {
            shape.calculateLocalInertia(weight, localInertia);
        }

        const boneOffsetForm = manager.allocTransform() as unknown as Ammo.btTransform;
        (manager as any).setIdentity(boneOffsetForm);
        (manager as any).setOriginFromArray3(boneOffsetForm, params.position);
        (manager as any).setBasisFromArray3(boneOffsetForm, params.rotation);

        const vector = manager.allocThreeVector3() as unknown as THREE.Vector3;
        const boneForm = manager.allocTransform() as unknown as Ammo.btTransform;
        (manager as any).setIdentity(boneForm);
        (manager as any).setOriginFromThreeVector3(boneForm, bone.getWorldPosition(vector));

        const form = (manager as any).multiplyTransforms(boneForm, boneOffsetForm) as unknown as Ammo.btTransform;
        const state = new Ammo.btDefaultMotionState(form);

        const info = new Ammo.btRigidBodyConstructionInfo(weight, state, shape, localInertia);
        info.set_m_friction(params.friction);
        info.set_m_restitution(params.restitution);

        const body = new Ammo.btRigidBody(info);

        this._disposeList.push(state, info, body);

        if (params.type === 0) {

            body.setCollisionFlags(body.getCollisionFlags() | 2);

            /*
            * It'd be better to comment out this line though in general I should call this method
            * because I'm not sure why but physics will be more like MMD's
            * if I comment out.
            */
            body.setActivationState(4);

        }

        body.setDamping(params.positionDamping, params.rotationDamping);
        body.setSleepingThresholds(0, 0);

        this.world.addRigidBody(body, 1 << params.groupIndex, params.groupTarget);

        this.body = body;
        this.bone = bone;
        this.boneOffsetForm = boneOffsetForm;
        this.boneOffsetFormInverse = manager.inverseTransform(boneOffsetForm) as Ammo.btTransform;

        this._disposeList.push(this.boneOffsetForm, this.boneOffsetFormInverse);

        manager.freeVector3(localInertia);
        manager.freeTransform(form);
        manager.freeTransform(boneForm);
        manager.freeThreeVector3(vector);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _getBoneTransform(): Ammo.btTransform {
        const manager = this.manager;
        const p = manager.allocThreeVector3() as unknown as THREE.Vector3;
        const q = manager.allocThreeQuaternion() as unknown as THREE.Quaternion;
        const s = manager.allocThreeVector3() as unknown as THREE.Vector3;

        this.bone.matrixWorld.decompose(p, q, s);

        const tr = manager.allocTransform() as unknown as Ammo.btTransform;
        manager.setOriginFromThreeVector3(tr, p);
        manager.setBasisFromThreeQuaternion(tr, q);

        const form = manager.multiplyTransforms(tr, this.boneOffsetForm) as unknown as Ammo.btTransform;

        manager.freeTransform(tr);
        manager.freeThreeVector3(s);
        manager.freeThreeQuaternion(q);
        manager.freeThreeVector3(p);

        return form;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _getWorldTransformForBone(): Ammo.btTransform {
        const manager = this.manager;
        const tr = this.body.getCenterOfMassTransform();
        const result = manager.multiplyTransforms(tr, this.boneOffsetFormInverse) as Ammo.btTransform;
        Ammo.destroy(tr);
        return result;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _setTransformFromBone(): void {
        const manager = this.manager;
        const form = this._getBoneTransform();

        // TODO: check the most appropriate way to set
        //this.body.setWorldTransform( form );
        this.body.setCenterOfMassTransform(form);
        this.body.getMotionState().setWorldTransform(form);

        manager.freeTransform(form);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _setPositionFromBone(): void {
        const manager = this.manager;
        const form = this._getBoneTransform();

        const tr = manager.allocTransform() as unknown as Ammo.btTransform;
        this.body.getMotionState().getWorldTransform(tr);
        manager.copyOrigin(tr, form);

        // TODO: check the most appropriate way to set
        //this.body.setWorldTransform( tr );
        this.body.setCenterOfMassTransform(tr);
        this.body.getMotionState().setWorldTransform(tr);

        manager.freeTransform(tr);
        manager.freeTransform(form);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _updateBoneRotation(): void {
        const manager = this.manager;

        const tr = this._getWorldTransformForBone() as unknown as Ammo.btTransform;
        const q = manager.getBasis(tr) as unknown as Ammo.btQuaternion;

        const thQ = manager.allocThreeQuaternion() as unknown as THREE.Quaternion;
        const thQ2 = manager.allocThreeQuaternion() as unknown as THREE.Quaternion;
        const thQ3 = manager.allocThreeQuaternion() as unknown as THREE.Quaternion;

        thQ.set(q.x(), q.y(), q.z(), q.w());
        thQ2.setFromRotationMatrix(this.bone.matrixWorld);
        thQ2.conjugate();
        thQ2.multiply(thQ);

        //this.bone.quaternion.multiply( thQ2 );

        thQ3.setFromRotationMatrix(this.bone.matrix);

        // Renormalizing quaternion here because repeatedly transforming
        // quaternion continuously accumulates floating point error and
        // can end up being overflow. See #15335
        this.bone.quaternion.copy(thQ2.multiply(thQ3).normalize());

        manager.freeThreeQuaternion(thQ);
        manager.freeThreeQuaternion(thQ2);
        manager.freeThreeQuaternion(thQ3);

        manager.freeQuaternion(q);
        manager.freeTransform(tr);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _updateBonePosition(): void {
        const manager = this.manager;

        const tr = this._getWorldTransformForBone();

        const thV = manager.allocThreeVector3() as unknown as THREE.Vector3;

        const o = manager.getOrigin(tr) as unknown as Ammo.btVector3;
        thV.set(o.x(), o.y(), o.z());

        if (this.bone.parent) {
            this.bone.parent.worldToLocal(thV);
        }

        this.bone.position.copy(thV);
        manager.freeThreeVector3(thV);
        manager.freeTransform(tr);
    }

    public dispose(): void {
        const disposeList = this._disposeList;
        for (let i = 0, il = disposeList.length; i < il; i++) {
            Ammo.destroy(disposeList[i]);
        }
        this._disposeList.length = 0;
    }
}
