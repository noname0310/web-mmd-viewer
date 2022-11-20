import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver";
import { GrantSolver as ThreeGrantSolver, MMDAnimationHelper, MMDAnimationHelperMixer } from "three/examples/jsm/animation/MMDAnimationHelper";
import * as THREE from "three/src/Three";

import { GeometryBone, MmdUserData } from "./MMDLoaderOverride";
import { MMdPhysicsOverride } from "./MMDPhysicsOverride";

export class MMDAnimationHelperOverride extends MMDAnimationHelper {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _createMMDPhysics(mesh: THREE.SkinnedMesh, params: any): MMdPhysicsOverride {

        if (MMdPhysicsOverride === undefined) {
            throw new Error("THREE.MMDPhysics: Import MMDPhysics.");
        }

        return new MMdPhysicsOverride(
            mesh,
            (mesh.geometry.userData.MMD as MmdUserData).rigidBodies,
            (mesh.geometry.userData.MMD as MmdUserData).constraints,
            params
        );
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _createCCDIKSolver(mesh: THREE.SkinnedMesh): CCDIKSolver {
        const iks = (mesh.geometry.userData.MMD as MmdUserData).iks;
        const bones = (mesh.geometry.userData.MMD as MmdUserData).bones;
        const objects = this.objects.get(mesh)! as MMDAnimationHelperMixer & { ikEnables?: boolean[], boneIkMapper?: Map<string, number> };
        objects.ikEnables = [];
        objects.boneIkMapper = new Map();
        for (let i = 0, il = iks.length; i < il; i++) {
            objects.ikEnables.push(true);
        }
        for (let i = 0, j = 0, il = bones.length; i < il; i++) {
            if (bones[i].ik) {
                objects.boneIkMapper.set(bones[i].name, j);
                j += 1;
            }
        }

        return new CCDIKSolver(mesh, iks as any); //TODO: pr to three typed
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _animateMesh(mesh: THREE.SkinnedMesh, delta: number): void {
        const objects = this.objects.get(mesh)! as MMDAnimationHelperMixer & { sortedBonesData?: GeometryBone[], ikEnables?: boolean[], boneIkMapper?: Map<string, number> };

        const mixer = objects.mixer;
        const ikSolver = objects.ikSolver;
        const grantSolver = objects.grantSolver;
        const physics = objects.physics;
        const looped = objects.looped;

        if (mixer && this.enabled.animation) {
            // alternate solution to save/restore bones but less performant?
            //mesh.pose();
            //this._updatePropertyMixersBuffer( mesh );

            (this as any)._restoreBones(mesh);
            mixer.update(delta);
            (this as any)._saveBones(mesh);

            // PMX animation system special path
            if ((this.configuration as any).pmxAnimation &&
                mesh.geometry.userData.MMD && (mesh.geometry.userData.MMD as MmdUserData).format === "pmx") {

                if (!objects.sortedBonesData) objects.sortedBonesData = 
                    (this as any)._sortBoneDataArray((mesh.geometry.userData.MMD as MmdUserData).bones.slice());

                this._animatePMXMesh(
                    mesh,
                    objects.sortedBonesData!,
                    ikSolver && this.enabled.ik ? ikSolver : null,
                    grantSolver && this.enabled.grant ? (grantSolver as unknown as GrantSolver) : null
                );
            } else {
                if (ikSolver && this.enabled.ik) {
                    mesh.updateMatrixWorld(true);

                    const ikEnables = objects.ikEnables!;
                    const iks = (mesh.geometry.userData.MMD as MmdUserData).iks;
                    for (let i = 0, il = iks.length; i < il; i++) {
                        if (ikEnables[i] === true) {
                            ikSolver.updateOne(iks[i] as any); //TODO: pr to three typed
                        }
                    }
                }

                if (grantSolver && this.enabled.grant) {
                    grantSolver.update();
                }
            }
        }

        if (looped === true && this.enabled.physics) {
            if (physics && this.configuration.resetPhysicsOnLoop) physics.reset();
            objects.looped = false;
        }

        if (physics && this.enabled.physics && !this.sharedPhysics) {
            this.onBeforePhysics(mesh);
            physics.update(delta);
        }
    }

    // PMX Animation system is a bit too complex and doesn't great match to
    // Three.js Animation system. This method attempts to simulate it as much as
    // possible but doesn't perfectly simulate.
    // This method is more costly than the regular one so
    // you are recommended to set constructor parameter "pmxAnimation: true"
    // only if your PMX model animation doesn't work well.
    // If you need better method you would be required to write your own.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public _animatePMXMesh(mesh: THREE.SkinnedMesh, sortedBonesData: GeometryBone[], ikSolver: CCDIKSolver|null, grantSolver: GrantSolver|null): this {
        _quaternionIndex = 0;
        _grantResultMap.clear();
        
        const mixer = this.objects.get(mesh)! as MMDAnimationHelperMixer & { ikEnables: boolean[], boneIkMapper: Map<string, number> };
        for (let i = 0, il = sortedBonesData.length; i < il; i++) {
            updateOne(mesh, sortedBonesData[i].index, ikSolver, grantSolver, mixer);
        }

        mesh.updateMatrixWorld(true);
        return this;
    }

    public createGrantSolver(mesh: THREE.SkinnedMesh): ThreeGrantSolver {
        return new GrantSolver(mesh, (mesh.geometry.userData.MMD as MmdUserData).grants) as unknown as ThreeGrantSolver;
    }

    public isIkEnabled(mesh: THREE.SkinnedMesh, name: string): boolean {
        const objects = this.objects.get(mesh)! as MMDAnimationHelperMixer & { ikEnables: boolean[], boneIkMapper: Map<string, number> };
        const index = objects.boneIkMapper.get(name);
        return index !== undefined ? objects.ikEnables[index] : false;
    }

    public setIkEnabled(mesh: THREE.SkinnedMesh, name: string, enabled: boolean): void {
        const objects = this.objects.get(mesh)! as MMDAnimationHelperMixer & { ikEnables: boolean[], boneIkMapper: Map<string, number> };
        const index = objects.boneIkMapper.get(name);
        if (index !== undefined) objects.ikEnables[index] = enabled;
    }

    public isIkExists(mesh: THREE.SkinnedMesh, name: string): boolean {
        const objects = this.objects.get(mesh)! as MMDAnimationHelperMixer & { boneIkMapper: Map<string, number> };
        return objects.boneIkMapper.has(name);
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

function updateOne(
    mesh: THREE.SkinnedMesh,
    boneIndex: number,
    ikSolver: CCDIKSolver|null,
    grantSolver: GrantSolver|null,
    mixer: MMDAnimationHelperMixer & { ikEnables: boolean[], boneIkMapper: Map<string, number> }
): void {
    const bones = mesh.skeleton.bones;
    const bonesData = (mesh.geometry.userData.MMD as MmdUserData).bones;
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

            updateOne(mesh, parentIndex, ikSolver, grantSolver, mixer);

        }

        grantSolver.addGrantRotation(bone, _grantResultMap.get(parentIndex), ratio);
    }

    if (ikSolver && boneData.ik && mixer.ikEnables[mixer.boneIkMapper.get(boneData.name)!] === true) {
        // @TODO: Updating world matrices every time solving an IK bone is
        // costly. Optimize if possible.
        mesh.updateMatrixWorld(true);
        ikSolver.updateOne(boneData.ik as any); //TODO: pr to three typed

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
