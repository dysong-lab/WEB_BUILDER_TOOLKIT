---
name: create-3d-container-component
description: GLTF 컨테이너 3D 컴포넌트를 생성합니다. 하나의 GLTF 모델 안에 다중 Mesh가 있고, 클릭된 Mesh를 동적으로 식별합니다.
---

# GLTF 컨테이너 3D 컴포넌트 생성

하나의 GLTF 모델 안에 여러 장비(Mesh)가 포함된 컨테이너 컴포넌트를 생성한다. Mesh 이름이 사전에 확정되지 않으며, Raycasting으로 클릭된 Mesh를 동적으로 식별한다.

> **설계 문서**: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md)
> **공통 규칙**: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)
> **단일 Mesh(개별 장비)는**: `create-3d-component` SKILL을 사용

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
   - [gltf_container](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/gltf_container/) — 대표 GLTF 컨테이너 컴포넌트

---

## GLTF 컨테이너의 특징

```
특징:
  - 1 GLTF 모델 = N 장비 = N Mesh
  - meshName이 사전에 확정되지 않음 (동적 식별)
  - Raycasting intersects에서 resolveMeshName으로 Mesh 이름 추출
  - 이벤트 이름이 범용 ('@meshClicked')
  - showDetail(meshName, data)에 인자를 받음 (외부에서 데이터 전달)
  - page before_load.js에서 fetchData로 클릭된 Mesh의 상세 데이터를 조회

개별 단위와의 핵심 차이:
  - resolveMeshName 함수 필수 (intersects 배열에서 parent 체인 탐색)
  - showDetail이 meshName과 data를 외부에서 받음
  - before_load.js에서 fetchData를 import하여 비동기 데이터 조회
```

---

## 변형 구조

| 변형 | 기능 | Mixin 조합 |
|------|------|-----------|
| 01_status | 상태 색상 표시 | MeshStateMixin |
| 02_status_camera | 상태 + 클릭 → 카메라 포커스 | MeshStateMixin + CameraFocusMixin |
| 03_status_popup | 상태 + 클릭 → 팝업 상세 | MeshStateMixin + 3DShadowPopupMixin |

> 02부터 resolveMeshName이 필요하다. 01에서는 클릭 이벤트가 없으므로 불필요.

---

## resolveMeshName — 핵심 유틸리티

GLTF 컨테이너 패턴의 핵심. Raycasting intersects 배열에서 클릭된 장비의 Mesh 이름을 추출한다.

```javascript
/**
 * resolveMeshName — intersects에서 장비 Mesh 이름을 동적으로 추출
 *
 * Raycasting 결과의 intersects[0].object는 최하위 Mesh일 수 있다.
 * parent 체인을 탐색하여 의미 있는 장비 이름을 가진 Mesh를 찾는다.
 *
 * @param {Object} event - 3D 클릭 이벤트 (event.intersects)
 * @returns {string|null} 장비 Mesh 이름 또는 null
 */
this.resolveMeshName = function (event) {
    if (!event.intersects || event.intersects.length === 0) return null;

    let object = event.intersects[0].object;

    // parent 체인을 탐색하여 장비 이름을 가진 Mesh 찾기
    while (object) {
        if (object.name && object.name !== '' && object.isMesh) {
            return object.name;
        }
        object = object.parent;
    }

    return null;
};
```

> resolveMeshName의 탐색 로직은 GLTF 모델의 구조에 따라 달라질 수 있다.
> 실제 모델의 노드 계층을 확인한 후 탐색 조건을 조정한다.

---

## 01_status — register.js

```javascript
/**
 * 01_status: MeshStateMixin만 적용
 * - 데이터 수신 시 여러 Mesh의 색상을 상태에 따라 변경
 * - 01에서는 클릭 이벤트 없음, resolveMeshName 불필요
 */



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
 * - 상태 색상 표시 + 클릭된 Mesh로 카메라 포커스
 *
 * 컨테이너에서는:
 * - resolveMeshName으로 클릭된 Mesh를 동적 식별
 * - '@meshClicked' 범용 이벤트 사용
 * - bind3DEvents로 3D 클릭 이벤트 바인딩
 */


const { bindCustomEvents, removeCustomEvents } = Wkit;

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
// 3. 이벤트 매핑 + resolveMeshName 정의
// ======================

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = function (event) {
    if (!event.intersects || event.intersects.length === 0) return null;

    let object = event.intersects[0].object;
    while (object) {
        if (object.name && object.name !== '' && object.isMesh) {
            return object.name;
        }
        object = object.parent;
    }
    return null;
};

this.customEvents = {
    '@meshClicked': (event) => {
        const meshName = this.resolveMeshName(event);
        if (meshName) {
            this.cameraFocus.focusOn({ meshName });
        }
    },
};
bindCustomEvents(this, this.customEvents);
```

## 02_status_camera — beforeDestroy.js

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

// 1. Mixin 정리 (적용 역순) + resolveMeshName 정리
this.resolveMeshName = null;
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## 03_status_popup — register.js

