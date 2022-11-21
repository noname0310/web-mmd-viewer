import { Camera, Component } from "the-world-engine";

export class UiController extends Component {
    public orbitCamera: Camera|null = null;
    private _switchCameraButton: HTMLButtonElement|null = null;
    private _fullscreenButton: HTMLButtonElement|null = null;

    private _ready = false;

    public onEnable(): void {
        this._ready = true;

        this._switchCameraButton?.addEventListener("click", this.onSwitchCameraButtonClick);
        this._fullscreenButton?.addEventListener("click", this.onFullscreenButtonClick);
        document.addEventListener("fullscreenchange", this.onFullscreenChange);

        if (this.orbitCamera) {
            this.orbitCamera.gameObject.activeSelf = this.orbitCamera.priority !== -1;
        }
    }

    public onDisable(): void {
        this._ready = true;

        this._switchCameraButton?.removeEventListener("click", this.onSwitchCameraButtonClick);
        this._fullscreenButton?.removeEventListener("click", this.onFullscreenButtonClick);
        document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    }

    private readonly onSwitchCameraButtonClick = (): void => {
        if (this.orbitCamera) {
            if (this.orbitCamera.priority === -1) {
                this.orbitCamera.priority = 1;
                this.orbitCamera.gameObject.activeSelf = true;
            } else {
                this.orbitCamera.priority = -1;
                this.orbitCamera.gameObject.activeSelf = false;
            }
        }
    };

    private readonly onFullscreenButtonClick = (): void => {
        if (this._fullscreenButton) {
            if (this._fullscreenButton.innerText === "fullscreen") {
                document.body.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    };

    private readonly onFullscreenChange = (): void => {
        if (this._fullscreenButton) {
            this._fullscreenButton.innerText = this._fullscreenButton.innerText === "fullscreen" ? "exit" : "fullscreen";
        }
    };

    public get switchCameraButton(): HTMLButtonElement|null {
        return this._switchCameraButton;
    }

    public set switchCameraButton(value: HTMLButtonElement|null) {
        this._switchCameraButton = value;

        if (value && this._ready) {
            value.addEventListener("click", this.onSwitchCameraButtonClick);
        }
    }

    public get fullscreenButton(): HTMLButtonElement|null {
        return this._fullscreenButton;
    }

    public set fullscreenButton(value: HTMLButtonElement|null) {
        this._fullscreenButton = value;

        if (value && this._ready) {
            value.addEventListener("click", this.onFullscreenButtonClick);
        }
    }
}
