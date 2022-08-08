import Ammo from "ammojs-typed";
import { BootstrapperConstructor, Game } from "the-world-engine";
import { Bootstrapper as BaseBootstrapper } from "the-world-engine";

import TestAudio from "./asset/audio/audioTest.mp3";
import { Bootstrapper } from "./asset/Bootstrapper";
import { Bootstrapper2 } from "./asset/Bootstrapper2";
import { Bootstrapper3 } from "./asset/Bootstrapper3";
import { Bootstrapper4 } from "./asset/Bootstrapper4";
import { Bootstrapper5 } from "./asset/Bootstrapper5";
import { Bootstrapper6 } from "./asset/Bootstrapper6";

function startGame(): void {
    Ammo(Ammo).then(() => {
        const bootstrapperSelectPanel = document.createElement("div");
        bootstrapperSelectPanel.style.position = "absolute";
        bootstrapperSelectPanel.style.top = "0px";
        bootstrapperSelectPanel.style.right = "0px";

        let currentGame: Game|null = null;
        let currentBootsrapper: BootstrapperConstructor<unknown, BaseBootstrapper<unknown>>|null = null;
        function runGame(bootstrapper: BootstrapperConstructor<unknown, BaseBootstrapper<unknown>>): void {
            if (currentBootsrapper === bootstrapper) {
                return;
            }
            if (currentGame) {
                currentGame.dispose();
            }
            currentBootsrapper = bootstrapper;
            currentGame = new Game(document.getElementById("game_view")!);
            currentGame.run(bootstrapper);
            currentGame.inputHandler.startHandleEvents();
        }

        const button1 = document.createElement("button");
        button1.innerText = "pizzicato drops";
        button1.onclick = (): void => runGame(Bootstrapper);

        const button2 = document.createElement("button");
        button2.innerText = "as you like it";
        button2.onclick = (): void => runGame(Bootstrapper2);

        const button3 = document.createElement("button");
        button3.innerText = "flos";
        button3.onclick = (): void => runGame(Bootstrapper3);

        const button4 = document.createElement("button");
        button4.innerText = "ru se";
        button4.onclick = (): void => runGame(Bootstrapper4);

        const button5 = document.createElement("button");
        button5.innerText = "daybreak frontline";
        button5.onclick = (): void => runGame(Bootstrapper5);

        const button6 = document.createElement("button");
        button6.innerText = "notitle";
        button6.onclick = (): void => runGame(Bootstrapper6);

        bootstrapperSelectPanel.appendChild(button1);
        bootstrapperSelectPanel.appendChild(button2);
        bootstrapperSelectPanel.appendChild(button3);
        bootstrapperSelectPanel.appendChild(button4);
        bootstrapperSelectPanel.appendChild(button5);
        bootstrapperSelectPanel.appendChild(button6);

        document.body.appendChild(bootstrapperSelectPanel);

        runGame(Bootstrapper2);
    });
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
