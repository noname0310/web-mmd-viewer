/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";

import { MmdCamera } from "../MmdCamera";
import { MmdModel } from "../MmdModel";
import { Inspector } from "./Inspector";
import { ObjectListView } from "./ObjectListView";

interface PanelHiddenProps {
    hidden: boolean;
}

const EditorWrapperDiv = styled.div<PanelHiddenProps>`
    position: absolute;
    top: 0;
    right: ${(props): string => props.hidden ? "-300px" : "0"};
    width: 300px;
    height: 90%;
    background-color: #222;
    color: #fff;

    display: flex;
    flex-direction: column;

    padding-top: 10px;
    padding-bottom: 10px;

    transition: right 0.5s;

    pointer-events: auto;
`;

const ToggleButtonDiv = styled.div`
    position: absolute;
    top: 0;
    right: 300px;
    width: 20px;
    height: 20px;

    background-color: #222;
    text-align: center;
    user-select: none;
`;

const EditorRightPanelDiv = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

export function EditorRightPanel(): JSX.Element {
    const [isHidden, setIsHidden] = React.useState(false);
    const [selectedModel, setSelectedModel] = React.useState<MmdModel|MmdCamera|null>(null);
    
    const toggleButtonOnClickCallback = React.useCallback((): void => {
        setIsHidden(!isHidden);
    }, [isHidden]);

    const onModelSelectedCallback = React.useCallback((target: MmdModel|MmdCamera|null): void => {
        setSelectedModel(target);
    }, []);

    return (
        <EditorWrapperDiv hidden={isHidden}>
            <ToggleButtonDiv onClick={toggleButtonOnClickCallback}>
                {isHidden ? "<" : ">"}
            </ToggleButtonDiv>
            <EditorRightPanelDiv>
                <ObjectListView height="calc(100% - 400px - 10px)" onTargetSelected={onModelSelectedCallback} />
                <Inspector height="400px" target={selectedModel} />
            </EditorRightPanelDiv>
        </EditorWrapperDiv>
    );
}
