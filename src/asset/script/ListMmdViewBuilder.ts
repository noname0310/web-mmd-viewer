import { BootstrapperConstructor, Game } from "the-world-engine";
import { Bootstrapper as BaseBootstrapper } from "the-world-engine";

import { AsYouLikeItBootstrapper } from "../mmd_scene/AsYouLikeItBootstrapper";
import { ConquerorBootstrapper } from "../mmd_scene/ConquerorBootstrapper";
import { DaybreakFrontlineBootstrapper } from "../mmd_scene/DaybreakFrontlineBootstrapper";
import { FlosBootstrapper } from "../mmd_scene/FlosBootstrapper";
import { LemonBootstrapper } from "../mmd_scene/LemonBootstrapper";
import { MelancholyNightBootstrapper } from "../mmd_scene/MelancholyNightBootstrapper";
import { MmdGenericBootstrapper, MmdLoadParams } from "../mmd_scene/MmdGenericBootstrapper";
import { MusicMusicBootstrapper } from "../mmd_scene/MusicMusicBootstrapper";
import { NotitleBootstrapper } from "../mmd_scene/NotitleBootstrapper";
import { PizzicatoDropsBootstrapper } from "../mmd_scene/PizzicatoDropsBootstrapper";
import { RuSeBootstrapper } from "../mmd_scene/RuSeBootstrapper";
import { TheTruthOfPlanetariumsBootstrapper } from "../mmd_scene/TheTruthOfPlanetariumsBootstrapper";

export class ListMmdViewBuilder {
    public static invoke(): void {
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
                    modelUrl: "mmd/YYB Hatsune Miku_default/YYB Hatsune Miku_default_1.0ver.pmx",
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

        const button13 = document.createElement("button");
        button13.className = "select_bootstrapper_button";
        button13.innerText = "music music";
        button13.onclick = (): void => runGame(MusicMusicBootstrapper);

        const button14 = document.createElement("button");
        button14.className = "select_bootstrapper_button";
        button14.innerText = "melancholy night";
        button14.onclick = (): void => runGame(MelancholyNightBootstrapper);

        const button15 = document.createElement("button");
        button15.className = "select_bootstrapper_button";
        button15.innerText = "lemon";
        button15.onclick = (): void => runGame(LemonBootstrapper);

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
        bootstrapperSelectPanel.appendChild(button13);
        bootstrapperSelectPanel.appendChild(button14);
        bootstrapperSelectPanel.appendChild(button15);

        //document.body.appendChild(bootstrapperSelectPanel);

        button14.onclick(new MouseEvent("click"));
    }
}
