/* eslint-disable @typescript-eslint/naming-convention */
import styled from "styled-components";

export interface PanelWidthHeightProps {
    width?: string;
    height?: string;
}

const WrapperDiv = styled.div<PanelWidthHeightProps>`
    width: ${(props): string|undefined => props.width};
    height: ${(props): string|undefined => props.height};
    margin: 10px;
    margin-top: 0;
    box-sizing: border-box;
    background-color: #444;
`;

const TitleDiv = styled.div`
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: 16px;
    background-color: #333;
    margin-bottom: 10px;
    user-select: none;
`;

const ContentDiv = styled.div`
    width: 100%;
    height: calc(100% - 66px);
`;

export interface PanelItemProps extends PanelWidthHeightProps {
    title: string;
    children: JSX.Element;
}

export function PanelItem(props: PanelItemProps): JSX.Element {
    return (
        <WrapperDiv width={props.width} height={props.height}>
            <TitleDiv>
                {props.title}
            </TitleDiv>
            <ContentDiv>
                {props.children}
            </ContentDiv>
        </WrapperDiv>
    );
}
