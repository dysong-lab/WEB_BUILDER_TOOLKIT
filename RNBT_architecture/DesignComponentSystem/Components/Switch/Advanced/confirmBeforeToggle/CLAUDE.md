# Switch — Advanced / confirmBeforeToggle

## 기능 정의

1. **스위치 항목 렌더링 (Standard 토대 답습)** — `switchItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 라벨 + 트랙 + 썸으로 구성되며, `data-checked`(true/false), `data-disabled`로 상태를 표현한다. 페이로드 호환성을 유지(Standard와 동일 토픽/스키마).
2. **2단계 확인 게이트 (Standard와의 핵심 분리)** — 항목 클릭 시 *즉시 토글하지 않는다*. 1차 click → `pendingConfirm` 상태 진입 + `data-confirming="true"` + `--confirm-progress` CSS 변수(0~1)를 16ms마다 갱신해 timeout 카운트다운 시각화 + `@switchConfirmation` 발행(payload: `{ switchid, pendingValue, timeoutMs }`). 항목 옆에 "확인 / 취소" 버튼 영역이 노출됨.
3. **확인 / 취소 분기** — 사용자가 "확인" 버튼 클릭 → 실제 토글(`data-checked` 반전) + `pendingConfirm` 해제 + `@switchToggled`(payload: `{ switchid, checked }`) 발행. "취소" 버튼 클릭 → 토글 없이 idle 복귀 + `@switchConfirmCancelled`(payload: `{ switchid, reason: 'user' }`) 발행.
4. **timeout 자동 cancel** — `pendingConfirm` 상태에서 5초(기본) 동안 응답 없으면 자동 idle 복귀 + `@switchConfirmCancelled`(reason: `'timeout'`) 발행. `--confirm-progress` 카운트다운 시각화도 함께 종료.
5. **외부 cancel 수신** — `setSwitchConfirmCancel` 토픽 구독으로 페이지가 외부 cancel(다른 UI 진입, ESC, 라우트 전환 등)을 publish하면 pending 항목이 있으면 idle 복귀 + `@switchConfirmCancelled`(reason: `'external'`) 발행.
6. **단일 pending 보장** — 항상 *한 번에 하나의 pending 항목만* 허용한다. 다른 항목이 pending 중일 때 새 항목을 click하면, 기존 pending은 cancel(reason: `'external'`) 처리 후 새 항목이 pending으로 진입.
7. **disabled 항목 보호** — `data-disabled="true"`인 항목은 click을 무시(pending 진입 X, 이벤트 발행 X). pending 중에는 다른 항목들도 시각적으로 디밍될 수 있으나 click 자체는 막지 않음(다른 항목이 pending이면 기존 cancel + 새 pending).

> **Standard와의 분리 정당성 (5축)**:
> - **새 자체 상태 5종** — `_pendingSwitchId: string|null` / `_pendingValue: 'true'|'false'|null` / `_confirmTimeoutMs: number(=5000)` / `_confirmTimer: number|null` / `_progressRaf: number|null` / `_confirmStartedAt: number`. Standard는 stateless(페이지가 토글을 결정하므로 컴포넌트 자체 상태 0종).
> - **새 토픽 1종 + Standard 토픽 답습** — `setSwitchConfirmCancel`(외부 강제 cancel). Standard의 `switchItems` 토픽은 그대로 사용(렌더 페이로드 호환).
> - **새 이벤트 3종 + Standard `@switchClicked` 미발행** — 새: `@switchConfirmation`(pending 진입 시), `@switchToggled`(확인 후 실제 토글), `@switchConfirmCancelled`(cancel 시 reason 분기). Standard의 `@switchClicked`는 발행하지 않음(click의 의미가 "토글 요청"에서 "확인 진입"으로 재정의됨).
> - **자체 메서드 6종** — `_handleSwitchClick` / `_handleConfirmClick` / `_handleCancelClick` / `_enterPending` / `_exitPending` / `_tickProgress` / `_handleExternalCancel`. Standard는 자체 메서드 0종.
> - **click 의미 재정의** — Standard의 `@switchClicked`는 페이지가 듣고 토글을 결정. 본 변형은 컴포넌트가 *상태머신을 흡수*하여 click을 1차/2차로 분기. 페이지는 `@switchToggled` 한 번만 듣고 실제 데이터 변경(예: API PATCH)을 수행하면 됨.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Switch/Standard** — ListRenderMixin(`switchid`/`checked`/`disabled`/`label`) + click 위임. 본 변형은 동일 토대 위에 confirm/cancel 버튼 영역 + 상태머신 + timeout 타이머를 추가.
> - **Buttons/Buttons/Advanced/confirmation** — idle/confirming 상태머신 + setTimeout(4000ms) + `--confirmation-progress` RAF + `@confirmationNeeded` / `@buttonClicked` / `@confirmationCancelled` 3종 이벤트 + 외부 cancel 토픽. 본 변형은 동일 메커니즘을 답습하되, *목록 안의 한 항목*에 적용 — `_pendingSwitchId`로 어떤 항목이 pending인지 식별, confirm/cancel 버튼이 항목 내부에 노출, `@switchToggled`는 Standard 호환 payload(`{switchid, checked}`)로 발행. timeout은 5000ms로 늘림(스위치는 단발 액션보다 *설정 변경*이 많아 사용자 인지 시간 더 필요).
> - **Snackbar/Advanced/persistent** (직전 5단계) — preview `<script src>` 5단계 verbatim 복사 기준(`Components/Switch/Advanced/confirmBeforeToggle/preview` = 5단계 = `../../../../../`).
>
> **MD3 / 도메인 근거**: MD3 Switch 명세는 *"Switches toggle the selection of an item on or off"*로 즉시 토글이 기본이지만, *위험한/되돌리기 어려운 설정 변경*에는 confirmation pattern이 표준 보조 게이트로 사용됨(Buttons/confirmation과 동일 근거). 도메인 예: ① **관리자 모드 활성화** ("관리자 모드를 켜면 모든 사용자 데이터에 접근할 수 있습니다"), ② **삭제 보호 해제** ("삭제 보호를 끄면 실수로 데이터가 영구 삭제될 수 있습니다"), ③ **2단계 인증 비활성화** ("2단계 인증을 끄면 계정 보안이 약해집니다"), ④ **공개 액세스 허용** ("공개 액세스를 켜면 외부 사용자가 이 자원을 볼 수 있습니다"). 모두 토글의 결과가 *되돌릴 수 없거나, 보안 영향이 큼* → 우발적 click 방지가 핵심.

---

## 구현 명세

### Mixin

**ListRenderMixin** + 자체 상태 6종 + 자체 메서드 7종.

> Mixin 조합은 Standard와 동일(ListRenderMixin). Advanced 분리는 Mixin 추가가 아니라 **상태머신 + timeout 타이머 + 외부 cancel 토픽 + click 의미 재정의 + confirm/cancel 버튼 native 부착**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

#### ListRenderMixin (`this.listRender`) — 항목 렌더

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.switch__list` | 항목이 추가될 부모 (규약) |
| template  | `#switch-item-template` | cloneNode 대상 (규약) |
| switchid  | `.switch__item` | 항목 식별 + click 이벤트 매핑 (Standard와 동일) |
| checked   | `.switch__item` | on/off 상태 (data-checked: "true"/"false") |
| disabled  | `.switch__item` | 비활성화 상태 (data-disabled) |
| label     | `.switch__label` | 라벨 텍스트 |

