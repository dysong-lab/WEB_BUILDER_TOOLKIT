# 런타임 이벤트 추가 — bindEvents 사용 사례

컴포넌트가 최초 `bindEvents()` 호출 이후에 이벤트를 **추가/교체/일시 비활성화/제거**해야 할 때 사용하는 패턴 모음. `customEvents` + `bindEvents` 경로만 다룬다. `_internalHandlers` 패턴은 [EVENT_HANDLING.md](./EVENT_HANDLING.md) §3 참조.

---

## 1. 핵심 원리 — `makeHandler`는 동적 lookup

런타임 패턴이 가능한 이유는 단 하나, `Wkit.js:237-252`의 `makeHandler`가 **이벤트 발생 시점에 매번 다시 lookup**하기 때문이다.

```javascript
function makeHandler(targetInstance, selector) {
  return function (event) {
    event.type === 'submit' && event.preventDefault();
    const { customEvents } = targetInstance;
    const triggerEvent = customEvents?.[event.type]?.[selector];   // ← 매번 다시 읽음
    if (triggerEvent) {
      Weventbus.emit(triggerEvent, { event, targetInstance });
    }
  };
}
```

**클로저에 갇히는 것**: `targetInstance`, `selector` (둘 다 참조/문자열).
**클로저에 갇히지 않는 것**: 트리거 이름(`'@xxx'`).

이 비대칭이 이 문서의 모든 패턴의 토대다.

---

## 2. 시나리오 매트릭스

| 하고 싶은 일 | `customEvents` mutation | `bindEvents` 추가 호출 | `removeCustomEvents` |
|---|:---:|:---:|:---:|
| 트리거 이름만 교체 | O | X | X |
| 새 selector 추가 (기존 type) | O (머지) | O (새 항목만) | X |
| 새 event type 추가 | O (머지) | O (새 type만) | X |
| 임시 비활성화 / 재활성화 | O (값을 `null`) | X | X |
| selector 영구 제거 | `delete` | X | O (해당 항목만) |

핵심 규칙: **`bindEvents`는 절대 `this.customEvents`를 통째로 다시 넘기지 않는다.** 항상 "추가된 부분만" 새 객체로 만들어 넘긴다 (이유는 §4 함정 참조).

---

## 3. 시나리오별 코드

### 3.1 트리거 이름만 교체

이미 바인딩된 selector의 트리거 이름만 다른 것으로 바꾸고 싶은 경우.

```javascript
// ✅ mutation 한 줄이면 끝
this.customEvents.click[this.fieldRender.cssSelectors.someBtn] = '@anotherEvent';
```

**왜 이게 충분한가** — `makeHandler`가 발화 시점에 `targetInstance.customEvents[event.type][selector]`를 다시 읽으므로, 다음 클릭부터 자동으로 새 트리거 이름이 적용된다.

**`bindEvents`/`removeCustomEvents`를 호출하면 안 된다.** 호출하면 §4의 leak으로 들어간다.

**페이지 측 동기화** — 컴포넌트가 `'@a'` → `'@anotherEvent'`로 바꾸면, 페이지의 `eventBusHandlers['@a']`는 조용히 수신을 멈춘다. 양쪽이 짝을 맞춰 같이 바뀌어야 한다.

---

### 3.2 새 selector 추가 (기존 event type 안에)

이 시나리오는 **두 책임이 분리돼 있어** 두 단계가 모두 필요하다.

| 책임 | 어디서 처리되나 |
|---|---|
| "이 selector가 매칭되면 `closest()`를 돌릴 listener가 등록돼 있다" | `delegate()` (= `bindEvents` 호출) |
| "매칭되면 무슨 트리거 이름으로 emit할지 안다" | `targetInstance.customEvents` 테이블 |

`bindEvents`는 (1)만 해주고 `this.customEvents`를 mutation하지 않는다. 반대로 mutation만 하면 (2)는 되지만 (1)이 없어서 listener 자체가 없다.

```javascript
const { bindEvents } = Wkit;
const newSel = this.fieldRender.cssSelectors.extraBtn;

// 1. customEvents에 머지 — makeHandler가 lookup할 수 있게
this.customEvents.click = this.customEvents.click || {};
this.customEvents.click[newSel] = '@extraClicked';

// 2. "추가된 부분만" bindEvents에 넘김 — 기존 selector 재바인딩 leak 회피
bindEvents(this, {
  click: {
    [newSel]: '@extraClicked'
  }
});
```

