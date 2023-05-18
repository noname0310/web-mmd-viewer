import { GroupMorph, MMDParser, ModelFormat, Pmd, Pmx, PmxBoneInfo, VertexMorph, Vmd } from "@noname0310/mmd-parser";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";
import * as THREE from "three/src/Three";
import { AnimationClip, AnimationClipInstance, AnimationKey, AnimationSequence, AnimationSequenceInstance, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";

import { EmptyBooleanInterpolator } from "../interpolation/EmptyInterpolator";
import { QuaternionUtils } from "../QuaternionUtils";

export class MMDLoaderOverride extends MMDLoader {
    public forceAllInterpolateToCubic = false;

    public constructor(manager?: THREE.LoadingManager) {
        super(manager);

        this.parser = MMDParser;
        this.animationBuilder = new AnimationBuilder(this);
        (this.meshBuilder as any).geometryBuilder = new GeometryBuilder();
    }
}

type GrantEntryItem = {
    parent: GrantEntryItem | null;
    children: GrantEntryItem[];
    param: {
        index: number;
        parentIndex: number;
        ratio: number;
        isLocal: boolean;
        affectRotation: boolean;
        affectPosition: boolean;
        transformationClass: number;
    } | null;
    visited: boolean;
};

export type GeometryBone = {
    index: number;
    transformationClass: number | undefined;
    parent: number;
    name: string;
    pos: number[];
    rotq: number[];
    scl: number[];
    rigidBodyType: number;
    ik?: {
        target: number;
        effector: number;
        iteration: number;
        maxAngle: number;
        links: {
            index: number;
            enabled: boolean;
            rotationMin?: THREE.Vector3 | undefined;
            rotationMax?: THREE.Vector3 | undefined;
        }[];
    };
    grant?: GrantEntryItem["param"];
};

export type IK = {
    target: number;
    effector: number;
    iteration: number;
    maxAngle: number;
    links: {
        index: number;
        enabled: boolean;
        limitation?: THREE.Vector3 | undefined;
    }[];
};

export type Grant = {
    index: number;
    parentIndex: number;
    ratio: number;
    isLocal: boolean;
    affectRotation: boolean;
    affectPosition: boolean;
    transformationClass: number;
}

export type MmdUserData = {
    bones: GeometryBone[];
    iks: IK[];
    grants: Grant[];
    rigidBodies: Pmd["rigidBodies"] & Pmx["rigidBodies"];
    constraints: Pmd["constraints"] & Pmx["constraints"];
    format: ModelFormat;
};

type GeometryMorphTarget = { name: string; };

type MmdBufferGeomatry = THREE.BufferGeometry & {
    bones: GeometryBone[];
    morphTargets: GeometryMorphTarget[];
};

export class GeometryBuilder {

    /**
     * @param {Object} data - parsed PMD/PMX data
     * @return {BufferGeometry}
     */
    public build(data: Pmd | Pmx): MmdBufferGeomatry {
        // for geometry
        const positions: number[] = [];
        const uvs: number[] = [];
        const normals: number[] = [];

        const indices: number[] = [];

        const groups: {
            offset: number;
            count: number;
        }[] = [];

        const bones: GeometryBone[] = [];
        const skinIndices: number[] = [];
        const skinWeights: number[] = [];

        const morphTargets: GeometryMorphTarget[] = [];
        const morphPositions: THREE.Float32BufferAttribute[] = [];

        const iks: IK[] = [];
        const grants: Grant[] = [];

        const rigidBodies: Pmd["rigidBodies"] & Pmx["rigidBodies"] = [];
        const constraints: Pmd["constraints"] & Pmx["constraints"] = [];

        // for work
        let offset = 0;
        const boneTypeTable: { [index: number]: number; } = {};

        // positions, normals, uvs, skinIndices, skinWeights

        for (let i = 0; i < data.metadata.vertexCount; i++) {
            const v = data.vertices[i];

            for (let j = 0, jl = v.position.length; j < jl; j++) {
                positions.push(v.position[j]);
            }

            for (let j = 0, jl = v.normal.length; j < jl; j++) {
                normals.push(v.normal[j]);
            }

            for (let j = 0, jl = v.uv.length; j < jl; j++) {
                uvs.push(v.uv[j]);
            }

            for (let j = 0; j < 4; j++) {
                skinIndices.push(v.skinIndices.length - 1 >= j ? v.skinIndices[j] : 0.0);
            }

            for (let j = 0; j < 4; j++) {
                skinWeights.push(v.skinWeights.length - 1 >= j ? v.skinWeights[j] : 0.0);
            }
        }

        // indices
        for (let i = 0; i < data.metadata.faceCount; i++) {
            const face = data.faces[i];

            for (let j = 0, jl = face.indices.length; j < jl; j++) {
                indices.push(face.indices[j]);
            }
        }

        // groups
        for (let i = 0; i < data.metadata.materialCount; i++) {
            const material = data.materials[i];

            groups.push({
                offset: offset * 3,
                count: material.faceCount * 3
            });

            offset += material.faceCount;
        }

        // bones
        for (let i = 0; i < data.metadata.rigidBodyCount; i++) {
            const body = data.rigidBodies[i];
            let value = boneTypeTable[body.boneIndex];

            // keeps greater number if already value is set without any special reasons
            value = value === undefined ? body.type : Math.max(body.type, value);

            boneTypeTable[body.boneIndex] = value;
        }

        for (let i = 0; i < data.metadata.boneCount; i++) {
            const boneData = data.bones[i];

            const bone = {
                index: i,
                transformationClass: data.metadata.format === "pmx" ? (boneData as PmxBoneInfo).transformationClass : undefined,
                parent: boneData.parentIndex,
                name: boneData.name,
                pos: boneData.position.slice(0, 3),
                rotq: [0, 0, 0, 1],
                scl: [1, 1, 1],
                rigidBodyType: boneTypeTable[i] !== undefined ? boneTypeTable[i] : -1
            };

            if (bone.parent !== -1) {
                bone.pos[0] -= data.bones[bone.parent].position[0];
                bone.pos[1] -= data.bones[bone.parent].position[1];
                bone.pos[2] -= data.bones[bone.parent].position[2];
            }

            bones.push(bone);
        }

        // iks

        // TODO: remove duplicated codes between PMD and PMX
        if (data.metadata.format === "pmd") {
            for (let i = 0; i < data.metadata.ikCount; i++) {
                const ik = (data as Pmd).iks[i];

                const param = {
                    target: ik.target,
                    effector: ik.effector,
                    iteration: ik.iteration,
                    maxAngle: ik.maxAngle * 4,
                    links: [] as {
                        index: number;
                        enabled: boolean;
                        limitation?: THREE.Vector3;
                    }[]
                };

                for (let j = 0, jl = ik.links.length; j < jl; j++) {
                    const link: {
                        index: number;
                        enabled: boolean;
                        limitation?: THREE.Vector3;
                    } = {
                        index: ik.links[j].index,
                        enabled: true
                    };

                    if (data.bones[link.index].name.includes("ひざ")) {
                        link.limitation = new THREE.Vector3(1.0, 0.0, 0.0);
                    }
                    param.links.push(link);
                }

                iks.push(param);
            }
        } else {
            for (let i = 0; i < data.metadata.boneCount; i++) {
                const ik = (data as Pmx).bones[i].ik;
                if (ik === undefined) continue;

                const param = {
                    target: i,
                    effector: ik.effector,
                    iteration: ik.iteration,
                    maxAngle: ik.maxAngle,
                    links: [] as {
                        index: number;
                        enabled: boolean;
                        rotationMin?: THREE.Vector3;
                        rotationMax?: THREE.Vector3;
                    }[]
                };

                for (let j = 0, jl = ik.links.length; j < jl; j++) {

                    const link: {
                        index: number;
                        enabled: boolean;
                        rotationMin?: THREE.Vector3;
                        rotationMax?: THREE.Vector3;
                    } = {
                        index: ik.links[j].index,
                        enabled: true
                    };

                    if (ik.links[j].angleLimitation === 1) {
                        // Revert if rotationMin/Max doesn't work well
                        // link.limitation = new Vector3( 1.0, 0.0, 0.0 );

                        const rotationMin = ik.links[j].lowerLimitationAngle!;
                        const rotationMax = ik.links[j].upperLimitationAngle!;

                        // Convert Left to Right coordinate by myself because
                        // MMDParser doesn't convert. It's a MMDParser's bug

                        const tmp1 = -rotationMax[0];
                        const tmp2 = -rotationMax[1];
                        rotationMax[0] = -rotationMin[0];
                        rotationMax[1] = -rotationMin[1];
                        rotationMin[0] = tmp1;
                        rotationMin[1] = tmp2;

                        link.rotationMin = new THREE.Vector3().fromArray(rotationMin);
                        link.rotationMax = new THREE.Vector3().fromArray(rotationMax);
                    }

                    param.links.push(link);
                }

                iks.push(param);

                // Save the reference even from bone data for efficiently
                // simulating PMX animation system
                bones[i].ik = param;
            }
        }

        // grants

        if (data.metadata.format === "pmx") {

            // bone index -> grant entry map
            const grantEntryMap: { [key: number]: GrantEntryItem } = {};

            for (let i = 0; i < data.metadata.boneCount; i++) {

                const boneData = (data as Pmx).bones[i];
                const grant = boneData.grant;

                if (grant === undefined) continue;

                const param = {
                    index: i,
                    parentIndex: grant.parentIndex,
                    ratio: grant.ratio,
                    isLocal: grant.isLocal,
                    affectRotation: grant.affectRotation,
                    affectPosition: grant.affectPosition,
                    transformationClass: boneData.transformationClass
                };

                grantEntryMap[i] = { parent: null, children: [], param: param, visited: false };

            }

            const rootEntry: GrantEntryItem = { parent: null, children: [], param: null, visited: false };

            // Build a tree representing grant hierarchy

            for (const boneIndex in grantEntryMap) {

                const grantEntry = grantEntryMap[boneIndex];

                // TODO: it makes type error i think it is human error
                const parentGrantEntry = grantEntryMap[(grantEntry as any).parentIndex] || rootEntry;
                if (grantEntryMap[grantEntry.param?.parentIndex ?? -1] !== undefined) {
                    console.warn("gramtEntryMap[grantEntry.param.parentIndex]", grantEntryMap[grantEntry.param!.parentIndex]);
                }
                //const parentGrantEntry = grantEntryMap[grantEntry.param.parentIndex] || rootEntry;

                grantEntry.parent = parentGrantEntry;
                parentGrantEntry.children.push(grantEntry);

            }

            // Sort grant parameters from parents to children because
            // grant uses parent's transform that parent's grant is already applied
            // so grant should be applied in order from parents to children

            // eslint-disable-next-line no-inner-declarations
            function traverse(entry: GrantEntryItem): void {
                if (entry.param) {
                    grants.push(entry.param);

                    // Save the reference even from bone data for efficiently
                    // simulating PMX animation system
                    bones[entry.param.index].grant = entry.param;
                }

                entry.visited = true;

                for (let i = 0, il = entry.children.length; i < il; i++) {
                    const child = entry.children[i];

                    // Cut off a loop if exists. (Is a grant loop invalid?)
                    if (!child.visited) traverse(child);
                }
            }

            traverse(rootEntry);
        }

        // morph

        function updateAttributes(attribute: THREE.Float32BufferAttribute, morph: Pmd["morphs"][0] | Pmx["morphs"][0], ratio: number | undefined): void {
            if (morph.type !== 1) throw new Error("updateAttributes: morph type must be 1(vertex morph).");

            for (let i = 0; i < morph.elementCount; i++) {
                const element = morph.elements[i];

                const index = data.metadata.format === "pmd"
                    ? data.morphs[0].elements[element.index].index
                    : element.index;

                (attribute.array as number[])[index * 3 + 0] += (element as VertexMorph).position[0] * ratio!;
                (attribute.array as number[])[index * 3 + 1] += (element as VertexMorph).position[1] * ratio!;
                (attribute.array as number[])[index * 3 + 2] += (element as VertexMorph).position[2] * ratio!;
            }
        }

        const morphNameSet = new Set<string>();

        for (let i = 0; i < data.metadata.morphCount; i++) {
            const morph = data.morphs[i];

            if (morphNameSet.has(morph.name)) continue;
            morphNameSet.add(morph.name);

            const params = { name: morph.name };

            const attribute = new THREE.Float32BufferAttribute(data.metadata.vertexCount * 3, 3);
            attribute.name = morph.name;

            for (let j = 0; j < data.metadata.vertexCount * 3; j++) {
                (attribute.array as number[])[j] = positions[j];
            }

            if (data.metadata.format === "pmd") {
                if (i !== 0) {
                    updateAttributes(attribute, morph, 1.0);
                }
            } else {

                if (morph.type === 0) { // group

                    for (let j = 0; j < morph.elementCount; j++) {

                        const morph2 = data.morphs[morph.elements[j].index];
                        const ratio = ((morph as Pmx["morphs"][0]).elements[j] as GroupMorph).ratio as number | undefined;

                        if (morph2.type === 1) {
                            updateAttributes(attribute, morph2, ratio);
                        } else {
                            // TODO: implement
                        }

                    }

                } else if (morph.type === 1) { // vertex
                    updateAttributes(attribute, morph, 1.0);
                } else if (morph.type === 2) { // bone

                    // TODO: implement

                } else if (morph.type === 3) { // uv

                    // TODO: implement

                } else if (morph.type === 4) { // additional uv1

                    // TODO: implement

                } else if (morph.type === 5) { // additional uv2

                    // TODO: implement

                } else if (morph.type === 6) { // additional uv3

                    // TODO: implement

                } else if (morph.type === 7) { // additional uv4

                    // TODO: implement

                } else if (morph.type === 8) { // material

                    // TODO: implement

                }
            }

            morphTargets.push(params);
            morphPositions.push(attribute);
        }

        // rigid bodies from rigidBodies field.
        for (let i = 0; i < data.metadata.rigidBodyCount; i++) {
            const rigidBody = data.rigidBodies[i];
            const params: typeof rigidBody = { ...rigidBody };

            /*
                 * RigidBody position parameter in PMX seems global position
                 * while the one in PMD seems offset from corresponding bone.
                 * So unify being offset.
                 */
            if (data.metadata.format === "pmx") {
                if (params.boneIndex !== -1) {

                    const bone = data.bones[params.boneIndex];
                    params.position[0] -= bone.position[0];
                    params.position[1] -= bone.position[1];
                    params.position[2] -= bone.position[2];
                }
            }

            rigidBodies.push(params);
        }

        // constraints from constraints field.

        for (let i = 0; i < data.metadata.constraintCount; i++) {
            const constraint = data.constraints[i];
            const params = { ...constraint };

            const bodyA = rigidBodies[params.rigidBodyIndex1];
            const bodyB = rigidBodies[params.rigidBodyIndex2];

            // Refer to http://www20.atpages.jp/katwat/wp/?p=4135
            if (bodyA.type !== 0 && bodyB.type === 2) {
                if (bodyA.boneIndex !== -1 && bodyB.boneIndex !== -1 && data.bones[bodyB.boneIndex].parentIndex === bodyA.boneIndex) {
                    bodyB.type = 1;
                }
            }

            constraints.push(params);
        }

        // build BufferGeometry.

        const geometry = new THREE.BufferGeometry() as MmdBufferGeomatry;

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
        geometry.setIndex(indices);

        for (let i = 0, il = groups.length; i < il; i++) {
            geometry.addGroup(groups[i].offset, groups[i].count, i);
        }

        geometry.bones = bones;
        if (0 < morphTargets.length) {
            geometry.morphTargets = morphTargets;
            geometry.morphAttributes.position = morphPositions;
            geometry.morphTargetsRelative = false;
        }

        (geometry.userData.MMD as MmdUserData) = {
            bones: bones,
            iks: iks,
            grants: grants,
            rigidBodies: rigidBodies,
            constraints: constraints,
            format: data.metadata.format
        };

        geometry.computeBoundingSphere();
        return geometry;
    }
}

export type MmdPropertyAnimationClipTrackData = { name: string; track: AnimationTrack<boolean>; }[];
export type MmdPropertyAnimationClip = AnimationClip<MmdPropertyAnimationClipTrackData>;
export type MmdPropertyAnimationClipInstance = AnimationClipInstance<MmdPropertyAnimationClipTrackData>;

export type MmdMorphAnimationClipTrackData = { name: string; track: AnimationTrack<number>; }[];
export type MmdMorphAnimationClip = AnimationClip<MmdMorphAnimationClipTrackData>;
export type MmdMorphAnimationClipInstance = AnimationClipInstance<MmdMorphAnimationClipTrackData>;

export type MmdAnimationSequenceContainerData = [
    RangedAnimation<MmdPropertyAnimationClip>,
    RangedAnimation<MmdMorphAnimationClip>
];
export type MmdAnimationSequence = AnimationSequence<MmdAnimationSequenceContainerData>;
export type MmdAnimationSequenceInstance = AnimationSequenceInstance<MmdAnimationSequenceContainerData>;

export class AnimationBuilder {
    private readonly _mmdLoader: MMDLoaderOverride;

    public constructor(mmdLoader: MMDLoaderOverride) {
        this._mmdLoader = mmdLoader;
    }

    public build(vmd: Vmd, mesh: THREE.SkinnedMesh): THREE.AnimationClip {
        return this.buildSkeletalAnimation(vmd, mesh);
    }

    public buildSkeletalAnimation(vmd: Vmd, mesh: THREE.SkinnedMesh): THREE.AnimationClip {
        const rigidBodies = (mesh.geometry.userData.MMD as MmdUserData).rigidBodies;
        const rigidBodyNameSet = new Set<string>();
        for (let i = 0, il = rigidBodies.length; i < il; ++i) {
            rigidBodyNameSet.add(rigidBodies[i].name);
        }

        //interpolation import references: https://github.com/AiMiDi/C4D_MMD_Tool/blob/main/source/Utility.h 302-318
        function pushInterpolation(array: number[], interpolation: number[], index: number): void {
            array.push(interpolation[index + 0] / 127); // x1
            array.push(interpolation[index + 8] / 127); // x2
            array.push(interpolation[index + 4] / 127); // y1
            array.push(interpolation[index + 12] / 127); // y2
        }

        const tracks = [];

        const motions: { [key: string]: Vmd["motions"] } = {};
        const bones = mesh.skeleton.bones;
        const boneNameDictionary: { [key: string]: boolean } = {};

        for (let i = 0, il = bones.length; i < il; ++i) {
            boneNameDictionary[bones[i].name] = true;
        }

        for (let i = 0; i < vmd.metadata.motionCount; ++i) {
            const motion = vmd.motions[i];
            const boneName = motion.boneName;

            if (boneNameDictionary[boneName] === undefined) continue;

            motions[boneName] = motions[boneName] || [];
            motions[boneName].push(motion);
        }

        const forceAllInterpolateToCubic = this._mmdLoader.forceAllInterpolateToCubic;

        for (const key in motions) {
            const array = motions[key];

            array.sort(function(a, b) {
                return a.frameNum - b.frameNum;
            });

            const times: number[] = [];
            const positions: number[] = [];
            const rotations: number[] = [];
            const pInterpolations: number[] = [];
            const rInterpolations: number[] = [];

            const basePosition = mesh.skeleton.getBoneByName(key)!.position.toArray();

            for (let i = 0, il = array.length; i < il; ++i) {

                const time = array[i].frameNum / 30;
                const position = array[i].position;
                const rotation = array[i].rotation;
                const interpolation = array[i].interpolation;

                times.push(time);

                for (let j = 0; j < 3; j++) positions.push(basePosition[j] + position[j]);
                for (let j = 0; j < 4; j++) rotations.push(rotation[j]);
                for (let j = 0; j < 3; j++) pushInterpolation(pInterpolations, interpolation, j * 16);

                pushInterpolation(rInterpolations, interpolation, 3 * 16);
            }

            const targetName = ".bones[" + key + "]";
            const boneHasRigidBody = rigidBodyNameSet.has(key);

            tracks.push(this.createTrack(targetName + ".position", THREE.VectorKeyframeTrack, times, positions, pInterpolations, !forceAllInterpolateToCubic && !boneHasRigidBody));
            tracks.push(this.createTrack(targetName + ".quaternion", THREE.QuaternionKeyframeTrack, times, rotations, rInterpolations, !forceAllInterpolateToCubic && !boneHasRigidBody));
        }

        return new THREE.AnimationClip("", -1, tracks);
    }

    public buildPropertyAnimation(vmd: Vmd): MmdPropertyAnimationClip {
        const properites = vmd.properties;

        const visibleTrack: AnimationKey<boolean>[] = [];
        const ikStateTracks = new Map<string, AnimationKey<boolean>[]>();

        properites.sort((a, b) => a.frameNum - b.frameNum);

        for (let i = 0; i < properites.length; i++) {
            const propertyFrame = properites[i];
            const frameNum = propertyFrame.frameNum;

            visibleTrack.push(new AnimationKey(frameNum, propertyFrame.visible, InterpolationKind.Step));

            const ikStates = propertyFrame.ikStates;
            for (let j = 0; j < ikStates.length; j++) {
                const ikState = ikStates[j];
                const ikName = ikState.name;

                let ikTrack = ikStateTracks.get(ikName);
                if (ikTrack === undefined) {
                    ikTrack = [];
                    ikStateTracks.set(ikName, ikTrack);
                }

                ikTrack.push(new AnimationKey(frameNum, ikState.enabled, InterpolationKind.Step));
            }
        }

        const tracks = [
            {
                name: "visible",
                track: AnimationTrack.createTrack(visibleTrack, EmptyBooleanInterpolator, 30)
            }
        ];

        for (const [ikName, ikTrack] of ikStateTracks) {
            tracks.push({
                name: ikName,
                track: AnimationTrack.createTrack(ikTrack, EmptyBooleanInterpolator, 30)
            });
        }

        return new AnimationClip(tracks, undefined, undefined, 30);
    }

    public buildMorphAnimation(vmd: Vmd): MmdMorphAnimationClip {
        const morphs = vmd.morphs;

        const morphTracks = new Map<string, AnimationKey<number>[]>();

        morphs.sort((a, b) => a.frameNum - b.frameNum);

        for (let i = 0; i < morphs.length; i++) {
            const morphFrame = morphs[i];
            const frameNum = morphFrame.frameNum;

            const morphName = morphFrame.morphName;

            let morphTrack = morphTracks.get(morphName);
            if (morphTrack === undefined) {
                morphTrack = [];
                morphTracks.set(morphName, morphTrack);
            }

            morphTrack.push(new AnimationKey(frameNum, morphFrame.weight, InterpolationKind.Linear));
        }

        const tracks: MmdMorphAnimationClipTrackData = [];

        for (const [morphName, morphTrack] of morphTracks) {
            tracks.push({
                name: morphName,
                track: AnimationTrack.createScalarTrack(morphTrack, 30)
            });
        }

        return new AnimationClip(tracks, undefined, undefined, 30);
    }

    public buildCameraAnimation(vmd: Vmd): THREE.AnimationClip {

        function pushVector3(array: number[], vec: THREE.Vector3): void {
            array.push(vec.x);
            array.push(vec.y);
            array.push(vec.z);
        }

        function pushQuaternion(array: number[], q: THREE.Quaternion): void {
            array.push(q.x);
            array.push(q.y);
            array.push(q.z);
            array.push(q.w);
        }

        function pushInterpolation(array: number[], interpolation: number[], index: number): void {
            array.push(interpolation[index * 4 + 0] / 127); // x1
            array.push(interpolation[index * 4 + 1] / 127); // x2
            array.push(interpolation[index * 4 + 2] / 127); // y1
            array.push(interpolation[index * 4 + 3] / 127); // y2
        }

        const cameras = vmd.cameras === undefined ? [] : vmd.cameras.slice();

        cameras.sort(function(a, b) {
            return a.frameNum - b.frameNum;
        });

        const times: number[] = [];
        const centers: number[] = [];
        const quaternions: number[] = [];
        const positions: number[] = [];
        const fovs: number[] = [];

        const cInterpolations: number[] = [];
        const qInterpolations: number[] = [];
        const pInterpolations: number[] = [];
        const fInterpolations: number[] = [];

        const quaternion = new THREE.Quaternion();
        // const euler = new THREE.Euler();
        const position = new THREE.Vector3();
        const center = new THREE.Vector3();

        for (let i = 0, il = cameras.length; i < il; ++i) {

            const motion = cameras[i];

            const time = motion.frameNum / 30;
            const pos = motion.position;
            const rot = motion.rotation;
            const distance = motion.distance;
            const fov = motion.fov;
            const interpolation = motion.interpolation;

            times.push(time);

            position.set(0, 0, -distance);
            center.set(pos[0], pos[1], pos[2]);

            // euler.set(- rot[0], - rot[1], - rot[2]);
            // quaternion.setFromEuler(euler);
            QuaternionUtils.rotationYawPitchRoll(-rot[1], -rot[0], -rot[2], quaternion);

            position.applyQuaternion(quaternion);
            position.add(center);

            pushVector3(centers, center);
            pushQuaternion(quaternions, quaternion);
            pushVector3(positions, position);

            fovs.push(fov);

            for (let j = 0; j < 3; j++) {

                pushInterpolation(cInterpolations, interpolation, j);

            }

            pushInterpolation(qInterpolations, interpolation, 3);

            // use the same parameter for x, y, z axis.
            for (let j = 0; j < 3; j++) {

                pushInterpolation(pInterpolations, interpolation, 4);

            }

            pushInterpolation(fInterpolations, interpolation, 5);

        }

        const tracks: THREE.KeyframeTrack[] = [];

        // I expect an object whose name 'target' exists under THREE.Camera
        tracks.push(this.createTrack("target.position", THREE.VectorKeyframeTrack, times, centers, cInterpolations, true));

        tracks.push(this.createTrack(".quaternion", THREE.QuaternionKeyframeTrack, times, quaternions, qInterpolations, true));
        tracks.push(this.createTrack(".position", THREE.VectorKeyframeTrack, times, positions, pInterpolations, true));
        tracks.push(this.createTrack(".fov", THREE.NumberKeyframeTrack, times, fovs, fInterpolations, true));

        return new THREE.AnimationClip("", -1, tracks);
    }

    private createTrack(
        node: string,
        typedKeyframeTrack: typeof THREE.KeyframeTrack,
        times: number[],
        values: number[],
        interpolations: number[],
        useStepInterpolation: boolean
    ): THREE.KeyframeTrack {
        /*
         * optimizes here not to let KeyframeTrackPrototype optimize
         * because KeyframeTrackPrototype optimizes times and values but
         * doesn't optimize interpolations.
         */
        if (times.length > 2) {
            times = times.slice();
            values = values.slice();
            interpolations = interpolations.slice();

            const stride = values.length / times.length;
            const interpolateStride = interpolations.length / times.length;

            let index = 1;

            for (let aheadIndex = 2, endIndex = times.length; aheadIndex < endIndex; aheadIndex++) {
                for (let i = 0; i < stride; ++i) {
                    if (values[index * stride + i] !== values[(index - 1) * stride + i] ||
                        values[index * stride + i] !== values[aheadIndex * stride + i]) {

                        index++;
                        break;
                    }
                }

                if (aheadIndex > index) {
                    times[index] = times[aheadIndex];

                    for (let i = 0; i < stride; ++i) {
                        values[index * stride + i] = values[aheadIndex * stride + i];
                    }

                    for (let i = 0; i < interpolateStride; ++i) {
                        interpolations[index * interpolateStride + i] = interpolations[aheadIndex * interpolateStride + i];
                    }
                }
            }

            times.length = index + 1;
            values.length = (index + 1) * stride;
            interpolations.length = (index + 1) * interpolateStride;
        }

        const track = new typedKeyframeTrack(node, times, values);

        (track as any).createInterpolant = function interpolantFactoryMethodCubicBezier(
            result: Float32Array | null
        ): CubicBezierStepInterpolation | CubicBezierInterpolation {
            const interpolationCtor = useStepInterpolation ? CubicBezierStepInterpolation : CubicBezierInterpolation;
            return new interpolationCtor(this.times, this.values, this.getValueSize(), result, new Float32Array(interpolations));
        };

        return track;
    }
}

class CubicBezierInterpolation extends THREE.Interpolant {
    public interpolationParams: Float32Array;

    public constructor(
        parameterPositions: Float32Array | null,
        sampleValues: Float32Array | null,
        sampleSize: number,
        resultBuffer: Float32Array | null,
        params: Float32Array
    ) {
        super(parameterPositions, sampleValues, sampleSize, resultBuffer);

        this.interpolationParams = params;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public interpolate_(i1: number, t0: number, t: number, t1: number): number[] {
        const result = this.resultBuffer;
        const values = this.sampleValues;
        const stride = this.valueSize;
        const params = this.interpolationParams;

        const offset1 = i1 * stride;
        const offset0 = offset1 - stride;

        const weight1 = (t - t0) / (t1 - t0);

        if (stride === 4) { // Quaternion
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            THREE.Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
        } else if (stride === 3) { // Vector3
            for (let i = 0; i !== stride; ++i) {
                const x1 = params[i1 * 12 + i * 4 + 0];
                const x2 = params[i1 * 12 + i * 4 + 1];
                const y1 = params[i1 * 12 + i * 4 + 2];
                const y2 = params[i1 * 12 + i * 4 + 3];

                const ratio = this._calculate(x1, x2, y1, y2, weight1);

                result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
            }
        } else { // Number
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
        }

        return result;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _calculate(x1: number, x2: number, y1: number, y2: number, x: number): number {
        let c = 0.5;
        let t = c;
        let s = 1.0 - t;
        const loop = 15;
        const eps = 1e-5;
        const math = Math;

        let sst3: number, stt3: number, ttt: number;

        for (let i = 0; i < loop; ++i) {
            sst3 = 3.0 * s * s * t;
            stt3 = 3.0 * s * t * t;
            ttt = t * t * t;

            const ft = (sst3 * x1) + (stt3 * x2) + (ttt) - x;

            if (math.abs(ft) < eps) break;

            c /= 2.0;

            t += (ft < 0) ? c : -c;
            s = 1.0 - t;
        }
        return (sst3! * y1) + (stt3! * y2) + ttt!;
    }
}

class CubicBezierStepInterpolation extends THREE.Interpolant {
    public interpolationParams: Float32Array;

    public constructor(
        parameterPositions: Float32Array | null,
        sampleValues: Float32Array | null,
        sampleSize: number,
        resultBuffer: Float32Array | null,
        params: Float32Array
    ) {
        super(parameterPositions, sampleValues, sampleSize, resultBuffer);

        this.interpolationParams = params;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public interpolate_(i1: number, t0: number, t: number, t1: number): number[] {
        const result = this.resultBuffer;
        const values = this.sampleValues;
        const stride = this.valueSize;
        const params = this.interpolationParams;

        const offset1 = i1 * stride;
        const offset0 = offset1 - stride;

        // No interpolation if next key frame is in one frame in 30fps.
        // This is from MMD animation spec.
        // '1.5' is for precision loss. times are Float32 in Three.js Animation system.
        const weight1 = ((t1 - t0) < 1 / 30 * 1.5) ? 0.0 : (t - t0) / (t1 - t0);

        if (stride === 4) { // Quaternion
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            THREE.Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
        } else if (stride === 3) { // Vector3
            for (let i = 0; i !== stride; ++i) {
                const x1 = params[i1 * 12 + i * 4 + 0];
                const x2 = params[i1 * 12 + i * 4 + 1];
                const y1 = params[i1 * 12 + i * 4 + 2];
                const y2 = params[i1 * 12 + i * 4 + 3];

                const ratio = this._calculate(x1, x2, y1, y2, weight1);

                result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
            }
        } else { // Number
            const x1 = params[i1 * 4 + 0];
            const x2 = params[i1 * 4 + 1];
            const y1 = params[i1 * 4 + 2];
            const y2 = params[i1 * 4 + 3];

            const ratio = this._calculate(x1, x2, y1, y2, weight1);

            result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
        }

        return result;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _calculate(x1: number, x2: number, y1: number, y2: number, x: number): number {
        let c = 0.5;
        let t = c;
        let s = 1.0 - t;
        const loop = 15;
        const eps = 1e-5;
        const math = Math;

        let sst3: number, stt3: number, ttt: number;

        for (let i = 0; i < loop; ++i) {
            sst3 = 3.0 * s * s * t;
            stt3 = 3.0 * s * t * t;
            ttt = t * t * t;

            const ft = (sst3 * x1) + (stt3 * x2) + (ttt) - x;

            if (math.abs(ft) < eps) break;

            c /= 2.0;

            t += (ft < 0) ? c : -c;
            s = 1.0 - t;
        }
        return (sst3! * y1) + (stt3! * y2) + ttt!;
    }
}