> **track/thumb 처리**: Standard와 동일 — `.switch__track` / `.switch__thumb`은 template에 고정 존재하며 `data-checked` 값에 따라 CSS로만 위치/색상을 제어. cssSelectors KEY로 등록하지 않음.

#### 사용자 정의 (cssSelectors 외부 — 고정 계약)

| KEY | VALUE | 용도 |
|-----|-------|------|
| confirmBtn | `.switch__confirm-btn` | 확인 버튼 — pending 항목 내부에 노출됨. native click → `_handleConfirmClick` |
| cancelBtn  | `.switch__cancel-btn`  | 취소 버튼 — pending 항목 내부에 노출됨. native click → `_handleCancelClick` |
| progress   | `.switch__progress`    | 카운트다운 시각화 요소(라인 또는 ring) — `--confirm-progress` 0~1 변수 setProperty 대상 |

> `confirmBtn` / `cancelBtn` / `progress`는 template 내부에 항상 존재하지만 CSS가 `[data-confirming="false"] { display: none }`로 숨김. pending 진입 시 `data-confirming="true"`로 토글되어 노출. native 이벤트 위임은 컴포넌트 루트(`appendElement`)에 단일 `click` 리스너로 부착하고 `event.target.closest()`로 분기(같은 click 이벤트가 항목/confirm/cancel 세 갈래로 발행되어야 하므로 bindEvents 위임으로 표현 불가).

