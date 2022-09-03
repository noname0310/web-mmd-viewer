/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import ReactDOM from "react-dom/client";
import styled from "styled-components";
import { Component } from "the-world-engine";

import { Inspector } from "./Inspector";
import { ObjectListView } from "./ObjectListView";

const EditorRightPanelDiv = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background-color: #222;
    color: #fff;

    display: flex;
    flex-direction: column;

    padding-top: 10px;
    box-sizing: border-box;
`;

function EditorMain(): JSX.Element {
    return (
        <EditorRightPanelDiv>
            <ObjectListView height="calc(100% - 300px)" />
            <Inspector height="300px" />
        </EditorRightPanelDiv>
    );
}

export class EditorUi extends Component {
    private _reactDomRoot: ReactDOM.Root|null = null;
    private _reactRootDiv: HTMLDivElement|null = null;

    public awake(): void {
        const reactRoot = this._reactRootDiv = document.createElement("div");
        reactRoot.style.position = "absolute";
        reactRoot.style.width = "100%";
        reactRoot.style.height = "calc(100% - 30px)";
        reactRoot.style.visibility = "hidden";
        reactRoot.style.fontFamily = "sans-serif";

        this.engine.domElement.appendChild(reactRoot);
        const reactDom = this._reactDomRoot = ReactDOM.createRoot(reactRoot);

        reactDom.render(
            <React.StrictMode>
                <EditorMain />
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
    }
}
