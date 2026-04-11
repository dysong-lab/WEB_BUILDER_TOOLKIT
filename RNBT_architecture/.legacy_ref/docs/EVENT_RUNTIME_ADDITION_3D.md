# 런타임 이벤트 추가 (3D) — bind3DEvents 사용 사례

3D 컴포넌트가 최초 `bind3DEvents()` 호출 이후에 이벤트를 **추가/교체/일시 비활성화/제거**해야 할 때 사용하는 패턴 모음. 2D 버전과 짝이지만 핵심 함정이 **정반대 방향**이라 따로 둔다. 2D 버전은 [EVENT_RUNTIME_ADDITION.md](./EVENT_RUNTIME_ADDITION.md) 참조.

---

## 1. 핵심 원리 — `make3DHandler`도 동적 lookup, 단 구조가 더 단순하다

`Wkit.js:279-288`의 `make3DHandler`는 2D와 마찬가지로 **이벤트 발생 시점에 매번 `customEvents`를 다시 읽는다**. 다만 선택자 계층이 없어 한 단계 얕다.

```javascript
function make3DHandler(targetInstance) {
  return function (event) {
    const { customEvents } = targetInstance;
    console.log('@eventHandler', customEvents[event.type]);
    Weventbus.emit(customEvents[event.type], {   // ← 바로 트리거 이름
      event,
      targetInstance,
    });
  };
}
```

**클로저에 갇히는 것**: `targetInstance` 참조.
**클로저에 갇히지 않는 것**: 이벤트 타입(런타임 `event.type`), 트리거 이름(`customEvents[event.type]`로 매번 lookup).

그리고 2D `makeHandler`와 결정적으로 다른 두 가지:

- **선택자 계층 없음** — `customEvents[type]`는 객체가 아니라 **문자열(트리거 이름)**. 스키마는 `{ click: '@triggerClick' }`(Wkit.js:222-226 `getCustomEventsSchemaFor3D`).
- **`if (triggerEvent)` 가드 없음** — 값이 `null`/`undefined`여도 그대로 `Weventbus.emit(null, ...)`로 흘러간다. 2D §3.4의 "값을 null로 만들어 임시 비활성화" 트릭이 그대로 통하지 않는 이유다.

---

## 2. 2D와의 핵심 차이 — 한눈에

| 항목 | 2D (`bindEvents`) | 3D (`bind3DEvents`) |
|---|---|---|
| `customEvents` 모양 | `{ type: { selector: '@trigger' } }` | `{ type: '@trigger' }` |
| 핸들러가 붙는 곳 | `appendElement`에 `addEventListener` | `appendElement.eventListener[type]`에 함수 할당 |
| 디스패치 경로 | DOM 버블링 → `closest(selector)` 매칭 → emit | raycaster가 hit된 Object3D까지 올라가 `eventListener[event.type]?.()` 호출 |
| `userHandlerList` | 있음 (`delegate()`가 관리) | **없음** |
| 같은 타입 재호출 시 위험 | DOM 리스너 누적 **leak** (§4 2D) | 기존 `eventListener` 객체가 **통째로 리셋** (§4 3D) |
| 권장 재호출 인자 | **추가된 부분만** | **머지된 전체** |
| `makeHandler` 가드 | `if (triggerEvent)` 있음 | **없음** — null/undefined도 emit |
| 개별 cleanup API | `removeCustomEvents` | **없음** (3D `customEvents`에 `removeCustomEvents`를 호출해도 no-op — §5) |
| 일반 cleanup | `beforeDestroy`의 `removeCustomEvents` | 페이지 teardown의 `dispose3DTree`가 `eventListener` 항목을 undefined로 설정 |

이 표의 마지막 두 줄이 이 문서 전체의 모양을 결정한다.

---

## 3. 시나리오 매트릭스

| 하고 싶은 일 | `customEvents` mutation | `bind3DEvents` 추가 호출 | `eventListener` 직접 조작 |
|---|:---:|:---:|:---:|
| 트리거 이름만 교체 | O | X | X |
| 새 event type 추가 | O (머지) | O (**머지된 전체** 넘기기) | X |
| 임시 비활성화 / 재활성화 | X (null mutation은 위험) | X | O (stash & restore) |
| event type 영구 제거 | `delete` | X 또는 머지된 전체 재호출 | O (`eventListener[type] = undefined`) |

핵심 규칙: **`bind3DEvents`는 절대 "추가분만" 넘기지 않는다.** 부분만 넘기면 나머지 타입이 전부 사라진다 (이유는 §4 함정 참조). 2D의 권장과 정확히 반대다.

