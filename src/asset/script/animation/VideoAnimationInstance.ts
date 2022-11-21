export class VideoAnimationInstance {
    private readonly _htmlVideo: HTMLVideoElement;
    private _fps = 60;

    public constructor(htmlVideo: HTMLVideoElement) {
        this._htmlVideo = htmlVideo;
    }

    public get fps(): number {
        return this._fps;
    }

    public set fps(value: number) {
        this._fps = value;
    }

    public process(frameTime: number, playbackRate: number): void {
        const elapsedTime = frameTime / this._fps;
        const video = this._htmlVideo;

        if (Math.abs(video!.currentTime - elapsedTime) > 1) {
            video!.currentTime = elapsedTime;
        }

        if (Math.abs(video!.currentTime - elapsedTime) > 0.1) {
            video!.playbackRate = playbackRate + (video!.currentTime < elapsedTime ? 0.1 : -0.1);
        } else {
            video!.playbackRate = playbackRate;
        }
    }

    public get htmlVideo(): HTMLVideoElement {
        return this._htmlVideo;
    }
}
