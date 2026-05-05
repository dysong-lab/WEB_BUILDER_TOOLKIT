# SplitButtons — Advanced / recentActions

## 기능 정의

1. **메인 액션 버튼 렌더링 + 이벤트** — `splitButtonInfo` 토픽으로 수신한 `{ mainAction: { id, label, icon? }, menuItems: [...] }` 페이로드 중 `mainAction`을 메인 버튼에 표시하고, 클릭 시 `@splitMainClicked` 발행 (payload: `{ actionId }`).
2. **Recent + 전체 메뉴 통합 렌더** — 페이로드의 `menuItems` 배열을 ListRenderMixin이 한 번의 cloneNode로 단일 ul에 렌더한다. localStorage(`splitButton_recentActions_<storageKey>`)에서 최근 사용 액션 ID 배열을 읽어, 동일 menuItems 중 최근 N개(기본 3)를 **상단 Recent 섹션**으로 prepend한 후 그 아래 전체 menuItems를 표시한다. Recent 항목과 일반 항목은 단일 배열 `[{ actionId, label, icon, isRecent }]` 형태로 합쳐 ListRender에 전달되고, `data-recent="true"` dataset로 시각 분기된다. Recent 섹션 라벨(`.split-button__recent-label`)은 view에 정적으로 존재하며, recent 항목이 0개이면 CSS로 숨김.
3. **메뉴 토글 + outside click + ESC close** — 트레일링 화살표 클릭 → `_isOpen` 토글 + `data-menu-state="open|closed"` 갱신. 메뉴 열기 시 `_renderWithRecent`를 호출하여 매번 최신 recent state로 다시 렌더(다른 사용자/탭에서 갱신된 localStorage를 반영). 외부 클릭(capture phase) / `Escape` 키 → 자동 close.
4. **메뉴 항목 클릭 — 발행 + Recent 기록 + 자동 close** — `.split-button__menu-item` 클릭 시 ① `@splitMenuItemClicked` 발행 (payload: `{ actionId, fromRecent: bool }`, fromRecent는 클릭된 요소의 `data-recent="true"` 여부), ② `_saveRecent(actionId)`가 localStorage에 시간순 + 중복 제거하여 갱신, ③ `_close()`로 메뉴 닫힘. 다음 열기 시 새로운 Recent 순서가 반영됨.

> **Standard와의 분리 정당성**: Standard는 ① 토픽 분리(`splitButtonAction` + `splitButtonMenuItems`), ② 단일 메뉴 셋(recent 개념 없음), ③ FieldRenderMixin(메인 버튼) + ListRenderMixin(메뉴 항목)만 사용, ④ 이벤트 `@splitActionClicked` / `@splitMenuToggled` / `@splitMenuItemClicked`(payload: 없음·Weventbus 기본). recentActions는 ① 단일 토픽 `splitButtonInfo`(`{ mainAction, menuItems }`), ② Recent 섹션 + 전체 메뉴의 통합 렌더 (단일 ListRender + `data-recent` 분기), ③ localStorage 영속화(`_loadRecent` / `_saveRecent`) + in-memory fallback, ④ 자체 메서드 `_renderWithRecent` / `_handleMenuItemClick` / `_handleTriggerClick` / `_handleOutsideClick` / `_handleEscKey` / `_open` / `_close`, ⑤ document-level outside click + keydown 리스너, ⑥ 새 이벤트 `@splitMainClicked`(payload: `{ actionId }`) + `@splitMenuItemClicked`(payload 추가: `{ actionId, fromRecent }`) — 여섯 축 모두 Standard register.js와 직교. 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **MD3 / 도메인 근거**: 최근 사용 액션 우선순위 노출은 macOS Finder "Recent Items", VSCode "Recent Files", Slack quick switcher, Gmail/Drive "최근 사용 항목" 등에서 광범위하게 채택되는 표준 패턴이다. SplitButton은 메인 액션 + 옵션 메뉴 구조이므로 옵션 메뉴 안에서 **자주 쓰는 액션의 발견 비용을 0에 수렴**시키는 패턴과 자연스럽게 결합된다 — 빈도가 높은 액션이 메뉴 상단으로 자동 승격되어 클릭 거리가 줄어든다.

> **localStorage 영속화 — 컴포넌트 데이터 영속화의 첫 사례**: 본 변형은 RNBT DesignComponentSystem 컴포넌트 중 **localStorage를 직접 사용하는 첫 사례**다. 핵심 원칙 ① graceful fallback: localStorage 접근(read/write) 실패 시 `try/catch`로 in-memory(`this._recentActionsMem`) fallback. private mode / quota / SecurityError 등 어떤 실패도 컴포넌트 동작을 멈추지 않음. ② 인스턴스 격리: localStorage key는 `splitButton_recentActions_<storageKey>` 형태로 컴포넌트 옵션 `recentStorageKey`(기본: `instance.id`)별 격리되어, 같은 페이지에 여러 SplitButton이 있어도 서로 다른 recent를 유지. ③ 양은 단조 제한: `_saveRecent`는 신규 actionId를 timeline 맨 앞에 unshift, 중복은 제거, 전체는 N=10으로 truncate(저장 비용 상한). 표시는 N=3(기본). ④ 데이터 형식: `JSON.stringify([actionId, actionId, ...])` 단순 string ID 배열. label/icon은 `menuItems`(외부 publish)에서 lookup하여 join — Recent 항목의 메타데이터는 **항상 최신 menuItems 출처**가 진실 소스(라벨/아이콘 변경 시 영속 데이터를 마이그레이션할 필요 없음).

