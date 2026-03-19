# Page Scripts 네이밍 가이드

Master와 Page의 page_scripts는 **같은 `this` 컨텍스트를 공유**한다.
따라서 `this`에 저장하는 속성 이름이 충돌하면 중복 등록, 덮어쓰기 등의 버그가 발생한다.

---

## 문제 상황

### eventBusHandlers 중복 등록

```javascript
// Master before_load.js
this.eventBusHandlers = {
    '@userMenuClicked': ({ event }) => { ... },
    '@navItemClicked': ({ event }) => { ... }
};
onEventBusHandlers(this.eventBusHandlers);  // 2개 등록

// Page before_load.js
this.eventBusHandlers = Object.assign(this.eventBusHandlers || {}, {
    '@3dObjectClicked': async ({ event }) => { ... }
});
onEventBusHandlers(this.eventBusHandlers);  // 3개 전체를 다시 등록
// => @userMenuClicked, @navItemClicked이 2번 등록됨
```

`Object.assign`으로 Master 핸들러를 보존한 것은 좋지만,
합쳐진 전체 객체를 `onEventBusHandlers`에 넘기므로 **Master 핸들러가 이중 등록**된다.

### globalDataMappings 중복 등록

```javascript
// Master loaded.js
this.globalDataMappings = [
    { topic: 'userInfo', ... },
    { topic: 'menuList', ... }
];
each(GlobalDataPublisher.registerMapping);   // 2개 등록
each(GlobalDataPublisher.fetchAndPublish);   // 2개 fetch

// Page loaded.js
this.globalDataMappings = [
    ...(this.globalDataMappings || []),
    { topic: 'equipmentStatus', ... }
];
each(GlobalDataPublisher.registerMapping);   // 3개 전체를 다시 등록
each(GlobalDataPublisher.fetchAndPublish);   // 3개 전체를 다시 fetch
// => userInfo, menuList가 2번 register + 2번 fetch됨
```

### currentParams 덮어쓰기

```javascript
// Master before_load.js
this.currentParams = {
    tasks: { status: 'active' },
    activity: { limit: 50 }
};

// Page loaded.js (Master 이후 실행)
this.currentParams = {};  // ← Master의 tasks, activity 전부 소실
this.currentParams.equipmentStatus = {};
```

Page가 `this.currentParams = {}`로 초기화하면 Master가 설정한 파라미터가 **전부 덮어쓰기**된다.
Master의 `fetchAndPublish`가 빈 파라미터로 동작하여 잘못된 API 호출이 발생한다.

### refreshIntervals 정리 누락

```javascript
// Master loaded.js
this.refreshIntervals = {};
this.refreshIntervals.userInfo = setInterval(() => {
    GlobalDataPublisher.fetchAndPublish('userInfo', this, {});
}, 30000);

// Page loaded.js (Master 이후 실행)
this.refreshIntervals = {};  // ← Master의 userInfo interval ID 소실
this.refreshIntervals.equipmentStatus = setInterval(() => { ... }, 5000);

// Page before_unload.js
Object.values(this.refreshIntervals).forEach(clearInterval);
// equipmentStatus만 정리됨
// userInfo의 interval ID를 잃어 clearInterval 불가 → 페이지 이탈 후에도 계속 실행
```

Page가 `this.refreshIntervals = {}`로 초기화하면 Master의 interval ID가 유실되어 **clearInterval이 불가능**해진다.
정리되지 않은 interval은 메모리 누수와 불필요한 API 호출을 유발한다.

---

## 해결: 속성 이름 분리

Master와 Page는 **각자 고유한 속성 이름**을 사용한다.

### eventBusHandlers

```javascript
// Master before_load.js
this.masterEventBusHandlers = {
    '@userMenuClicked': ({ event }) => { ... },
    '@navItemClicked': ({ event }) => { ... }
};
onEventBusHandlers(this.masterEventBusHandlers);

// Page before_load.js
this.pageEventBusHandlers = {
    '@3dObjectClicked': async ({ event }) => { ... }
};
onEventBusHandlers(this.pageEventBusHandlers);
```

```javascript
// Master before_unload.js
offEventBusHandlers(this.masterEventBusHandlers);
this.masterEventBusHandlers = null;

// Page before_unload.js
offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;
```

### globalDataMappings

```javascript
// Master loaded.js
this.masterDataMappings = [
    { topic: 'userInfo', ... },
    { topic: 'menuList', ... }
];
fx.go(
    this.masterDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this, {}))
);

// Page loaded.js
this.pageDataMappings = [
    { topic: 'equipmentStatus', ... }
];
fx.go(
    this.pageDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this, {}))
);
```

```javascript
// Master before_unload.js
if (this.masterDataMappings) {
    fx.go(this.masterDataMappings, each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic)));
    this.masterDataMappings = null;
}

// Page before_unload.js
if (this.pageDataMappings) {
    fx.go(this.pageDataMappings, each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic)));
    this.pageDataMappings = null;
}
```

### currentParams

```javascript
// Master before_load.js
this.masterParams = {
    tasks: { status: 'active' },
    activity: { limit: 50 }
};

// Page before_load.js
this.pageParams = {
    equipmentStatus: {}
};
```

```javascript
// Master before_unload.js
this.masterParams = null;

// Page before_unload.js
this.pageParams = null;
```

### refreshIntervals

