# 모든 스킬 공통 지침

모든 SKILL.md에서 참조하는 공통 규칙입니다.

---

## 작업 전 필수 확인

**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

| 스킬 단계 | 필수 확인 문서 |
|-----------|---------------|
| 1-figma (정적 퍼블리싱) | [/Figma_Conversion/README.md](/Figma_Conversion/README.md), [/Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) |
| 2-component (동적 변환) | [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md), **사용할 Mixin의 .md 파일** (아래 참조) |
| 2-component (디자인 변형 추가) | **대상 컴포넌트의 register.js** (선택자 계약 추출), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md), **기존 views/ 파일** (현재 변형 현황) |
| 3-page (프로젝트 생성) | [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md), **사용할 Mixin의 .md 파일** (아래 참조) |
| 6-design (직접 디자인) | [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md), **DesignSystemGuide CSS 4개 파일** ([01-Dark](/Figma_Conversion/DesignSystemGuide/Design%20system01-Dark/Design%20system01-Dark.css), [01-Light](/Figma_Conversion/DesignSystemGuide/Design%20system01-Light/Design%20system01-Light.css), [02-Dark](/Figma_Conversion/DesignSystemGuide/Design%20system02-Dark/Design%20system02-Dark.css), [02-Light](/Figma_Conversion/DesignSystemGuide/Design%20system02-Light/Design%20system02-Light.css)) |

### Mixin 문서 확인 규칙 (2-component, 3-page 공통)

**SKILL은 공통 패턴(register.js 3단계, beforeDestroy 역순 정리)을 안내한다. 각 Mixin의 구체적 사용법(옵션, 메서드, destroy 범위)은 해당 Mixin의 .md 문서가 담당한다.**

코드 작성 전, 사용할 Mixin의 .md를 반드시 읽는다:

| Mixin | 문서 |
|-------|------|
| FieldRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md) |
| ListRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md) |
| EChartsMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/EChartsMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/EChartsMixin.md) |
| TabulatorMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/TabulatorMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/TabulatorMixin.md) |
| HeatmapJsMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/HeatmapJsMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/HeatmapJsMixin.md) |
| MeshStateMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md) |
| CameraFocusMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) |
| ShadowPopupMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md) |
| 3DShadowPopupMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) |
| TreeRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/TreeRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/TreeRenderMixin.md) |

> 전체 목록 및 생성 기준: [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md)

---

## CSS 공통 규칙

- **px 단위 사용** (rem/em 금지) - RNBT 런타임 호환성 보장
- **Flexbox 우선** (Grid는 2D 카드 레이아웃 등 명확한 경우만 허용, absolute 지양)
- 상세: [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) CSS 원칙 섹션

---

## JS 공통 규칙

### 구조분해 응답

**적용 대상:** datasetName 기반 데이터 응답을 받는 함수 (Mixin의 renderData 포함)

런타임은 datasetName 기반 데이터 응답을 `{ response: data }`로 감싸서 전달합니다.

```javascript
// ❌ 데이터 응답을 직접 사용
function renderData(response) { ... }

// ✅ 데이터 응답은 { response: data }로 구조분해 (response를 data로 rename)
ns.renderData = function({ response: data }) {
    // data가 곧 응답 데이터
};
```

### fx.go 파이프라인 패턴

데이터 변환은 `fx.go` 파이프라인으로 표현합니다.

```javascript
// 구독 등록 패턴 (함수 참조)
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// 데이터 변환 패턴
fx.go(
    items,
    fx.filter(item => item.active),
    fx.map(item => createItemElement(template, item)),
    fx.each(el => container.appendChild(el))
);
```

---

## register.js 구조

register.js는 인스턴스에 기능을 붙이는 코드다. Mixin과 자체 메서드 모두 가능하며, 순서가 중요하다.

```
1. Mixin 적용 / 자체 메서드 정의  — 반드시 먼저 (네임스페이스 및 메서드 생성)
2. 구독 연결                      — Mixin/자체 메서드를 함수 참조로 연결
3. 이벤트 매핑                    — cssSelectors를 computed property로 참조
```

**공통 규칙:** DOM 접근은 cssSelectors 계약을 통해야 한다 (Mixin이든 자체 메서드든 동일). 생성한 것은 beforeDestroy.js에서 정리한다.

### subscriptions 패턴

subscriptions는 **함수 참조** 배열을 사용한다. Mixin 적용 이후에 선언해야 한다.

```javascript
// Mixin 적용 후
this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
```

### customEvents에서 Mixin 선택자 참조

Mixin의 선택자를 **computed property**로 참조한다. 하드코딩 금지.

```javascript
// ✅ Mixin의 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};

// ❌ 선택자 하드코딩
this.customEvents = {
    click: {
        '.event-log__item': '@eventClicked'
    }
};
```

### Shadow DOM 내부 이벤트 (ShadowPopupMixin 사용 시)

