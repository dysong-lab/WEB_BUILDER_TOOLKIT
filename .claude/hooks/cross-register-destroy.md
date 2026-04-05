# cross-register-destroy.sh

## 무엇을 검사하는가

register.js와 beforeDestroy.js를 교차 비교하여 6가지를 검증한다.

1. `apply*Mixin` 수 = `.destroy()` 수
2. `bindEvents`/`bind3DEvents` 존재 시 `removeCustomEvents` 필수
3. `this.customEvents` 정의 시 `this.customEvents = null` 필수
4. `this.subscriptions` 정의 시 `this.subscriptions = null` 필수
5. `this.xxx = function` 정의마다 `this.xxx = null` 필수
6. 정리 순서가 생성의 역순인지 (행 번호 비교)

## 왜 수가 일치해야 하는가

Mixin은 내부적으로 타이머, 캐시, DOM 참조를 보유할 수 있다. destroy()를 누락하면 그것들이 남는다. this에 할당된 함수는 인스턴스에 대한 클로저 참조를 보유한다. null로 끊지 않으면 인스턴스 전체가 GC되지 않는다.

## 왜 역순이어야 하는가

생성 순서: Mixin 적용 → 구독 연결 → 이벤트 매핑

- **이벤트를 먼저 제거해야** 한다. 이벤트가 살아있는 상태에서 구독을 해제하면, 사용자 클릭 → 이미 해제된 구독을 참조 → 에러.
- **구독을 먼저 해제해야** 한다. 구독이 살아있는 상태에서 Mixin을 destroy하면, 데이터 도착 → 이미 파괴된 Mixin 메서드 호출 → 에러.
- **Mixin은 마지막에 destroy** 한다. 이벤트와 구독이 모두 끊어진 후에야 안전하게 내부 상태를 정리할 수 있다.

역순이 아니면 정리 도중 타이밍에 따라 간헐적 에러가 발생한다.
