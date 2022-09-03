/* eslint-disable @typescript-eslint/naming-convention */
import styled from "styled-components";

import { PanelItem, PanelWidthHeightProps } from "./PanelItem";

const TextDiv = styled.div`
    display: flex;
    flex-direction: row;
`;

const LabelDiv = styled.div`
    width: auto;
`;

const OverflowTextDiv = styled.span`
    overflow-x: auto;
    white-space: nowrap;

    ::-webkit-scrollbar {
        display: none;
    }
`;

interface TextInfoProps {
    title: string;
    content: string;
}

function TextInfo(props: TextInfoProps): JSX.Element {
    return (
        <TextDiv>
            <LabelDiv>
                {props.title}:&nbsp;
            </LabelDiv>
            <OverflowTextDiv>
                {props.content}
            </OverflowTextDiv>
        </TextDiv>
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

export interface InspectorProps extends PanelWidthHeightProps {
    empty?: never;
}

export function Inspector(props: InspectorProps): JSX.Element {    
    return (
        <PanelItem title="Inspector" width={props.width} height={props.height}>
            <ContainerDiv>
                <TextInfo title="motion" content="lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" />
            </ContainerDiv>
        </PanelItem>
    );
}
