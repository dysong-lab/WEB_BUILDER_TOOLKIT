# Input — Advanced / pasteMultiple

## 기능 정의

1. **태그 칩 항목 렌더링** — `inputChipItems` 토픽으로 수신한 태그 배열(`[{chipid, label}]`)을 ListRenderMixin이 `<template>` cloneNode로 렌더한다. 입력 영역(`<input>`)과 동일 컨테이너에 공존한다. Standard와 동일한 토픽을 재사용하여 외부 호환성 유지(`@inputChipClicked`/`@inputChipRemoved` 칩 이벤트 채널 동일).
2. **단일 토큰 입력 (Enter / blur)** — `<input>`에서 Enter 키 또는 blur 시 현재 텍스트를 trim한 단일 토큰으로 추가. 빈 토큰/중복 chipid는 silent skip. 추가 시 `_addToken('keyboard')` 경로로 통일.
3. **Paste 다건 입력 — 핵심 변형 정책** — `<input>`의 `paste` 이벤트에서 `e.clipboardData.getData('text/plain')`을 읽어 `/[\s,;]+/`로 split한 후, 각 토큰을 trim/빈값/중복(chipid)/검증 실패 기준으로 분류한다. 유효 토큰은 일괄 chip으로 추가, 무효 토큰은 `skipped` 배열에 누적. 단일 토큰 paste(분리 결과 1개)도 동일 경로를 거쳐 정합성 유지. 기본 paste 동작은 `e.preventDefault()`로 차단(텍스트가 input에 남지 않음). 결과 발행: `@chipsPasted` (payload: `{ added: [{chipid, label}], skipped: [{value, reason}], remainingChipIds: [...] }`).
4. **검증 콜백 — 외부 주입 옵션** — `validateToken(value)` 콜백이 인스턴스에 정의되어 있으면 각 토큰에 적용한다(예: 이메일 형식 정규식). 반환은 `true | false | { ok: false, reason: string }`. 무효 토큰은 추가하지 않고 `@chipPasteInvalid` 이벤트로 외부 보고만 한다 (payload: `{ value, reason }`). 검증 콜백 미정의 시 모든 비빈 토큰을 유효로 본다.
5. **칩 단건 추가/삭제 라이프사이클 이벤트** — 단건 enter 입력 시 `@tagAdded` (payload: `{ targetInstance, chipid, label, source: 'keyboard' }`). × 삭제 시 `@inputChipRemoved` (Standard 호환) + `@tagRemoved` (payload: `{ targetInstance, chipid, label, remainingChipIds }`) 두 채널 발행. paste 결과는 `@chipsPasted` 단일 이벤트로 묶음 발행하되, 일괄 추가된 각 토큰에 대해서도 `@tagAdded`를 source='paste'로 함께 emit.
6. **외부 강제 갱신 토픽 `setInputChipItems`** — 외부에서 칩 set을 통째로 교체(서버 동기화 후 권위 set 갱신). 페이로드: `[{chipid, label}]`. `inputChipItems`와 의미 동일하나 정책상 분리 — `inputChipItems`는 페이지가 source-of-truth로 사용, `setInputChipItems`는 외부 시스템이 강제 갱신할 때 명시적으로 사용.

> **Standard와의 분리 정당성 (5축)**: Standard는 ① 토픽 `inputChipItems` 단일 + 칩 본체/삭제 이벤트만, ② `<input>` / paste 처리 / 토큰 split·trim·dedup·validate 정책 자체가 없음, ③ 자체 상태 없음(ListRender만), ④ 이벤트 `@inputChipClicked`/`@inputChipRemoved` 단순 위임, ⑤ Enter/blur/paste/검증 콜백 모두 없음. pasteMultiple은 ① 새 토픽 `setInputChipItems` 추가, ② 새 영역 추가 — `<input>` + paste/keydown/blur 핸들러 + clipboard API 사용, ③ 자체 상태 4종(`_chipIds: Set<chipid>`, bound handler refs, `validateToken` 옵션 슬롯), ④ 새 이벤트 4종 — `@chipsPasted`(묶음), `@chipPasteInvalid`(검증 실패), `@tagAdded`/`@tagRemoved`(라이프사이클), ⑤ split/trim/dedup/검증/일괄 추가 정책을 모두 흡수 — 같은 register.js로 표현 불가. 페이지가 매번 input 요소·paste 이벤트·split 정규식·dedup·검증 보일러를 재구현하지 않도록 컴포넌트가 흡수.

