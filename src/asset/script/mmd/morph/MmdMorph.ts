import { BoneMorph, GroupMorph, MaterialMorph, UvMorph, VertexMorph } from "@noname0310/mmd-parser";

export enum MorphType {
    Group = 0,
    Vertex = 1,
    Bone = 2,
    Uv = 3,
    Uv1 = 4,
    Uv2 = 5,
    Uv3 = 6,
    Uv4 = 7,
    Material = 8,
}

type InferedMorphType<T extends MorphType> =
    T extends MorphType.Group ? GroupMorph :
    T extends MorphType.Vertex ? VertexMorph :
    T extends MorphType.Bone ? BoneMorph :
    T extends MorphType.Uv ? UvMorph :
    T extends MorphType.Uv1 ? UvMorph :
    T extends MorphType.Uv2 ? UvMorph :
    T extends MorphType.Uv3 ? UvMorph :
    T extends MorphType.Uv4 ? UvMorph :
    T extends MorphType.Material ? MaterialMorph :
    GroupMorph | VertexMorph | BoneMorph | UvMorph | MaterialMorph;

export class MmdMorph<T extends MorphType = MorphType> {
    public readonly name: string;
    public readonly type: T;
    public readonly elements: InferedMorphType<T>[];

    public constructor(name: string, type: T, elements: InferedMorphType<T>[]) {
        this.name = name;
        this.type = type;
        this.elements = elements;
    }
}
