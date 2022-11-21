import { Component, CssHtmlElementRenderer, GameObject, ReadonlyVector3 } from "the-world-engine";
import { Vector2, Vector3 } from "three/src/Three";

export class ManualSampler extends Component {
    private _samples: Vector2[] = [];
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

        for (let i = 0; i < this._samples.length; i++) {
            spawnPosition.set(this._samples[i].x * this.unitScale, this._samples[i].y * this.unitScale, 0);
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

    public get samples(): readonly Vector2[] {
        return this._samples;
    }

    public set samples(value: readonly Vector2[]) {
        this._samples.length = 0;
        for (let i = 0; i < value.length; i++) {
            this._samples.push(value[i]);
        }

        if (this._readyToSpawn) this.start();
    }
}
