# BATT — Advanced/popup

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
| click | `@battClicked` |

### 커스텀 메서드

없음. 팝업 표시는 외부에서 `instance.shadowPopup.show()`를 직접 호출한다 (`@battClicked` 이벤트 수신자가 책임). 콘텐츠는 publishCode HTML/CSS 자체로 결정한다.
