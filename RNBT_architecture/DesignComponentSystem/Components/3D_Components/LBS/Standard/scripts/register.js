/**
 * LBS — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 'LBS' Group 하위 Mesh들의 material 색상 변경
 *
 * GLTF 내부 구조: Group 'LBS' → { Line012, Circle073, Rectangle171, Circle071 }
 * 폴더명과 GLTF 최상위 Node 이름이 모두 'LBS'로 일치한다.
 * MeshStateMixin은 Group을 받으면 자식 Mesh들을 traverse하여 일괄 적용한다.
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
