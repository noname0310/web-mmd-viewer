/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import styled from "styled-components";

import { MmdCamera } from "../MmdCamera";
import { MmdModel } from "../MmdModel";
import { useEditorController } from "./EditorControllerContext";
import { FileDropArea } from "./FileDropArea";
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

const RemoveModelButton = styled.button`
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

const animationName = "animation1";

function InspectorInternal(props: InspectorProps): JSX.Element {
    const [forceUpdate, setForceUpdate] = React.useState(0);
    const controller = useEditorController();

    const onPositionChangeCallback = React.useCallback((value: [number, number, number]): void => {
        props.target!.transform.position.set(value[0], value[1], value[2]);
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);

    const onRotationChangeCallback = React.useCallback((value: [number, number, number]): void => {
        props.target!.transform.eulerAngles.set(value[0], value[1], value[2]);
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
    }, [props.target, controller]);

    const onFilesCallback = React.useCallback((files: File[]): void => {
        if (props.target!.isAnimationLoading(animationName)) return;
        console.log(files);
        setForceUpdate(forceUpdate + 1);
    }, [props.target, forceUpdate]);
    
    return (
        <PanelItem title="Inspector" width={props.width} height={props.height}>
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
                                value={props.target.transform.eulerAngles.toArray() as [number, number, number]}
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
                        <RemoveModelButton onClick={onRemoveModelCallback}>
                            remove model
                        </RemoveModelButton>
                    </>
                )}
                {(props.target instanceof MmdCamera || props.target instanceof MmdModel) && (
                    <>
                        <TextInfo title="motion" content={props.target.animations.size > 0 ? props.target.animations.keys().next().value : "none"} />
                        <FileDropArea onFiles={onFilesCallback} />
                    </>
                )}
            </ContainerDiv>
        </PanelItem>
    );
}

export const Inspector = React.memo(InspectorInternal);
