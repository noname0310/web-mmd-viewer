import { Component, CoroutineIterator, CssSpriteRenderer, WaitForSeconds } from "the-world-engine";

export class CssImageTrace extends Component {
    public iterations = 1000;
    public delay = 0.1;
    
    public onEnable(): void {
        this.startCoroutine(this.spawnTraces());
    }

    private spawnTrace(): void {
        this.engine.scene.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("trace", this.transform.position)
                .withComponent(CssSpriteRenderer)
        );
    }

    private *spawnTraces(): CoroutineIterator {
        for (let i = 0; i < this.iterations; i++) {
            this.spawnTrace();
            yield new WaitForSeconds(this.delay);
        }
    }
}