### itemKey

switchid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | switchid | switchid |
| ListRenderMixin | checked  | checked |
| ListRenderMixin | disabled | disabled |

> `confirming`은 ListRenderMixin의 datasetAttrs에 등록하지 않고, 인스턴스 메서드가 `itemEl.dataset.confirming`을 직접 갱신(Mixin은 데이터 바인딩만 담당, 상태머신 표시는 컴포넌트 책임).

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_pendingSwitchId` | `string\|null` | `null` | 현재 pending 항목의 switchid (없으면 null) |
| `_pendingValue`    | `'true'\|'false'\|null` | `null` | pending 항목이 확인 시 적용될 다음 checked 값 |
| `_confirmTimeoutMs` | `number` | `5000` | 자동 cancel 임계 (`@switchConfirmation` payload `timeoutMs`로 노출) |
| `_confirmTimer`    | `number\|null` | `null` | setTimeout 핸들 — timeout 도달 시 자동 cancel |
| `_progressRaf`     | `number\|null` | `null` | requestAnimationFrame 핸들 — pending 동안 progress 변수 갱신용 |
| `_confirmStartedAt` | `number` | `0` | pending 진입 시각(performance.now), progress 계산용 |
| `_clickHandler`    | `Function\|null` | `null` | bound `_handleSwitchClick` 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `switchItems` | `this.listRender.renderData` | `[{ switchid, label, checked: 'true'\|'false', disabled?: 'true'\|'false' }, ...]` (Standard와 동일) |
| `setSwitchConfirmCancel` | `this._handleExternalCancel` | `{}` 또는 임의 객체 — pending 항목이 있으면 즉시 cancel(reason='external') |

### 이벤트 (customEvents — Wkit.bindEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| (없음) | — | — |

> click은 같은 이벤트가 *항목/confirm/cancel 세 갈래*로 분기 발행되어야 하므로 bindEvents 위임으로는 표현 불가. `_handleSwitchClick`이 `appendElement.addEventListener('click', ...)`로 직접 부착되어 `event.target.closest()`로 분기한다. `customEvents`는 본 변형에서 비어 있고, `bindEvents` 호출도 생략한다.

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@switchConfirmation` | pending 진입 시(idle → pendingConfirm) | `{ targetInstance, switchid, pendingValue: 'true'\|'false', timeoutMs: number }` |
| `@switchToggled`      | 확인 클릭 후 실제 토글 적용 시점 | `{ targetInstance, switchid, checked: 'true'\|'false' }` |
| `@switchConfirmCancelled` | cancel 시점(user / timeout / external) | `{ targetInstance, switchid, reason: 'user' \| 'timeout' \| 'external' }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSwitchClick(e)` | `(MouseEvent) => void` | 컴포넌트 루트의 단일 click 리스너. `event.target.closest()`로 confirmBtn / cancelBtn / item 분기. confirm/cancel 버튼이 우선 매칭(항목 내부에 있으므로 `closest('.switch__item')`이 동시 매칭됨 → 버튼 매칭이 먼저 처리되면 `return`). |
| `_handleItemClick(itemEl)` | `(HTMLElement) => void` | item 분기 핸들러. `data-disabled="true"`면 무시. 다른 항목이 pending이면 기존 cancel(reason='external') 후 새 항목 pending 진입. 같은 항목 재클릭이면 무시(이미 pending). |
| `_handleConfirmClick()` | `() => void` | pending 항목의 checked를 `_pendingValue`로 업데이트(`listRender.updateItemState`) + idle 복귀 + `@switchToggled` 발행. |
| `_handleCancelClick()` | `() => void` | idle 복귀 + `@switchConfirmCancelled`(reason='user') 발행. |
| `_enterPending(switchid, pendingValue)` | `(string, 'true'\|'false') => void` | 항목 element를 querySelector로 찾아 `dataset.confirming='true'`, `--confirm-progress=0` 설정. 자체 상태 갱신, setTimeout(5000) 시작, RAF 시작, `@switchConfirmation` 발행. |
| `_exitPending(reason)` | `('user'\|'timeout'\|'external'\|null) => void` | timer/RAF clear + 항목 element의 `dataset.confirming='false'` + `--confirm-progress=0`. 자체 상태 초기화. `reason`이 있으면 `@switchConfirmCancelled` 발행(`reason==null`이면 `@switchToggled` 사이클이라 여기서는 발행 안 함). |
| `_tickProgress()` | `() => void` | `progress = min(1, (now - _confirmStartedAt) / _confirmTimeoutMs)` 계산 → 항목 element의 `style.setProperty('--confirm-progress', progress)`. progress<1이고 pending이면 다음 frame 예약. |
| `_handleExternalCancel()` | `() => void` | pending 있으면 `_exitPending('external')`. 없으면 무시. |

