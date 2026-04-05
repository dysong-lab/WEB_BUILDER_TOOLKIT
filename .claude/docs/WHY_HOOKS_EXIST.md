# Hook이 존재하는 이유

## 이 문서의 목적

[hooks/README.md](../hooks/README.md)는 **무엇을** 검사하는지 설명한다.
이 문서는 **왜** 그것을 검사해야 하는지 설명한다.

---

## 이 아키텍처의 핵심 구조

RENOBIT은 페이지와 컴포넌트로 웹 결과물을 만드는 플랫폼이다.

```
페이지 = 오케스트레이터 (데이터를 정의하고, 발행하고, 정리한다)
컴포넌트 = 독립적 구독자 (데이터를 받아서 보여주기만 한다)
```

이 둘을 연결하는 것이 **Topic 기반 pub-sub** 패턴이다.

```
페이지가 fetchAndPublish('systemInfo') →
  GlobalDataPublisher가 API를 호출하고 →
    'systemInfo' topic을 구독한 모든 컴포넌트에게 데이터를 전달
```

컴포넌트는 데이터가 어디서 오는지 모른다. 페이지는 컴포넌트가 데이터를 어떻게 보여주는지 모른다. 이 무지(ignorance)가 설계의 핵심이다.

---

## 컴포넌트 내부의 역할 분리

컴포넌트 안에서도 역할이 나뉜다.

```
HTML          시각 구조를 정의한다. 약속된 선택자(class, id)만 갖는다.
              데이터 값을 모른다.

Mixin         기능을 담당한다. cssSelectors 계약으로만 HTML에 접근한다.
              HTML의 구체적인 구조를 모른다.

register.js   Mixin을 HTML에 연결하고, topic을 구독에 연결한다.
              조립만 한다. 렌더링하지 않는다.
```

이 3층 분리가 있어서, 같은 Mixin으로 완전히 다른 디자인의 컴포넌트를 만들 수 있다.

---

## 각 Hook이 막는 것과 그 이유

### register.js에 렌더링/fetch 로직이 왜 안 되는가

**Hook**: check-register.sh (P0-2)
**차단**: `innerHTML`, `appendChild`, `createElement`, `fetch(`, `XMLHttpRequest`

register.js는 **조립 코드**다. Mixin을 적용하고, 구독을 연결하고, 이벤트를 매핑한다. 여기까지만.

올바른 register.js는 **이름만** 안다:

```javascript
// ✅ "status라는 데이터가 .card__status에 간다"만 선언
applyFieldRenderMixin(this, {
    cssSelectors: { status: '.card__status' }
});
```

`.card__status`가 `<span>`인지 `<div>`인지, 안에 아이콘이 있는지 — register.js는 모른다. 디자인이 바뀌어 HTML이 완전히 달라져도 `.card__status`라는 약속만 유지되면 register.js는 수정할 필요가 없다.

만약 register.js가 직접 렌더링한다면:

```javascript
// ❌ register.js에서 직접 렌더링
const el = document.createElement('div');
el.innerHTML = `<span class="icon">●</span><span>${data.status}</span>`;
container.appendChild(el);
```

이 순간 "div 안에 span 2개, 첫 번째는 아이콘, 두 번째는 텍스트"라는 **HTML 구조 지식이 register.js에 박힌다.** 디자이너가 아이콘을 SVG로 바꾸면 register.js도 수정해야 한다. HTML을 고치면 JS도 고쳐야 하고, 이 register.js를 다른 디자인에서 재사용할 수 없다.

만약 register.js가 직접 fetch한다면:

```javascript
// ❌ register.js에서 직접 fetch
fetch('/api/system-info').then(res => res.json()).then(data => {
    this.fieldRender.renderData({ response: data });
});
```

이 순간 컴포넌트는 **데이터 출처를 알게 된다.** API 주소가 바뀌면 컴포넌트를 수정해야 한다. 페이지가 오케스트레이션하는 pub-sub 구조가 무너진다. 같은 컴포넌트를 다른 데이터 소스에 연결할 수 없게 된다.

