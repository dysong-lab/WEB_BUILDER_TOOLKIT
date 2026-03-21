# 모든 스킬 공통 지침

모든 SKILL.md에서 참조하는 공통 규칙입니다.

---

## 작업 전 필수 확인

**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

| 스킬 단계 | 필수 확인 문서 |
|-----------|---------------|
| 1-figma (정적 퍼블리싱) | [/Figma_Conversion/README.md](/Figma_Conversion/README.md), [/Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) |
| 2-component (동적 변환) | [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md), 사용할 Mixin의 .md 파일 |
| 3-page (프로젝트 생성) | [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md), [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) |

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

// ✅ 데이터 응답은 { response }로 구조분해
ns.renderData = function({ response }) {
    const { data } = response;
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

## register.js 구조 (Mixin 기반)

register.js는 **조립 코드만** 포함한다. 순서가 중요하다.

```
1. Mixin 적용     — 반드시 먼저 (네임스페이스 생성)
2. 구독 연결      — Mixin 메서드를 함수 참조로 연결
3. 이벤트 매핑    — Mixin의 선택자를 computed property로 참조
```

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

// 1. Mixin 정리 — Mixin이 자기 것만 정리
this.fieldRender.destroy();
// this.listRender.destroy();
```

**핵심:** Mixin의 destroy가 내부 상태, 메서드, 선택자를 모두 정리한다. 수동 null 처리 불필요.

---

## 에러 처리

```
Mixin:        throw (에러를 알림)
컴포넌트:     에러 처리 없음 (조립 코드만)
페이지:       fetchAndPublish().catch() (에러를 처리)
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

this.updateSystemInfo = function({ response }) {
    const data = response.data;
    this.fieldRender.renderData({
        response: {
            data: {
                name:        data.hostname,     // API 'hostname' → selector KEY 'name'
                status:      data.status,       // 일치 → 그대로
                statusLabel: data.statusLabel   // 일치 → 그대로
            }
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
- ❌ datasetName 기반 데이터 응답을 받는 함수에서 `function(response)` 사용 → `function({ response })` 필수
- ❌ 생성 후 정리 누락 (register ↔ beforeDestroy 쌍)
- ❌ Mixin 메서드 재정의 (래핑, 덮어쓰기)
- ❌ register.js에 렌더링 로직 작성 (조립 코드만)
- ❌ customEvents에서 선택자 하드코딩 (Mixin의 computed property 사용)
- ❌ HTML 문자열을 JS에 작성 (template 태그 사용)
- ❌ 컴포넌트에서 직접 fetch
