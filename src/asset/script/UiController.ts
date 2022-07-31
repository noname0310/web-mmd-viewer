import { Camera, Component } from "the-world-engine";

export class UiController extends Component {
    public orbitCamera: Camera|null = null;
    private _switchCameraButton: HTMLButtonElement|null = null;

    public onEnable(): void {
        this._switchCameraButton?.addEventListener("click", this.onSwitchCameraButtonClick);
    }

    public onDisable(): void {
        this._switchCameraButton?.removeEventListener("click", this.onSwitchCameraButtonClick);
    }

    private readonly onSwitchCameraButtonClick = (): void => {
        if (this.orbitCamera) {
            this.orbitCamera.priority = this.orbitCamera.priority === -1 ? 1 : -1;
        }
    };

    public get switchCameraButton(): HTMLButtonElement|null {
        return this._switchCameraButton;
    }

    public set switchCameraButton(value: HTMLButtonElement|null) {
        this._switchCameraButton = value;

        if (value) {
            value.addEventListener("click", this.onSwitchCameraButtonClick);
        }
    }
}
