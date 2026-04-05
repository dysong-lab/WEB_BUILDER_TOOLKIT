# check-beforeDestroy.sh

## 무엇을 검사하는가

beforeDestroy.js에서 세 가지 필수 존재를 확인한다.

1. `= null` — 참조 정리
2. `.destroy()` 또는 `?.destroy()` — Mixin 정리
3. `unsubscribe` — 구독 해제

## 왜 정리가 필수인가

RENOBIT에서 페이지 전환 시 beforeDestroy가 실행된다. 정리하지 않으면:

- **구독이 남는다.** 새 페이지에서 같은 topic으로 데이터를 발행하면, 이미 죽은 컴포넌트가 데이터를 받는다. 존재하지 않는 DOM에 렌더링을 시도하고 에러가 쌓인다.
- **이벤트가 남는다.** 클릭 핸들러가 해제되지 않으면 좀비 이벤트가 남는다.
- **참조가 남는다.** `this.subscriptions`, `this.fieldRender` 같은 참조가 null 처리되지 않으면 가비지 컬렉터가 관련 객체를 회수하지 못한다. 페이지를 반복 전환하면 메모리가 누적된다.
- **Mixin 내부 상태가 남는다.** destroy()를 호출하지 않으면 Mixin이 보유한 타이머, 캐시, DOM 참조가 정리되지 않는다.
