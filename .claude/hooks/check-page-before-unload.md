# check-page-before-unload.sh

## 무엇을 검사하는가

page before_unload.js에서 세 가지 필수 존재를 확인한다.

1. `offEventBusHandlers` — 이벤트 핸들러 해제
2. `unregisterMapping` — 데이터 매핑 해제
3. `= null` — 참조 정리

## 왜 정리가 필수인가

before_unload.js는 컴포넌트 beforeDestroy **이전에** 실행된다. 페이지가 정리하지 않으면:

- **Interval이 계속 돈다.** setTimeout 체인이 끊어지지 않아, 새 페이지로 이동한 후에도 이전 페이지의 API 호출이 반복된다. 서버에 불필요한 부하가 걸리고 콘솔에 에러가 쌓인다.
- **EventBus 핸들러가 남는다.** 이전 페이지의 `@cardClicked` 핸들러가 해제되지 않으면, 새 페이지에서 같은 이벤트가 발생할 때 이전 페이지의 로직이 실행된다.
- **DataMapping이 남는다.** 등록된 매핑이 해제되지 않으면 GlobalDataPublisher가 이미 없는 페이지의 매핑 정보를 보유한다.

loaded.js에서 생성한 것은 반드시 before_unload.js에서 정리한다.
