/**
 * CameraFocusButton — 조립 코드
 *
 * CameraFocusMixin을 적용하여 카메라 포커스 버튼을 제공한다.
 * 버튼 클릭 시 3D 장면의 카메라를 대상으로 이동시킨다.
 */
const { bindEvents } = Wkit;

// ======================
// 1. MIXIN 적용
// ======================

applyCameraFocusMixin(this, {
    camera: this.camera,
    controls: this.controls,
    duration: 1000
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        '.camera-focus-btn': '@cameraFocusClicked'
    }
};
bindEvents(this, this.customEvents);
