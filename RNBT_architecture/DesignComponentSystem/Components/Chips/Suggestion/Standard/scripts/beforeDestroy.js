const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this.listRender.destroy();
