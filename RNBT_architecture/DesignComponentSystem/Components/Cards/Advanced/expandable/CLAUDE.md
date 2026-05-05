# Cards — Advanced / expandable

## 기능 정의

1. **카드 본문 렌더링** — `cardInfo` 토픽으로 수신한 단일 객체 데이터(`icon`, `headline`, `subhead`, `summary`, `details`)를 카드 영역에 렌더 (FieldRenderMixin). `summary`는 항상 보이는 요약 텍스트(collapsed 상태에서도 노출), `details`는 expanded 상태에서만 보이는 본문(접힘 영역).
2. **확장/접힘 토글 (자체 메서드)** — 카드 헤더 또는 토글 버튼(`.card__toggle`) 클릭 시 `expanded ↔ collapsed` 상태가 토글된다. 카드 루트의 `data-expanded="true|false"` 속성으로 CSS가 `.card__details`(접힘 영역)의 `max-height` / `opacity`를 transition한다. chevron 아이콘은 180° 회전.
3. **확장/접힘 이벤트 발행** — 상태가 실제로 바뀐 시점에만 `@cardExpanded`(접힘 → 펼침) 또는 `@cardCollapsed`(펼침 → 접힘)를 1회 발행. payload: `{ cardId }`. cardId는 `cardInfo.id`로 받은 값을 우선 사용하며, 없으면 인스턴스 id로 fallback.
4. **외부 강제 토글 (선택 토픽)** — `setExpanded` 토픽 publish 시 데이터의 boolean으로 강제 expand/collapse. 페이지가 다른 카드 클릭 시 단일 expansion을 강제하거나, "전체 펼침" 컨트롤을 구현할 수 있다.
5. **액션 버튼 클릭 이벤트** — Standard와 동일하게 `.card__action` 클릭 시 `@cardActionClicked` 발행. 액션 버튼은 본문(`details`) 안에 위치하며, 클릭은 토글과 분리(stopPropagation 없이 위임 + 핸들러 분리).

> **Standard와의 분리 정당성**:
> - **새 cssSelectors KEY 3종** — `toggle` (헤더의 토글 버튼/chevron), `details` (접힘 본문 영역 — Standard의 `supporting`을 대체/확장), `summary` (collapsed 상태에서도 보이는 요약 텍스트).
> - **자체 상태 (`_isExpanded`)** — Standard는 stateless. 이 변형은 boolean 상태 + dataset 토글을 관리.
> - **자체 메서드 4종** — `_handleToggle`, `_expand`, `_collapse`, `_setExpanded`(상태 전환의 단일 진입점) + `setExpanded`(외부 명령형 API).
> - **새 이벤트 2종** — `@cardExpanded`, `@cardCollapsed` 가 추가되어 페이지가 다른 카드/패널과 동기화 가능.
> - **새 구독 토픽 (`setExpanded`)** — 외부 강제 토글용. Standard에는 없음.
>
> 위 4축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**: `AppBars/Advanced/scrollCollapsing` (height 전환 + boolean 상태 토글 + 이벤트 발행), `AppBars/Advanced/contextual` (상태 토글 + 시각 분기), `Buttons/Buttons/Advanced/confirmation` (자체 상태머신 + 이벤트 발행).

---

## 구현 명세

### Mixin

FieldRenderMixin + 커스텀 메서드(`_handleToggle`, `_expand`, `_collapse`, `_setExpanded`, `setExpanded`)

> ListRenderMixin은 사용하지 않는다 — 액션이 1~2개로 고정이므로 HTML에 직접 작성. 단순 토글이 본 변형의 핵심이고, 액션 리스트 동적 렌더는 Standard의 책임.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| card | `.card` | 카드 루트 — `data-expanded="true|false"` 토글 대상 + 헤더 클릭 위임 |
| icon | `.card__icon` | 미디어 아이콘 (선택적) |
| headline | `.card__headline` | 헤드라인(제목) 텍스트 |
| subhead | `.card__subhead` | 서브헤드(보조 라벨) 텍스트 |
| summary | `.card__summary` | 요약 텍스트 (collapsed 상태에서도 보임) |
| details | `.card__details-text` | 본문 텍스트(접힘 영역의 텍스트 대상 — textContent로 매핑) |
| detailsArea | `.card__details` | 접힘 영역 컨테이너 — `max-height`/`opacity` transition 대상 (CSS 셀렉터용, 데이터 매핑 없음) |
| toggle | `.card__toggle` | 토글 버튼/chevron — click 이벤트 위임 (chevron 180° rotate 대상) |
| action | `.card__action` | 액션 버튼 — 클릭 위임 |

### datasetAttrs

| KEY | data-* |
|-----|--------|
| — | (없음) |

