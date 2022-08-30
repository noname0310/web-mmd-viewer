import Ammo from "ammojs-typed";
import { BootstrapperConstructor, Game } from "the-world-engine";
import { Bootstrapper as BaseBootstrapper } from "the-world-engine";

import TestAudio from "./asset/audio/audioTest.mp3";
import { AsYouLikeItBootstrapper } from "./asset/mmd_scene/AsYouLikeItBootstrapper";
import { ConquerorBootstrapper } from "./asset/mmd_scene/ConquerorBootstrapper";
import { DaybreakFrontlineBootstrapper } from "./asset/mmd_scene/DaybreakFrontlineBootstrapper";
import { FlosBootstrapper } from "./asset/mmd_scene/FlosBootstrapper";
//import { InterpolationTestBootstrapper } from "./asset/InterpolationTestBootstrapper";
import { MmdGenericBootstrapper, MmdLoadParams } from "./asset/mmd_scene/MmdGenericBootstrapper";
import { NotitleBootstrapper } from "./asset/mmd_scene/NotitleBootstrapper";
import { PizzicatoDropsBootstrapper } from "./asset/mmd_scene/PizzicatoDropsBootstrapper";
import { RuSeBootstrapper } from "./asset/mmd_scene/RuSeBootstrapper";
import { TheTruthOfPlanetariumsBootstrapper } from "./asset/mmd_scene/TheTruthOfPlanetariumsBootstrapper";

