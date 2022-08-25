import { GrantSolver as ThreeGrantSolver, MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";
import * as THREE from "three/src/Three";

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

    public createGrantSolver(mesh: THREE.SkinnedMesh): ThreeGrantSolver {
        return new GrantSolver(mesh, mesh.geometry.userData.MMD.grants) as unknown as ThreeGrantSolver;
    }
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
