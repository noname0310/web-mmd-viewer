import { Component } from "the-world-engine";

interface IDisposable {
    dispose(): void;
}

export class GlobalAssetManager extends Component {    
    public readonly assets: Map<string, IDisposable> = new Map();

    public addAsset(name: string, asset: IDisposable): void {
        this.assets.set(name, asset);
    }

    public onDestroy(): void {
        this.assets.forEach((asset) => asset.dispose());
    }
}
