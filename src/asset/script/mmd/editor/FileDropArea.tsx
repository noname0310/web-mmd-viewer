import React from "react";
import styled from "styled-components";

const FileDropAreaLabel = styled.label<FileDropAreaSizeProps>`
    width: ${props => props.width};
    height: ${props => props.height};
`;

const FileDropInput = styled.input<FileDropAreaSizeProps>`
    width: ${props => props.width};
    height: ${props => props.height};
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

async function entriesToFiles(entries: FileSystemEntry[]): Promise<File[]> {
    const files: File[] = [];
    const directories = await readDirectories(entries);
    for (let i = 0; i < directories.length; i++) {
        const entry = directories[i];
        const file = await new Promise<File>((resolve, reject) => {
            entry.file(resolve, reject);
        });
        files.push(file);
    }
    return files;
}

interface FileDropAreaSizeProps {
    width?: string;
    height?: string;
}

export interface FileDropAreaProps extends FileDropAreaSizeProps {
    onFiles: (files: File[]) => void;
}

export function FileDropArea(props: FileDropAreaProps): JSX.Element {
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

        readDirectories(entries).then(result => {
            entriesToFiles(result).then(files => {
                props.onFiles(files);
            });
        });
    } , []);

    const changeCallback = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.target.files as File[]|null;
        if (!files) return;
        props.onFiles(files);
    }, []);

    return (
        <FileDropAreaLabel width={props.width} height={props.height}>
            <FileDropInput
                width={props.width}
                height={props.height}
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