**register.js가 조립만 하면:**
- 디자인이 바뀌어도 → HTML과 CSS만 수정
- 데이터 소스가 바뀌어도 → 페이지의 pageDataMappings만 수정
- register.js는 그대로

---

### register.js에 Mixin 적용과 구독이 왜 필수인가

**Hook**: check-register.sh (P1-1)
**필수**: `apply*Mixin`, `subscribe(`

Mixin이 없는 register.js는 빈 껍데기다. 구독이 없는 컴포넌트는 데이터를 받을 수 없다.

이 두 가지가 없다면 컴포넌트가 존재하는 이유가 없다. 화면에 정적 HTML만 보이고, 런타임 데이터는 영원히 도착하지 않는다.

---

### beforeDestroy.js에 null 정리와 destroy()가 왜 필수인가

**Hook**: check-beforeDestroy.sh (P1-4)
**필수**: `= null`, `.destroy()`, `unsubscribe`

RENOBIT에서 페이지 전환이 발생하면:

```
페이지 A → 페이지 B 이동
  before_unload (페이지 정리)
    → beforeDestroy (컴포넌트 정리)   ← 여기
      → 새 페이지 B 로드
```

beforeDestroy에서 정리하지 않으면:

1. **구독이 남는다.** 페이지 B에서 같은 topic으로 데이터를 발행하면, 이미 죽은 페이지 A의 컴포넌트가 데이터를 받는다. 존재하지 않는 DOM에 렌더링을 시도하고, 콘솔에 에러가 쌓인다.

2. **이벤트가 남는다.** 클릭 핸들러가 해제되지 않으면, 이미 교체된 DOM에 바인딩된 이벤트가 좀비처럼 남는다.

3. **참조가 남는다.** `this.subscriptions`, `this.customEvents`, `this.fieldRender` 같은 참조가 null 처리되지 않으면, 가비지 컬렉터가 관련 객체를 회수하지 못한다. 페이지를 반복 전환하면 메모리가 누적된다.

4. **Mixin 내부 상태가 남는다.** destroy()를 호출하지 않으면 Mixin이 내부적으로 보유한 타이머, 캐시, DOM 참조가 정리되지 않는다.

---

### beforeDestroy.js가 왜 register.js의 역순이어야 하는가

**Hook**: cross-register-destroy.sh (P1-2)

생성:
```
1. Mixin 적용 → 네임스페이스 생성 (this.fieldRender)
2. 구독 연결  → Mixin 메서드를 topic에 연결
3. 이벤트 매핑 → DOM 클릭을 Weventbus에 연결
```

정리가 역순이어야 하는 이유:

- **이벤트를 먼저 제거해야** 한다. 이벤트가 살아있는 상태에서 구독을 해제하면, 사용자 클릭 → Weventbus → 이미 해제된 구독을 참조하는 핸들러 실행 → 에러.

- **구독을 먼저 해제해야** 한다. 구독이 살아있는 상태에서 Mixin을 destroy하면, 데이터 도착 → 구독 콜백 → 이미 파괴된 Mixin 메서드 호출 → 에러.

- **Mixin은 마지막에 destroy** 한다. 이벤트와 구독이 모두 끊어진 후에야 안전하게 Mixin의 내부 상태를 정리할 수 있다.

역순이 아니면, 정리 도중 타이밍에 따라 간헐적 에러가 발생한다. 재현하기 어렵고 디버깅하기 더 어려운 종류의 버그다.

---

### page loaded.js에서 DOM 조작이 왜 안 되는가

**Hook**: check-page-loaded.sh (P0-4)
**차단**: `innerHTML`, `appendChild`, `createElement`, `querySelector`

페이지의 역할은 **오케스트레이션**이다.

```
loaded.js가 하는 것:
  1. 어떤 데이터를 → pageDataMappings 정의
  2. 얼마나 자주 → refreshInterval 설정
  3. 누구에게 보낼지 → registerMapping + fetchAndPublish
```

