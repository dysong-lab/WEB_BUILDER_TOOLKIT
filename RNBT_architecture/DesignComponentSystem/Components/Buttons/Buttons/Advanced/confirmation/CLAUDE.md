# Buttons — Advanced / confirmation

## 기능 정의

1. **라벨/아이콘 표시** — `buttonInfo` 토픽으로 수신한 데이터를 라벨/아이콘 영역에 렌더(Standard와 동일한 1:1 필드 매핑). `buttonInfo`에는 `label`(idle 라벨), `confirmLabel`(confirming 라벨, 선택), `icon`을 함께 받는다. `confirmLabel`은 인스턴스 상태로 보관되어 confirming 진입 시 라벨을 교체한다.
2. **2단계 확인 게이트** — `idle` ↔ `confirming` 두 상태를 가진다. 1차 click → `confirming` 상태 진입 + `--confirmation-progress` CSS 변수(0~1)를 16ms마다 갱신해 timeout 카운트다운 시각화 + `@confirmationNeeded` 발행. 2차 click → `idle` 복귀 + `@buttonClicked` 발행(실제 액션). timeout(기본 4000ms) 내 응답 없으면 자동 idle 복귀 + `@confirmationCancelled` 발행.
3. **외부 cancel 수신** — `confirmationCancel` 토픽 구독으로 페이지가 외부 cancel(다른 UI 클릭, ESC 등)을 publish하면 idle 복귀 + `@confirmationCancelled` 발행.
4. **상태 시각 차별화** — `data-confirmation-state="idle|confirming"` 속성을 버튼에 부착해 CSS가 페르소나별로 confirming 상태를 강조(글로우, 색 변경, 펄스 등). idle/confirming 라벨은 동일한 `.button__label` 위치에 textContent로 교체된다.

> **Standard와의 분리 정당성**: Standard는 단일 click → `@buttonClicked` 발행이 끝이다. confirmation은 ① 새 이벤트 2~3종 (`@confirmationNeeded`, `@confirmationCancelled`) + payload, ② idle/confirming 상태 머신 + timeout 타이머 + progress RAF 자체 상태, ③ 외부 cancel 토픽 구독, ④ click의 의미가 상태에 따라 달라짐(1차=확인 요청, 2차=실행) — 네 축 모두 Standard register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **longPress와의 분리 정당성**: longPress는 **단일 pointer hold 사이클** 안에서 임계 시간 도달을 판정한다(pointerdown→500ms→pointerup; pointer 4종 native 리스너 + click capture 억제). confirmation은 **두 번의 별개 click 이벤트** 사이의 **상태머신 + timeout window**다(click 1→state=confirming→click 2 within 4s→fire). 게스처 인식 vs 상태 게이트 — 의도와 구현 모두 직교한다. 따라서 동일 register.js로 통합할 수 없고 별도 Advanced 변형으로 둔다.

> **MD3 근거**: Confirmation pattern은 destructive/irreversible 액션(계정 삭제, 일괄 발송, 결제 확정 등)에서 우발적 클릭을 방지하는 표준 보조 게이트다. inline 2-step click은 dialog 띄움보다 마찰이 작아 빈번한 위험 액션에 적합하다.

---

## 구현 명세

### Mixin

FieldRenderMixin (라벨/아이콘 렌더 전용) + 커스텀 메서드 (`_handleButtonClick` / `_enterConfirming` / `_exitToIdle` / `_tickProgress` / `_handleExternalCancel`).

