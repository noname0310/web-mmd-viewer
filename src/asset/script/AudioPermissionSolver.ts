import TestAudio from "../audio/audioTest.mp3";

export class AudioPermissionSolver {
    public static async invoke(): Promise<void> {
        let audioTest: HTMLAudioElement|null = new Audio(TestAudio);

        try {
            await audioTest.play();
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "NotAllowedError") {
                const button = document.createElement("button");
                button.style.position = "absolute";
                button.style.left = "0";
                button.style.top = "0";
                button.style.width = "100%";
                button.style.height = "100%";
                button.style.border = "none";
                button.style.fontSize = "32px";
                button.innerText = "Play";
                document.body.appendChild(button);
                await new Promise<void>((resolve): void => {
                    button.onclick = (): void => {
                        audioTest!.play();
                        audioTest!.remove();
                        audioTest = null;
                        button.remove();
                        resolve();
                    };
                });
            } else {
                throw error;
            }
        }
    }
}