---

## 구현 명세

### Mixin

FieldRenderMixin (메인 액션 버튼 라벨/아이콘) + ListRenderMixin (Recent + 전체 메뉴 통합 렌더) + 자체 메서드 (`_loadRecent` / `_saveRecent` / `_renderWithRecent` / `_handleMenuItemClick` / `_handleTriggerClick` / `_handleOutsideClick` / `_handleEscKey` / `_open` / `_close`).

> Standard와 같은 두 Mixin을 사용하되, 핸들러 결합 방식이 다르다. Standard는 두 Mixin이 각자의 토픽을 직접 구독하지만, recentActions는 단일 토픽 `splitButtonInfo`를 자체 메서드 `_renderWithRecent`가 받아 ① mainAction은 `fieldRender.renderData` 호출, ② menuItems는 recent + 전체로 합쳐 `listRender.renderData` 호출 — wrapper 패턴(Mixin 메서드 재정의 금지 규칙 준수).

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 메인 액션 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| action     | `.split-button__action`       | 메인 액션 버튼 — 이벤트 매핑 + actionId dataset 부착 |
| actionIcon | `.split-button__action-icon`  | 메인 아이콘 (선택적) |
| actionLabel| `.split-button__action-label` | 메인 라벨 |

#### ListRenderMixin (`this.listRender`) — Recent + 전체 메뉴 항목

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.split-button__menu-list`             | 항목이 추가될 부모 ul (규약) |
| template  | `#split-button-recent-item-template`   | cloneNode 대상 (규약) |
| item      | `.split-button__menu-item`             | 항목 식별 + 이벤트 매핑 |
| actionId  | `.split-button__menu-item`             | data-action-id (항목 click 시 actionId 추출) |
| isRecent  | `.split-button__menu-item`             | data-recent (Recent 항목 시각 분기) |
| menuLabel | `.split-button__menu-label`            | 메뉴 항목 라벨 |
| menuIcon  | `.split-button__menu-icon`             | 메뉴 항목 아이콘 (선택적) |

#### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest('.split-button__menu-item')?.dataset.actionId` |
| isRecent | `recent`    | `data-recent="true"` Recent 항목 CSS 시각 분기 |

#### 사용자 정의 (cssSelectors 외부)

| KEY | VALUE | 용도 |
|-----|-------|------|
| trigger | `.split-button__trigger` | 메뉴 토글 트레일링 버튼 — 이벤트 매핑 전용 |
| menuRoot| `.split-button`          | `data-menu-state` 토글 루트 |
| recentLabel | `.split-button__recent-label` | Recent 섹션 라벨 (정적) — recent 0개 시 CSS로 숨김 |
| recentDivider | `.split-button__recent-divider` | Recent와 전체 사이 구분선 (정적) — recent 0개 시 CSS로 숨김 |

### 인스턴스 옵션 / 상태

| 키 | 설명 |
|----|------|
| `recentStorageKey` | localStorage key suffix (기본: `instance.id`). 페이지가 옵션으로 재정의 가능. 같은 페이지에 여러 SplitButton 인스턴스가 있을 때 격리에 사용. |
| `recentLimit`      | 표시할 recent 항목 수 (기본: 3) |
| `_isOpen`          | 메뉴 펼침 상태(boolean) |
| `_lastMenuItems`   | 가장 최근에 받은 menuItems 배열 — 메뉴 토글 시 재렌더용 cache |
| `_recentActionsMem`| localStorage 실패 시 in-memory fallback 배열 |
| `_outsideClickHandler` / `_escKeyHandler` | bound handler 참조 (beforeDestroy detach용) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `splitButtonInfo` | `this._renderWithRecent` (페이로드: `{ mainAction, menuItems }`) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `action` (FieldRender)           | `@splitMainClicked`     | (페이지가 `event.target.closest('.split-button__action')?.dataset.actionId` 추출) |
| click | `.split-button__trigger`         | `@splitMenuToggled`     | — |
| click | `item` (ListRender)              | `@splitMenuItemClicked` | (페이지가 `event.target.closest('.split-button__menu-item')?.dataset.actionId` + `dataset.recent` 추출) |