> **유사 변형과의 비교**: 직전 `tagAutoComplete`이 "외부 추천 풀 + 디바운스 + 클라이언트 필터 + 키보드 dropdown navigation"을 흡수했다면, pasteMultiple은 추천/dropdown 영역을 **두지 않고** 대신 "다건 paste split + 토큰 검증 + 일괄 추가 + 묶음 이벤트" 정책을 자체 메서드로 흡수한다. tagAutoComplete의 dropdown UI 비용이 불필요한 단순 토큰 입력(이메일 수신자, 키워드 묶음 입력 등) 시나리오에 적합. Filter/Advanced/removable이 "× 버튼 + 즉시 제거"를 흡수한 것과 같은 결의 정책 흡수.

> **MD3 / 도메인 근거**: MD3 Input Chips 명세는 "이메일 주소나 검색어 등 사용자가 입력한 정보의 토큰화"를 다룬다. 실제 운영에서는 사용자가 외부 소스(이메일 문서, 스프레드시트, 메신저 메시지)에서 콤마/공백/줄바꿈으로 구분된 다건 항목을 그대로 복사해 붙여넣는 빈도가 매우 높다(Gmail/Outlook의 To/Cc, Slack 채널 멤버 추가, GitHub Action env 변수, 검색엔진 다중 키워드). Standard는 한 건씩만 입력 가능 — 페이지가 매번 paste split 보일러를 재구현해야 하므로 본 변형이 그 정책을 컴포넌트로 정식화한다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'chipid'`) + 자체 메서드 7종 + 자체 상태 4종.

> Standard와 동일하게 ListRenderMixin을 사용하지만, 칩 항목 렌더에만 사용한다(template `#paste-multiple-chip-template`). paste/keydown/blur 처리는 모두 자체 메서드 — 신규 Mixin 생성 금지 규칙 준수.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.paste-multiple__chip-list`        | 칩이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#paste-multiple-chip-template`     | 칩 cloneNode 대상 (ListRenderMixin 규약) |
| chipid    | `.paste-multiple__chip`             | 칩 항목 식별 + 본체 클릭 위임 (data-chipid) |
| label     | `.paste-multiple__chip-label`       | 칩 라벨 텍스트 |
| removeBtn | `.paste-multiple__chip-remove`      | 칩 × 버튼 — click delegator 분기 영역 |
| input     | `.paste-multiple__input`            | 사용자 입력 `<input>` 요소 (이벤트 영역, 데이터 바인딩 X) |

> **이벤트 영역 KEY**: `input`은 ListRenderMixin이 직접 사용하지 않지만(데이터 바인딩 X), 자체 메서드의 querySelector 진입점 + native paste/keydown/blur 핸들러 부착 영역으로 등록한다.

### itemKey

chipid

### datasetAttrs

| KEY | data-* |
|-----|--------|
| chipid | `chipid` |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_chipIds` | `Set<chipid>`. 현재 칩 set의 진실 소스(중복 차단 O(1) 조회용). `_renderItems`/`_addToken`/`_removeChip` 변경. paste 시 한 batch 안에서도 토큰 간 중복 차단에 사용. |
| `_pasteHandler` / `_keydownHandler` / `_blurHandler` / `_clickHandler` | bound handler refs — beforeDestroy에서 정확히 removeEventListener. |
| `validateToken` | 옵션 슬롯. 외부에서 `instance.validateToken = (value) => ...`로 주입 가능. 미정의 시 모든 비빈 토큰 유효. |
| `SPLIT_RE` | `/[\s,;]+/` 정규식 상수 (모듈 스코프). |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|--------|
| `inputChipItems`    | `this._renderItems` | `[{chipid, label}]` — 초기/페이지 source-of-truth 갱신 |
| `setInputChipItems` | `this._renderItems` | `[{chipid, label}]` — 외부 강제 갱신 (동일 핸들러) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipid` (cssSelectors) | 칩 본체 영역 클릭 | `@inputChipClicked` (bindEvents 위임 — Weventbus 채널 등록 보장) |

