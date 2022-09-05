import Ammo from "ammojs-typed";
import { MMDPhysics, ResourceManager } from "three/examples/jsm/animation/MMDPhysics";
import * as THREE from "three/src/Three";

export class ResourceManagerOverride {
    public threeVector3s: THREE.Vector3[];
    public threeMatrix4s: THREE.Matrix4[];
    public threeQuaternions: THREE.Quaternion[];
    public threeEulers: THREE.Euler[];

    public transforms: Ammo.btTransform[];
    public quaternions: Ammo.btQuaternion[];
    public vector3s: Ammo.btVector3[];

    public constructor() {
        // for Three.js
        this.threeVector3s = [];
        this.threeMatrix4s = [];
        this.threeQuaternions = [];
        this.threeEulers = [];

        // for Ammo.js
        this.transforms = [];
        this.quaternions = [];
        this.vector3s = [];
    }

    public allocThreeVector3(): THREE.Vector3 {
        return (this.threeVector3s.length > 0)
            ? this.threeVector3s.pop()!
            : new THREE.Vector3();
    }

    public freeThreeVector3(v: THREE.Vector3): void {
        this.threeVector3s.push(v);
    }

    public allocThreeMatrix4(): THREE.Matrix4 {
        return (this.threeMatrix4s.length > 0)
            ? this.threeMatrix4s.pop()!
            : new THREE.Matrix4();
    }

    public freeThreeMatrix4(m: THREE.Matrix4): void {
        this.threeMatrix4s.push(m);
    }

    public allocThreeQuaternion(): THREE.Quaternion {
        return (this.threeQuaternions.length > 0)
            ? this.threeQuaternions.pop()!
            : new THREE.Quaternion();
    }

    public freeThreeQuaternion(q: THREE.Quaternion): void {
        this.threeQuaternions.push(q);
    }

    public allocThreeEuler(): THREE.Euler {
        return (this.threeEulers.length > 0)
            ? this.threeEulers.pop()!
            : new THREE.Euler();
    }

    public freeThreeEuler(e: THREE.Euler): void {
        this.threeEulers.push(e);
    }

    public allocTransform(): Ammo.btTransform {
        return (this.transforms.length > 0)
            ? this.transforms.pop()!
            : new Ammo.btTransform();
    }

    public freeTransform(t: Ammo.btTransform): void {
        this.transforms.push(t);
    }

    public allocQuaternion(): Ammo.btQuaternion {
        return (this.quaternions.length > 0)
            ? this.quaternions.pop()!
            : new Ammo.btQuaternion(0, 0, 0, 1);
    }

    public freeQuaternion(q: Ammo.btQuaternion): void {
        this.quaternions.push(q);
    }

    public allocVector3(): Ammo.btVector3 {
        return (this.vector3s.length > 0)
            ? this.vector3s.pop()!
            : new Ammo.btVector3();
    }

    public freeVector3(v: Ammo.btVector3): void {
        this.vector3s.push(v);
    }

    public setIdentity(t: Ammo.btTransform): void {
        t.setIdentity();
    }

    public getBasis(t: Ammo.btTransform): Ammo.btQuaternion {
        const q = this.allocQuaternion();
        t.getBasis().getRotation(q);
        return q;
    }

    public getBasisAsMatrix3(t: Ammo.btTransform): number[] {
        const q = this.getBasis(t);
        const m = this.quaternionToMatrix3(q);
        this.freeQuaternion(q);
        return m;
    }

    public getOrigin(t: Ammo.btTransform): Ammo.btVector3 {
        return t.getOrigin();
    }

    public setOrigin(t: Ammo.btTransform, v: Ammo.btVector3): void {
        t.getOrigin().setValue(v.x(), v.y(), v.z());
    }

    public copyOrigin(t1: Ammo.btTransform, t2: Ammo.btTransform): void {
        const o = t2.getOrigin();
        this.setOrigin(t1, o);
    }

    public setBasis(t: Ammo.btTransform, q: Ammo.btQuaternion): void {
        t.setRotation(q);
    }

    public setBasisFromMatrix3(t: Ammo.btTransform, m: number[]): void {
        const q = this.matrix3ToQuaternion(m);
        this.setBasis(t, q);
        this.freeQuaternion(q);
    }

    public setOriginFromArray3(t: Ammo.btTransform, a: number[]): void {
        t.getOrigin().setValue(a[0], a[1], a[2]);
    }

    public setOriginFromThreeVector3(t: Ammo.btTransform, v: THREE.Vector3): void {
        t.getOrigin().setValue(v.x, v.y, v.z);
    }

    public setBasisFromArray3(t: Ammo.btTransform, a: number[]): void {
        const thQ = this.allocThreeQuaternion();
        const thE = this.allocThreeEuler();
        thE.set(a[0], a[1], a[2]);
        this.setBasisFromThreeQuaternion(t, thQ.setFromEuler(thE));

        this.freeThreeEuler(thE);
        this.freeThreeQuaternion(thQ);
    }

