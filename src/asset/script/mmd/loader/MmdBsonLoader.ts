import { Pmx, Vmd } from "@noname0310/mmd-parser";
import { deserialize, serialize } from "bson";

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

    public static async loadAndDeserialize(url: string): Promise<Vmd | Pmx> {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const data = this.deserialize(this.arrayBufferToBuffer(buffer));
        return data;
    }

    private static arrayBufferToBuffer(arrayBuffer: ArrayBuffer): Buffer {
        const buffer = Buffer.alloc(arrayBuffer.byteLength);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = view[i];
        }
        return buffer;
    }
}