---

## 4. 시나리오별 코드

### 4.1 트리거 이름만 교체

이미 바인딩된 type의 트리거 이름만 다른 것으로 바꾸고 싶은 경우. 2D §3.1과 동일한 원리다.

```javascript
// ✅ mutation 한 줄이면 끝
this.customEvents.click = '@anotherEvent';
```

**왜 이게 충분한가** — `make3DHandler`가 발화 시점에 `targetInstance.customEvents[event.type]`를 다시 읽으므로, 다음 클릭부터 자동으로 새 트리거 이름이 적용된다. `eventListener.click`에 할당된 함수 자체는 교체할 필요가 없다.

**`bind3DEvents`를 호출하면 안 된다.** 호출해도 §4의 리셋 때문에 현재 타입 하나만 다루는 경우라면 결과가 같아 보이지만, 다른 타입이 있을 때 같이 날아가는 사고를 부를 수 있다. 단순 교체에는 부르지 않는 습관을 들인다.

**페이지 측 동기화** — 컴포넌트가 `'@a'` → `'@anotherEvent'`로 바꾸면, 페이지의 `eventBusHandlers['@a']`는 조용히 수신을 멈춘다. 양쪽이 짝을 맞춰 같이 바뀌어야 한다 (2D와 동일).

---

### 4.2 새 event type 추가

`click`만 있던 3D 컴포넌트에 `wheel` 또는 `pointermove`가 새로 필요해진 경우. 2D §3.3과 코드 모양은 비슷해 보이지만 `bind3DEvents`에 넘기는 인자가 **정반대**다.

```javascript
const { bind3DEvents } = Wkit;

// 1. customEvents에 머지
this.customEvents.wheel = '@zoomed';

// 2. ⚠️ "머지된 전체"를 넘긴다 — 부분만 넘기면 기존 click이 날아간다 (§4)
bind3DEvents(this, this.customEvents);
```

**왜 전체를 넘겨야 하는가** — `bind3DEvents`는 호출 즉시 `instance.appendElement.eventListener = {}`로 **리셋**하고 인자 객체의 키만 다시 채운다. `bind3DEvents(this, { wheel: '@zoomed' })`로 호출하면 `eventListener.click`이 통째로 증발한다.

**`make3DHandler`가 이렇게 써도 안전한 이유** — 리셋-후-재등록되는 핸들러들은 모두 `targetInstance`를 읽기 때문에, `customEvents.click`의 기존 트리거 이름은 그대로 보존된다. 새로 생성된 `eventListener.click` 함수도 같은 `targetInstance`를 참조하여 동일 트리거 이름을 emit한다.

**2D와의 누적 leak 문제가 없는 이유** — `bind3DEvents`는 `addEventListener`를 호출하지 않는다. `eventListener`는 `Object3D` 위의 plain 객체 슬롯일 뿐이고, 재할당은 그냥 참조 교체다. DOM 리스너 누적이 생길 여지 자체가 없다.

---

### 4.3 임시 비활성화 / 재활성화

**2D §3.4의 "값을 null로 만들기" 트릭은 3D에서 쓰면 안 된다.** `make3DHandler`에 `if (triggerEvent)` 가드가 없어 `Weventbus.emit(null, ...)` 또는 `emit(undefined, ...)`가 실제로 발화된다.

대신, **디스패처 레이어에서 직접 끈다** — raycaster의 `target.eventListener?.[event.type]?.(…)`(Wkit.js:274)은 옵셔널 콜이므로 슬롯을 `undefined`로 두면 호출 자체가 일어나지 않는다.

```javascript
// 임시 비활성화 — raycaster 디스패치를 차단
const stashedClick = this.appendElement.eventListener.click;
this.appendElement.eventListener.click = undefined;

// 재활성화 — 저장해 둔 핸들러를 되돌린다
this.appendElement.eventListener.click = stashedClick;
```

**왜 stash해 두는가** — `make3DHandler`는 Wkit 내부 함수로 export되지 않는다. 외부에서 새 핸들러를 만들 방법이 없기 때문에, 이미 만들어진 핸들러 참조를 버리지 않고 보관해 두는 것이 유일한 복구 수단이다. 참조를 잃었다면 `bind3DEvents(this, this.customEvents)`로 머지된 전체를 재호출해 모든 타입의 핸들러를 새로 만드는 길밖에 없다.

**대안 — customEvents를 비우는 방식은 금지** — `this.customEvents.click = null` 또는 `delete this.customEvents.click`은 `make3DHandler`가 여전히 살아있어 `Weventbus.emit(undefined, …)`이 매 클릭마다 발화된다. `eventListener` 슬롯을 비우는 것과 다르다.

