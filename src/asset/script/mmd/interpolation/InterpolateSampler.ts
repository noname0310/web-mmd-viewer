import { Component, CssHtmlElementRenderer, GameObject, ReadonlyVector3 } from "the-world-engine";
import { Vector3 } from "three/src/Three";

export class InterpolateSampler extends Component {
    private interpolatorFunc: (x: number) => number = (x: number) => x;
    public step = 0.001;
    public unitScale = 10;
    public sampleColor = "red";
    private _readyToSpawn = false;
    private readonly _spawnedSamples: GameObject[] = [];

    public start(): void {
        this._readyToSpawn = true;

        const spawnPosition = new Vector3();

        const spawnedSamples = this._spawnedSamples;
        for (let i = 0; i < spawnedSamples.length; i++) {
            spawnedSamples[i].destroy();
        }
        this._spawnedSamples.length = 0;

        for (let i = 0; i < 1; i += this.step) {
            spawnPosition.set(i * this.unitScale, this.interpolatorFunc(i) * this.unitScale, 0);
            this.spawnSample(spawnPosition);
        }
    }

    private spawnSample(worldPosition: ReadonlyVector3): void {
        const gameObject = this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("trace", worldPosition)
                .withComponent(CssHtmlElementRenderer, c => {
                    const div = document.createElement("div");
                    div.style.backgroundColor = this.sampleColor;
                    c.element = div;
                    c.elementWidth = 0.1;
                    c.elementHeight = 0.1;
                })
        );

        this._spawnedSamples.push(gameObject);
    }

    public get interpolator(): (x: number) => number {
        return this.interpolatorFunc;
    }

    public set interpolator(value: (x: number) => number) {
        this.interpolatorFunc = value;

        if (this._readyToSpawn) this.start();
    }
}
