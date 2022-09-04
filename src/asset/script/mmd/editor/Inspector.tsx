/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";
import { MathUtils } from "three/src/Three";

import { ClockCalibrator } from "../../animation/ClockCalibrator";
import { MmdCamera } from "../MmdCamera";
import { MmdModel } from "../MmdModel";
import { MmdPlayer } from "../MmdPlayer";
import { useEditorController } from "./EditorControllerContext";
import { FileDropArea } from "./FileDropArea";
import { ImportDialog } from "./ImportDialog";
import { PanelItem, PanelWidthHeightProps } from "./PanelItem";

const TextDiv = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 5px;
`;

const LabelDiv = styled.div`
    width: auto;
`;

interface LabelProps {
    title: string;
    children: React.ReactNode;
}

function Label(props: LabelProps): JSX.Element {
    return (
        <TextDiv>
            <LabelDiv>
                {props.title}:&nbsp;
            </LabelDiv>
            {props.children}
        </TextDiv>
    );
}

const OverflowTextDiv = styled.span`
    overflow-x: auto;
    white-space: nowrap;

    ::-webkit-scrollbar {
        display: none;
    }
`;

interface TextInfoProps extends Omit<LabelProps, "children"> {
    content: string;
}

function TextInfo(props: TextInfoProps): JSX.Element {
    return (
        <Label title={props.title}>
            <OverflowTextDiv>
                {props.content}
            </OverflowTextDiv>
        </Label>
    );
}

const NumberInputWrapper = styled.div`
    width: 180px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const NumberInput = styled.input`
    width: 60px;
    outline: none;
    overflow: hidden;
`;

interface Vector3InputProps {
    value: [number, number, number];
    onChange: (value: [number, number, number]) => void;
}

function Vector3Input(props: Vector3InputProps): JSX.Element {
    const [x, y, z] = props.value;

    const onChangeCallback = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
        const index = parseInt(e.target.name, 10);
        const newValue = [...props.value];
        newValue[index] = value;
        props.onChange(newValue as [number, number, number]);
    }, [props.value, props.onChange]);

    return (
        <NumberInputWrapper>
            <NumberInput 
                type="number"
                value={x}
                name="0"
                onChange={onChangeCallback}
            />
            <NumberInput
                type="number"
                value={y}
                name="1"
                onChange={onChangeCallback}
            />
            <NumberInput
                type="number"
                value={z}
                name="2"
                onChange={onChangeCallback}
            />
        </NumberInputWrapper>
    );
}

interface CheckBoxInputProps {
    value: boolean;
    enabled: boolean;
    onChange: (value: boolean) => void;
}

function CheckBoxInput(props: CheckBoxInputProps): JSX.Element {
    const onChangeCallback = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange(e.target.checked);
    }, [props.onChange]);

    return (
        <input
            type="checkbox"
            checked={props.value}
            onChange={onChangeCallback}
            disabled={!props.enabled}
        />
    );
}

const ContainerDiv = styled.div`
    display: flex;
    flex-direction: column;
    margin: 10px;
    margin-top: 0;
    overflow: auto;

    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`;

const PaddingDiv = styled.div`
    height: 10px;
`;

const RemoveButton = styled.button`
    width: 100%;
    height: 30px;
    margin: 10px 0;
    color: #fff;
    border: none;

    background-color: #f00;

    :hover {
        background-color: #f44;
    }

    :active {
        background-color: #f88;
    }
`;

export interface InspectorProps extends PanelWidthHeightProps {
    target: MmdModel|MmdCamera|null;
}

