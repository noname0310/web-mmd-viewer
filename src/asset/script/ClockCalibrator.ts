import { IEventContainer } from "the-world-engine";
import { IAnimationClock } from "tw-engine-498tokio/dist/asset/script/IAnimationClock";

export class ClockCalibrator implements IAnimationClock {
    private readonly _animationClock: IAnimationClock;

    public constructor(animationClock: IAnimationClock) {
        this._animationClock = animationClock;
    }

    public get onPlayed(): IEventContainer<() => void> {
        return this._animationClock.onPlayed;
    }

    public get onPaused(): IEventContainer<() => void> {
        return this._animationClock.onPaused;
    }

    public get onStopped(): IEventContainer<() => void> {
        return this._animationClock.onStopped;
    }

    public get onJumped(): IEventContainer<(time: number) => void> {
        return this._animationClock.onJumped;
    }

    public play(): void {
        this._animationClock.play();
    }

    public pause(): void {
        this._animationClock.pause();
    }

    public stop(): void {
        this._animationClock.stop();
    }

    public setPosition(position: number): void {
        this._animationClock.setPosition(position);
    }

    private _lastCurrentTime = 0;
    private _lastNow = 0;
    
    public get currentTime(): number {
        if (this._lastCurrentTime !== this._animationClock.currentTime) {
            this._lastCurrentTime = this._animationClock.currentTime;
            this._lastNow = performance.now() / 1000;
            return this._animationClock.currentTime;
        } else {
            const performanceNow = performance.now() / 1000;
            const performanceDelta = performanceNow - this._lastNow;
            this._lastNow = performanceNow;
            if (1000 < performanceDelta) {
                return this._lastCurrentTime;
            } else {
                return this._lastCurrentTime + performanceDelta;
            }
        }
    }    
}