**순서 노트** — 두 줄 사이의 순서는 사실 결과에 영향을 주지 않는다 (`makeHandler`가 동적 lookup이므로). 단, 두 줄 사이에 click이 발생하면 그 한 번은 emit이 비는 윈도우가 생긴다. 안전하게 **mutation → bindEvents** 순서로 두는 것을 권장한다.

---

### 3.3 새 event type 추가

> **§3.2와의 관계** — 코드 모양은 §3.2와 글자 단위로 거의 동일하다 (`this.customEvents[type] = this.customEvents[type] || {}` 한 줄이 두 케이스를 모두 처리함). 그럼에도 별도 항목으로 둔 이유는 **멘탈 모델 차이** 때문이다. "이미 다루던 type에 selector 한 칸 더"와 "새로운 종류의 이벤트가 컴포넌트 어휘에 처음 등장"은 같은 작업이지만 머릿속에서는 다른 결정으로 느껴지므로, 검색/참조 편의를 위해 분리해 둔다.

`click`만 있던 컴포넌트에 `change`가 새로 필요해진 경우. `event type`별로 listener가 따로 등록되므로, 기존 type에는 전혀 영향이 없다.

```javascript
const { bindEvents } = Wkit;
const sel = this.fieldRender.cssSelectors.filterSelect;

// 1. 새 type 머지
this.customEvents.change = this.customEvents.change || {};
this.customEvents.change[sel] = '@filterChanged';

// 2. 새 type만 넘김 (click은 건드리지 않음)
bindEvents(this, {
  change: {
    [sel]: '@filterChanged'
  }
});
```

기존 `click` 매핑은 그대로 유지되고, `change` listener만 새로 `appendElement`에 부착된다.

---

### 3.4 임시 비활성화 / 재활성화

`makeHandler`의 `if (triggerEvent)` 분기를 활용해 emit만 일시적으로 막을 수 있다. listener는 그대로 살아 있고 `closest()` 매칭도 계속 일어나지만, Weventbus 발행만 건너뛴다.

```javascript
// 임시로 emit 멈추기
this.customEvents.click[sel] = null;

// 다시 켜기
this.customEvents.click[sel] = '@originalEvent';
```

**경고 — 부수효과성 의존** — 이 동작은 `makeHandler`의 `if (triggerEvent)` 분기에 직접 의존한다(`Wkit.js:244`). 누군가 `makeHandler`를 리팩토링하면서 이 분기를 지우거나 falsy 처리를 바꾸면 조용히 깨질 수 있다. 임시 토글이 컴포넌트의 핵심 동작이라면 mutation 트릭에 의존하지 말고 `removeCustomEvents` + 재바인딩(§3.5 → §3.2 순)으로 명시적으로 다루는 것이 안전하다.

---

### 3.5 selector 영구 제거

특정 selector만 listener와 테이블 양쪽에서 완전히 떼어내는 경우.

```javascript
const { removeCustomEvents } = Wkit;
const sel = this.fieldRender.cssSelectors.extraBtn;

// 1. 해당 항목만 부분 객체로 만들어 removeCustomEvents에 전달
removeCustomEvents(this, {
  click: { [sel]: '@whatever' }   // 값은 무시되고 키만 사용됨
});

// 2. 테이블에서도 제거
delete this.customEvents.click[sel];
```

`removeCustomEvents`(`Wkit.js:16-28`)는 전달받은 객체의 `[eventName][selector]` 키만 보고 `userHandlerList`에서 핸들러 참조를 찾아 떼어낸다. 트리거 이름 값은 보지 않으므로 위의 `'@whatever'` 자리는 아무거나 와도 된다(가독성을 위해 원래 트리거 이름을 적는 것을 권장).

`delete`만 하고 `removeCustomEvents`를 빼먹으면 — 매칭은 무력화되지만 listener는 `appendElement`에 남아 매 클릭마다 `closest()`가 헛돌고, beforeDestroy의 표준 cleanup 패턴(§5)도 더 이상 그 항목을 인지하지 못한다.

---

## 4. 함정 — 같은 selector 재바인딩 leak

이 문서의 모든 권장사항이 결국 회피하려고 하는 단 하나의 함정.

### 4.1 단계별 추적

핵심은 `Wkit.js:328-344` `delegate()`가 `userHandlerList[type][selector]`를 **그대로 덮어쓰는** 한편, `addEventListener`는 매번 새로 호출한다는 점이다.

```javascript
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => { /* ... */ };
  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;          // ← 덮어씀
  instance.appendElement.addEventListener(eventName, emitEvent);      // ← 누적
}
```

**1단계** — 첫 번째 호출
```javascript
bindEvents(this, { click: { '.btn': '@a' } });
```