    public setBasisFromThreeQuaternion(t: Ammo.btTransform, a: THREE.Quaternion): void {
        const q = this.allocQuaternion();

        q.setX(a.x);
        q.setY(a.y);
        q.setZ(a.z);
        q.setW(a.w);
        this.setBasis(t, q);

        this.freeQuaternion(q);
    }

    public multiplyTransforms(t1: Ammo.btTransform, t2: Ammo.btTransform): Ammo.btTransform {
        const t = this.allocTransform();
        this.setIdentity(t);

        const m1 = this.getBasisAsMatrix3(t1);
        const m2 = this.getBasisAsMatrix3(t2);

        const o1 = this.getOrigin(t1);
        const o2 = this.getOrigin(t2);

        const v1 = this.multiplyMatrix3ByVector3(m1, o2);
        const v2 = this.addVector3(v1, o1);
        this.setOrigin(t, v2);

        const m3 = this.multiplyMatrices3(m1, m2);
        this.setBasisFromMatrix3(t, m3);

        this.freeVector3(v1);
        this.freeVector3(v2);

        return t;
    }

    public inverseTransform(t: Ammo.btTransform): Ammo.btTransform {
        const t2 = this.allocTransform();

        const m1 = this.getBasisAsMatrix3(t);
        const o = this.getOrigin(t);

        const m2 = this.transposeMatrix3(m1);
        const v1 = this.negativeVector3(o);
        const v2 = this.multiplyMatrix3ByVector3(m2, v1);

        this.setOrigin(t2, v2);
        this.setBasisFromMatrix3(t2, m2);

        this.freeVector3(v1);
        this.freeVector3(v2);

        return t2;
    }

    public multiplyMatrices3(m1: number[], m2: number[]): number[] {
        const m3 = [];

        const v10 = this.rowOfMatrix3(m1, 0);
        const v11 = this.rowOfMatrix3(m1, 1);
        const v12 = this.rowOfMatrix3(m1, 2);

        const v20 = this.columnOfMatrix3(m2, 0);
        const v21 = this.columnOfMatrix3(m2, 1);
        const v22 = this.columnOfMatrix3(m2, 2);

        m3[0] = this.dotVectors3(v10, v20);
        m3[1] = this.dotVectors3(v10, v21);
        m3[2] = this.dotVectors3(v10, v22);
        m3[3] = this.dotVectors3(v11, v20);
        m3[4] = this.dotVectors3(v11, v21);
        m3[5] = this.dotVectors3(v11, v22);
        m3[6] = this.dotVectors3(v12, v20);
        m3[7] = this.dotVectors3(v12, v21);
        m3[8] = this.dotVectors3(v12, v22);

        this.freeVector3(v10);
        this.freeVector3(v11);
        this.freeVector3(v12);
        this.freeVector3(v20);
        this.freeVector3(v21);
        this.freeVector3(v22);

        return m3;
    }

    public addVector3(v1: Ammo.btVector3, v2: Ammo.btVector3): Ammo.btVector3 {
        const v = this.allocVector3();
        v.setValue(v1.x() + v2.x(), v1.y() + v2.y(), v1.z() + v2.z());
        return v;
    }

    public dotVectors3(v1: Ammo.btVector3, v2: Ammo.btVector3): number {
        return v1.x() * v2.x() + v1.y() * v2.y() + v1.z() * v2.z();
    }

    public rowOfMatrix3(m: number[], i: number): Ammo.btVector3 {
        const v = this.allocVector3();
        v.setValue(m[i * 3 + 0], m[i * 3 + 1], m[i * 3 + 2]);
        return v;
    }

    public columnOfMatrix3(m: number[], i: number): Ammo.btVector3 {
        const v = this.allocVector3();
        v.setValue(m[i + 0], m[i + 3], m[i + 6]);
        return v;
    }

    public negativeVector3(v: Ammo.btVector3): Ammo.btVector3 {
        const v2 = this.allocVector3();
        v2.setValue(- v.x(), - v.y(), - v.z());
        return v2;
    }

    public multiplyMatrix3ByVector3(m: number[], v: Ammo.btVector3): Ammo.btVector3 {
        const v4 = this.allocVector3();

        const v0 = this.rowOfMatrix3(m, 0);
        const v1 = this.rowOfMatrix3(m, 1);
        const v2 = this.rowOfMatrix3(m, 2);
        const x = this.dotVectors3(v0, v);
        const y = this.dotVectors3(v1, v);
        const z = this.dotVectors3(v2, v);

        v4.setValue(x, y, z);

        this.freeVector3(v0);
        this.freeVector3(v1);
        this.freeVector3(v2);

        return v4;
    }