function InspectorInternal(props: InspectorProps): JSX.Element {
    const [forceUpdate, setForceUpdate] = React.useState(0);

    const controller = useEditorController();

    const onPositionChangeCallback = React.useCallback((value: [number, number, number]): void => {
        props.target!.transform.position.set(value[0], value[1], value[2]);
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onRotationChangeCallback = React.useCallback((value: [number, number, number]): void => {
        props.target!.transform.eulerAngles.set(value[0] * MathUtils.DEG2RAD, value[1] * MathUtils.DEG2RAD, value[2] * MathUtils.DEG2RAD);
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onCastShadowChangeCallback = React.useCallback((value: boolean): void => {
        const skinnedMesh = (props.target as MmdModel).skinnedMesh;
        if (skinnedMesh) skinnedMesh.castShadow = value;
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onReceiveShadowChangeCallback = React.useCallback((value: boolean): void => {
        const skinnedMesh = (props.target as MmdModel).skinnedMesh;
        if (skinnedMesh) skinnedMesh.receiveShadow = value;
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onRemoveModelCallback = React.useCallback((): void => {
        controller.removeModel(props.target as MmdModel);
        props.target!.removeAnimation(props.target!.animations.keys().next().value);
        updateAnimation();
    }, [props.target, controller]);

    const [showImportSoundFileDialog, setShowImportSoundFileDialog] = React.useState(false);
    const [soundFiles, setSoundFiles] = React.useState<File[]>([]);
    const [soundFileName, setSoundFileName] = React.useState<string|null>(null);
    
    const onSoundFilesCallback = React.useCallback((files: File[]): void => {
        files = files.filter(file => file.name.endsWith(".mp3"));
        if (files.length === 0) return;

        if (files.length === 1) {
            setSoundFileName(files[0].name);
            const objectUrl = URL.createObjectURL(files[0]);
            controller.audioPlayer.asyncSetAudioFromUrl(objectUrl, () => {
                URL.revokeObjectURL(objectUrl);

                updateAnimation(true);
            });
        } else {
            setSoundFiles(files);
            setShowImportSoundFileDialog(true);
        }
    }, [controller]);

    const onSoundFileImportCanceledCallback = React.useCallback((): void => {
        setShowImportSoundFileDialog(false);
    }, []);

    const onSoundFileImportSelectedCallback = React.useCallback((file: File): void => {
        setSoundFileName(file.name);
        const objectUrl = URL.createObjectURL(file);
        controller.audioPlayer.asyncSetAudioFromUrl(objectUrl, () => {
            URL.revokeObjectURL(objectUrl);

            updateAnimation(true);
        });
        setShowImportSoundFileDialog(false);
    }, [controller]);
    
    const [showImportMotionDialog, setShowImportMotionDialog] = React.useState(false);
    const [motionFiles, setMotionFiles] = React.useState<File[]>([]);
    const [vmdFileName, setVmdFileName] = React.useState("");

    React.useEffect(() => {
        setVmdFileName(props.target?.animations.keys().next().value ?? "");
    }, [props.target]);

    const onFilesCallback = React.useCallback((files: File[]): void => {
        if (props.target!.isAnimationLoading(vmdFileName)) return;
        files = files.filter(file => file.name.endsWith(".vmd"));
        if (files.length === 0) return;

        if (files.length === 1) {
            props.target!.removeAnimation(vmdFileName);
            controller.audioPlayer.enabled = false;
            controller.animationPlayer.enabled = false;
            if (props.target instanceof MmdModel) props.target.poseToDefault();
            const vmdFile = files[0];
            setVmdFileName(vmdFile.name);
            const objectUrl = URL.createObjectURL(vmdFile);
            props.target!.asyncLoadAnimation(vmdFile.name, objectUrl, () => {
                URL.revokeObjectURL(objectUrl);
                setForceUpdate(forceUpdate + 1);
                updateAnimation();
            });
        } else {
            setMotionFiles(files);
            setShowImportMotionDialog(true);
        }
    }, [props.target, vmdFileName, controller, forceUpdate]);

    const onRemoveMotionCallback = React.useCallback(() => {
        props.target!.removeAnimation(vmdFileName);
        controller.audioPlayer.enabled = false;
        controller.animationPlayer.enabled = false;
        if (props.target instanceof MmdModel) props.target!.poseToDefault();
        setVmdFileName("");

        updateAnimation();
    }, [props.target, vmdFileName, controller]);

    const onImportCanceledCallback = React.useCallback((): void => {
        setShowImportMotionDialog(false);
    }, []);

    const onImportSelectedCallback = React.useCallback((file: File): void => {
        props.target!.removeAnimation(vmdFileName);
        controller.audioPlayer.enabled = false;
        controller.animationPlayer.enabled = false;
        if (props.target instanceof MmdModel) props.target!.poseToDefault();
        setVmdFileName(file.name);
        const objectUrl = URL.createObjectURL(file);
        props.target!.asyncLoadAnimation(file.name, objectUrl, () => {
            URL.revokeObjectURL(objectUrl);
            setForceUpdate(forceUpdate + 1);
            updateAnimation();
        });
        setShowImportMotionDialog(false);
    }, [props.target, vmdFileName, controller, forceUpdate]);

    const onUsePhysicsChangeCallback = React.useCallback((value: boolean): void => {
        const mmdModel = props.target as MmdModel;
        const mmdPlayer = mmdModel.gameObject.getComponent(MmdPlayer)!;
        mmdPlayer.usePhysics = value;
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onUseIkChangeCallback = React.useCallback((value: boolean): void => {
        const mmdModel = props.target as MmdModel;
        const mmdPlayer = mmdModel.gameObject.getComponent(MmdPlayer)!;
        mmdPlayer.useIk = value;
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const applyRad2Deg = React.useCallback((EulerTuple: [number, number, number]): [number, number, number] => {
        return [
            EulerTuple[0] * MathUtils.RAD2DEG,
            EulerTuple[1] * MathUtils.RAD2DEG,
            EulerTuple[2] * MathUtils.RAD2DEG
        ];
    }, []);

    const updateAnimation = React.useCallback((audioPlayerisReady?: boolean) => {
        const models = controller.models;
        const camera = controller.camera;
        const audioPlayer = controller.audioPlayer;
        const mmdController = controller.mmdController;
        const animationPlayer = controller.animationPlayer;

        animationPlayer.stop();
        mmdController.removeAllMmdPlayers();
        mmdController.removeAllModelLoaders();

        if ((soundFileName !== null || audioPlayerisReady) && animationPlayer.animationClock === null) {
            animationPlayer.animationClock = new ClockCalibrator(audioPlayer);
        }

        mmdController.cameraLoader = camera;

        for (let i = 0; i < models.length; ++i) {
            const model = models[i];
            if (model.animations.size === 0) continue;

            model.poseToDefault();

            let modelPlayer = model.gameObject.getComponent(MmdPlayer);
            const usePhysics = modelPlayer?.usePhysics ?? true;
            const useIk = modelPlayer?.useIk ?? true;
            if (modelPlayer) modelPlayer.destroy();

            modelPlayer = model.gameObject.addComponent(MmdPlayer)!;

            modelPlayer.usePhysics = usePhysics;
            modelPlayer.useIk = useIk;

            mmdController.addMmdPlayer(modelPlayer);
            mmdController.addModelLoader(model);
        }

        const animationNames: string[] = [];
        for (let i = 0; i < models.length; ++i) {
            const model = models[i];
            (globalThis as any).model = model;
            if (model.animations.size === 0) continue;

            animationNames.push(model.animations.keys().next().value);
        }

        if (animationNames.length === 0) return;

        audioPlayer.enabled = true;
        animationPlayer.enabled = true;

        mmdController.asyncPlay(
            animationNames,
            camera.animations.keys().next().value
        );
    }, [controller, soundFileName]);

    return (
        <PanelItem title="Inspector" width={props.width} height={props.height}>
            {props.target?.exists 
                ? (
                    <ContainerDiv>
                        {props.target instanceof MmdModel && (
                            <>
                                <Label title="position">
                                    <Vector3Input
                                        value={props.target.transform.position.toArray()}
                                        onChange={onPositionChangeCallback}
                                    />
                                </Label>
                                <Label title="rotation">
                                    <Vector3Input
                                        value={applyRad2Deg(props.target.transform.eulerAngles.toArray() as [number, number, number])}
                                        onChange={onRotationChangeCallback}
                                    />
                                </Label>
                                <PaddingDiv />
                                <Label title="cast shadow">
                                    <CheckBoxInput
                                        value={props.target.skinnedMesh?.castShadow ?? true}
                                        onChange={onCastShadowChangeCallback}
                                        enabled={props.target.skinnedMesh !== null}
                                    />
                                </Label>
                                <Label title="receive shadow">
                                    <CheckBoxInput
                                        value={props.target.skinnedMesh?.receiveShadow ?? true}
                                        onChange={onReceiveShadowChangeCallback}
                                        enabled={props.target.skinnedMesh !== null}
                                    />
                                </Label>
                                <PaddingDiv />
                                <TextInfo title="model" content={props.target.gameObject.name} />
                                <RemoveButton onClick={onRemoveModelCallback}>
                                    remove model
                                </RemoveButton>
                            </>
                        )}
                        {props.target instanceof MmdCamera && (
                            <>
                                <TextInfo title="mp3 file" content={soundFileName ?? "none"} />
                                <FileDropArea onFiles={onSoundFilesCallback} />
                                <PaddingDiv />
                                {showImportSoundFileDialog && (
                                    <ImportDialog
                                        title={"Multiple Sound Files Have Been Found"}
                                        files={soundFiles}
                                        onCanceled={onSoundFileImportCanceledCallback}
                                        onSelected={onSoundFileImportSelectedCallback}
                                    />
                                )}
                            </>
                        )}
                        {(props.target instanceof MmdCamera || props.target instanceof MmdModel) && (
                            <>
                                <TextInfo
                                    title="motion"
                                    content={
                                        props.target.isAnimationLoading(vmdFileName)
                                            ? "loading..."
                                            : props.target.animations.size > 0
                                                ? props.target.animations.keys().next().value
                                                : "none"
                                    }/>
                                <FileDropArea onFiles={onFilesCallback} />
                                <RemoveButton onClick={onRemoveMotionCallback}>
                                    remove motion
                                </RemoveButton>
                                {showImportMotionDialog && (
                                    <ImportDialog
                                        title={"Multiple Motions Have Been Found"}
                                        files={motionFiles}
                                        onCanceled={onImportCanceledCallback}
                                        onSelected={onImportSelectedCallback}
                                    />
                                )}
                            </>
                        )}
                        {props.target instanceof MmdModel && (
                            <>
                                <Label title="use physics">
                                    <CheckBoxInput
                                        value={(props.target.gameObject.getComponent(MmdPlayer)?.usePhysics) ?? true}
                                        onChange={onUsePhysicsChangeCallback}
                                        enabled={props.target.gameObject.getComponent(MmdPlayer) !== null}
                                    />
                                </Label>
                                <Label title="use ik">
                                    <CheckBoxInput
                                        value={(props.target.gameObject.getComponent(MmdPlayer)?.useIk) ?? true}
                                        onChange={onUseIkChangeCallback}
                                        enabled={props.target.gameObject.getComponent(MmdPlayer) !== null}
                                    />
                                </Label>
                            </>
                        )}
                    </ContainerDiv>
                ) : (
                    <>  </>
                )
            }
        </PanelItem>
    );
}

export const Inspector = React.memo(InspectorInternal);