```javascript
// Master loaded.js
this.masterIntervals = {};
this.masterIntervals.userInfo = setInterval(() => { ... }, 30000);

// Page loaded.js
this.pageIntervals = {};
this.pageIntervals.equipmentStatus = setInterval(() => { ... }, 5000);
```

```javascript
// Master before_unload.js
Object.values(this.masterIntervals || {}).forEach(clearInterval);
this.masterIntervals = null;

// Page before_unload.js
Object.values(this.pageIntervals || {}).forEach(clearInterval);
this.pageIntervals = null;
```

---

## 네이밍 규칙

| 스코프 | eventBusHandlers | globalDataMappings | currentParams | refreshIntervals |
|--------|------------------|--------------------|---------------|------------------|
| Master | `masterEventBusHandlers` | `masterDataMappings` | `masterParams` | `masterIntervals` |
| Page   | `pageEventBusHandlers`   | `pageDataMappings`   | `pageParams`   | `pageIntervals`   |

`currentParams`와 `refreshIntervals`도 Master와 Page가 모두 사용할 수 있다.
예: Master에서 `this.currentParams = { tasks: {...} }`를 설정한 뒤, Page에서 `this.currentParams = {}`로 초기화하면 Master의 값이 덮어쓰기된다.

### 원칙

1. **Master와 Page는 같은 속성 이름을 사용하지 않는다**
2. **각자 등록한 것만 각자 해제한다**
3. **`Object.assign`이나 spread로 합치지 않는다** - 합칠 필요가 없다

---

## 왜 이름 충돌이 문제인가

| 속성 | 충돌 유형 | 결과 |
|------|----------|------|
| `eventBusHandlers` | 이중 등록 | 같은 핸들러가 2번 실행 |
| `globalDataMappings` | 덮어쓰기 (Map.set) | 같은 topic이면 무해, 다른 datasetInfo면 Master 설정 유실 |
| `currentParams` | 덮어쓰기 | Master 파라미터 소실 → 잘못된 API 호출 |
| `refreshIntervals` | 덮어쓰기 | Master interval ID 유실 → clearInterval 불가, 메모리 누수 |

- `Weventbus.on(eventName, handler)`은 리스너 배열에 push하는 방식이므로, 같은 핸들러를 2번 `on`하면 **이벤트 발생 시 2번 실행**된다
- `GlobalDataPublisher.registerMapping`은 `Map.set()`이므로 같은 topic을 2번 등록하면 **덮어쓰기**된다 (이중 실행은 아님)
- `currentParams`, `refreshIntervals`는 `= {}`로 재초기화하면 기존 값이 **완전히 소실**된다

---

## 중복 등록 시 동작 차이: eventBusHandlers vs globalDataMappings

두 시스템은 내부 저장 구조가 다르기 때문에 같은 이름으로 중복 등록했을 때 **발생하는 문제가 다르다**.

### eventBusHandlers → 배열 push (이중 실행)

```javascript
// Weventbus.on() 내부 구현
listeners[eventName] = listeners[eventName] || [];
listeners[eventName].push(handler);  // 배열에 push
```

같은 이벤트에 같은 핸들러를 2번 `on`하면 배열에 2번 들어간다.
이벤트 발생 시 배열을 순회하므로 **핸들러가 2번 실행**된다.

```
@filterApplied 리스너 배열:
  [0] Master의 핸들러  ← Master가 등록
  [1] Master의 핸들러  ← Page가 Object.assign 후 재등록 (중복)
  [2] Page의 핸들러    ← Page가 등록

→ @filterApplied 발생 시 Master 핸들러가 2번 실행됨
```

### globalDataMappings → Map.set() (덮어쓰기)

```javascript
// GlobalDataPublisher.registerMapping() 내부 구현
registerMapping({ topic, datasetInfo }) {
    mappingTable.set(topic, datasetInfo);  // Map.set → 같은 key면 덮어쓰기
}
```

같은 topic으로 2번 `registerMapping`하면 마지막 값으로 **덮어쓰기**된다.
이전 값은 유실되지만, 같은 datasetInfo를 등록하는 경우 **결과적으로 동일**하다.

```
mappingTable (Map):
  'tasks' → { datasetName: 'tasksApi', param: {...} }  ← 마지막 등록 값만 남음

→ Master와 Page가 같은 topic에 같은 datasetInfo를 등록하면 동작상 문제 없음
→ 단, 다른 datasetInfo를 등록하면 Master의 설정이 Page 것으로 덮어써짐
```

### 요약

| 시스템 | 내부 구조 | 중복 등록 동작 | 실제 영향 |
|--------|----------|--------------|----------|
| `Weventbus.on()` | 배열 push | 핸들러 이중 실행 | **버그 발생** |
| `GlobalDataPublisher.registerMapping()` | Map.set() | 값 덮어쓰기 | 같은 값이면 무해, 다른 값이면 Master 설정 유실 |

따라서 **eventBusHandlers의 중복 등록이 실질적으로 더 위험**하다.
globalDataMappings는 동작상 문제가 없더라도, 의도를 명확히 하기 위해 분리하는 것을 권장한다.

---

## 관련 문서

- [EVENT_HANDLING.md](EVENT_HANDLING.md) - 컴포넌트 이벤트 처리 원칙
- [WEVENTBUS_API.md](WEVENTBUS_API.md) - Weventbus API
- [WKIT_API.md](WKIT_API.md) - onEventBusHandlers, offEventBusHandlers
- [GLOBAL_DATA_PUBLISHER_API.md](GLOBAL_DATA_PUBLISHER_API.md) - GlobalDataPublisher API
