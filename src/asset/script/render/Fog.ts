import { Component } from "the-world-engine";
import * as THREE from "three/src/Three";

export class Fog extends Component {
    private static _instance: Fog|null = null;
    private _fog: THREE.Fog|null = null;
    private _color: THREE.ColorRepresentation = 0x000000;
    private _near = 10;
    private _far = 20;

    public start(): void {
        if (Fog._instance) {
            throw new Error("Fog can only be instantiated once.");
        }
        Fog._instance = this;

        this._fog = new THREE.Fog(this._color, this._near, this._far);
        this.engine.scene.unsafeGetThreeScene().fog = this._fog;
    }

    public get color(): THREE.ColorRepresentation {
        return this._color;
    }

    public set color(value: THREE.ColorRepresentation) {
        this._color = value;
        if (this._fog) {
            this._fog.color = new THREE.Color(value);
        }
    }

    public get near(): number {
        return this._near;
    }

    public set near(value: number) {
        this._near = value;
        if (this._fog) {
            this._fog.near = value;
        }
    }

    public get far(): number {
        return this._far;
    }

    public set far(value: number) {
        this._far = value;
        if (this._fog) {
            this._fog.far = value;
        }
    }
}