Shadow DOM 내부 이벤트는 shadow boundary를 넘을 때 `event.target`이 host 요소로 retarget된다. `bindEvents`로는 Shadow DOM 내부 요소의 클릭을 잡을 수 없다.

`bindPopupEvents`를 사용한다. `@eventName` 문자열을 넘기면 Weventbus로 전파된다 (customEvents와 동일한 패턴).

```javascript
// 일반 DOM 이벤트 → bindEvents (기존 패턴)
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@deviceClicked'
    }
};
bindEvents(this, this.customEvents);

// Shadow DOM 내부 이벤트 → bindPopupEvents
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@popupClose'
    }
});
```

`show()` 전에 호출해도 된다. Shadow DOM 생성 시 자동 바인딩된다.

> 상세: [ShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md) 참조

---

## beforeDestroy 정리 순서

**생성의 역순. 3단계.**

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 및 자체 상태 정리
this._myState = null;             // 자체 상태가 있다면 해제
this.fieldRender.destroy();       // Mixin 정리
// this.listRender.destroy();
```

**핵심:** Mixin의 destroy가 내부 상태, 메서드, 선택자를 모두 정리한다. 자체 상태는 직접 해제한다.

---

## 에러 처리

```
Mixin/자체 메서드:  throw (에러를 알림)
페이지:             fetchAndPublish().catch() (에러를 처리)
```

---

## 데이터 변환 원칙

- Mixin은 데이터 출처를 모른다. 이미 selector KEY에 맞춰진 데이터만 받는다.
- 데이터 변환은 Mixin 바깥에서 수행한다 (페이지 또는 인스턴스 메서드).
- 변환이 필요하면 인스턴스에 메서드를 정의하고, 내부에서 Mixin 메서드를 호출한다.

```javascript
// 변환이 필요 없는 경우 — API 응답의 키가 selector KEY와 일치
// API: { name: 'RNBT-01', status: 'RUNNING' }
// selector KEY: name, status → 그대로 전달
this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};
```

변환이 필요한 경우: **API 응답의 키가 selector KEY와 다를 때.**

예를 들어 API가 `hostname`으로 주지만, cssSelectors의 KEY는 `name`인 경우:

```javascript
// API 응답:     { hostname: 'RNBT-01', status: 'RUNNING', statusLabel: '정상' }
// selector KEY: name, status, statusLabel
// → hostname ≠ name 이므로 변환이 필요

this.updateSystemInfo = function({ response: data }) {
    this.fieldRender.renderData({
        response: {
            name:        data.hostname,     // API 'hostname' → selector KEY 'name'
            status:      data.status,       // 일치 → 그대로
            statusLabel: data.statusLabel   // 일치 → 그대로
        }
    });
};

this.subscriptions = {
    systemInfo: [this.updateSystemInfo]
};
```

---

## 정적 CSS 복사 규칙 (Figma → RNBT 변환 시)

Figma_Conversion에서 검증된 CSS를 복사하되, 아래만 제외합니다:

```css
/* 제외 */
@import url('...');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { ... }

/* 복사 */
#component-container { ... }    /* 컴포넌트 스타일 전체 */
.component-class { ... }
```

**절대 금지:** 검증된 CSS를 "비슷하게" 새로 작성하는 것

---

## preview.html 작성 규칙

- **inline 방식** — CSS는 `<style>` 태그로 인라인, `<link rel="stylesheet" href="...">` 로컬 파일 참조 금지 (CDN 폰트 등 외부 라이브러리는 허용)
- HTML 구조는 views/ 의 HTML과 **동일**해야 함
- Mixin 정의를 인라인으로 포함
- 최소 런타임 시뮬레이션 (GlobalDataPublisher, Wkit, fx)

---

## 스크린샷 검증 필수

```
1. Playwright 스크린샷 캡처
2. 정적 HTML 원본 (또는 Figma get_screenshot)과 비교
3. 시각적 차이가 있으면 수정
4. 차이점 없음 확인 후에만 완료
```

---

## 금지 사항 (전체 공통)

- ❌ 추측하지 않는다 — 데이터 기반으로만 작업
- ❌ 존재하지 않는 함수를 사용하지 않는다 — grep으로 확인 후 사용
- ❌ 확인 없이 완료라고 말하지 않는다
- ❌ datasetName 기반 데이터 응답을 받는 함수에서 `function(response)` 사용 → `function({ response: data })` 필수
- ❌ 생성 후 정리 누락 (register ↔ beforeDestroy 쌍)
- ❌ Mixin 메서드 재정의 (래핑, 덮어쓰기)
- ❌ cssSelectors 계약을 거치지 않는 DOM 접근
- ❌ customEvents에서 선택자 하드코딩 (Mixin의 computed property 사용)
- ❌ HTML 문자열을 JS에 작성 (template 태그 사용)
- ❌ 컴포넌트에서 직접 fetch
