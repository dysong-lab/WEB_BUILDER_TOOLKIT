# cross-page-lifecycle.sh

## 무엇을 검사하는가

loaded.js, before_load.js, before_unload.js를 교차 비교하여 생성-정리 매칭을 검증한다.

**loaded.js에서 생성한 것:**
1. `pageDataMappings` → `unregisterMapping` + `pageDataMappings = null` 필수
2. `startAllIntervals` → `stopAllIntervals` 필수
3. `pageParams` → `pageParams = null` 필수

**before_load.js에서 생성한 것:**
4. `pageEventBusHandlers` → `offEventBusHandlers` + `pageEventBusHandlers = null` 필수
5. `raycastingEvents` (3D) → `removeEventListener` + `raycastingEvents = null` 필수
6. `initThreeRaycasting` (3D) → `disposeAllThreeResources` 필수

## 왜 생성-정리가 1:1 대응이어야 하는가

loaded.js에서 생성한 리소스가 before_unload.js에서 정리되지 않으면, 페이지 전환 후에도 이전 페이지의 리소스가 남는다.

가장 치명적인 것은 Interval이다. setTimeout 체인이 끊어지지 않으면 이전 페이지의 API 호출이 영원히 반복된다. 3D 페이지에서는 raycasting 이벤트와 Three.js 리소스(geometry, material, texture)까지 누적되어 메모리가 빠르게 증가한다.