function startGame(): void {
    Ammo(Ammo).then(() => {
        const bootstrapperSelectPanel = document.createElement("div");
        bootstrapperSelectPanel.style.position = "absolute";
        bootstrapperSelectPanel.style.top = "0px";
        bootstrapperSelectPanel.style.right = "0px";

        let currentGame: Game|null = null;
        let currentBootsrapper: BootstrapperConstructor<any, BaseBootstrapper<any>>|null = null;
        let currentInteropObject: any = null;

        function runGame<T, U extends BaseBootstrapper<T> = BaseBootstrapper<T>>(
            bootstrapperCtor: BootstrapperConstructor<T, U>,
            interopObject?: T
        ): void {
            if (currentBootsrapper === bootstrapperCtor && JSON.stringify(currentInteropObject) === JSON.stringify(interopObject)) {
                return;
            }
            if (currentGame) {
                currentGame.dispose();
            }
            currentBootsrapper = bootstrapperCtor;
            currentInteropObject = interopObject;
            
            currentGame = new Game(document.getElementById("game_view")!);
            currentGame.run(bootstrapperCtor, interopObject);
            currentGame.inputHandler.startHandleEvents();
        }

        const button1 = document.createElement("button");
        button1.className = "select_bootstrapper_button";
        button1.innerText = "pizzicato drops";
        button1.onclick = (): void => runGame(PizzicatoDropsBootstrapper);

        const button2 = document.createElement("button");
        button2.className = "select_bootstrapper_button";
        button2.innerText = "as you like it";
        button2.onclick = (): void => runGame(AsYouLikeItBootstrapper);

        const button3 = document.createElement("button");
        button3.className = "select_bootstrapper_button";
        button3.innerText = "flos";
        button3.onclick = (): void => runGame(FlosBootstrapper);

        const button4 = document.createElement("button");
        button4.className = "select_bootstrapper_button";
        button4.innerText = "ru se";
        button4.onclick = (): void => runGame(RuSeBootstrapper);

        const button5 = document.createElement("button");
        button5.className = "select_bootstrapper_button";
        button5.innerText = "daybreak frontline";
        button5.onclick = (): void => runGame(DaybreakFrontlineBootstrapper);

        const button6 = document.createElement("button");
        button6.className = "select_bootstrapper_button";
        button6.innerText = "notitle";
        button6.onclick = (): void => runGame(NotitleBootstrapper);

        const button7 = document.createElement("button");
        button7.className = "select_bootstrapper_button";
        button7.innerText = "conqueror";
        button7.onclick = (): void => runGame(ConquerorBootstrapper);

        const button8 = document.createElement("button");
        button8.className = "select_bootstrapper_button";
        button8.innerText = "never ender";
        button8.onclick = (): void => runGame(MmdGenericBootstrapper, {
            models: [
                {
                    modelUrl: "mmd/YYB Hatsune Miku Default fanmade by HB-Squiddy - phys edit/Miku phys edit for skirt - faceforward.pmx",
                    modelMotionUrl: ["mmd/never_ender/motion.vmd", "mmd/never_ender/facial.vmd"]
                }
            ],
            cameraMotionUrl: "mmd/never_ender/camera.vmd",
            audioUrl: "mmd/never_ender/never ender.mp3"
        } as MmdLoadParams);

        const button9 = document.createElement("button");
        button9.className = "select_bootstrapper_button";
        button9.innerText = "kimini totte";
        button9.onclick = (): void => runGame(MmdGenericBootstrapper, {
            models: [
                {
                    modelUrl: "mmd/YYB Hatsune Miku Default fanmade by HB-Squiddy - phys edit/Miku phys edit for skirt - faceforward.pmx",
                    modelMotionUrl: "mmd/kimini_totte/motion_a.vmd"
                },
                {
                    modelUrl: "mmd/YYB Hatsune Miku_10th - faceforward/YYB Hatsune Miku_10th_v1.02 - faceforward-physedit2.pmx",
                    modelMotionUrl: "mmd/kimini_totte/motion_b_edited.vmd"
                }
            ],
            cameraMotionUrl: "mmd/kimini_totte/camera_edited.vmd",
            audioUrl: "mmd/kimini_totte/kimini totte.mp3"
        } as MmdLoadParams);

        const button10 = document.createElement("button");
        button10.className = "select_bootstrapper_button";
        button10.innerText = "deep blue town";
        button10.onclick = (): void => runGame(MmdGenericBootstrapper, {
            models: [
                {
                    modelUrl: "mmd/YYB Hatsune Miku Default fanmade by HB-Squiddy - phys edit/Miku phys edit for skirt - faceforward.pmx",
                    modelMotionUrl: "mmd/deep_blue_town/motion.vmd"
                }
            ],
            cameraMotionUrl: "mmd/deep_blue_town/camera.vmd",
            audioUrl: "mmd/deep_blue_town/deep blue town.mp3",
            settings: {
                useIk: false,
                forceAllInterpolateToCubic: true
            }
        } as MmdLoadParams);

        const button11 = document.createElement("button");
        button11.className = "select_bootstrapper_button";
        button11.innerText = "the truth of planetariums";
        button11.onclick = (): void => runGame(TheTruthOfPlanetariumsBootstrapper);

        const button12 = document.createElement("button");
        button12.className = "select_bootstrapper_button";
        button12.innerText = "demons";
        button12.onclick = (): void => runGame(MmdGenericBootstrapper, {
            models: [
                {
                    modelUrl: "mmd/YYB_black__white_dress_v1.31_edited/edit2.pmx",
                    modelMotionUrl: ["mmd/demons/Rin PhysicsBake Full.vmd", "mmd/demons/Rin Facial.vmd"]
                },
                {
                    modelUrl: "mmd/YYB School Miku/YYB School Miku.pmx",
                    modelMotionUrl: ["mmd/demons/Len PhysicsBake Full2.vmd", "mmd/demons/Len Facial.vmd"]
                }
            ],
            cameraMotionUrl: "mmd/demons/camera.vmd",
            audioUrl: "mmd/demons/Nightcore -  Demons.mp3",
            settings: {
                usePhysics: false,
                forceAllInterpolateToCubic: true
            }
        } as MmdLoadParams);

        bootstrapperSelectPanel.appendChild(button1);
        bootstrapperSelectPanel.appendChild(button2);
        bootstrapperSelectPanel.appendChild(button3);
        bootstrapperSelectPanel.appendChild(button4);
        bootstrapperSelectPanel.appendChild(button5);
        bootstrapperSelectPanel.appendChild(button6);
        bootstrapperSelectPanel.appendChild(button7);
        bootstrapperSelectPanel.appendChild(button8);
        bootstrapperSelectPanel.appendChild(button9);
        bootstrapperSelectPanel.appendChild(button10);
        bootstrapperSelectPanel.appendChild(button11);
        bootstrapperSelectPanel.appendChild(button12);

        document.body.appendChild(bootstrapperSelectPanel);

        button12.onclick(new MouseEvent("click"));

        // runGame(MmdGenericBootstrapper, {
        //     models: [
        //         {
        //             modelUrl: "mmd/box_motion/Box10.pmx",
        //             modelMotionUrl: "mmd/box_motion/motion.vmd"
        //         }
        //     ],
        //     cameraMotionUrl: "mmd/box_motion/empty_camera.vmd",
        //     audioUrl: "mmd/the_truth_of_planetariums/the truth of planetariums.mp3"
        // });
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
