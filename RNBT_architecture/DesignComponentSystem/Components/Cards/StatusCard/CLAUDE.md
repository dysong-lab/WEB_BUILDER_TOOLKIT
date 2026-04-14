# Cards — StatusCard

## 기능 정의

1. **시스템 정보 표시** — `systemInfo` 토픽으로 수신한 정보를 카드에 렌더링
2. **상태 속성 동기화** — `status` 값을 상태 요소의 `data-status`로 반영
3. **카드 클릭 이벤트 발행** — 카드 루트 클릭 시 `@statusCardClicked` 이벤트를 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| card | `.status-card` | 카드 루트, 클릭 이벤트 타깃 |
| name | `.status-card__name` | 시스템 이름 표시 |
| status | `.status-card__status` | `data-status` 반영 |
| statusLabel | `.status-card__status` | 상태 텍스트 표시 |
| version | `.status-card__version` | 버전 표시 |
| uptime | `.status-card__uptime` | 가동 시간 표시 |

### datasetAttrs

```javascript
{
    status: 'status'
}
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| systemInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `card` (computed property) | `@statusCardClicked` |

### 데이터 계약

```javascript
{
    name: 'RNBT-01',
    status: 'RUNNING',
    statusLabel: '정상',
    version: 'v2.4.1',
    uptime: '12d 03h'
}
```

### 페이지 연결 사례

```text
[페이지] ──systemInfo 토픽──▶ [Cards/StatusCard] ──▶ 시스템 상태 표시

[Cards/StatusCard] ──@statusCardClicked──▶ [페이지] ──▶ 상세 상태 패널 열기
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 유리질 패널, 블루 하이라이트, 다크 |
| 02_material | B: Material Elevated | MD3 카드 톤, 라이트 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 미니멀 에디토리얼 |
| 04_operational | D: Dark Operational | 다크 HUD, 시안 상태 강조 |