페이지가 직접 DOM을 조작하면:

```javascript
// ❌ loaded.js에서 직접 DOM 조작
const header = document.querySelector('.dashboard-header');
header.textContent = '대시보드';
```

이 순간 페이지가 **컴포넌트의 내부 구조를 알게 된다.** 페이지와 컴포넌트 사이의 느슨한 결합이 깨진다. 컴포넌트의 HTML 구조를 변경하면 페이지 코드도 수정해야 한다.

페이지는 "데이터를 보내라"만 말하고, "어떻게 보여줄지"는 컴포넌트가 알아서 결정해야 한다.

---

### page before_load.js에서 DOM 조작이 왜 안 되는가

**Hook**: check-page-before-load.sh (P0-4)
**차단**: `innerHTML`, `appendChild`, `createElement`

before_load.js는 **컴포넌트 register 이전에** 실행된다.

```
실행 순서:
  before_load.js 실행    ← 여기
    ↓
  컴포넌트 register.js 실행
    ↓
  loaded.js 실행
```

이 시점에서 컴포넌트의 DOM이 아직 완성되지 않았을 수 있다. DOM을 조작하면 타이밍 의존 버그가 발생한다.

before_load.js의 유일한 역할은 **이벤트 핸들러를 미리 등록하는 것**이다. 컴포넌트가 나중에 emit할 이벤트를 받을 준비를 하는 것이지, DOM을 직접 건드리는 것이 아니다.

---

### page before_unload.js에서 정리가 왜 필수인가

**Hook**: check-page-before-unload.sh, cross-page-lifecycle.sh (P1)

before_unload.js는 **컴포넌트 beforeDestroy 이전에** 실행된다.

```
실행 순서:
  before_unload.js 실행   ← 여기 (페이지 리소스 정리)
    ↓
  컴포넌트 beforeDestroy.js 실행 (컴포넌트 리소스 정리)
```

페이지가 정리하지 않으면:

1. **Interval이 계속 돈다.** setTimeout 체인이 끊어지지 않아, 페이지 B로 이동한 후에도 페이지 A의 API 호출이 반복된다. 서버에 불필요한 부하, 콘솔에 에러.

2. **EventBus 핸들러가 남는다.** 페이지 A의 `@cardClicked` 핸들러가 해제되지 않으면, 페이지 B에서 같은 이벤트가 발생할 때 페이지 A의 로직이 실행된다.

3. **DataMapping이 남는다.** 등록된 매핑이 해제되지 않으면, GlobalDataPublisher가 이미 없는 페이지의 매핑 정보를 보유한다.

loaded.js에서 생성한 것은 반드시 before_unload.js에서 정리한다. 이것이 **생성-정리 매칭**이다.

---

### register.js와 beforeDestroy.js의 생성-정리 대응이 왜 필수인가

**Hook**: cross-register-destroy.sh (P1-3, P1-4)

register.js에서 `this.showDetail = function() {...}`을 정의했다면, beforeDestroy.js에서 `this.showDetail = null`이 있어야 한다.

이유: this에 할당된 함수는 **인스턴스에 대한 클로저 참조를 보유한다.** null로 끊지 않으면 인스턴스 전체가 GC되지 않는다.

apply*Mixin 수와 destroy() 수가 일치해야 하는 이유도 같다. Mixin은 내부적으로 타이머, 캐시, DOM 참조를 보유할 수 있다. destroy()를 누락하면 그것들이 남는다.

---

### cssSelectors가 HTML에 왜 존재해야 하는가

**Hook**: cross-selectors-html.sh (P2-1)

Mixin은 cssSelectors 계약을 통해 HTML에 접근한다.

```javascript
applyFieldRenderMixin(this, {
    cssSelectors: {
        status: '.card__status'    // "이 선택자에 데이터를 넣겠다"
    }
});
```

만약 HTML에 `.card__status`가 없다면:

