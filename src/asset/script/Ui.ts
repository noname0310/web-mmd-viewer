export class Ui {
    public static getOrCreateLoadingElement(): HTMLElement {
        let loadingText = document.getElementById("load-progress");
        if (!loadingText) {
            loadingText = document.createElement("div");
            loadingText.id = "load-progress";
            loadingText.style.position = "absolute";
            loadingText.style.top = "0";
            loadingText.style.left = "0";
            loadingText.style.margin = "10px";
            loadingText.style.backgroundColor = "#FFFFFF";
            loadingText.style.padding = "10px";
            document.body.appendChild(loadingText);
        }
        return loadingText;
    }
}