> **Mixin 불필요 범주에 가깝지만 Standard가 FieldRenderMixin으로 라벨 렌더를 처리하므로 동일 Mixin을 재사용**한다(payload 호환성 유지). 상태머신과 timeout 로직은 추가 Mixin 없이 자체 메서드로 완결한다.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.button` | 버튼 요소 — click 이벤트 매핑 + `data-confirmation-state` 속성 + `.button--confirming` 클래스 토글 |
| label | `.button__label` | 라벨 텍스트 (FieldRender + idle/confirming 전환 시 textContent 교체 대상) |
| icon | `.button__icon` | 아이콘 (FieldRender, 선택적) |
| progress | `.button__progress` | 카운트다운 시각화 요소 — `--confirmation-progress` 0~1 변수 setProperty 대상 |

### datasetAttrs

| KEY | data-* | 용도 |
|-----|--------|------|
| confirmationState | `confirmation-state` | `data-confirmation-state="idle|confirming"` 속성을 button에 부착(상태머신 진입/이탈 시 직접 setAttribute로 갱신; FieldRender의 datasetAttrs는 사용하지 않고 `_buttonEl.dataset.confirmationState` 직접 셋팅) |

> 실제 register.js에서는 datasetAttrs를 등록하지 않고 인스턴스 메서드가 `_buttonEl.dataset.confirmationState`를 직접 갱신한다. 위 표는 HTML이 사용하는 속성 명세를 명시하기 위함.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_confirmationState` | `'idle'` \| `'confirming'`. 기본 `'idle'`. |
| `_confirmTimeoutMs` | 자동 idle 복귀 임계(고정 4000ms). `@confirmationNeeded` payload `timeoutMs`로 노출. |
| `_confirmTimer` | setTimeout 핸들. timeout 도달 시 자동 idle 복귀 + `@confirmationCancelled`. |
| `_progressRaf` | requestAnimationFrame 핸들. confirming 동안 progress 변수 갱신용. |
| `_confirmStartedAt` | confirming 진입 시각(performance.now). progress 계산용. |
| `_idleLabel` | `buttonInfo`에서 받은 idle 상태 라벨 (페이지가 publish한 기본). |
| `_confirmLabel` | `buttonInfo`에서 받은 confirming 상태 라벨 (없으면 `'Confirm?'` 기본값 사용). |
| `_buttonEl` / `_labelEl` | querySelector 결과 cache. |
| `_clickHandler` | bound `_handleButtonClick` 참조 — beforeDestroy에서 정확히 removeEventListener. |
| `_renderButtonInfo` | `buttonInfo` 수신 핸들러(label/confirmLabel/icon 분리 후 fieldRender 위임). |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `buttonInfo` | `this._renderButtonInfo` | `{ label, confirmLabel?, icon }` 수신 → label/icon은 fieldRender로, confirmLabel은 `_confirmLabel`에 보관. 현재 상태에 맞는 라벨로 즉시 textContent 갱신. |
| `confirmationCancel` | `this._handleExternalCancel` | (선택) 페이지에서 외부 cancel 트리거(다른 UI 진입 등). confirming이면 idle 복귀 + `@confirmationCancelled` 발행. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| `@buttonClicked` | — (Weventbus.emit, 직접 발행) | 2차 click 시(confirming → idle 복귀와 동시) | `{ targetInstance: this }` |
| `@confirmationNeeded` | — | 1차 click 시(idle → confirming 진입) | `{ targetInstance: this, timeoutMs: 4000 }` |
| `@confirmationCancelled` | — | timeout 만료 또는 외부 cancel 수신 시 | `{ targetInstance: this, reason: 'timeout' \| 'external' }` |

