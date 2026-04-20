# ACBmetasol — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경

---

## 구현 명세

### Mixin

MeshStateMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### meshName 목록

| meshName | 설명 |
|----------|------|
| DDH003 | 본체 메시 1 |
| DDH005 | 본체 메시 2 |
| DDH001 | 본체 메시 3 |
| DDH002 | 본체 메시 4 |
| DDH021 | 본체 메시 5 |
| Object231 | 상단 보조 메시 |
| Rectangle070 | 하단 보조 메시 |
| Line005 | 라인 메시 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음

### 커스텀 메서드

없음