### 페이지 연결 사례

```
[페이지 — 관리자 모드 / 삭제 보호 / 2FA / 공개 액세스 토글]
    │
    ├─ publish('switchItems', [
    │     { switchid: 'admin',     label: 'Admin mode',          checked: 'false', disabled: 'false' },
    │     { switchid: 'protect',   label: 'Delete protection',   checked: 'true',  disabled: 'false' },
    │     { switchid: 'two-fa',    label: '2-step verification', checked: 'true',  disabled: 'false' },
    │     { switchid: 'public',    label: 'Public access',       checked: 'false', disabled: 'false' }
    │   ])
    │
    ├─ '@switchConfirmation' 수신 → 다른 위험 토글 잠금 / "정말 변경할까요?" 헬퍼 표시
    ├─ '@switchToggled'      수신 → 실제 데이터 변경 (PATCH /api/settings)
    │     payload: { switchid, checked }
    │
    ├─ '@switchConfirmCancelled' 수신 → reason 분기:
    │     'user'     → 사용자 명시적 취소 (잠금 해제)
    │     'timeout'  → 5초 무응답 (잠금 해제 + "확인 시간 만료" 토스트)
    │     'external' → 외부 cancel (라우트 전환 등)
    │
    └─ (라우트 전환 시) publish('setSwitchConfirmCancel', {}) — 외부 강제 cancel

[Switch/Advanced/confirmBeforeToggle]
    ├─ switchItems 수신 → listRender.renderData
    ├─ 항목 click → _handleItemClick → (다른 항목 pending이면 _exitPending('external'))
    │              → _enterPending(switchid, !checked) → @switchConfirmation 발행
    ├─ 확인 click → _handleConfirmClick → listRender.updateItemState({ checked: pendingValue })
    │              → _exitPending(null) → @switchToggled(checked: pendingValue) 발행
    ├─ 취소 click → _handleCancelClick → _exitPending('user') → @switchConfirmCancelled
    ├─ 5s timeout → _exitPending('timeout') → @switchConfirmCancelled
    └─ setSwitchConfirmCancel 수신 → _handleExternalCancel → _exitPending('external')

운영: this.pageDataMappings = [
        { topic: 'switchItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@switchConfirmation':       ({ switchid, pendingValue, timeoutMs }) => { /* 잠금 + 헬퍼 */ },
        '@switchToggled':            ({ switchid, checked })                  => { /* PATCH API */ },
        '@switchConfirmCancelled':   ({ switchid, reason })                   => { /* reason 분기 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------|
| `01_refined`     | A: Refined Technical | 다크 남색 + 퍼플 그라디언트 트랙 답습. `[data-confirming="true"]` 항목은 크림슨 글로우 펄스 + 좌→우로 줄어드는 progress underline(scaleX). confirm/cancel 버튼은 라벤더/크림슨 outline. **도메인**: 클라우드 콘솔 — *"Admin mode (관리자 모드 활성화 — 모든 사용자 데이터 접근)"* (Pretendard, persistent 답습 톤). |
| `02_material`    | B: Material Elevated | 라이트 블루 accent + outlined off / filled on 답습. confirming은 error tonal surface(에러 빨강 배경) + elevation 단계 상승 + 360° conic-gradient progress ring. **도메인**: 워크스페이스 보안 — *"Delete protection (삭제 보호 해제)"* (Roboto, MD3 elevation 답습). |
| `03_editorial`   | C: Minimal Editorial | 웜 베이지 + 세리프 답습. confirming은 다크 레드 좌측 2px solid bar + 라벨 italic + 하단 underline scaleX 진행. confirm/cancel은 헤어라인 사각 박스. **도메인**: 출판/CMS — *"2-step verification (2단계 인증 비활성화 — 보안 약화)"* (Georgia, 헤어라인 답습). |
| `04_operational` | D: Dark Operational  | 다크 시안 + 각진 트랙 답습. confirming은 노랑 펄스 border + uppercase 라벨 강조 + 좌→우 노랑 fill 카운트다운. confirm/cancel은 시안 / 노랑 outline. **도메인**: 운영 콘솔 — *"Public access (공개 액세스 — 외부 사용자 노출)"* (JetBrains Mono, 운영 보안 답습). |

각 페르소나는 Standard / Buttons-confirmation과 같은 4종 색/타이포 토큰을 답습하면서, **`[data-confirming="true"]` 분기** + **`--confirm-progress` 카운트다운**으로 *"이 토글은 확인이 필요한 위험 변경"*을 시각화한다.

### 결정사항

- **상태머신 단일 pending 보장**: 한 번에 하나만 pending. 다른 항목이 pending 중일 때 새 항목 click → 기존 cancel(`'external'`) + 새 pending 진입. 두 항목이 동시에 pending되는 케이스 차단.
- **timeout 5000ms (Buttons-confirmation 4000ms보다 김)**: 스위치는 *설정 변경*이 많아 사용자 인지 시간이 더 필요. Buttons는 단발 액션이라 4초로 충분.
- **`@switchClicked` 미발행**: Standard click 의미가 "토글 요청"이지만 본 변형에선 "확인 진입"으로 재정의되어 발행 시점이 모호. 페이지는 `@switchConfirmation`(pending 진입) / `@switchToggled`(확정) / `@switchConfirmCancelled`(취소) 3채널로 명확히 듣는다.
- **`@switchToggled` payload Standard 호환**: `{ switchid, checked }` — Standard의 페이지 코드가 변형 교체 시 쉽게 답습 가능(Standard는 `@switchClicked` 받아 페이지가 토글 결정 → 본 변형은 `@switchToggled`로 결과만 통보). `checked`는 문자열 `'true'`/`'false'` (datasetAttrs와 동일 형식).
- **외부 cancel 토픽 명명 `setSwitchConfirmCancel`**: Buttons-confirmation의 `confirmationCancel`과 의미는 동일하지만, Switch 도메인 명사로 한정(라우트 단일 컴포넌트 단위 cancel 가능). open=true 외부 강제 토글은 미지원(토글 결정은 항상 사용자 click으로만).
- **단일 progress 시각화**: 항목 element 자체에 `--confirm-progress` 변수만 setProperty. CSS가 페르소나별로 underline / ring / fill 등으로 시각화. 컴포넌트 로직은 페르소나별 분기 없음.
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 상태/메서드 + native click 위임 분기로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js) — `confirmBtn` / `cancelBtn` / `progress`는 컴포넌트 소유 고정 계약(cssSelectors 외부)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Switch/Advanced/confirmBeforeToggle/preview/...html` → `../`를 5번 = Snackbar/Advanced/persistent와 동일 verbatim 복사)
