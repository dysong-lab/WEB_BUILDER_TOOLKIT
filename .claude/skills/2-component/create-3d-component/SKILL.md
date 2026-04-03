---
name: create-3d-component
description: 개별 단위 3D 컴포넌트를 생성합니다. 단일 GLTF 모델(1 장비 = 1 Mesh)의 상태 표시·카메라·팝업 변형을 만듭니다.
---

# 개별 단위 3D 컴포넌트 생성

단일 GLTF 모델을 제어하는 3D 컴포넌트를 생성한다. 하나의 장비가 하나의 Mesh에 대응하며, meshName이 확정되어 있다.

> **설계 문서**: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md)
> **공통 규칙**: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)
> **다중 Mesh(GLTF 컨테이너)는**: `create-3d-container-component` SKILL을 사용

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 — 캐싱하거나 생략하지 마세요.**

1. [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) — 시스템 설계
2. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
3. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
4. **Mixin 문서 확인** — 사용할 Mixin의 .md 파일을 반드시 읽기:
   - [MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md)
   - [CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) (02 이상)
   - [3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) (03)
5. **기존 예제 확인** — 같은 패턴의 기존 컴포넌트를 참조:
   - [BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) — 대표 개별 단위 컴포넌트

---

## 개별 단위 3D 컴포넌트의 특징

```
특징:
  - 1 GLTF 모델 = 1 장비 = 1 Mesh
  - meshName이 확정됨 (하드코딩)
  - 이벤트 이름이 장비 고유 (예: '@battClicked')
  - showDetail()에 인자 없음 (자기 자신의 상태를 내부에서 조회)

예시:
  BATT, Chiller, Panel, UPS, thermohygrostat, tempHumiTH2B
```

---

## 변형 구조

하나의 3D 컴포넌트는 3단계 변형으로 구성된다. Mixin이 누적 조합된다.

| 변형 | 기능 | Mixin 조합 |
|------|------|-----------|
| 01_status | 상태 색상 표시 | MeshStateMixin |
| 02_status_camera | 상태 + 카메라 포커스 | MeshStateMixin + CameraFocusMixin |
| 03_status_popup | 상태 + 팝업 상세 | MeshStateMixin + 3DShadowPopupMixin |

> 모든 변형이 필요하지 않을 수 있다. 프로젝트 요구사항에 따라 필요한 변형만 생성한다.

---

## 01_status — register.js

```javascript
/**
 * 01_status: MeshStateMixin만 적용
 * - 데이터 수신 시 Mesh 색상을 상태에 따라 변경
 */

const { applyMeshStateMixin } = Wkit.loadMixin('MeshStateMixin');

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (01에서는 없음)
// ======================
```

## 01_status — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리
this.meshState?.destroy();
```

---

## 02_status_camera — register.js

```javascript
/**
 * 02_status_camera: MeshStateMixin + CameraFocusMixin
 * - 상태 색상 표시 + 클릭 시 카메라 포커스
 *
 * 개별 단위에서는 meshName이 확정이므로
 * resolveMeshName이 불필요하다.
 * page before_load.js에서 하드코딩된 meshName으로 focusOn을 호출한다.
 */

const { applyMeshStateMixin } = Wkit.loadMixin('MeshStateMixin');
const { applyCameraFocusMixin } = Wkit.loadMixin('CameraFocusMixin');

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyCameraFocusMixin(this);

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (개별 단위 02에서는 없음)
// ======================
// 클릭 이벤트는 page before_load.js에서 처리한다.
// meshName이 확정이므로 컴포넌트 레벨에서 이벤트를 바인딩할 필요 없음.
```

## 02_status_camera — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## 03_status_popup — register.js

```javascript
/**
 * 03_status_popup: MeshStateMixin + 3DShadowPopupMixin
 * - 상태 색상 표시 + 클릭 시 팝업으로 상세 정보 표시
 *
 * 개별 단위에서는:
 * - meshName이 확정이므로 resolveMeshName 불필요
 * - showDetail()에 인자 없음 — 내부에서 getMeshState로 상태 조회
 * - 이벤트 이름이 장비 고유 (예: '@battClicked')
 */

const { applyMeshStateMixin } = Wkit.loadMixin('MeshStateMixin');
const { apply3DShadowPopupMixin } = Wkit.loadMixin('3DShadowPopupMixin');
const { bindCustomEvents } = Wkit;

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

