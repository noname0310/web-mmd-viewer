/* eslint-disable @typescript-eslint/naming-convention */
import React from "react";
import ReactDOM from "react-dom";

interface PortalProps {
    children: React.ReactNode;
    elementId: string;
}

export function Portal(props: PortalProps): React.ReactPortal {
    const { children, elementId } = props;
    const rootElement = React.useMemo(() => document.getElementById(elementId), [elementId]);

    if (!rootElement) {
        throw new Error(`Could not find element with id: ${elementId}`);
    }

    return ReactDOM.createPortal(children, rootElement);
}