---

### 4.4 event type 영구 제거

특정 type의 디스패치와 테이블 항목을 모두 떼어내는 경우. 2D의 `removeCustomEvents`에 해당하는 3D 전용 API는 없으므로 직접 한다.

```javascript
// 1. 디스패처 슬롯 제거 — raycaster가 더 이상 호출하지 않음
this.appendElement.eventListener.click = undefined;
// (또는) delete this.appendElement.eventListener.click;

// 2. 테이블에서도 제거 — make3DHandler lookup 시 유령 emit 방지
delete this.customEvents.click;
```

**둘 다 필요한 이유** — (1)만 하면 raycaster가 호출할 핸들러가 없어 동작상 "꺼진" 상태가 되지만, 누군가 실수로 나중에 `eventListener.click`을 다시 연결하면 예전 트리거 이름이 되살아난다. (2)만 하면 §4.3에서 설명한 대로 `emit(undefined, …)`이 발화된다. 둘을 짝지어 해야 consistent한 "제거" 상태가 된다.

**대안 — 머지된 전체 재바인딩** — click 외의 type만 남기고 싶다면 아래도 가능하다. 새로 만들어지는 핸들러 수 = 남은 type 수라서 약간 더 많은 일을 하지만 결과는 같다.

```javascript
delete this.customEvents.click;
bind3DEvents(this, this.customEvents);   // click이 없는 상태로 리셋 후 재등록
```

---

## 5. 함정 — `bind3DEvents`는 `eventListener`를 통째로 리셋한다

이 문서의 모든 권장사항이 결국 회피하려고 하는 단 하나의 함정. 2D의 "leak" 함정과 **방향이 정반대**다.

### 5.1 소스 — 리셋이 일어나는 한 줄

`Wkit.js:41-47`:

```javascript
Wkit.bind3DEvents = function (instance, customEvents) {
  instance.appendElement.eventListener = {};   // ← 이 한 줄이 모든 것을 날린다
  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

빈 객체 할당이 무조건 선행되므로, `customEvents` 인자에 포함되지 않은 모든 기존 type이 즉시 사라진다.

### 5.2 단계별 추적

**1단계** — 첫 번째 호출
```javascript
this.customEvents = { click: '@a' };
bind3DEvents(this, this.customEvents);
```

| 위치 | 상태 |
|---|---|
| `appendElement.eventListener` | `{ click: handler_click_1 }` |
| `this.customEvents` | `{ click: '@a' }` |

**2단계** — `wheel`을 추가하려고 부분만 넘김 (❌ 잘못된 패턴)
```javascript
this.customEvents.wheel = '@zoomed';
bind3DEvents(this, { wheel: '@zoomed' });
```

| 위치 | 상태 |
|---|---|
| `appendElement.eventListener` | `{ wheel: handler_wheel_1 }` ← `click`이 **사라짐** |
| `this.customEvents` | `{ click: '@a', wheel: '@zoomed' }` ← 테이블은 그대로 |

이 순간부터 click은 raycaster가 `eventListener.click`을 찾지 못해 디스패치 자체가 일어나지 않는다. `this.customEvents.click`이 여전히 `'@a'`로 살아있기 때문에 테이블과 실제 동작이 어긋나 디버깅이 까다롭다.

### 5.3 회피 — "머지된 전체 넘기기"

```javascript
// ❌ 절대 금지 — 부분만 넘김
this.customEvents.wheel = '@zoomed';
bind3DEvents(this, { wheel: '@zoomed' });   // click 증발

// ✅ 머지된 전체를 넘김
this.customEvents.wheel = '@zoomed';
bind3DEvents(this, this.customEvents);      // 모든 type 재등록
```

2D 문서 §4.3과 비교하면 허용/금지가 정확히 반대라는 점을 주의한다:

```javascript
// 2D에서는 이게 금지 — leak
bindEvents(this, this.customEvents);

