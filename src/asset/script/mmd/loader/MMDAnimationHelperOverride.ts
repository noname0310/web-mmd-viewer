import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver";
import { GrantSolver as ThreeGrantSolver, MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";
import * as THREE from "three/src/Three";

import { GeometryBone } from "./MMDLoaderOverride";
import { MMdPhysicsOverride } from "./MMDPhysicsOverride";

export class MMDAnimationHelperOverride extends MMDAnimationHelper {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _createMMDPhysics(mesh: THREE.SkinnedMesh, params: any): MMdPhysicsOverride {

        if (MMdPhysicsOverride === undefined) {
            throw new Error("THREE.MMDPhysics: Import MMDPhysics.");
        }

        return new MMdPhysicsOverride(
            mesh,
            mesh.geometry.userData.MMD.rigidBodies,
            mesh.geometry.userData.MMD.constraints,
            params
        );
    }

    // PMX Animation system is a bit too complex and doesn't great match to
    // Three.js Animation system. This method attempts to simulate it as much as
    // possible but doesn't perfectly simulate.
    // This method is more costly than the regular one so
    // you are recommended to set constructor parameter "pmxAnimation: true"
    // only if your PMX model animation doesn't work well.
    // If you need better method you would be required to write your own.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _animatePMXMesh(mesh: THREE.SkinnedMesh, sortedBonesData: GeometryBone[], ikSolver: CCDIKSolver, grantSolver: GrantSolver): this {
        _quaternionIndex = 0;
        _grantResultMap.clear();

        for (let i = 0, il = sortedBonesData.length; i < il; i++) {
            updateOne(mesh, sortedBonesData[i].index, ikSolver, grantSolver);
        }

        mesh.updateMatrixWorld(true);
        return this;
    }

    public createGrantSolver(mesh: THREE.SkinnedMesh): ThreeGrantSolver {
        return new GrantSolver(mesh, mesh.geometry.userData.MMD.grants) as unknown as ThreeGrantSolver;
    }
}

// Keep working quaternions for less GC
// eslint-disable-next-line @typescript-eslint/naming-convention
const _quaternions: THREE.Quaternion[] = [];
// eslint-disable-next-line @typescript-eslint/naming-convention
let _quaternionIndex = 0;

function getQuaternion(): THREE.Quaternion {
    if (_quaternionIndex >= _quaternions.length) {
        _quaternions.push(new THREE.Quaternion());
    }

    return _quaternions[_quaternionIndex++];
}

// Save rotation whose grant and IK are already applied
// used by grant children
// eslint-disable-next-line @typescript-eslint/naming-convention
const _grantResultMap = new Map();

function updateOne(mesh: THREE.SkinnedMesh, boneIndex: number, ikSolver: CCDIKSolver, grantSolver: GrantSolver): void {
    const bones = mesh.skeleton.bones;
    const bonesData = mesh.geometry.userData.MMD.bones;
    const boneData = bonesData[boneIndex];
    const bone = bones[boneIndex];

    // Return if already updated by being referred as a grant parent.
    if (_grantResultMap.has(boneIndex)) return;

    const quaternion = getQuaternion();

    // Initialize grant result here to prevent infinite loop.
    // If it's referred before updating with actual result later
    // result without applyting IK or grant is gotten
    // but better than composing of infinite loop.
    _grantResultMap.set(boneIndex, quaternion.copy(bone.quaternion));

    // @TODO: Support global grant and grant position
    if (grantSolver && boneData.grant &&
        !boneData.grant.isLocal && boneData.grant.affectRotation) {

        const parentIndex = boneData.grant.parentIndex;
        const ratio = boneData.grant.ratio;

        if (!_grantResultMap.has(parentIndex)) {

            updateOne(mesh, parentIndex, ikSolver, grantSolver);

        }

        grantSolver.addGrantRotation(bone, _grantResultMap.get(parentIndex), ratio);

    }

    if (ikSolver && boneData.ik) {

        // @TODO: Updating world matrices every time solving an IK bone is
        // costly. Optimize if possible.
        mesh.updateMatrixWorld(true);
        ikSolver.updateOne(boneData.ik);

        // No confident, but it seems the grant results with ik links should be updated?
        const links = boneData.ik.links;

        for (let i = 0, il = links.length; i < il; i++) {
            const link = links[i];
            if (link.enabled === false) continue;

            const linkIndex = link.index;

            if (_grantResultMap.has(linkIndex)) {
                _grantResultMap.set(linkIndex, _grantResultMap.get(linkIndex).copy(bones[linkIndex].quaternion));
            }
        }
    }

    // Update with the actual result here
    quaternion.copy(bone.quaternion);
}

type Grant = {
    index: number;
    parentIndex: number;
    isLocal: boolean;
    affectPosition: boolean;
    affectRotation: boolean;
    ratio: number;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const _q = new THREE.Quaternion();

class GrantSolver {
    public mesh: THREE.SkinnedMesh;
    public grants: Grant[];

    public constructor(mesh: THREE.SkinnedMesh, grants: Grant[] = []) {
        this.mesh = mesh;
        this.grants = grants;
    }

    public update(): GrantSolver {
        const grants = this.grants;

        for (let i = 0, il = grants.length; i < il; ++i) this.updateOne(grants[i]);

        return this;
    }

    public updateOne(grant: Grant): GrantSolver {
        const bones = this.mesh.skeleton.bones;
        const bone = bones[grant.index];
        const parentBone = bones[grant.parentIndex];

        if (grant.isLocal) {
            // TODO: implement
            if (grant.affectPosition) {
                //...
            }

            // TODO: implement
            if (grant.affectRotation) {
                //...
            }

        } else {
            // TODO: implement
            if (grant.affectPosition) {
                //...
            }

            if (grant.affectRotation) {
                this.addGrantRotation(bone, parentBone.quaternion, grant.ratio);
            }
        }

        return this;
    }

    public addGrantRotation(bone: THREE.Bone, q: THREE.Quaternion, ratio: number): GrantSolver {
        _q.set(0, 0, 0, 1);
        _q.slerp(q, ratio);
        bone.quaternion.multiply(_q);

        return this;
    }
}
