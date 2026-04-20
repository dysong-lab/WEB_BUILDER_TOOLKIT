# Cards — Standard

## 기능 정의

1. **카드 본문 렌더링** — `cardInfo` 토픽으로 수신한 단일 객체 데이터(아이콘/헤드라인/서브헤드/본문)를 카드 본문 영역에 렌더
2. **액션 버튼 렌더링** — `cardActions` 토픽으로 수신한 배열 데이터를 template 반복으로 카드 하단 액션 영역에 렌더
3. **카드 클릭 이벤트** — 카드 영역 클릭 시 `@cardClicked` 발행
4. **액션 버튼 클릭 이벤트** — 액션 버튼 클릭 시 `@cardActionClicked` 발행

---

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

- FieldRenderMixin — 카드 본문 (단일 객체: icon, headline, subhead, supporting)
- ListRenderMixin — 액션 버튼 배열 반복

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 카드 본문

| KEY | VALUE | 용도 |
|-----|-------|------|
| card | `.card` | 카드 루트 — 이벤트 매핑 |
| icon | `.card__icon` | 미디어 아이콘 (선택적) |
| headline | `.card__headline` | 헤드라인(제목) 텍스트 |
| subhead | `.card__subhead` | 서브헤드(보조 라벨) 텍스트 |
| supporting | `.card__supporting` | 본문(supporting text) |

#### ListRenderMixin (`this.listRender`) — 액션 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.card__actions` | 항목이 추가될 부모 (규약) |
| template | `#card-action-template` | cloneNode 대상 (규약) |
| actionid | `.card__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.card__action-label` | 액션 라벨 |
| actionIcon | `.card__action-icon` | 액션 아이콘 (선택적) |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| cardInfo | `this.fieldRender.renderData` |
| cardActions | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `card` (fieldRender.cssSelectors) | `@cardClicked` |
| click | `actionid` (listRender.cssSelectors) | `@cardActionClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('cardInfo', this)──> [Cards] 본문 렌더링
         publish data: { icon, headline, subhead, supporting }

[페이지] ──fetchAndPublish('cardActions', this)──> [Cards] 액션 렌더링
         publish data: [{ actionid, actionIcon, actionLabel }, ...]

[Cards] ──@cardClicked──> [페이지] ──> 카드 상세 페이지로 이동 또는 선택 상태 토글

[Cards] ──@cardActionClicked──> [페이지] ──> 액션 식별(data-actionid)하여 실행
                                             액션 버튼의 클릭은 stopPropagation 없이
                                             @cardClicked와 함께 발행될 수 있으므로
                                             페이지는 actionid 존재 여부로 분기한다
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 헤더 + Filled 카드 |
| 02_material | B: Material Elevated | 라이트 블루 Elevated, Roboto, shadow elevation |
| 03_editorial | C: Minimal Editorial | 웜 그레이 Outlined, Georgia 세리프, 미니멀 여백 |
| 04_operational | D: Dark Operational | 다크 시안 컴팩트, JetBrains Mono, 바 헤더 + 상태 outline |
