const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 — 없음
this.subscriptions = null;

// 1. 선택자 계약 정리
this.cssSelectors = null;
