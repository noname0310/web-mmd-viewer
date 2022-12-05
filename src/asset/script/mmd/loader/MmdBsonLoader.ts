import { Pmx, Vmd } from "@noname0310/mmd-parser";
import { deserialize, serialize } from "bson";
import { FileLoader } from "three/src/Three";

export class MmdBsonLoader {
    private constructor() { /* */ }

    public static serialize(data: Vmd | Pmx): Buffer {
        const buffer = serialize(data, {
            checkKeys: false,
            serializeFunctions: false
        });

        return buffer;
    }

    public static serializeAndSave(data: Vmd | Pmx, fileName: string): void {
        const buffer = this.serialize(data);
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    }

    public static deserialize(buffer: Buffer): Vmd | Pmx {
        const data = deserialize(buffer, {
            validation: { utf8: false }
        });
        return data as Vmd | Pmx;
    }

    public static loadAndDeserialize(
        url: string,
        onLoad: (data: Vmd | Pmx) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
    ): void {
        const loader = new FileLoader();
        loader.setResponseType("arraybuffer");
        loader.load(url, arrayBuffer => {
            const data = this.deserialize(arrayBuffer as Buffer);
            onLoad(data);
        }, onProgress, onError);
    }
}