```javascript
// Mixin 내부 동작
const el = this.appendElement.querySelector('.card__status');
// el === null
el.textContent = data.status;  // TypeError: Cannot set properties of null
```

런타임 null 참조 에러가 발생한다. 이것은 디자인 변경 시 가장 흔하게 발생하는 버그다 — HTML에서 클래스명을 바꾸고, register.js의 cssSelectors를 업데이트하지 않은 경우.

---

### ListRenderMixin에 template 태그가 왜 필수인가

**Hook**: cross-selectors-html.sh (P2-2)

ListRenderMixin은 `<template>` 태그를 복제하여 목록 아이템을 생성한다.

```html
<template id="item-template">
    <div class="list-item">
        <span class="item-name"></span>
    </div>
</template>
```

```javascript
// Mixin 내부: template을 찾아서 cloneNode로 복제
const template = this.appendElement.querySelector(cssSelectors.template);
const clone = template.content.cloneNode(true);  // template이 없으면 에러
```

template이 없으면 리스트가 아예 렌더링되지 않는다.

---

### CSS에 rem/em이 왜 금지인가

**Hook**: check-p3.sh (P3-1)

```css
/* rem은 <html>의 font-size 기준 */
.card { padding: 1rem; }   /* 브라우저: 16px, RNBT 런타임: ? */

/* px는 절대값 */
.card { padding: 16px; }   /* 어디서든 16px */
```

RENOBIT 런타임 환경에서 html/body의 font-size가 브라우저 기본값(16px)과 다를 수 있다. rem/em을 사용하면 Figma에서 디자인한 치수와 실제 렌더링 결과가 달라진다.

px는 환경에 관계없이 Figma 수치와 1:1 대응된다.

---

### JS에 var가 왜 금지인가

**Hook**: check-p3.sh (P3-2)

```javascript
var count = 0;    // 함수 스코프 — for 루프 밖에서도 접근 가능
let count = 0;    // 블록 스코프 — 선언된 블록 안에서만 유효
const count = 0;  // 블록 스코프 + 재할당 불가
```

var는 함수 스코프이므로 의도치 않게 외부에서 접근되거나 덮어써질 수 있다. 특히 for 루프에서 클로저와 결합하면 고전적인 스코프 버그가 발생한다. const/let은 이를 원천 차단한다.

---

### preview.html에 로컬 CSS link가 왜 금지인가

**Hook**: check-p3.sh (P3-3)

preview.html은 **독립 실행 가능한 단일 파일**이어야 한다. 브라우저에서 더블클릭으로 열어 컴포넌트의 시각적 결과를 즉시 확인하는 용도다.

```html
<!-- ❌ 로컬 CSS link — 파일 경로가 틀리면 스타일 없이 렌더링 -->
<link rel="stylesheet" href="../styles/component.css">

<!-- ✅ 인라인 스타일 — 항상 동작 -->
<style>
.component { width: 320px; ... }
</style>
```

로컬 CSS link는 상대 경로에 의존하므로, 파일을 다른 위치로 옮기거나 프로젝트 구조가 바뀌면 깨진다.

---

## 요약: 역할 경계를 지키는 이유

```
모든 Hook은 결국 하나의 원칙을 지킨다:

  "각 요소는 자신의 역할만 수행한다."

  HTML은 구조만.
  Mixin은 기능만.
  register.js는 조립만.
  페이지는 오케스트레이션만.
  beforeDestroy는 register의 정확한 역순만.

이 경계가 유지되면:
  - 디자인이 바뀌어도 HTML/CSS만 수정
  - 데이터 소스가 바뀌어도 페이지만 수정
  - 기능이 바뀌어도 Mixin만 수정
  - 나머지는 그대로

이 경계가 무너지면:
  - 하나를 고치면 다른 것도 고쳐야 한다
  - 같은 Mixin으로 다른 디자인을 만들 수 없다
  - 같은 컴포넌트를 다른 데이터에 연결할 수 없다
  - "일관된 품질로 대량 생산"이 불가능해진다
```
