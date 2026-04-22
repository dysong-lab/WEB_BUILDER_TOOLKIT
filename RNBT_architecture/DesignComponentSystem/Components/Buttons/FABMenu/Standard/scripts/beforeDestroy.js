const { removeCustomEvents } = Wkit;
// 3. 이벤트 제거

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제

this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

this.renderFabMenu = null;
this.toggleMenu = null;
this.listRender.destroy();
