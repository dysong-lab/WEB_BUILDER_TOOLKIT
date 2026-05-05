# AppBars — Advanced / notificationBadge

## 기능 정의

1. **페이지 제목 표시** — `appBarInfo` 토픽으로 수신한 `title`을 제목 영역에 렌더 (Standard와 동일한 슬롯이지만, 본 변형은 별도 토픽 `badgeInfo`로 배지 데이터를 분리 구독한다).
2. **알림 배지 카운트 표시** — `badgeInfo` 토픽으로 수신한 `{ count, label }`을 알림 액션의 우상단 배지에 렌더한다. `count=0`이면 배지를 숨기고(점/숫자 모두 비표시), `count>0`이면 숫자(혹은 99+ 잘림)를, `count='dot'`이면 숫자 없는 점만 표시한다 (MD3 Badge: numeric vs small).
3. **배지 영역 클릭 트리거** — 알림 액션(notificationAction) 클릭 시 `@badgeClicked`를 발행한다. payload로 클릭 시점 카운트를 전달해 페이지가 알림 패널을 열거나 카운트를 즉시 0으로 리셋하는 후속 처리를 결정한다.
4. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked`를 발행한다 (Standard와 동일 슬롯 — 변형 도입으로 잃지 않는다).

> **Standard와의 분리 정당성**:
> - **새 토픽** — `badgeInfo`를 추가 구독한다 (Standard는 `appBarInfo` 단일 토픽).
> - **새 이벤트** — `@badgeClicked` 발행 (Standard에는 일반 `@actionClicked`만 존재).
> - **새 cssSelectors KEY 3종** — `badge`, `badgeCount`, `notificationAction` 추가 + 새 `datasetAttrs` (`badge → 'visible'`)로 카운트 0 / dot / 숫자의 3-state 표현.
> - **새 커스텀 메서드** — `renderBadge` (count → label 변환 + visibility dataset 분기). Standard는 fieldRender.renderData 직결.
> - **새 payload 형태** — `@badgeClicked`가 클릭 당시 카운트를 payload로 전달 (Standard는 무 payload).
>
> 위 5축 모두 Standard와 상이 → register.js가 명백히 다름. Standard 내부 variant로 흡수 불가.
>
> **MD3 근거**: Badge — "Badges show notifications, counts, or status information on navigation items and icons." Top app bar의 액션 아이콘에 부착되는 숫자/점 배지가 표준 패턴. 카운트 0 vs dot vs 숫자 vs 99+ 잘림 분기는 MD3 small/large badge 행동과 일치.

---

## 구현 명세

### Mixin

FieldRenderMixin + 커스텀 메서드(`renderBadge`)

> ListRenderMixin은 사용하지 않는다 — 알림은 단일 카운트(객체) 표시이며 배열 렌더 대상이 아님.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| bar | `.top-app-bar` | 루트 요소 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 — click 위임 |
| title | `.top-app-bar__title` | 페이지 제목 텍스트 |
| notificationAction | `.top-app-bar__action--notifications` | 배지가 부착된 알림 액션 버튼 — click 위임 (`@badgeClicked` 발행) |
| badge | `.top-app-bar__badge` | 배지 루트 (visibility dataset 토글 대상) |
| badgeCount | `.top-app-bar__badge-count` | 배지 숫자 텍스트 (textContent) |

### datasetAttrs

| KEY | 속성 |
|-----|------|
| badge | `visible` |

> `[data-visible="hidden"|"dot"|"count"]` 3-state: hidden=완전 숨김, dot=숫자 없는 점, count=숫자 표시.
> CSS는 `.top-app-bar__badge[data-visible="..."]` 셀렉터로 분기한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |
| badgeInfo | `this.renderBadge` — 커스텀 dispatcher (count → visibility dataset + label 변환) |

페이로드 예시:
```json
// appBarInfo
{ "response": { "title": "Inbox" } }

// badgeInfo
{ "response": { "count": 12 } }     // → data-visible="count", badgeCount="12"
{ "response": { "count": 0 } }      // → data-visible="hidden"
{ "response": { "count": 'dot' } }  // → data-visible="dot", badgeCount=""
{ "response": { "count": 134 } }    // → data-visible="count", badgeCount="99+"
```

`renderBadge`는 다음 분기로 `fieldRender.renderData`를 호출한다:

```javascript
this.renderBadge = ({ response }) => {
    const c = response.count;
    if (c === 0 || c == null)             return this.fieldRender.renderData({ response: { badge: 'hidden', badgeCount: '' } });
    if (c === 'dot')                      return this.fieldRender.renderData({ response: { badge: 'dot',    badgeCount: '' } });
    const label = (typeof c === 'number' && c > 99) ? '99+' : String(c);
    return this.fieldRender.renderData({ response: { badge: 'count', badgeCount: label } });
};
```

> `badge` 키는 `datasetAttrs: { badge: 'visible' }`에 의해 `data-visible` 속성으로 매핑되고, `badgeCount`는 일반 textContent 매핑.

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload (Wkit.emitEvent / bus) |
|--------|------------------|------|---------|
| click | `navIcon` | `@navigationClicked` | — |
| click | `notificationAction` | `@badgeClicked` | `{ event }` (페이지가 `event.target` 또는 현재 데이터 카운트로 후속 결정) |

> bindEvents 경로는 customEvents 디스패처 기본 동작에 따라 `{ event }` 페이로드를 핸들러에 전달한다. 페이지는 자신이 마지막으로 publish한 카운트를 알고 있으므로 별도 payload를 컴포넌트가 만들지 않는다 — `@badgeClicked`는 "사용자가 알림 영역을 눌렀다"는 의도 신호다.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `renderBadge({ response })` | `({ response: { count } })` | count(number/'dot'/0/null)를 받아 `data-visible` 3-state와 textContent를 결정해 `fieldRender.renderData`로 위임. |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'appBarInfo', datasetInfo: { datasetName: 'page_meta' } },
   │     { topic: 'badgeInfo',  datasetInfo: { datasetName: 'unread_notifications' }, refreshInterval: 30000 }
   │   ]
   │   → fetchAndPublish 두 토픽 → AppBar.fieldRender.renderData / AppBar.renderBadge
   │
   └─ Wkit.onEventBusHandlers({
        '@navigationClicked': () => drawer.open(),
        '@badgeClicked':       () => {
            notificationPanel.open();
            // 패널이 읽음 처리 후 서버에 PATCH → 다음 fetchAndPublish('badgeInfo')에서 카운트가 0으로 갱신
            GlobalDataPublisher.fetchAndPublish('badgeInfo', this, { force: true });
        }
      });
```

> **명령형 호출의 정당성**: 클릭 즉시 카운트를 0으로 만들지 않는다 — 서버가 단일 진실 소스이며, 페이지가 패널 오픈 후 PATCH 결과로 다음 publish를 트리거하면 컴포넌트는 자연스럽게 재렌더된다. 컴포넌트 안에 클라이언트 측 dec/clear 로직을 넣지 않는다.

---

## 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard, 배지 크림슨 액센트 |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto, 배지 빨강(MD error) |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 라이트, 넓은 여백, 배지 미니멀 점·세리프 숫자 |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 배지 노랑 펄스(미해결 알람 강조) |
