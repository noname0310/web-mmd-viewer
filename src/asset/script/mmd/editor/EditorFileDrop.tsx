import React from "react";
import styled from "styled-components";

const FileDropAreaLabel = styled.label`
    width: 100%;
    height: 100%;
`;

const FileDropInput = styled.input`
    width: 100%;
    height: 100%;
`;

async function readDirectories(entries: FileSystemEntry[], path: string = ""): Promise<FileSystemFileEntry[]> {
    const result: FileSystemFileEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.isDirectory) {
            const dirReader = (entry as FileSystemDirectoryEntry).createReader();
            const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
                dirReader.readEntries(resolve, reject);
            });
            result.push(...await readDirectories(entries, path + entry.name + "/"));
        } else {
            result.push(entry as FileSystemFileEntry);
        }
    }

    return result;
}

export function EditorFileDrop(): JSX.Element {
    const fileDropInput = React.useRef<HTMLInputElement>(null);
    
    React.useEffect(() => {
        if (!fileDropInput.current) return;

        fileDropInput.current.setAttribute("directory", "");
        fileDropInput.current.setAttribute("allowdirs", "");
        fileDropInput.current.setAttribute("webkitdirectory", "");
    }, [fileDropInput]);

    const dragOverCallback = React.useCallback((e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const dropCallback = React.useCallback((e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const dataTransferItemList = e.dataTransfer.items;
        if (!dataTransferItemList) return;
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < dataTransferItemList.length; ++i) {
            const item = dataTransferItemList[i];
            const entry = item.webkitGetAsEntry();
            if (entry) entries.push(entry);
        }
        readDirectories(entries).then(fileEntries => {
            console.log(fileEntries);
        });
    } , []);

    const changeCallback = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.target.files as File[]|null;
        if (!files) return;
        console.log(files);
    }, []);

    return (
        <FileDropAreaLabel>
            <FileDropInput
                type="file"
                name="editor-file-drop"
                ref={fileDropInput}
                onDragOver={dragOverCallback}
                onDrop={dropCallback}
                onChange={changeCallback}
            >
            </FileDropInput>
        </FileDropAreaLabel>
    );
}
