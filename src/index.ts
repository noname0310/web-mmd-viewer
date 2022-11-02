import Ammo from "ammojs-typed";
import { Game } from "the-world-engine";

import { MmdEditorBootstrapper } from "./asset/MmdEditorBootstrapper";
import { AudioPermissionSolver } from "./asset/script/AudioPermissionSolver";
import { ListMmdViewBuilder } from "./asset/script/ListMmdViewBuilder";

const listMmdViewBuilder: typeof ListMmdViewBuilder|null = ListMmdViewBuilder;
const mmdEditorBootstrapper: typeof MmdEditorBootstrapper|null = null;

async function startGame(): Promise<void> {
    await AudioPermissionSolver.invoke();
    await Ammo(Ammo);

    if (listMmdViewBuilder) {
        listMmdViewBuilder.invoke();
    } else if (mmdEditorBootstrapper) {
        const game = new Game(document.getElementById("game_view")!);
        game.run(mmdEditorBootstrapper);
        game.inputHandler.startHandleEvents();
    } else {
        throw new Error("No bootstrapper.");
    }
}

startGame();
