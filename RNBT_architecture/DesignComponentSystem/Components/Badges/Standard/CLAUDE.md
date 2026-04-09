# Badges — Standard

## 기능 정의

1. **카운트 표시** — `badgeInfo` 토픽으로 수신한 카운트를 배지 텍스트에 렌더링
2. **빈값 자동 숨김** — count가 `null`, `undefined`, `''`, `0`, `'0'`이면 배지를 숨김
3. **크기 상태 전환** — `size` 값에 따라 `small` / `large` 형태를 전환

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| anchor | `.badge-anchor` | 클릭 이벤트 트리거 |
| badge | `.badge` | 루트 요소, size/visible 상태 반영 |
| count | `.badge__count` | 카운트 텍스트 표시 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| badgeInfo | `this.renderBadgeInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `anchor` (computed property) | `@badgeClicked` |

### 페이지 연결 사례

```text
[Badges/Standard] ──@badgeClicked──▶ [페이지] ──▶ 알림 패널 열기
                                          또는 관련 리스트로 이동
                                          또는 읽음 처리 팝업 열기
```

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderBadgeInfo({ response: data })` | count 정규화 후 `FieldRenderMixin`으로 렌더링하고, `data-size`, `data-visible`, `aria-label`을 동기화 |

### 데이터 계약

```javascript
{
    count: '12',      // number|string, 100 이상이면 99+로 정규화
    size: 'large'     // 'small' | 'large'
}
```

### 표시 규칙

- `count`가 없거나 0이면 `data-visible="false"`로 숨김 처리
- `size`가 없으면 `large`
- `size === 'small'`이면 점 배지 형태로 렌더링하고 텍스트는 숨김
- 표시 텍스트는 최대 4자 이내를 유지하며, 100 이상은 `99+`

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 글로우 링, 다크 |
| 02_material | B: Material Elevated | 블루/레드 MD 톤, 라이트 |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 잉크 라벨 감성 |
| 04_operational | D: Dark Operational | 시안/레드 대비, 모노스페이스 HUD |
