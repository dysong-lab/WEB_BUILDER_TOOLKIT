/**
 * TreeRenderMixin
 *
 * 계층적 데이터를 트리 구조로 렌더링한다.
 *
 * ─────────────────────────────────────────────────────────────
 * renderData 반영 규칙 (applyValue 4경로):
 *
 *   대상 요소는 cssSelectors가 결정한다.
 *   datasetAttrs에 등록된 키 → data-* 속성 설정
 *   elementAttrs에 등록된 키 → 요소 속성 설정 (src, fill 등)
 *   styleAttrs에 등록된 키   → 스타일 속성 설정 (width, height 등)
 *   등록되지 않은 키          → textContent 설정
 *   각 노드에 data-node-id, data-depth, data-expanded 속성이 자동 부여된다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyTreeRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.tree__list',
 *           template:  '#tree-node-template',
 *           node:      '.tree__node',
 *           toggle:    '.tree__toggle',
 *           icon:      '.tree__icon',
 *           label:     '.tree__label',
 *           status:    '.tree__node'
 *       },
 *       nodeKey: 'id',
 *       childrenKey: 'children',
 *       datasetAttrs: {
 *           status: 'status'
 *       }
 *   });
 *
 *   // renderData — 재귀적 배열:
 *   // [
 *   //   { id: 'site-1', label: '본사', status: 'normal', children: [
 *   //       { id: 'floor-3', label: '3층', children: [
 *   //           { id: 'room-301', label: '서버실', status: 'warning' }
 *   //       ]}
 *   //   ]}
 *   // ]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.treeRender):
 *
 *   this.treeRender.cssSelectors   — CSS 선택자
 *   this.treeRender.datasetAttrs   — data-* 속성 매핑
 *   this.treeRender.elementAttrs   — 요소 속성 매핑 (src, fill 등)
 *   this.treeRender.styleAttrs     — 스타일 속성 매핑 (width, height 등)
 *   this.treeRender.renderData     — { response } → 트리 렌더링
 *   this.treeRender.expand         — (id) → 노드 펼치기
 *   this.treeRender.collapse       — (id) → 노드 접기
 *   this.treeRender.expandAll      — () → 전체 펼치기
 *   this.treeRender.collapseAll    — () → 전체 접기
 *   this.treeRender.toggle         — (id) → 노드 펼치기/접기 토글
 *   this.treeRender.getNodeState   — (id) → 노드의 data 속성 반환
 *   this.treeRender.clear          — 컨테이너 비우기
 *   this.treeRender.destroy        — 자기 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function _applyValue(el, key, value, paths) {
    const { datasetAttrs, elementAttrs, styleAttrs } = paths;

    if (datasetAttrs[key]) {
        el.setAttribute('data-' + datasetAttrs[key], value);
    } else if (elementAttrs[key]) {
        el.setAttribute(elementAttrs[key], value);
    } else if (styleAttrs[key]) {
        const { property, unit = '' } = styleAttrs[key];
        el.style[property] = value + unit;
    } else {
        el.textContent = value;
    }
}

function applyTreeRenderMixin(instance, options) {
    const {
        cssSelectors = {},
        datasetAttrs = {},
        elementAttrs = {},
        styleAttrs = {},
        nodeKey = 'id',
        childrenKey = 'children'
    } = options;

    const paths = { datasetAttrs, elementAttrs, styleAttrs };

    // Mixin이 직접 참조하는 KEY 추출
    const container = cssSelectors.container;
    const template = cssSelectors.template;
    const nodeSelector = cssSelectors.node;

    // 네임스페이스 생성
    const ns = {};
    instance.treeRender = ns;

    // 선택자/옵션 보존 (외부에서 computed property로 참조 가능)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };
    ns.elementAttrs = { ...elementAttrs };
    ns.styleAttrs = { ...styleAttrs };

    /**
     * 단일 노드를 template에서 복제하여 생성
     */
    function createNode(nodeData, depth, templateEl) {
        const clone = templateEl.content.cloneNode(true);

        // cssSelectors 반영
        Object.entries(cssSelectors).forEach(([key, selector]) => {
            const el = clone.querySelector(selector);
            if (!el || nodeData[key] == null) return;

            _applyValue(el, key, nodeData[key], paths);
        });

        // 자동 속성: node-id, depth, expanded
        const nodeEl = clone.querySelector(nodeSelector);
        if (nodeEl) {
            nodeEl.setAttribute('data-node-id', nodeData[nodeKey]);
            nodeEl.setAttribute('data-depth', depth);
            nodeEl.style.paddingLeft = (depth * 20) + 'px';

            const children = nodeData[childrenKey];
            const hasChildren = Array.isArray(children) && children.length > 0;

            nodeEl.setAttribute('data-has-children', hasChildren);
            if (hasChildren) {
                nodeEl.setAttribute('data-expanded', 'true');
            }
        }

        return clone;
    }

    /**
     * 재귀적으로 노드를 렌더링
     */
    function renderNodes(nodes, depth, containerEl, templateEl) {
        nodes.forEach(nodeData => {
            const clone = createNode(nodeData, depth, templateEl);
            containerEl.appendChild(clone);

            // children 재귀
            const children = nodeData[childrenKey];
            if (Array.isArray(children) && children.length > 0) {
                renderNodes(children, depth + 1, containerEl, templateEl);
            }
        });
    }

    /**
     * 데이터 렌더링
     *
     * @param {{ response: Array }} payload
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[TreeRenderMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[TreeRenderMixin] data is not an array');

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[TreeRenderMixin] container not found: ' + container);

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[TreeRenderMixin] template not found: ' + template);

        containerEl.innerHTML = '';
        renderNodes(data, 0, containerEl, templateEl);
    };

    /**
     * 노드 ID로 요소 찾기
     */
    function findNodeEl(id) {
        return instance.appendElement.querySelector(
            nodeSelector + '[data-node-id="' + id + '"]'
        );
    }

    /**
     * 자식 노드 요소들 찾기 (직계 + 하위 전체)
     */
    function findDescendantEls(id) {
        const nodeEl = findNodeEl(id);
        if (!nodeEl) return [];

        const parentDepth = parseInt(nodeEl.getAttribute('data-depth'), 10);
        const descendants = [];
        let sibling = nodeEl.nextElementSibling;

        while (sibling) {
            const siblingDepth = parseInt(sibling.getAttribute('data-depth'), 10);
            if (siblingDepth <= parentDepth) break;
            descendants.push(sibling);
            sibling = sibling.nextElementSibling;
        }

        return descendants;
    }

    /**
     * 노드 펼치기
     *
     * @param {string} id - nodeKey에 해당하는 값
     */
    ns.expand = function(id) {
        const nodeEl = findNodeEl(id);
        if (!nodeEl || nodeEl.getAttribute('data-has-children') !== 'true') return;

        nodeEl.setAttribute('data-expanded', 'true');

        // 직계 자식만 표시 (하위 노드는 각자의 expanded 상태에 따름)
        const parentDepth = parseInt(nodeEl.getAttribute('data-depth'), 10);
        const descendants = findDescendantEls(id);

        descendants.forEach(el => {
            const elDepth = parseInt(el.getAttribute('data-depth'), 10);
            if (elDepth === parentDepth + 1) {
                el.style.display = '';
                // 자식이 expanded 상태이면 그 자식의 하위도 표시
                if (el.getAttribute('data-expanded') === 'true') {
                    ns.expand(el.getAttribute('data-node-id'));
                }
            }
        });
    };

    /**
     * 노드 접기
     *
     * @param {string} id - nodeKey에 해당하는 값
     */
    ns.collapse = function(id) {
        const nodeEl = findNodeEl(id);
        if (!nodeEl || nodeEl.getAttribute('data-has-children') !== 'true') return;

        nodeEl.setAttribute('data-expanded', 'false');

        // 모든 하위 노드 숨기기
        const descendants = findDescendantEls(id);
        descendants.forEach(el => {
            el.style.display = 'none';
        });
    };

    /**
     * 노드 펼치기/접기 토글
     *
     * @param {string} id - nodeKey에 해당하는 값
     */
    ns.toggle = function(id) {
        const nodeEl = findNodeEl(id);
        if (!nodeEl) return;

        if (nodeEl.getAttribute('data-expanded') === 'true') {
            ns.collapse(id);
        } else {
            ns.expand(id);
        }
    };

    /**
     * 전체 펼치기
     */
    ns.expandAll = function() {
        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) return;

        const nodes = containerEl.querySelectorAll(nodeSelector + '[data-has-children="true"]');
        nodes.forEach(nodeEl => {
            nodeEl.setAttribute('data-expanded', 'true');
        });

        // 모든 노드 표시
        const allNodes = containerEl.querySelectorAll(nodeSelector);
        allNodes.forEach(el => {
            el.style.display = '';
        });
    };

    /**
     * 전체 접기
     */
    ns.collapseAll = function() {
        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) return;

        const nodes = containerEl.querySelectorAll(nodeSelector + '[data-has-children="true"]');
        nodes.forEach(nodeEl => {
            nodeEl.setAttribute('data-expanded', 'false');
        });

        // depth > 0인 노드 숨기기
        const allNodes = containerEl.querySelectorAll(nodeSelector);
        allNodes.forEach(el => {
            if (parseInt(el.getAttribute('data-depth'), 10) > 0) {
                el.style.display = 'none';
            }
        });
    };

    /**
     * 노드 상태 조회
     *
     * @param {string} id - nodeKey에 해당하는 값
     * @returns {Object|null} data 속성 객체 (복사본) 또는 null
     */
    ns.getNodeState = function(id) {
        const el = findNodeEl(id);
        if (!el) return null;

        const state = {};
        Array.from(el.attributes).forEach(a => {
            if (a.name.startsWith('data-')) state[a.name.slice(5)] = a.value;
        });
        return state;
    };

    /**
     * 컨테이너 비우기
     */
    ns.clear = function() {
        const containerEl = instance.appendElement.querySelector(container);
        if (containerEl) containerEl.innerHTML = '';
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.renderData = null;
        ns.expand = null;
        ns.collapse = null;
        ns.toggle = null;
        ns.expandAll = null;
        ns.collapseAll = null;
        ns.getNodeState = null;
        ns.clear = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        ns.elementAttrs = null;
        ns.styleAttrs = null;
        instance.treeRender = null;
    };
}