> `card` 요소의 `data-expanded="true|false"`는 컴포넌트 내부 `_setExpanded()`가 `cardEl.dataset.expanded = String(next)`로 직접 갱신한다 (외부 발행 데이터가 아니므로 datasetAttrs 매핑은 두지 않는다). CSS는 `.card[data-expanded="true|false"]` 셀렉터로 두 상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_isExpanded` | `boolean` | 현재 expanded 상태 (기본 `false`) |
| `_cardId` | `string \| null` | `cardInfo.id`로 수신된 카드 식별자 (없으면 `this.id` fallback) |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `cardInfo` | `this._renderCardInfo` | `{ id?, icon, headline, subhead, summary, details }` 수신 → fieldRender로 렌더 + `_cardId` 보관 |
| `setExpanded` | `this._handleExternalSet` | `{ expanded: boolean }` 수신 → 강제 expand/collapse |

페이로드 예시:
```json
{ "response": { "id": "card-001", "icon": "info", "headline": "장비 상태", "subhead": "RNBT-01", "summary": "정상 운영 중", "details": "최근 24시간 평균 부하 62%, 온도 38°C..." } }
```

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `toggle` | 토글 버튼 클릭 | (직접 분기 — `_handleToggle` 호출) |
| click | `card` | 카드 헤더 영역 클릭 (action/details 외부) | (직접 분기 — `_handleToggle` 호출) |
| click | `action` | 액션 버튼 클릭 | `@cardActionClicked` |

> 카드 본체 click과 toggle click은 모두 `_handleToggle`에 위임된다(같은 분기 → 통합 가능). action click은 별도 `@cardActionClicked` 발행. action click이 먼저 처리되어 토글이 동시에 발생하지 않도록 `_handleToggle`은 `event.target.closest('.card__action')` 시 early return.

### 자체 발행 이벤트 (Wkit.emitEvent)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@cardExpanded` | collapsed → expanded 전환된 시점 1회 | `{ targetInstance, cardId }` (`Wkit.emitEvent` 표준 + `cardId` 동봉) |
| `@cardCollapsed` | expanded → collapsed 전환된 시점 1회 | `{ targetInstance, cardId }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderCardInfo({ response })` | `({response}) => void` | `cardInfo` 수신 핸들러 — `id`를 `_cardId`에 보관 후 fieldRender.renderData 위임 |
| `_handleToggle(event)` | `(MouseEvent) => void` | 카드/토글 클릭 핸들러. action 클릭은 무시. `_isExpanded`를 toggle하여 `_setExpanded` 호출 |
| `_setExpanded(next)` | `(boolean) => void` | 상태가 실제로 바뀔 때만 dataset.expanded 갱신 + 이벤트 발행 (멱등) |
| `_expand()` | `() => void` | 강제 expand. 이미 expanded면 no-op. |
| `_collapse()` | `() => void` | 강제 collapse. 이미 collapsed면 no-op. |
| `setExpanded(value)` | `(boolean) => void` | 외부 명령형 API. `_setExpanded(Boolean(value))` 호출 |
| `_handleExternalSet({ response })` | `({response}) => void` | `setExpanded` 토픽 수신 핸들러 — `response.expanded` boolean으로 강제 토글 |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [{ topic: 'cardInfo', datasetInfo: {...} }]
   │   → fetchAndPublish → Card.fieldRender.renderData (제목/요약/상세 렌더)
   │
   └─ Wkit.onEventBusHandlers({
        '@cardExpanded':   ({ cardId }) => analytics.track('card_expanded', { cardId }),
        '@cardCollapsed':  ({ cardId }) => analytics.track('card_collapsed', { cardId }),
        '@cardActionClicked': ({ event }) => { ... }
      });

[사용자 클릭] → 헤더/토글 클릭 → @cardExpanded 발행 + max-height transition

[다른 카드 펼침 시 단일 expansion 강제 (선택)]
   페이지가 selectedCardId 변경 시 다른 카드들에 대해
   otherCardInstance.setExpanded(false) 호출 또는
   instance.subscriptions.setExpanded.forEach(h => h.call(instance, { response: { expanded: false } }))
```

### 디자인 변형

| 파일 | 페르소나 | expand transition 차별화 |
|------|---------|--------------------------|
| `01_refined` | A: Refined Technical | 부드러운 spring-easing(cubic-bezier 220ms) + chevron 회전 + 헤드라인 글로우 미세 강화 |
| `02_material` | B: Material Elevated | elevation 단계 상승(shadow 강화) + body fade-in + chevron 회전 |
| `03_editorial` | C: Minimal Editorial | 여백 확장 + serif body fade + chevron 0.6 ease-out 회전 |
| `04_operational` | D: Dark Operational | instant snap(80ms) + 시안 ring border 강화 + chevron 빠른 회전 |

각 페르소나는 `[data-expanded="true|false"]` 셀렉터로 `.card__details`의 `max-height` / `opacity`와 `.card__toggle`의 chevron 회전을 동시에 transition한다.
