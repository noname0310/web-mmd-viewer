/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";

import { MmdModel } from "../MmdModel";
import { useEditorController } from "./EditorControllerContext";
import { FileDropArea, FileDropAreaProps } from "./FileDropArea";
import { ImportModelDialog } from "./ImportModelDialog";
import { PanelItem, PanelWidthHeightProps } from "./PanelItem";

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
    name: string;
    model: MmdModel;
}

function ObjectListItem(props: ObjectListItemProps): JSX.Element {
    return (
        <ListItemDiv>
            {props.name}
        </ListItemDiv>
    );
}

const ListAddItemDiv = styled(ListItemDiv)`
    background-color: #68689e;

    &:hover {
        background-color: #8484ad;
    }

    &:active {
        background-color: #83839c;
    }
`;

function ObjectListAddItem(props: Omit<FileDropAreaProps, "width"|"height">): JSX.Element {
    return (
        <ListAddItemDiv>
            <FileDropArea {...props} width="100%" height="100%" />
        </ListAddItemDiv>
    );
}

const ListContainerDiv = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    padding-top: 0;
    overflow: auto;
    user-select: none;
    height: 100%;
    
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`;

export interface ObjectListViewProps extends PanelWidthHeightProps {
    empty?: never;
}

export function ObjectListView(props: ObjectListViewProps): JSX.Element {
    const [models, setModels] = React.useState<{ ref: readonly MmdModel[] }>({ ref: [] });
    const [showImportModelDialog, setShowImportModelDialog] = React.useState(false);
    const [files, setFiles] = React.useState<readonly File[]>([]);
    const [pmxFiles, setPmxFiles] = React.useState<readonly File[]>([]);

    const controller = useEditorController();

    const onModelsUpdatedCallback = React.useCallback((models: readonly MmdModel[]) => {
        setModels({ ref: models });
    }, []);

    React.useEffect(() => {
        controller.onModelsUpdated.addListener(onModelsUpdatedCallback);
        return () => {
            controller.onModelsUpdated.removeListener(onModelsUpdatedCallback);
        };
    }, [controller, onModelsUpdatedCallback]);

    const onImportCanceledCallback = React.useCallback(() => {
        setShowImportModelDialog(false);
    }, []);

    const onImportSelectedCallback = React.useCallback((file: File) => {
        controller.spawnModel(file, files);
        setShowImportModelDialog(false);
    }, [controller, files]);

    const onFilesCallback = React.useCallback((files: readonly File[]) => {
        const pmxFiles = files.filter((file) => {
            return file.name.endsWith(".pmx");
        });

        if (pmxFiles.length === 0) {
            alert("No pmx files found.");
            return;
        }

        if (pmxFiles.length === 1) {
            controller.spawnModel(pmxFiles[0], files);
        } else {
            setFiles(files);
            setPmxFiles(pmxFiles);

            setShowImportModelDialog(true);
        }
    }, [controller]);

    return (
        <PanelItem title="Objects" width={props.width} height={props.height}>
            <ListContainerDiv>
                {models.ref.map((model) => (
                    <ObjectListItem key={model.instanceId} name={model.gameObject.name} model={model} />
                ))}
                <ObjectListAddItem onFiles={onFilesCallback} />

                {showImportModelDialog && (
                    <ImportModelDialog files={pmxFiles} onCanceled={onImportCanceledCallback} onSelected={onImportSelectedCallback} />
                )}
            </ListContainerDiv>
        </PanelItem>
    );
}
