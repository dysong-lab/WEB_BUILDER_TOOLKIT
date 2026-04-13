# BATT — Advanced/highlight

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경
2. **선택 강조** — 클릭 시 emissive 강조 적용 (이전 강조는 자동 해제)

---

## 구현 명세

### Mixin

MeshStateMixin + MeshHighlightMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### highlight 옵션

| 옵션 | 값 |
|------|-----|
| highlightColor | 0xffaa00 |
| highlightIntensity | 0.4 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 발행 |
|--------|------|
| click | `@battClicked` |

### 커스텀 메서드

없음. 강조 적용은 페이지 `@battClicked` 핸들러가 `meshHighlight.clearAll() → meshHighlight.highlight('BATT')`를 직접 호출한다.

---

## Mixin 공존

MeshStateMixin은 `material.color`, MeshHighlightMixin은 `material.emissive`를 사용하여 채널이 독립적이다. 상태 색상과 선택 강조가 동시 적용되어도 충돌하지 않는다.
