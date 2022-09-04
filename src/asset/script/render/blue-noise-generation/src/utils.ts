export function shuffleArray(array: Uint8Array|Uint16Array|Uint32Array|any[], random = Math.random): void {
    for (let i = array.length - 1; i > 0; i--) {
        const replaceIndex = ~ ~((random() - 1e-6) * i);
        const tmp = array[i];
        array[i] = array[replaceIndex];
        array[replaceIndex] = tmp;
    }
}

export function fillWithOnes(array: Uint8Array|Uint16Array|Uint32Array|number[], count: number): void {
    array.fill(0);

    for (let i = 0; i < count; i++) {
        array[i] = 1;
    }
}
