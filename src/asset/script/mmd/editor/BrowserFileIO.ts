export class BrowserFileIO {
    private readonly _objectUrlMap: Map<string, string> = new Map<string, string>();
    private readonly _filesMap: Map<string, string[]> = new Map<string, string[]>();

    public addFiles(id: string, ...files: File[]): void {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileFullPath = (file as any).webkitRelativePath as string;
            const fileURL = URL.createObjectURL(file);
            this._objectUrlMap.set(this.normalizePath(fileFullPath), fileURL);
            const fileList = this._filesMap.get(id);
            if (fileList) fileList.push(fileURL);
            else this._filesMap.set(id, [fileURL]);
        }
    }

    public removeFiles(id: string): void {
        const fileList = this._filesMap.get(id);
        if (!fileList) return;
        for (let i = 0; i < fileList.length; i++) {
            const fileURL = fileList[i];
            URL.revokeObjectURL(fileURL);
        }
        this._filesMap.delete(id);
    }

    public removeAllFiles(): void {
        for (const [id] of this._filesMap) {
            this.removeFiles(id);
        }
    }

    public getURLModifier(): (url: string) => string {
        return (url: string) => {
            return this._objectUrlMap.get(this.normalizePath(url)) ?? url;
        };
    }

    private normalizePath(path: string): string {
        if (path.startsWith("data:") || path.startsWith("blob:")) {
            return path;
        }
        return path.replace(/\\/g, "/").toLowerCase();
    }
}
