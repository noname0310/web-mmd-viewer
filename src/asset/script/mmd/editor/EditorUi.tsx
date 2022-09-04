/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import ReactDOM from "react-dom/client";
import { Component } from "the-world-engine";

import { EditorController } from "./EditorController";
import { EditorControllerProvider } from "./EditorControllerContext";
import { EditorRightPanel } from "./EditorRightPanel";

function EditorMain(): JSX.Element {
    return (
        <EditorRightPanel/>
    );
}

export class EditorUi extends Component {
    public override readonly requiredComponents = [EditorController];

    private _reactDomRoot: ReactDOM.Root|null = null;
    private _reactRootDiv: HTMLDivElement|null = null;

    public awake(): void {
        const editorController = this.gameObject.getComponent(EditorController)!;

        const reactRoot = this._reactRootDiv = document.createElement("div");
        reactRoot.id = "react-root";
        reactRoot.style.position = "absolute";
        reactRoot.style.width = "100%";
        reactRoot.style.height = "calc(100% - 30px)";
        reactRoot.style.overflow = "hidden";
        reactRoot.style.visibility = "hidden";
        reactRoot.style.fontFamily = "sans-serif";
        reactRoot.style.pointerEvents = "none";

        this.engine.domElement.appendChild(reactRoot);
        const reactDom = this._reactDomRoot = ReactDOM.createRoot(reactRoot);

        reactDom.render(
            <React.StrictMode>
                <EditorControllerProvider controller={editorController}>
                    <EditorMain />
                </EditorControllerProvider>
            </React.StrictMode>
        );
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
        if (this._reactRootDiv) {
            this._reactRootDiv.remove();
            this._reactRootDiv = null;
        }
    }
}