// 3D에서는 이게 권장 — 리셋 방어
bind3DEvents(this, this.customEvents);
```

---

## 6. cleanup 매칭

3D에는 2D의 `removeCustomEvents`에 해당하는 짝 API가 **없다**. 실제 cleanup 경로는 두 가지다.

### 6.1 페이지 teardown — `dispose3DTree`

`Wkit.disposeAllThreeResources` → `Wkit.dispose3DTree`(Wkit.js:50-88)가 scene을 순회하며 `obj.eventListener` 항목을 모두 `undefined`로 설정하고 슬롯 자체를 제거한다:

```javascript
if (obj.eventListener) {
  fx.each((eventType) => {
    obj.eventListener[eventType] = undefined;
  }, Object.keys(obj.eventListener));
  obj.eventListener = undefined;
}
```

페이지가 teardown될 때 모든 3D 컴포넌트의 이벤트 슬롯이 일괄 정리된다. 런타임에 §4.2로 추가한 type도 `eventListener` 객체 안에 머지돼 있으므로 별도 추적이 필요 없다.

### 6.2 개별 컴포넌트 beforeDestroy

현재 코드베이스의 3D `beforeDestroy.js`는 2D에서 복사된 다음 패턴을 사용한다:

```javascript
const { removeCustomEvents } = Wkit;
removeCustomEvents(this, this.customEvents);
this.customEvents = null;
```

**주의 — 이 호출은 3D에서 실질적으로 no-op이다.** 이유:

- `removeCustomEvents`(`Wkit.js:16-28`)는 `instance.userHandlerList?.[eventName]?.[selector]`를 lookup한다.
- 3D는 `userHandlerList`를 전혀 쓰지 않는다 (`bind3DEvents`가 설정하지 않음).
- 또한 `Object.keys('@trigger')`는 문자열 인덱스(`['0','1',…]`)를 돌려주므로 selector 순회 자체가 의미 없는 키들을 돈다.
- `if (handler)` 가드에서 모두 걸러져 `removeEventListener`가 한 번도 호출되지 않는다.

따라서 **`removeCustomEvents` 호출은 crash를 내지는 않지만 아무것도 정리하지 않는다.** 실제 정리는 §6.1의 페이지 teardown 경로에 의존한다. 이 호출을 지우지 않는 이유는 순전히 2D와의 대칭성과 관습 유지 정도다.

**`this.customEvents = null`의 의미** — 이건 실질적 효과가 있다. 페이지 teardown 이전에 혹시 잔여 이벤트가 한 번 더 발화되는 경우, `make3DHandler` 안의 `customEvents[event.type]` lookup이 `null.click`을 시도해 TypeError를 던진다. 방어가 필요하다면 `this.customEvents = {}`로 비워 두는 편이 낫다. 다만 현실에서는 `appendElement`가 detach된 이후 raycaster hit 자체가 없으므로 문제가 드러나지 않는다.

### 6.3 개별 컴포넌트를 mid-life에 제거해야 한다면

페이지 teardown과 무관하게 단일 3D 컴포넌트만 destroy해야 한다면 (현재 코드베이스에서 이 시나리오는 드물다), §4.4의 "영구 제거" 패턴을 수동으로 반복해 각 type을 떼어내고 `appendElement`를 scene에서 detach한다. 자동화된 경로는 없다.

---

## 7. 체크리스트

새 3D 이벤트 작업을 할 때마다 점검:

- [ ] **트리거 이름만 바꾸는가?** → mutation 한 줄. `bind3DEvents` 부르지 말 것.
- [ ] **새 event type을 추가하는가?** → mutation 후 `bind3DEvents(this, this.customEvents)` **머지된 전체**로 호출.
- [ ] **`bind3DEvents`에 부분 객체를 넘기고 있지 않은가?** → §5 리셋으로 기존 type 증발.
- [ ] **임시 비활성화가 필요한가?** → `customEvents`를 null로 두지 말고 `appendElement.eventListener[type]`을 stash & undefined로 조작.
- [ ] **`customEvents`에 값을 `null`로 두고 있지 않은가?** → `make3DHandler`에 가드가 없어 `emit(null, …)`이 발화된다.
- [ ] **type을 영구 제거했다면 `eventListener[type]`과 `customEvents[type]` 둘 다 정리했는가?**
- [ ] **페이지 `eventBusHandlers`의 트리거 이름과 짝이 맞는가?** → 컴포넌트가 트리거 이름을 바꿨다면 페이지도 같이.

---

## 관련 문서

- [EVENT_RUNTIME_ADDITION.md](./EVENT_RUNTIME_ADDITION.md) — 2D `bindEvents` 버전. 함정이 "누적 leak"이라 권장 패턴이 정반대("추가된 부분만 넘기기").
- [EVENT_HANDLING.md](./EVENT_HANDLING.md) — 최초 등록 + cleanup 매칭, 페이지가 알아야 하는지 여부에 따른 패턴 선택
- [WKIT_API.md](./WKIT_API.md) — `bind3DEvents` / `dispose3DTree` / `initThreeRaycasting` API 시그니처와 내부 동작