> click은 **bindEvents에 등록하지 않는다**. `_handleButtonClick`이 직접 `addEventListener('click', ...)`로 부착되어 상태에 따라 1차/2차를 분기 발행한다(같은 click을 두 갈래로 갈라 발행해야 하므로 bindEvents 위임으로는 표현 불가). 즉 `customEvents`는 본 변형에서 비어 있고, `bindEvents` 호출도 생략한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderButtonInfo({ response })` | `{ label, confirmLabel?, icon }` 수신 → `_idleLabel = label`, `_confirmLabel = confirmLabel ?? 'Confirm?'` 보관 → fieldRender.renderData로 label/icon 렌더(현재 상태가 confirming이면 직접 `_confirmLabel`을 textContent로 덮어쓰기). |
| `_handleButtonClick(e)` | 좌클릭만 허용. 현재 상태가 idle이면 `_enterConfirming()`, confirming이면 `_exitToIdle({ fire: true })` (액션 실행 → `@buttonClicked` 발행). |
| `_enterConfirming()` | `_confirmationState='confirming'` → `data-confirmation-state` 갱신, `.button--confirming` 추가, `_labelEl.textContent = _confirmLabel`, `_confirmStartedAt = performance.now()`, `_confirmTimer = setTimeout(timeout 핸들러, 4000)`, `_progressRaf = requestAnimationFrame(_tickProgress)`, `Weventbus.emit('@confirmationNeeded', { targetInstance: this, timeoutMs: 4000 })`. |
| `_exitToIdle({ fire?, reason? })` | `clearTimeout(_confirmTimer)` + `cancelAnimationFrame(_progressRaf)` + `_confirmationState='idle'` → `data-confirmation-state` 갱신, `.button--confirming` 제거, `--confirmation-progress=0`, `_labelEl.textContent = _idleLabel`. `fire=true`면 `@buttonClicked` 발행. `fire=false`이고 `reason` 있으면 `@confirmationCancelled` 발행. |
| `_tickProgress()` | `progress = min(1, (now - _confirmStartedAt) / _confirmTimeoutMs)` → `_buttonEl.style.setProperty('--confirmation-progress', String(progress))`. progress<1이고 confirming이면 다음 frame 예약. |
| `_handleExternalCancel({ response })` | confirming 상태면 `_exitToIdle({ reason: 'external' })`. idle이면 무시. |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('buttonInfo', this)──> [Buttons/confirmation] 라벨/아이콘 렌더
            (payload: { label, confirmLabel, icon })

1차 click:
[Buttons/confirmation] ──@confirmationNeeded { timeoutMs: 4000 } ──▶ [페이지]
                                                                        ├─ 다른 위험 버튼들 잠금/디밍
                                                                        └─ "정말 실행할까요?" 보조 안내 표시(선택)

2차 click (within 4s):
[Buttons/confirmation] ──@buttonClicked──▶ [페이지] ──> 실제 액션 수행
                                                          ├─ 계정 삭제 API 호출
                                                          ├─ 일괄 발송 commit
                                                          └─ 결제 확정 등

timeout / 외부 cancel:
[Buttons/confirmation] ──@confirmationCancelled { reason }──▶ [페이지]
                                                                  ├─ 잠갔던 다른 UI 해제
                                                                  └─ "확인 시간 만료" 토스트(선택)

운영: this.pageDataMappings = [
        { topic: 'buttonInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@confirmationNeeded':   ({ targetInstance, timeoutMs }) => { /* 잠금 */ },
        '@buttonClicked':        ({ targetInstance })            => { /* 실행 */ },
        '@confirmationCancelled':({ targetInstance, reason })    => { /* 해제 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | confirming 상태 시각 표현 |
|------|---------|--------------------------|
| `01_refined` | A: Refined Technical | 퍼플(idle) → 크림슨 그라디언트(confirming) + 글로우 강화 + progress underline 좌→우 |
| `02_material` | B: Material Elevated | elevated 라이트 → 에러 톤 배경 + elevation 단계 상승 + 360° conic-gradient progress ring |
| `03_editorial` | C: Minimal Editorial | text 스타일 → 라벨 색 강조 + italic + 아이콘 페이드아웃 + 하단 underline scaleX 진행 |
| `04_operational` | D: Dark Operational | outlined 시안 → 노랑 펄스 border + label uppercase 강조 + 좌→우 노랑 fill 카운트다운 |

각 페르소나는 `[data-confirmation-state="confirming"]` 셀렉터로 idle 대비 명확한 상태 시각 차별을 둔다.
