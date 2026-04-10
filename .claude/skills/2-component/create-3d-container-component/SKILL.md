---
name: create-3d-container-component
description: GLTF 컨테이너 3D 컴포넌트를 생성합니다. 하나의 GLTF 모델 안에 다중 Mesh가 있고, 클릭된 Mesh를 동적으로 식별합니다.
---

# GLTF 컨테이너 3D 컴포넌트 생성

하나의 GLTF 모델 안에 여러 장비(Mesh)가 포함된 컨테이너 컴포넌트를 생성한다. Mesh 이름이 사전에 확정되지 않으며, Raycasting으로 클릭된 Mesh를 동적으로 식별한다.

> 공통 인덱스: [SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md)
> 공통 패턴: [SHARED_PATTERNS.md](/.claude/skills/SHARED_PATTERNS.md)
> **단일 Mesh(개별 장비)는**: `create-3d-component` SKILL을 사용

---

## 전제 조건

이 스킬은 `produce-component` 스킬에서 다음이 완료된 후 호출된다:

- **컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세 (Mixin, 커스텀 메서드, 이벤트) 작성 완료
- **사용자 승인** — CLAUDE.md 내용이 승인됨

이 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다. 기능 정의나 Mixin 선택을 다시 하지 않는다.

> Mixin이 존재하지 않는 경우에도, 구현 명세에 커스텀 속성/메서드가 정의되어 있으면 그대로 구현한다. 신규 Mixin이 필요한 경우는 `produce-component` → `create-mixin-spec` → `implement-mixin`에서 이미 처리되어 있다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**세션 시작 시 읽고, 관련 파일이나 작업 유형이 바뀌면 다시 읽으세요.**

1. **대상 컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세
2. [SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md) — 공통 인덱스
3. [SHARED_PATTERNS.md](/.claude/skills/SHARED_PATTERNS.md) — 공통 코드 패턴
4. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
5. **Mixin 문서 확인** — 구현 명세에 명시된 Mixin의 .md 파일
6. **기존 예제 확인** — 같은 패턴의 기존 컴포넌트를 참조:
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

변형은 CLAUDE.md 구현 명세에서 결정된다. 아래는 자주 사용되는 패턴 예시이다.

| 변형 예시 | 기능 | Mixin 조합 예시 |
|----------|------|----------------|
| 01_status | 상태 색상 표시 | MeshStateMixin |
| 02_status_camera | 상태 + 클릭 → 카메라 포커스 | MeshStateMixin + CameraFocusMixin |
| 03_status_popup | 상태 + 클릭 → 팝업 상세 | MeshStateMixin + 3DShadowPopupMixin |

변형의 종류, 이름, Mixin 조합은 고정이 아니다. 구현 명세에 따라 달라진다.

> 클릭 이벤트가 있는 변형에서는 resolveMeshName이 필요하다.

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

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
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
// 3. 이벤트 매핑 + resolveMeshName 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
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


// ======================
// 1. MIXIN 적용
// ======================

// ── MeshStateMixin ────────────────────────────────────────────
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

// ── 3DShadowPopupMixin ────────────────────────────────────────
const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: () => {
        this.shadowPopup.bindPopupEvents({
            click: {
                '.popup-close': () => this.shadowPopup.hide()
            }
        });
    }
});

// ======================
// 3. 이벤트 매핑 + resolveMeshName/showDetail 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
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
this.showDetail = (meshName, data) => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    const statusEl = this.shadowPopup.query('.popup-status');

    if (nameEl) nameEl.textContent = meshName;
    if (statusEl) {
        const currentStatus = (data && data.status) || this.meshState.getMeshState(meshName) || 'normal';
        statusEl.textContent = currentStatus;
        statusEl.dataset.status = currentStatus;
    }
};
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

> 공통 금지 사항과 기본 규칙은 [SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md) 참조

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
