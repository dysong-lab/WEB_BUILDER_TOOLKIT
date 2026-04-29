/**
 * STATCOM_MMC — Advanced/pipeFlow / scripts / register
 *
 * MeshStateMixin + pipeFlow API
 */

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

const DEFAULT_SPEED = { u: 0, v: 0.25 };
const PRESET_SPEEDS = {
    STATCOM_MMC_1257_Flow01: { u: 0, v: 0.25 },
    STATCOM_MMC_1258_Flow02: { u: 0, v: -0.25 }
};

const pipeState = { meshMap: new Map(), speeds: new Map(), rafId: null, lastTime: 0 };

const detectPipeMeshes = () => {
    if (!this.appendElement) return [];
    const meshes = [];
    this.appendElement.traverse((obj) => {
        if (!obj.isMesh || !obj.name || !obj.name.includes('_Flow')) return;
        if (!obj.material || !obj.material.map) return;
        meshes.push(obj);
    });
    return meshes;
};

this.pipeFlow = {
    start: () => {
        const meshes = detectPipeMeshes();
        pipeState.meshMap.clear();
        meshes.forEach((mesh) => {
            pipeState.meshMap.set(mesh.name, mesh);
            const map = mesh.material.map;
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            pipeState.speeds.set(mesh.name, { ...(PRESET_SPEEDS[mesh.name] || DEFAULT_SPEED) });
        });
        if (pipeState.rafId !== null || pipeState.meshMap.size === 0) return;
        pipeState.lastTime = performance.now();
        const tick = (now) => {
            const delta = (now - pipeState.lastTime) / 1000;
            pipeState.lastTime = now;
            pipeState.meshMap.forEach((mesh, meshName) => {
                const speed = pipeState.speeds.get(meshName) || DEFAULT_SPEED;
                if (!mesh.material?.map) return;
                mesh.material.map.offset.x = (mesh.material.map.offset.x + speed.u * delta) % 1;
                mesh.material.map.offset.y = (mesh.material.map.offset.y + speed.v * delta) % 1;
            });
            pipeState.rafId = requestAnimationFrame(tick);
        };
        pipeState.rafId = requestAnimationFrame(tick);
    },
    stop: () => {
        if (pipeState.rafId !== null) cancelAnimationFrame(pipeState.rafId);
        pipeState.rafId = null;
    },
    setSpeed: (meshName, speed) => {
        pipeState.speeds.set(meshName, { u: speed?.u || 0, v: speed?.v || 0 });
    },
    getMeshNames: () => [...pipeState.meshMap.keys()],
    destroy: () => {
        if (pipeState.rafId !== null) cancelAnimationFrame(pipeState.rafId);
        pipeState.meshMap.forEach((mesh) => {
            if (!mesh.material?.map) return;
            mesh.material.map.offset.set(0, 0);
            mesh.material.map.wrapS = THREE.ClampToEdgeWrapping;
            mesh.material.map.wrapT = THREE.ClampToEdgeWrapping;
        });
        pipeState.meshMap.clear();
        pipeState.speeds.clear();
        pipeState.rafId = null;
        this.pipeFlow = null;
    }
};

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