| 위치 | 상태 |
|---|---|
| DOM의 click listener 리스트 | `[emitEvent_1]` |
| `userHandlerList.click['.btn']` | `emitEvent_1` |

**2단계** — 두 번째 호출 (같은 selector)
```javascript
bindEvents(this, { click: { '.btn': '@b' } });
```

| 위치 | 상태 |
|---|---|
| DOM의 click listener 리스트 | `[emitEvent_1, emitEvent_2]` ← 둘 다 부착 |
| `userHandlerList.click['.btn']` | `emitEvent_2` (only) |
| `emitEvent_1`로 가는 참조 | **어디에도 없음** (leak 확정) |

**3단계** — `removeCustomEvents(this, this.customEvents)` 호출
- `userHandlerList.click['.btn']` 조회 → `emitEvent_2`만 반환
- `removeEventListener('click', emitEvent_2)` → DOM에서 `emitEvent_2`만 떨어짐
- `emitEvent_1`은 참조가 사라졌으므로 **그 어떤 코드도 떼어낼 수 없음**

### 4.2 증상

| 시점 | 관찰되는 동작 |
|---|---|
| 2단계 직후 ~ 3단계 전 | `.btn` 클릭 한 번에 `Weventbus.emit`이 **두 번** 발화 (`emitEvent_1`, `emitEvent_2`가 둘 다 살아있고, 둘 다 같은 `customEvents` 테이블을 lookup하므로 같은 트리거를 두 번 emit) |
| 3단계 이후 | `this.customEvents = null`까지 했어도 `.btn` 클릭마다 `emitEvent_1`이 여전히 발화. `customEvents`가 null이라 `triggerEvent`가 undefined로 풀려 emit은 일어나지 않지만, 매 클릭마다 `closest()`가 헛돌고 메모리는 잡혀 있는 **조용한 좀비** |

### 4.3 회피 — "추가된 부분만 넘기기"

```javascript
// ❌ 절대 금지 — this.customEvents 통째로 재바인딩
this.customEvents.click[newSel] = '@newEvent';
bindEvents(this, this.customEvents);   // 기존 selector 전부 leak

// ✅ 새 매핑만 새 객체로 만들어 넘김
this.customEvents.click[newSel] = '@newEvent';
bindEvents(this, { click: { [newSel]: '@newEvent' } });
```

§3.2 / §3.3의 권장 코드가 `bindEvents`에 부분 객체를 만들어 넘기는 이유가 바로 이것이다.

---

## 5. cleanup 매칭

`beforeDestroy`에서 한 번의 `removeCustomEvents` 호출로 머지된 항목까지 전부 정리된다 — `Wkit.js:16-28`이 전달받은 객체를 순회하며 `userHandlerList`에서 참조를 찾아 떼기 때문이다.

```javascript
// beforeDestroy.js
const { removeCustomEvents } = Wkit;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;
```

런타임에 §3.2 / §3.3로 추가한 항목들도 모두 `this.customEvents` 안에 머지돼 있으므로 별도 추적이 필요 없다. **단, §3.5의 영구 제거 패턴으로 이미 떼어낸 항목은 `this.customEvents`에서도 `delete`로 빠져 있어야 cleanup이 유령 키를 lookup하지 않는다** (lookup 실패는 무해하지만 가독성/디버깅을 위해 권장).

---

## 6. 체크리스트

새 이벤트 작업을 할 때마다 점검:

- [ ] **트리거 이름만 바꾸는가?** → mutation 한 줄. `bindEvents` 부르지 말 것.
- [ ] **새 selector 또는 새 event type인가?** → mutation + `bindEvents`에 **추가된 부분만** 넘기기.
- [ ] **`bindEvents(this, this.customEvents)` 식으로 통째로 넘기고 있지 않은가?** → §4 leak.
- [ ] **페이지 `eventBusHandlers`의 트리거 이름과 짝이 맞는가?** → 컴포넌트가 트리거 이름을 바꿨다면 페이지도 같이.
- [ ] **`beforeDestroy`에 `removeCustomEvents(this, this.customEvents)`가 있는가?** → 머지된 항목까지 한 번에 정리.
- [ ] **§3.5로 영구 제거한 항목을 `delete`로 테이블에서도 빼냈는가?**

---

## 관련 문서

- [EVENT_HANDLING.md](./EVENT_HANDLING.md) — 최초 등록 + cleanup 매칭, `_internalHandlers`와의 구분, 페이지가 알아야 하는지 여부에 따른 패턴 선택
- [WKIT_API.md](./WKIT_API.md) — `bindEvents` / `removeCustomEvents` API 시그니처와 내부 동작
