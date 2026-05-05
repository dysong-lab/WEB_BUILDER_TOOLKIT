# NavigationBar — Advanced / badgeNotification

## 기능 정의

1. **목적지 항목 렌더링 (Standard 호환)** — `navItems` 토픽으로 수신한 배열(3~5개)을 template 반복으로 렌더링한다. Standard와 동일한 ListRenderMixin 호출 (KEY `menuid`/`active`/`icon`/`label`).
2. **항목별 실시간 알림 배지** — 별도 토픽 `navItemBadges`로 `{ [navid]: count }` 또는 `[{ navid, count, dot? }]` 형태의 배지 데이터를 수신한다. 항목별로 다음 4-state 표시:
   - `count === 0` 또는 `null` → 배지 hidden (`data-badge-count="0"`)
   - `count === 1~99` → 숫자 그대로 표시
   - `count >= 100` → `99+`로 잘려 표시
   - `dot === true` 또는 `count === 'dot'` → 숫자 없이 작은 점만 표시 (`data-badge-count="dot"`)
3. **배지 갱신 펄스 애니메이션** — 직전 카운트 대비 카운트가 증가하거나 dot 상태가 새로 진입한 경우, 해당 항목 배지에 `data-pulse="true"`를 부착하여 1회 펄스 keyframe (scale/opacity)을 트리거한다. 약 600ms 후 dataset를 제거해 다음 갱신을 위해 정리.
4. **외부 활성 항목 강제 (선택)** — `setSelectedNav` 토픽으로 `{ navid }`를 수신하면 해당 항목으로 활성 상태를 강제 전환한다 (Standard에서는 페이지가 직접 `updateItemState`를 호출하지만 본 변형은 토픽 기반 일괄 갱신을 지원).
5. **항목 클릭 이벤트** — Standard와 동일하게 항목 클릭 시 `@navItemSelected`를 발행한다 (Standard의 `@navBarItemClicked`에 대응되지만, 이름을 `@navItemSelected`로 변경하여 변형 의도를 분명히 함). payload는 Wkit 기본(`{ event, targetInstance }`)이며, 페이지가 `event.target.closest`로 navid를 추출.
6. **배지 변경 이벤트 발행 (선택)** — 배지가 펄스를 트리거할 때마다 `@navBadgeChanged`를 발행한다 (payload: `{ navid, count, previousCount }`). 페이지가 햅틱/사운드 등 부수효과를 연결할 수 있다.

> **Standard와의 분리 정당성 (5축)**:
> ① **신규 토픽 2종** — `navItemBadges`(배지 카운트), `setSelectedNav`(외부 활성 강제). Standard는 `navigationBar` 단일 토픽.
> ② **신규 이벤트 1종 + 이름 변경** — `@navBadgeChanged` 신규, `@navBarItemClicked` → `@navItemSelected` (변형 의도 명시).
> ③ **신규 cssSelectors KEY 1종 + datasetAttrs 1종** — `badgeCount` 신규(`.nav-bar__badge-count` 숫자 텍스트). `data-badge-count` (숨김/숫자/dot 분기), `data-pulse` (펄스 트리거) — Standard의 `.nav-bar__badge:empty` 단일 분기보다 풍부.
> ④ **신규 자체 상태 1종** — `_badges: Map<navid, count>` (직전 카운트 보관, 펄스 트리거 비교용). Standard는 자체 상태 0개.
> ⑤ **신규 자체 메서드 3종** — `_renderBadges`, `_setBadge`, `_pulseBadge`. Standard는 `listRender.renderData` 직결.
>
> 위 5축 모두 Standard와 상이 → register.js가 명백히 다르며 Standard 내부 variant로 흡수 불가.
>
> **MD3 / 도메인 근거**: Badge — *"Badges show notifications, counts, or status information on navigation items."* Bottom navigation의 알림 배지는 모바일 앱(메일, 채팅, 장바구니, 친구 요청)의 표준 패턴. Standard는 정적 `badge` 문자열만 — 실시간 카운트 갱신 + 펄스 강조는 별도 토픽/상태/애니메이션이 필요해 본 Advanced 변형으로 분리.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'menuid'`로 개별 항목 상태 변경 활성화) + 자체 상태 1종(`_badges: Map`) + 자체 메서드 3종(`_renderBadges`, `_setBadge`, `_pulseBadge`).

> 신규 Mixin 생성 금지 규칙 준수. ListRenderMixin의 `updateItemState`로 `data-badge-count`/`data-pulse` 속성을 변경하고, 텍스트는 querySelector + textContent로 직접 작성한다 (`badgeCount` 키는 cssSelectors에 등록되어 외부 publish의 `badgeCount` 필드도 자동 textContent에 매핑되지만, 본 변형은 `_setBadge`에서 명시적으로 작성).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container  | `.nav-bar__list` | 항목이 추가될 부모 (규약) |
| template   | `#nav-bar-item-template` | cloneNode 대상 (규약) |
| menuid     | `.nav-bar__item` | 항목 식별 + 클릭 위임 |
| active     | `.nav-bar__item` | 활성 상태 (data-active) |
| icon       | `.nav-bar__icon` | 아이콘 (Material Symbols 등) |
| label      | `.nav-bar__label` | 라벨 텍스트 |
| badge      | `.nav-bar__badge` | 배지 루트 (data-badge-count, data-pulse 부착 대상) |
| badgeCount | `.nav-bar__badge-count` | **신규** — 배지 숫자 텍스트 (textContent) |

