function gatherMeshes(scene: THREE.Object3D, target: (THREE.Mesh|THREE.SkinnedMesh)[] = []): void {
    target.length = 0;
    scene.traverse(c => {
        if ((c as THREE.Mesh).isMesh || (c as THREE.SkinnedMesh).isSkinnedMesh) {
            target.push((c as THREE.Mesh|THREE.SkinnedMesh));
        }
    });
}

export { gatherMeshes };
