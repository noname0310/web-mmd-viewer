import React from "react";
import ReactDOM from "react-dom/client";
import { Component } from "the-world-engine";
import { EditorFileDrop } from "./EditorFileDrop";

export class EditorUi extends Component {
    private _reactDomRoot: ReactDOM.Root|null = null;
    private _reactRootDiv: HTMLDivElement|null = null;

    public awake(): void {
        const reactRoot = this._reactRootDiv = document.createElement("div");
        reactRoot.style.position = "absolute";
        reactRoot.style.width = "100%";
        reactRoot.style.height = "calc(100% - 30px)";
        reactRoot.style.visibility = "hidden";

        this.engine.domElement.appendChild(reactRoot);
        const reactDom = this._reactDomRoot = ReactDOM.createRoot(reactRoot);

        reactDom.render(
            <React.StrictMode>
                <EditorFileDrop/>
            </React.StrictMode>
        )
    }

    public onEnable(): void {
        this._reactRootDiv!.style.visibility = "visible";
    }

    public onDisable(): void {
        this._reactRootDiv!.style.visibility = "hidden";
    }

    public onDestroy(): void {
        if (this._reactDomRoot) {
            this._reactDomRoot.unmount();
            this._reactDomRoot = null;
        }
    }
}