apply3DShadowPopupMixin(this, {
    getHTML: () => `
        <div class="popup-container">
            <h3 class="popup-title"></h3>
            <p class="popup-status"></p>
        </div>
    `,
    getStyles: () => `
        .popup-container { padding: 16px; color: #fff; }
        .popup-title { margin: 0 0 8px; font-size: 14px; }
        .popup-status { margin: 0; font-size: 12px; opacity: 0.8; }
    `,
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 + showDetail 정의
// ======================

/**
 * showDetail — 인자 없이 호출 (개별 단위 패턴)
 * 내부에서 getMeshState로 자기 자신의 상태를 조회하여 팝업에 표시
 */
this.showDetail = function () {
    const meshName = '장비명';  // ← 실제 장비명으로 교체
    const state = this.meshState.getMeshState(meshName);
    const status = state ? state.status : 'unknown';

    this.shadowPopup.query('.popup-title').textContent = meshName;
    this.shadowPopup.query('.popup-status').textContent = status;
    this.shadowPopup.show();
};

this.customEvents = {
    '@장비명Clicked': (event) => {  // ← 실제 이벤트 이름으로 교체
        this.showDetail();
    },
};
bindCustomEvents(this, this.customEvents);
```

## 03_status_popup — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순) + showDetail 정리
this.showDetail = null;
this.shadowPopup.destroy();
this.meshState?.destroy();
```

---

## page scripts

### loaded.js (모든 변형 공통)

```javascript
const { GlobalDataPublisher } = Wkit;

const pageDataMappings = {
    equipmentStatus: {
        datasetName: '장비명Status',  // ← API 엔드포인트명
        refreshInterval: 30000,
    },
};

GlobalDataPublisher.registerMapping(this, pageDataMappings);
GlobalDataPublisher.fetchAndPublish(this, 'equipmentStatus');
GlobalDataPublisher.startAllIntervals(this);
```

### before_load.js — 03_status_popup

```javascript
const { Weventbus } = Wkit;

const pageEventBusHandlers = {
    '@장비명Clicked': ({ targetInstance }) => {
        targetInstance.showDetail();  // 인자 없이 호출 (개별 단위 패턴)
    },
};

Weventbus.onEventBusHandlers(this, pageEventBusHandlers);
```

### before_unload.js (모든 변형 공통)

```javascript
const { GlobalDataPublisher, Weventbus } = Wkit;

GlobalDataPublisher.stopAllIntervals(this);
Weventbus.offEventBusHandlers(this, this.pageEventBusHandlers);
GlobalDataPublisher.unregisterMapping(this);
```

---

## 출력 구조

```
Components/3D_Components/
└── {장비명}/
    ├── scripts/
    │   ├── 01_status/
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   ├── 02_status_camera/
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   └── 03_status_popup/
    │       ├── component/
    │       │   ├── register.js
    │       │   └── beforeDestroy.js
    │       └── page/
    │           ├── before_load.js
    │           ├── loaded.js
    │           └── before_unload.js
    └── preview/
        ├── 01_status.html
        ├── 02_status_camera.html
        └── 03_status_popup.html
```

---

## 금지 사항

> 공통 금지 사항은 [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

- ❌ meshName을 동적으로 추출하지 않는다 — 개별 단위는 이름이 확정됨
- ❌ resolveMeshName 함수를 만들지 않는다 — GLTF 컨테이너 전용 패턴
- ❌ showDetail에 meshName/data 인자를 넣지 않는다 — 내부에서 getMeshState로 조회
- ❌ 이벤트 이름에 '@meshClicked'를 사용하지 않는다 — 범용 이름은 GLTF 컨테이너 전용
- ❌ fetchData를 page before_load.js에서 호출하지 않는다 — 개별 단위는 구독 데이터만 사용

---

## 관련 자료

| 문서 | 경로 |
|------|------|
| MeshStateMixin | [Mixins/MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md) |
| CameraFocusMixin | [Mixins/CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) |
| 3DShadowPopupMixin | [Mixins/3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) |
| GLTF 컨테이너 패턴 | [create-3d-container-component](/.claude/skills/2-component/create-3d-container-component/SKILL.md) |
| BATT (참조 구현) | [Components/3D_Components/BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) |

---
