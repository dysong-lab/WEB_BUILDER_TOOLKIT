# tempHumiTH2B — Advanced/popup

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경
2. **팝업 상세** — 클릭 시 Shadow DOM 팝업으로 상세 정보 표시

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
| click | `@temphumith2bClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| showDetail() | 팝업 표시 + 현재 상태 데이터 렌더링 (인자 없음, 내부 조회) |
