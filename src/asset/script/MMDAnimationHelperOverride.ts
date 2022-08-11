import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";

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
}
