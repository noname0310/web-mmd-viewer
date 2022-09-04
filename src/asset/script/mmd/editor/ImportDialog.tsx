/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";

import { Portal } from "./Portal";

const ListItemDiv = styled.div`
    width: auto;
    padding: 5px 10px;
    box-sizing: border-box;
    margin-bottom: 3px;
    background-color: #555;
    overflow-x: auto;
    white-space: nowrap;

    ::-webkit-scrollbar {
        display: none;
    }

    &:hover {
        background-color: #666;
    }

    &:active {
        background-color: #777;
    }
`;

interface ObjectListItemProps {
    file: File;
    onClick: (file: File) => void;
}

function ObjectListItem(props: ObjectListItemProps): JSX.Element {
    const onClick = React.useCallback(() => {
        props.onClick(props.file);
    }, [props.file, props.onClick]);

    return (
        <ListItemDiv onClick={onClick}>
            {props.file.name}
        </ListItemDiv>
    );
}

const WrapperDiv = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    pointer-events: auto;
`;

const DialogDiv = styled.div`
    width: 400px;
    height: 300px;
    background-color: #333;
    color: #fff;

    display: flex;
    flex-direction: column;
    align-items: center;

    user-select: none;
`;

const TitleDiv = styled.div`
    width: 100%;
    height: 50px;
    background-color: #444;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ListContainerWrapperDiv = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: calc(100% - 50px);
    box-sizing: border-box;
`;

const ListContainerDiv = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    box-sizing: border-box;
    overflow: auto;
    width: 100%;
    
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`;

export interface ImportModelDialogProps {
    title: string;
    files: readonly File[];
    onCanceled: () => void;
    onSelected: (file: File) => void;
}

export function ImportDialog(props: ImportModelDialogProps): JSX.Element {
    const onBackgroundClickCallback = React.useCallback(() => {
        props.onCanceled();
    }, [props.onCanceled]);

    const onDialogClickCallback = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    }, []);

    const onFileClickCallback = React.useCallback((file: File) => {
        props.onSelected(file);
    }, [props.onSelected]);

    return (
        <Portal elementId="react-root">
            <WrapperDiv onClick={onBackgroundClickCallback}>
                <DialogDiv onClick={onDialogClickCallback}>
                    <TitleDiv>{props.title}</TitleDiv>
                    <ListContainerWrapperDiv>
                        <ListContainerDiv>
                            {props.files.map((file) => (
                                <ObjectListItem key={file.name} file={file} onClick={onFileClickCallback} />
                            ))}
                        </ListContainerDiv>
                    </ListContainerWrapperDiv>
                </DialogDiv>
            </WrapperDiv>
        </Portal>
    );
}
