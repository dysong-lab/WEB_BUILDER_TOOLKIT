/**
 * PCS — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`PCS` — **단일 Mesh Node**. 폴더명(`PCS`) = GLTF Mesh Node 이름(`PCS`) = mesh 이름(`PCS`) = material 이름(`PCS`) **네 이름이 모두 동일**. MeshStateMixin의 단일-Mesh 경로(`obj.isMesh ? applyColor(obj) : traverse`)에서 Mesh 브랜치로 직진." 메시 색상 변경
 */

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

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