### itemKey

`menuid` (개별 항목 `updateItemState` 활성)

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid | menuid |
| active | active |

> `data-badge-count`와 `data-pulse`는 `badge` 요소(`.nav-bar__badge`)에 대해 `_setBadge` 내부에서 직접 setAttribute로 작성한다. `updateItemState`는 항목 루트(`.nav-bar__item`)에만 적용되므로 사용하지 않는다.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_badges` | `Map<string, number\|'dot'\|0>` | 항목별 직전 카운트. 펄스 트리거 비교용. `_renderBadges` 시 갱신. |

### 구독 (subscriptions)

| topic | handler | payload | 의미 |
|-------|---------|---------|------|
| `navItems` | `this.listRender.renderData` | `Array<{menuid, icon, label, active}>` | Standard의 `navigationBar`와 동일 형태 (이름만 변경) |
| `navItemBadges` | `this._renderBadges` | `Object {navid: count}` 또는 `Array<{navid, count, dot?}>` | 배지 카운트 일괄 갱신 |
| `setSelectedNav` | `this._setSelected` | `{ navid }` | 외부에서 활성 항목 강제 전환 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click  | `menuid` | `@navItemSelected` |

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@navBadgeChanged` | 배지가 펄스 트리거(증가 또는 dot 신규 진입)될 때 | `{ targetInstance, navid, count, previousCount }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderBadges({ response })` | `navItemBadges` 핸들러. response가 객체면 entries로 순회, 배열이면 각 원소 처리. 각 항목에 대해 `_setBadge(navid, count, dot?)` 호출. |
| `_setBadge(navid, count, dot)` | 단일 항목 배지를 갱신. `data-badge-count` 분기(`0`/`dot`/숫자), `badgeCount` textContent 작성, 변경 시 `_pulseBadge` 호출 + `_badges` Map 갱신. |
| `_pulseBadge(navid, count, previousCount)` | 펄스 애니메이션 트리거 — `data-pulse="true"` 부착 → 600ms 후 제거. `@navBadgeChanged` 발행. |
| `_setSelected({ response })` | `setSelectedNav` 핸들러. `{ navid }` 받아 모든 항목의 active를 갱신 (`updateItemState`). 마지막 활성 항목 추적은 외부에서 가능하므로 컴포넌트는 모든 항목을 스윕해 `data-active="false"` → 대상만 `"true"`. |

### 데이터 형식

`navItems` payload (Standard 호환):
```json
[
  { "menuid": "home",     "icon": "home",          "label": "Home",     "active": "true"  },
  { "menuid": "messages", "icon": "chat",          "label": "Messages", "active": "false" },
  { "menuid": "alerts",   "icon": "notifications", "label": "Alerts",   "active": "false" },
  { "menuid": "cart",     "icon": "shopping_cart", "label": "Cart",     "active": "false" },
  { "menuid": "profile",  "icon": "person",        "label": "Profile",  "active": "false" }
]
```

`navItemBadges` payload (객체 또는 배열, 둘 다 인식):
```json
// 객체 형태 — 키가 navid
{ "messages": 3, "alerts": 134, "cart": 0, "profile": "dot" }

// 배열 형태 — 각 원소에 navid + count + dot
[
  { "navid": "messages", "count": 3 },
  { "navid": "alerts",   "count": 134 },
  { "navid": "profile",  "dot": true }
]
```

