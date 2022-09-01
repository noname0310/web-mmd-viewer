import Ammo from "ammojs-typed";

import { AudioPermissionSolver } from "./asset/script/AudioPermissionSolver";
import { ListMmdViewBuilder } from "./asset/script/ListMmdViewBuilder";

async function startGame(): Promise<void> {
    await AudioPermissionSolver.invoke();
    await Ammo(Ammo);
    ListMmdViewBuilder.invoke();
}

startGame();

//test directory read
function createFileInputElement(id: string): HTMLInputElement {
    const html = `
        <input id="${id}" type="file" directory allowdirs webkitdirectory/>
    `;
    const element = document.createElement("div");
    element.innerHTML = html;
    const input = element.querySelector("input") as HTMLInputElement;
    element.removeChild(input);
    element.remove();
    return input;
}

const fileInput = createFileInputElement("file-input");

document.body.appendChild(fileInput);
fileInput.addEventListener("change", filesDroped);

function filesDroped(event: Event): void {
    const files: File[] = (event.target! as any).files;
    console.log(URL.createObjectURL(files[0]));
    console.log(event);
    (globalThis as any).webkitResult = files;
}