```javascript
/**
 * 03_status_popup: MeshStateMixin + 3DShadowPopupMixin
 * - 상태 색상 표시 + 클릭된 Mesh의 상세 정보를 팝업으로 표시
 *
 * 컨테이너에서는:
 * - resolveMeshName으로 클릭된 Mesh를 동적 식별
 * - showDetail(meshName, data)에 인자를 받음
 * - page before_load.js에서 fetchData로 상세 데이터를 조회한 후 showDetail 호출
 */


const { bindCustomEvents, removeCustomEvents } = Wkit;

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
// 3. 이벤트 매핑 + resolveMeshName/showDetail 정의
// ======================

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = function (event) {
    if (!event.intersects || event.intersects.length === 0) return null;

    let object = event.intersects[0].object;
    while (object) {
        if (object.name && object.name !== '' && object.isMesh) {
            return object.name;
        }
        object = object.parent;
    }
    return null;
};

/**
 * showDetail(meshName, data) — 외부에서 데이터를 받아 팝업에 표시
 * (개별 단위와 달리 인자를 받음)
 *
 * @param {string} meshName - 클릭된 Mesh 이름
 * @param {Object} data - fetchData로 조회한 상세 데이터
 */
this.showDetail = function (meshName, data) {
    const status = data.status || this.meshState.getMeshState(meshName)?.status || 'unknown';

    this.shadowPopup.query('.popup-title').textContent = meshName;
    this.shadowPopup.query('.popup-status').textContent = status;
    this.shadowPopup.show();
};

this.customEvents = {
    '@meshClicked': (event) => {
        // page before_load.js에서 처리 — resolveMeshName → fetchData → showDetail
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

// 1. Mixin 정리 (적용 역순) + resolveMeshName/showDetail 정리
this.resolveMeshName = null;
this.showDetail = null;
this.shadowPopup.destroy();
this.meshState?.destroy();
```

---

## page scripts

### loaded.js (모든 변형 공통)

```javascript
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

this.pageDataMappings = [
    {
        topic: 'equipmentStatus',
        datasetInfo: {
            datasetName: 'containerEquipmentStatus',
            param: {}
        },
        refreshInterval: 30000
    }
];

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic}:`, err))
    )
);

this.startAllIntervals = () => {
    this.pageIntervals = {};

    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                const state = { _stopped: false, _timerId: null };
                this.pageIntervals[topic] = state;

                const scheduleNext = () => {
                    if (state._stopped) return;
                    state._timerId = setTimeout(() => {
                        fetchAndPublish(topic, this, this.pageParams[topic] || {})
                            .catch(err => console.error(`[Page] ${topic}:`, err))
                            .finally(scheduleNext);
                    }, refreshInterval);
                };
                scheduleNext();
            }
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.values(this.pageIntervals || {}),
        each(state => {
            state._stopped = true;
            clearTimeout(state._timerId);
        })
    );
};

this.startAllIntervals();
```

### before_load.js — 02_status_camera

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (meshName) {
            targetInstance.cameraFocus.focusOn({ meshName });
        }
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_load.js — 03_status_popup

```javascript
const { onEventBusHandlers } = Wkit;
const { fetchData } = GlobalDataPublisher;

this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (!meshName) return;

        // fetchData로 클릭된 Mesh의 상세 데이터를 조회한 후 showDetail 호출
        fetchData(this, 'meshDetail', { meshName }).then(({ data }) => {
            targetInstance.showDetail(meshName, data);
        });
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

> **개별 단위와의 핵심 차이**: before_load.js에서 `fetchData`를 import하여 클릭된 Mesh의 상세 데이터를 비동기로 조회한다. 개별 단위는 `targetInstance.showDetail()`만 호출하면 되지만, 컨테이너는 `resolveMeshName → fetchData → showDetail` 체인이 필요하다.

### before_unload.js (모든 변형 공통)

```javascript
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = Wkit;
const { each, go } = fx;

if (this.stopAllIntervals) this.stopAllIntervals();
this.pageIntervals = null;

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);
this.pageDataMappings = null;
this.pageParams = null;
```

---

## 출력 구조

```
Components/3D_Components/
└── {컨테이너명}/
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

- ❌ meshName을 하드코딩하지 않는다 — 컨테이너는 동적 식별이 핵심
- ❌ 장비 고유 이벤트 이름('@battClicked' 등)을 사용하지 않는다 — '@meshClicked' 사용
- ❌ showDetail()을 인자 없이 호출하지 않는다 — 반드시 (meshName, data) 전달
- ❌ resolveMeshName 없이 클릭 이벤트를 처리하지 않는다 — intersects 직접 접근 금지
- ❌ page before_load.js에서 fetchData 없이 showDetail을 호출하지 않는다 — 상세 데이터는 반드시 API 조회

---

## 관련 자료

| 문서 | 경로 |
|------|------|
| MeshStateMixin | [Mixins/MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md) |
| CameraFocusMixin | [Mixins/CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) |
| 3DShadowPopupMixin | [Mixins/3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) |
| 개별 단위 패턴 | [create-3d-component](/.claude/skills/2-component/create-3d-component/SKILL.md) |
| gltf_container (참조 구현) | [Components/3D_Components/gltf_container](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/gltf_container/) |

---
