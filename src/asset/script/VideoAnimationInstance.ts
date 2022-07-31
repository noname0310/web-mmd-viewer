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

    public process(frameTime: number): void {
        const elapsedTime = frameTime / this._fps;
        const video = this._htmlVideo;

        if (Math.abs(video!.currentTime - elapsedTime) > 10) {
            video!.currentTime = elapsedTime;
        }
        
        if (Math.abs(video!.currentTime - elapsedTime) > 0.1) {
            video!.playbackRate = 1 + (video!.currentTime < elapsedTime ? 0.1 : -0.1);
        }
    }

    public get htmlVideo(): HTMLVideoElement {
        return this._htmlVideo;
    }
}