> 메인 버튼의 `actionId`는 `_renderWithRecent`가 `mainAction.id`를 메인 버튼 element의 `data-action-id`로 직접 부착(FieldRender의 datasetAttrs로 매핑할 수도 있으나 단일 객체이므로 직접 부착이 단순). 항목 클릭의 fromRecent 분기는 페이지 핸들러가 `dataset.recent === 'true'`로 판별.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_loadRecent()` | localStorage에서 `splitButton_recentActions_<storageKey>` 읽기. JSON parse 실패/접근 실패 시 `this._recentActionsMem` 반환. 항상 array 반환(빈 배열 fallback). |
| `_saveRecent(actionId)` | actionId를 recent 배열의 맨 앞에 unshift, 중복 제거, 상한 10개 truncate. localStorage 쓰기 시도, 실패 시 `this._recentActionsMem`에만 저장. |
| `_renderWithRecent({ response })` | `splitButtonInfo` 핸들러. ① `mainAction`을 `fieldRender.renderData`로 메인 버튼에 렌더 + 메인 버튼 element의 `dataset.actionId = mainAction.id` 부착, ② `this._lastMenuItems = menuItems` cache, ③ recent 배열을 `_loadRecent`로 읽어 menuItems와 join하여 단일 배열 `[{ actionId, label, icon, isRecent }]` 생성(recent 항목 N개 + 전체 menuItems), ④ `listRender.renderData({ response: merged })` 호출, ⑤ recent 0개면 `.split-button__recent-label` / `.split-button__recent-divider`에 `data-empty="true"` 부착(CSS로 숨김). |
| `_handleMenuItemClick(e)` | bindEvents가 `@splitMenuItemClicked`를 먼저 발행한 후 본 핸들러는 ① 클릭된 항목의 `dataset.actionId`로 `_saveRecent(actionId)`, ② `_close()`. |
| `_handleTriggerClick(e)` | bindEvents가 `@splitMenuToggled`를 먼저 발행한 후 본 핸들러는 `_isOpen` 토글. open 직전에 `_renderWithRecent({ response: { mainAction: <prev>, menuItems: this._lastMenuItems } })`로 최신 recent로 재렌더. |
| `_handleOutsideClick(e)` | document capture click. `_isOpen=true`이고 `appendElement.contains(e.target)`가 false면 `_close()`. |
| `_handleEscKey(e)` | document keydown. `_isOpen=true`이고 `e.key === 'Escape'`면 `_close()`. |
| `_open()` / `_close()` | `_isOpen` 갱신 + `.split-button` 루트의 `dataset.menuState = 'open'\|'closed'`. |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('splitButtonInfo', this)──> [SplitButtons/recentActions]
         publish data: {
           mainAction: { id: 'send', label: 'Send', icon: 'send' },
           menuItems: [
             { actionId: 'send_email',   label: 'Email',     icon: 'mail' },
             { actionId: 'send_link',    label: 'Share link',icon: 'link' },
             { actionId: 'send_embed',   label: 'Embed',     icon: 'code' },
             { actionId: 'send_archive', label: 'Archive',   icon: 'archive' },
             { actionId: 'send_print',   label: 'Print',     icon: 'print' }
           ]
         }

[SplitButtons/recentActions] 첫 열기 (localStorage 비어있음)
    └─ Recent 섹션 숨김, 전체 menuItems만 표시

[사용자] 트리거 클릭 → 메뉴 열림 → "Embed" 클릭
    └─ @splitMenuItemClicked(actionId='send_embed', fromRecent=false) 발행
    └─ localStorage[splitButton_recentActions_<id>] = ['send_embed']
    └─ 메뉴 자동 닫힘

[사용자] 다시 트리거 클릭 → _renderWithRecent 재실행
    └─ Recent 섹션 표시: [Embed]
    └─ 그 아래 전체 menuItems

[사용자] "Email" 클릭 → localStorage = ['send_email', 'send_embed']
[사용자] 다음 열기 → Recent: [Email, Embed]

운영: this.pageDataMappings = [
        { topic: 'splitButtonInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@splitMainClicked':       ({ event }) => {
          const actionId = event.target.closest('.split-button__action')?.dataset.actionId;
          // 메인 액션 실행
        },
        '@splitMenuItemClicked':   ({ event }) => {
          const item = event.target.closest('.split-button__menu-item');
          const actionId   = item?.dataset.actionId;
          const fromRecent = item?.dataset.recent === 'true';
          // (actionId, fromRecent) 조합 분기
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | Recent 시각 차별화 방식 | 도메인 예 |
|------|---------|------------------------|----------|
| `01_refined`     | A: Refined Technical | Recent 섹션: 좌측 ★ 별 아이콘 + accent 퍼플 라벨 + Pretendard semibold | 자주 쓰는 공유 액션 (Email/Embed/Archive) |
| `02_material`    | B: Material Elevated | Recent 섹션: secondary container surface(라이트 블루 tint) + 시계 아이콘 + Roboto medium | 자주 쓰는 작성 액션 (문서/스프레드시트/슬라이드) |
| `03_editorial`   | C: Minimal Editorial | Recent 섹션: italic Georgia + "Recent" 라벨 small caps + 좌측 vertical rule | 자주 쓰는 편집 액션 (서식/주석/공유) |
| `04_operational` | D: Dark Operational  | Recent 섹션: 시안 ring border + 빈도 카운트 표시(`#1`, `#2` 등 인덱스) + JetBrains Mono | 자주 쓰는 운영 명령 (RUN/STOP/RESTART) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, Recent 섹션의 시각 차별화는 일반 메뉴 항목과 식별 가능하면서도 페르소나의 톤을 깨지 않는 범위에서 적용된다.