    public transposeMatrix3(m: number[]): number[] {
        const m2 = [];
        m2[0] = m[0];
        m2[1] = m[3];
        m2[2] = m[6];
        m2[3] = m[1];
        m2[4] = m[4];
        m2[5] = m[7];
        m2[6] = m[2];
        m2[7] = m[5];
        m2[8] = m[8];
        return m2;
    }

    public quaternionToMatrix3(q: Ammo.btQuaternion): number[] {
        const m: number[] = [];

        const x = q.x();
        const y = q.y();
        const z = q.z();
        const w = q.w();

        const xx = x * x;
        const yy = y * y;
        const zz = z * z;

        const xy = x * y;
        const yz = y * z;
        const zx = z * x;

        const xw = x * w;
        const yw = y * w;
        const zw = z * w;

        m[0] = 1 - 2 * (yy + zz);
        m[1] = 2 * (xy - zw);
        m[2] = 2 * (zx + yw);
        m[3] = 2 * (xy + zw);
        m[4] = 1 - 2 * (zz + xx);
        m[5] = 2 * (yz - xw);
        m[6] = 2 * (zx - yw);
        m[7] = 2 * (yz + xw);
        m[8] = 1 - 2 * (xx + yy);

        return m;
    }

    public matrix3ToQuaternion(m: number[]): Ammo.btQuaternion {
        const t = m[0] + m[4] + m[8];
        let s, x, y, z, w;

        if (t > 0) {
            s = Math.sqrt(t + 1.0) * 2;
            w = 0.25 * s;
            x = (m[7] - m[5]) / s;
            y = (m[2] - m[6]) / s;
            z = (m[3] - m[1]) / s;
        } else if ((m[0] > m[4]) && (m[0] > m[8])) {
            s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2;
            w = (m[7] - m[5]) / s;
            x = 0.25 * s;
            y = (m[1] + m[3]) / s;
            z = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2;
            w = (m[2] - m[6]) / s;
            x = (m[1] + m[3]) / s;
            y = 0.25 * s;
            z = (m[5] + m[7]) / s;
        } else {
            s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2;
            w = (m[3] - m[1]) / s;
            x = (m[2] + m[6]) / s;
            y = (m[5] + m[7]) / s;
            z = 0.25 * s;
        }

        const q = this.allocQuaternion();
        q.setX(x);
        q.setY(y);
        q.setZ(z);
        q.setW(w);
        return q;
    }
}

export class MMdPhysicsOverride extends MMDPhysics {
    public override setGravity(gravity: THREE.Vector3): this {
        const ammoVector3 = new Ammo.btVector3(gravity.x, gravity.y, gravity.z);
        (this.world as unknown as Ammo.btDiscreteDynamicsWorld).setGravity(ammoVector3);
        this.gravity.copy(gravity);
        Ammo.destroy(ammoVector3);
        return this;
    }

    //override private methods

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _createWorld(): Ammo.btDiscreteDynamicsWorld {
        if ((this as any)._createWorldDisposeList === undefined) {
            (this as any)._createWorldDisposeList = [];
        }

        const createWorldDisposeList = (this as any)._createWorldDisposeList as any[];
        for (let i = 0; i < createWorldDisposeList.length; ++i) {
            Ammo.destroy(createWorldDisposeList[i]);
        }
        createWorldDisposeList.length = 0;

        const config = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(config);
        const cache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);

        (this as any)._createWorldDisposeList.push(world, solver, cache, dispatcher, config);

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
        transforms.length = 0;

        const quaternions = resourceManager.quaternions as Ammo.btQuaternion[];
        for (let i = 0; i < quaternions.length; ++i) {
            Ammo.destroy(quaternions[i]);
        }
        quaternions.length = 0;

        const vector3s = resourceManager.vector3s as Ammo.btVector3[];
        for (let i = 0; i < vector3s.length; ++i) {
            Ammo.destroy(vector3s[i]);
        }
        vector3s.length = 0;

        const world = this.world as unknown as Ammo.btDiscreteDynamicsWorld;

        const bodies = this.bodies;
        for (let i = 0; i < bodies.length; ++i) {
            world.removeRigidBody(bodies[i].body as Ammo.btRigidBody);
            (bodies[i] as RigidBody).dispose();
        }
        bodies.length = 0;

        const constraints = this.constraints;
        for (let i = 0; i < constraints.length; ++i) {
            world.removeConstraint((constraints[i] as any).constraint as Ammo.btTypedConstraint);
            Ammo.destroy((constraints[i] as any).constraint);
        }
        constraints.length = 0;

        const createWorldDisposeList = (this as any)._createWorldDisposeList as any[];
        if (createWorldDisposeList === undefined) {
            throw new Error("createWorldDisposeList is undefined");
        }
        for (let i = 0; i < createWorldDisposeList.length; ++i) {
            Ammo.destroy(createWorldDisposeList[i]);
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
                disposeList.push(shape, vector3);
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

        this._disposeList.push(body, info, state);

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
