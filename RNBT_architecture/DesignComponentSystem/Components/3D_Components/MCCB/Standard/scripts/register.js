/**
 * MCCB — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 루트 Group 'MCCB'의 자식 3 Mesh(Object299 / Object300 / Rectangle180) 일괄 색상 변경
 *
 * GLTF 구조: scene → "MCCB"(Group) → [Object299(GRAY), Object300(MCCB, texture), Rectangle180(WHITE)].
 * 자식 이름은 3ds Max 기본 네이밍(의미 없음)이므로 페이지는 루트 Group 'MCCB'만 알면 된다.
 * MeshStateMixin은 Group 대상에 대해 traverse로 자식 Mesh들의 material을 일괄 clone + color 적용한다.
 *
 * 3개 material 모두 단일 객체 — MeshStateMixin의 객체 material 경로로 각각 처리.
 * Object300의 baseColorTexture(MCCB.png 라벨)는 유지되고 color 승수만 적용되어 라벨 글자는 보존된다.
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