`setSelectedNav` payload:
```json
{ "navid": "alerts" }
```

### 페이지 연결 사례

```
[페이지 onLoad]
  this.pageDataMappings = [
    { topic: 'navItems',       datasetInfo: { datasetName: 'nav_items' } },
    { topic: 'navItemBadges',  datasetInfo: { datasetName: 'nav_unread_counts' }, refreshInterval: 15000 }
  ];

  Wkit.onEventBusHandlers({
    '@navItemSelected': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.menuid);
        const navid = item?.dataset.menuid;
        if (!navid) return;
        // 라우팅
        router.go(navid);
        // 외부 publish로 활성 강제 (모든 인스턴스에 동기화)
        targetInstance.subscriptions.setSelectedNav.forEach(h => h.call(targetInstance, { response: { navid } }));
        // 클릭한 항목의 배지를 0으로 리셋(서버 PATCH 응답 후 다음 publish에서 자연 갱신)
        fetch(`/api/nav/${navid}/read`, { method: 'PATCH' });
    },
    '@navBadgeChanged': ({ navid, count, previousCount }) => {
        if (count > previousCount) navigator.vibrate?.(30);
    }
  });
```

> **명령형 호출의 정당성**: 클릭 즉시 카운트를 0으로 만들지 않는다 — 서버가 단일 진실 소스이며, 페이지가 PATCH 결과로 다음 `fetchAndPublish('navItemBadges')`를 트리거하면 컴포넌트는 자연스럽게 재렌더된다. 컴포넌트 내부에서 클라이언트 측 dec/clear 로직을 넣지 않는다.

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 퍼플 팔레트, 다크, Pretendard. 배지는 크림슨 액센트(#F43031), 펄스는 글로우 + scale 1.0→1.25→1.0 | 메시징 앱 — 미읽음 메시지/알림 카운트 |
| `02_material`    | B: Material Elevated | 블루 팔레트, 라이트, Roboto. MD3 표준 배지(빨강 #d32f2f), 펄스는 elevation shadow + scale | E-커머스 앱 — 장바구니 상품 수, 주문 상태 알림 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이, 라이트, 세리프 라벨. 배지는 미니멀 점/괄호숫자, 펄스는 페이드인 + 미세 톤 시프트 | 매거진/뉴스 앱 — 새 기사/뉴스레터 알림 |
| `04_operational` | D: Dark Operational | 시안 팔레트, 다크, IBM Plex Mono. 배지는 노란/빨간 강조 사각, 펄스는 깜빡임 1회 + 외곽선 강조 | 운영 콘솔 앱 — 미해결 알람/경보 카운트 (작업자 즉시 인지) |

### 결정사항

- **navItemBadges 두 형태 동시 지원**: 객체(`{navid: count}`)와 배열(`[{navid, count, dot}]`) 둘 다 받는다. 객체는 짧고 자연스러운 외부 API 형태, 배열은 명시적 dot/count 분리가 필요한 경우. `_renderBadges`가 형태를 자동 분기.
- **펄스 트리거 조건**: 카운트가 이전보다 증가, 또는 dot 신규 진입. 카운트 감소(읽음 처리)는 펄스를 트리거하지 않는다 — 사용자 액션의 자연 결과이므로 강조 불필요.
- **펄스 600ms 단발**: setTimeout으로 dataset 제거. 동시에 같은 항목이 또 갱신되면 timeout을 reset하여 펄스 재시작 (펄스 큐잉은 하지 않음 — UX상 단발이 적절).
- **`_badges: Map`을 Mixin이 아닌 자체 상태로**: ListRenderMixin은 항목 dataset을 가지지만, "직전 카운트 비교"는 도메인 로직이라 Mixin 책임이 아님. 별도 Map으로 분리.
- **`@navItemSelected` 이름 변경**: Standard의 `@navBarItemClicked`는 단순 클릭 의미. 본 변형은 라우팅/탐색 의도를 명확히 하기 위해 `@navItemSelected`로 변경 (의미상 "사용자가 이 목적지를 선택").
- **`setSelectedNav`는 단방향**: 외부 → 컴포넌트만 흐름. 클릭 시 컴포넌트가 자동 publish하지 않는다 — 페이지가 라우팅 정책에 따라 결정해서 publish할지 고른다.
