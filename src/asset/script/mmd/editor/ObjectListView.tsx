/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";

import { MmdCamera } from "../MmdCamera";
import { MmdModel } from "../MmdModel";
import { useEditorController } from "./EditorControllerContext";
import { FileDropArea, FileDropAreaProps } from "./FileDropArea";
import { ImportDialog } from "./ImportDialog";
import { PanelItem, PanelWidthHeightProps } from "./PanelItem";

interface ListItemSelectedProps {
    selected?: boolean;
}

const ListItemDiv = styled.div<ListItemSelectedProps>`
    width: auto;
    min-height: 32px;
    padding: 5px 10px;
    box-sizing: border-box;
    margin-bottom: 3px;
    background-color: ${(props): string => props.selected ? "#585" : "#555" };
    overflow-x: auto;
    white-space: nowrap;
    
    ::-webkit-scrollbar {
        display: none;
    }

    &:hover {
        background-color: ${(props): string => props.selected ? "#585" : "#666" };
    }

    &:active {
        background-color: ${(props): string => props.selected ? "#585" : "#777" };
    }
`;

interface ObjectListItemProps extends ListItemSelectedProps {
    name: string;
    model: MmdModel|MmdCamera;
    onClick: (model: MmdModel|MmdCamera) => void;
}

function ObjectListItem(props: ObjectListItemProps): JSX.Element {
    const onClickCallback = React.useCallback((): void => {
        props.onClick(props.model);
    }, [props.model, props.onClick]);

    return (
        <ListItemDiv onClick={onClickCallback} selected={props.selected}>
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
    onTargetSelected: (model: MmdModel|MmdCamera|null) => void;
}

function ObjectListViewInternal(props: ObjectListViewProps): JSX.Element {
    const [models, setModels] = React.useState<{ ref: readonly MmdModel[] }>({ ref: [] });
    const [showImportModelDialog, setShowImportModelDialog] = React.useState(false);
    const [files, setFiles] = React.useState<readonly File[]>([]);
    const [pmxFiles, setPmxFiles] = React.useState<readonly File[]>([]);
    const [selectedTarget, setSelectedTarget] = React.useState<MmdModel|MmdCamera|null>(null);

    const controller = useEditorController();

    const onModelsUpdatedCallback = React.useCallback((models: readonly MmdModel[]) => {
        if (!models.includes(selectedTarget as MmdModel)) {
            setSelectedTarget(null);
            props.onTargetSelected(null);
        }
        setModels({ ref: models });
    }, [selectedTarget, props.onTargetSelected]);

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

    const onModelSelectedCallback = React.useCallback((model: MmdModel|MmdCamera) => {
        if (selectedTarget === model) return;
        setSelectedTarget(model);
        props.onTargetSelected(model);
    }, [props.onTargetSelected, selectedTarget]);

    const modelsJsx = React.useMemo(() => {
        return models.ref.map(model => (
            <ObjectListItem
                key={model.instanceId}
                name={model.gameObject.name}
                model={model}
                selected={model === selectedTarget}
                onClick={onModelSelectedCallback}
            />
        ));
    }, [models, onModelSelectedCallback, selectedTarget]);

    return (
        <PanelItem title="Objects" width={props.width} height={props.height}>
            <ListContainerDiv>
                <ObjectListItem
                    name="Camera"
                    model={controller.camera}
                    selected={controller.camera === selectedTarget}
                    onClick={onModelSelectedCallback}
                />
                {modelsJsx}
                <ObjectListAddItem onFiles={onFilesCallback} />

                {showImportModelDialog && (
                    <ImportDialog
                        title={"Multiple Models Have Been Found"}
                        files={pmxFiles}
                        onCanceled={onImportCanceledCallback}
                        onSelected={onImportSelectedCallback}
                    />
                )}
            </ListContainerDiv>
        </PanelItem>
    );
}

export const ObjectListView = React.memo(ObjectListViewInternal);
