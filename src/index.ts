import Ammo from "ammojs-typed";
import { Game } from "the-world-engine";

import TestAudio from "./asset/audio/audioTest.mp3";
//import { run } from "./example";
import { Bootstrapper } from "./asset/Bootstrapper";

function startGame(): void {
    Ammo(Ammo).then(() => {
        const game = new Game(document.body);
        game.run(Bootstrapper);
        game.inputHandler.startHandleEvents();
        //run();
    } );
}

let audioTest: HTMLAudioElement|null = new Audio(TestAudio);
audioTest.play()
    .then(_ => {
        audioTest!.pause();
        audioTest!.remove();
        audioTest = null;
        startGame();
    })
    .catch(e => {
        if (e instanceof DOMException && e.name === "NotAllowedError") {
            audioTest!.remove();
            audioTest = null;
            const button = document.createElement("button");
            button.style.position = "absolute";
            button.style.left = "0";
            button.style.top = "0";
            button.style.width = "100%";
            button.style.height = "100%";
            button.style.border = "none";
            button.style.fontSize = "32px";
            button.innerText = "Play";
            button.onclick = (): void => {
                button.parentElement!.removeChild(button);
                startGame();
            };
            document.body.appendChild(button);
        } else {
            throw e;
        }
    });

// //test directory read
// function createFileInputElement(id: string): HTMLInputElement {
//     const html = `
//         <input id="${id}" type="file" directory allowdirs webkitdirectory/>
//     `;
//     const element = document.createElement("div");
//     element.innerHTML = html;
//     const input = element.querySelector("input") as HTMLInputElement;
//     element.removeChild(input);
//     element.remove();
//     return input;
// }

// const fileInput = createFileInputElement("file-input");

// document.body.appendChild(fileInput);
// fileInput.addEventListener("change", filesDroped);

// function filesDroped(event: Event): void {
//     const files: File[] = (event.target! as any).files;
//     console.log(URL.createObjectURL(files[0]));
//     console.log(event);
//     (globalThis as any).webkitResult = files;
// }
