# gltf_container — Advanced/popup

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **팝업 상세** — 클릭된 Mesh의 상세 정보를 Shadow DOM 팝업으로 표시

---

## 구현 명세

### Mixin

MeshStateMixin + 3DShadowPopupMixin

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 발행 |
|--------|------|
| click | `@meshClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| resolveMeshName(event) | intersects에서 Mesh 이름 동적 추출 |
| showDetail(meshName, data) | 팝업 표시 + 외부 데이터 렌더링 (인자 있음) |