> **추가 native 핸들러** (bindEvents와 분리):
> - 컨테이너 click delegator → × 영역 매칭 시 `_removeChip` (`@inputChipRemoved` + `@tagRemoved` 명시 payload). 본체는 bindEvents가 처리.
> - input element `paste` 이벤트 → `_handlePaste`: `e.preventDefault()` + clipboard 텍스트 split + 토큰 처리 + `@chipsPasted` emit.
> - input element `keydown` 이벤트 → `_handleKeydown`: Enter 키 시 단일 토큰 추가.
> - input element `blur` 이벤트 → `_handleBlur`: 잔여 텍스트가 있으면 단일 토큰 추가.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `inputChipItems`/`setInputChipItems` 핸들러. 배열을 ListRender selectorKEY에 매핑하여 `listRender.renderData` 호출 + `_chipIds` Set 새 batch 교체. |
| `_handlePaste(e)` | input element `paste` 이벤트. clipboard text를 SPLIT_RE로 split + trim + 빈/중복/검증 분류 + 일괄 chip 추가 + `@chipsPasted` emit. |
| `_handleKeydown(e)` | input element `keydown`. Enter 키 시 `_commitInputValue('keyboard')` 호출. preventDefault + input 클리어. |
| `_handleBlur(e)` | input element `blur`. 잔여 텍스트가 비어있지 않으면 `_commitInputValue('keyboard')` 호출. |
| `_commitInputValue(source)` | input.value를 trim하여 단일 토큰 추가 시도 — `_addToken` 호출 + input 클리어. 빈/중복/검증 실패 시 silent skip(검증 실패만 `@chipPasteInvalid` emit). |
| `_addToken(value, source)` | 토큰 1개 추가 — trim → 빈/중복/검증 분류 → DOM에 chip clone append + `_chipIds` Set 추가 + `@tagAdded` emit. 반환: `{ ok: true, chipid, label } | { ok: false, reason }`. |
| `_handleClick(e)` | 컨테이너 click delegator. removeBtn 매칭 시 `_removeChip` 호출 + `@inputChipRemoved`/`@tagRemoved` emit. |
| `_removeChip(chipid)` | 칩 제거 — DOM detach + `_chipIds` Set delete + 두 채널 emit. |
| `_extractRemainingIds()` | `_chipIds` Set의 배열 반환. 이벤트 payload의 `remainingChipIds` 산출. |
| `_validate(value)` | `this.validateToken` 옵션이 있으면 호출하여 `{ ok, reason }` 표준화. 옵션 미정의 시 `{ ok: true }`. |
| `_appendChipDom(chipid, label)` | template cloneNode + 라벨/dataset 채움 + container append. `_addToken` 내부에서 사용. |

### 페이지 연결 사례

