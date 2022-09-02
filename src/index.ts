import Ammo from "ammojs-typed";
import { Game } from "the-world-engine";

import { MmdEditorBootstrapper } from "./asset/MmdEditorBootstrapper";
import { AudioPermissionSolver } from "./asset/script/AudioPermissionSolver";

async function startGame(): Promise<void> {
    await AudioPermissionSolver.invoke();
    await Ammo(Ammo);
    const game = new Game(document.getElementById("game_view")!);
    game.run(MmdEditorBootstrapper);
    game.inputHandler.startHandleEvents();
}

startGame();
