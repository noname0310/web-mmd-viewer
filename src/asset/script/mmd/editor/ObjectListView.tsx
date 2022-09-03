/* eslint-disable @typescript-eslint/naming-convention */
import styled from "styled-components";

import { PanelItem, PanelWidthHeightProps } from "./PanelItem";

const ListItemDiv = styled.div`
    width: auto;
    padding: 5px 10px;
    box-sizing: border-box;
    margin-bottom: 3px;
    background-color: #555;

    &:hover {
        background-color: #666;
    }

    &:active {
        background-color: #777;
    }
`;

interface ObjectListItemProps {
    name: string;
}

function ObjectListItem(props: ObjectListItemProps): JSX.Element {
    return (
        <ListItemDiv>
            {props.name}
        </ListItemDiv>
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
    return (
        <PanelItem title="Objects" width={props.width} height={props.height}>
            <ListContainerDiv>
                <ObjectListItem name="test" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
                <ObjectListItem name="test2" />
                <ObjectListItem name="test3" />
                <ObjectListItem name="test4" />
            </ListContainerDiv>
        </PanelItem>
    );
}
