import { ExtendedShaderMaterial } from "./ExtendedShaderMaterial";

export class WrappedShaderMaterial extends ExtendedShaderMaterial {
    public modifiedDefines: { [key: string]: any };
    public modifiedUniforms: { [key: string]: any };

    public constructor(...args: any[]) {
        super(...args);
        this.modifiedDefines = {};
        this.modifiedUniforms = {};
    }

    // TODO: do the same for uniforms
    public setDefine(name: string, value: any): void {
        const defines = this.defines;
        const modifiedDefines = this.modifiedDefines;

        const isDeleted = value === null || value === undefined;
        if (isDeleted) {
            if (name in defines) {
                if (!(name in modifiedDefines)) {
                    modifiedDefines[name] = defines[name];
                }
                delete defines[name];
            }
        } else if (defines[name] !== value) {
            if (!(name in modifiedDefines)) {
                if (name in defines) {
                    modifiedDefines[name] = defines[name];
                } else {
                    modifiedDefines[name] = undefined;
                }
            }
            defines[name] = value;
        }
    }

    public setTextureUniform(name: string, value: any): void {
        const uniforms = this.uniforms;
        const modifiedUniforms = this.modifiedUniforms;

        if (!(name in modifiedUniforms)) {
            modifiedUniforms[name] = uniforms[name].value;
        }
        uniforms[name].value = value;
    }

    public finalize(): void {
        const modifiedDefines = this.modifiedDefines;
        const defines = this.defines;

        for (const key in modifiedDefines) {

            if (modifiedDefines[key] === undefined) {
                if (key in defines) {
                    this.needsUpdate = true;
                }
            } else {
                if (defines[key] !== modifiedDefines[key]) {
                    this.needsUpdate = true;
                }
            }

            delete modifiedDefines[key];
        }

        const modifiedUniforms = this.modifiedUniforms;
        const uniforms = this.uniforms;
        for (const key in modifiedUniforms) {
            if (modifiedUniforms[key] !== uniforms[key].value) {
                this.needsUpdate = true;
            }
            delete modifiedUniforms[key];
        }
    }
}
