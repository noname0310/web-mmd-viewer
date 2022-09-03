/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";

import { EditorController } from "./EditorController";

const EditorControllerContext = React.createContext<EditorController|null>(null);

interface EditorControllerProviderProps {
    children: React.ReactNode|React.ReactNode[];
    controller: EditorController;
}

export function EditorControllerProvider(props: EditorControllerProviderProps): JSX.Element {
    return (
        <EditorControllerContext.Provider value={props.controller}>
            {props.children}
        </EditorControllerContext.Provider>
    );
}

export function useEditorController(): EditorController {
    const controller = React.useContext(EditorControllerContext);
    if (!controller) throw new Error("EditorControllerContext is null");
    if (!controller.exists) throw new Error("EditorController is destroyed");
    return controller;
}