```
[페이지 — 이메일 수신자 일괄 입력 / GitHub Action env 변수 / 다중 키워드 검색 / Slack 채널 멤버 추가]
    │
    └─ fetchAndPublish('inputChipItems', this) 또는 직접 publish
          payload 예: [{ chipid: 'alice@x.com', label: 'alice@x.com' }]

[Chips/Input/Advanced/pasteMultiple]
    ├─ ListRender가 칩 1개 cloneNode를 chip-list에 append
    ├─ _chipIds: Set { 'alice@x.com' }
    └─ <input> 영역 활성

[사용자가 "bob@x.com, carol@x.com; dave@x.com\nalice@x.com" 붙여넣음]
    ├─ split → ["bob@x.com", "carol@x.com", "dave@x.com", "alice@x.com"]
    ├─ trim/빈/중복(alice) 차단 → added=[bob, carol, dave], skipped=[{value:'alice@x.com', reason:'duplicate'}]
    ├─ DOM 일괄 append + _chipIds 갱신
    ├─ @tagAdded × 3 (source='paste')
    └─ @chipsPasted emit { added, skipped, remainingChipIds: [alice, bob, carol, dave] }

[사용자가 "eve@x.com" 입력 후 Enter]
    ├─ _commitInputValue('keyboard') → _addToken
    ├─ chip append + _chipIds.add
    └─ @tagAdded { chipid: 'eve@x.com', label: 'eve@x.com', source: 'keyboard' }

[× 클릭 — 'bob@x.com' 제거]
    └──@inputChipRemoved (Standard 호환) + @tagRemoved 명시 payload──▶ [페이지]

운영: this.pageDataMappings = [
        { topic: 'inputChipItems',    datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setInputChipItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      // 검증 콜백 외부 주입 (예: 이메일 형식)
      instance.validateToken = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                                          ? { ok: true }
                                          : { ok: false, reason: 'invalid_email' };
      Wkit.onEventBusHandlers({
        '@chipsPasted':       ({ added, skipped }) => { /* paste 결과 보고 */ },
        '@chipPasteInvalid':  ({ value, reason }) => { /* 검증 실패 토스트 */ },
        '@tagAdded':          ({ chipid, source }) => { /* backend sync */ },
        '@tagRemoved':        ({ chipid, remainingChipIds }) => { /* backend sync */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 fill 칩 + Pretendard + 입력 필드 focus glow + paste 안내 inline. | 이메일 수신자 일괄 입력 (메일 문서에서 수신자 라인 통째로 복사) |
| `02_material`    | B: Material Elevated | 라이트 그레이 + tonal `#E3F2FD` filled 칩 + Roboto + 입력 필드 elevation + paste 안내 chip 우측. | Gmail/Outlook 스타일 To/Cc 다중 주소록 입력 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 1px outline 칩 + Georgia serif + 입력 필드 hairline border + paste 안내 italic. | 매거진 키워드/태그 일괄 입력 (편집자가 외부 메모에서 키워드 복사) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + 시안 stripe 좌측 + JetBrains Mono uppercase + 입력 필드 모노스페이스 + paste 안내 모노. | 운영 콘솔 — 호스트명/메트릭 키 묶음 입력(스프레드시트 셀 복사) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 1~2개 초기 칩 + 충분한 입력 폭(360~440px)으로 paste 시연. preview의 demo 버튼은 clipboard API 우회를 위해 `_commitMultiple(text)` 헬퍼로 직접 split을 호출한다 — 사용자가 직접 Ctrl+V를 시도할 수도 있다(둘 다 동작).

### 결정사항

- **split 정규식 `/[\s|,|;]+/`**: 콤마, 세미콜론, 모든 공백류(스페이스, 탭, 개행 포함)을 단일 구분자로 처리. 연속 구분자(`,,` / `, ;` 등)는 빈 토큰을 만든 뒤 trim으로 제거되므로 자연스럽게 흡수.
- **paste 기본 동작 차단**: `e.preventDefault()`로 input.value에 텍스트가 남지 않도록 함. 모든 토큰이 chip으로 추가되거나 skipped로 분류되므로 input은 항상 빈 상태로 유지(추가 입력 가능).
- **단일/다건 통합 경로**: paste split 결과가 1개여도 동일 분류·검증 경로를 거친다. paste 1건과 enter 1건의 source만 다르고(`'paste'` vs `'keyboard'`) 정책은 동일.
- **이벤트 채널 이중화 (`@inputChipRemoved` + `@tagRemoved`)**: Standard와의 외부 호환성 유지를 위해 `@inputChipRemoved`도 함께 발행(Standard 페이지가 그대로 동작). `@tagRemoved`는 `remainingChipIds`를 포함한 명시 payload.
- **묶음 이벤트 `@chipsPasted` + 단건 `@tagAdded`**: paste batch 결과를 `@chipsPasted` 한 번으로 묶고, 추가된 각 토큰별로 `@tagAdded` source='paste'도 함께 emit. 페이지가 토큰 단위 sync(예: backend POST per chip)를 원하면 `@tagAdded`, batch 단위 보고를 원하면 `@chipsPasted` 사용 — 두 채널 분리.
- **검증 콜백 옵션 슬롯**: `validateToken`은 register.js에서 정의하지 않고 외부에서 주입 가능한 슬롯으로만 둔다. 도메인별로 형식이 다르므로(이메일/호스트명/JIRA 키…) 컴포넌트 내부에 하드코딩하지 않음.
- **`_chipIds` = Set (Map 아님)**: pasteMultiple은 chipid만으로 중복 판정한다 — label은 외부 매핑 가능성 있음(예: chipid="alice@x.com", label="Alice"). Map<chipid, label>은 tagAutoComplete처럼 dropdown 필터에 label이 필요할 때만 의미. 본 변형은 chipid만 차단 키.
- **input 클리어 시점**: enter/blur는 `_commitInputValue`에서 commit 후 즉시 클리어. paste는 `e.preventDefault()`로 애초에 input에 들어가지 않으므로 별도 클리어 불필요.
