/**
 * PopupMixin
 *
 * 콘텐츠를 별도 레이어에 표시한다.
 *
 * Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다.
 * <template> 태그에서 HTML/CSS를 가져와 Shadow DOM에 주입한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyPopupMixin(this, {
 *       cssSelectors: {
 *           template: '#asset-popup-template',
 *           closeBtn: '.popup-close-btn',
 *           title:    '.popup-title',
 *           content:  '.popup-content'
 *       }
 *   });
 *
 *   this.popup.bindPopupEvents({
 *       click: {
 *           [this.popup.cssSelectors.closeBtn]: '@popupClose'
 *       }
 *   });
 *
 *   this.popup.show();
 *   this.popup.query(this.popup.cssSelectors.title).textContent = 'Hello';
 *   this.popup.hide();
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.popup):
 *
 *   this.popup.cssSelectors      — 주입된 선택자 (computed property 참조용)
 *   this.popup.datasetAttrs      — 주입된 dataset 속성
 *   this.popup.show              — 팝업 표시 (lazy init)
 *   this.popup.hide              — 팝업 숨김
 *   this.popup.query             — Shadow DOM 내 요소 선택
 *   this.popup.queryAll          — Shadow DOM 내 모든 요소 선택
 *   this.popup.bindPopupEvents   — Shadow DOM 내 이벤트 바인딩
 *   this.popup.removePopupEvents — Shadow DOM 내 이벤트 해제
 *   this.popup.destroy           — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyPopupMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {}, onCreated } = options;

    const template = cssSelectors.template;

    const ns = {};
    instance.popup = ns;

    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };

    let host = null;
    let shadowRoot = null;

    // ── 이벤트 관리 ──

    const _popupListeners = [];
    let _pendingEvents = null;

    function bindInternal(events) {
        Object.entries(events).forEach(([eventType, selectorMap]) => {
            Object.entries(selectorMap).forEach(([selector, handler]) => {
                const listener = function(e) {
                    const target = e.target.closest(selector);
                    if (!target) return;

                    if (typeof handler === 'string' && handler.charAt(0) === '@') {
                        // '@eventName' → Weventbus로 전파 (customEvents와 동일한 패턴)
                        Weventbus.emit(handler, { event: e, targetInstance: instance });
                    } else {
                        handler(e);
                    }
                };
                shadowRoot.addEventListener(eventType, listener);
                _popupListeners.push({ eventType, listener });
            });
        });
    }

    // ── Shadow DOM 생성 ──

    /**
     * Shadow DOM 생성 (lazy init)
     * 최초 show() 호출 시 실행된다.
     */
    function ensureInstance() {
        if (shadowRoot) return;

        const templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[PopupMixin] template not found: ' + template);

        host = document.createElement('div');
        instance.appendElement.appendChild(host);

        shadowRoot = host.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(templateEl.content.cloneNode(true));

        host.style.display = 'none';

        // bindPopupEvents가 show() 전에 호출되었으면 여기서 바인딩
        if (_pendingEvents) {
            bindInternal(_pendingEvents);
            _pendingEvents = null;
        }

        if (onCreated) onCreated(shadowRoot);
    }

    // ── Public 메서드 ──

    /**
     * 팝업 표시
     * 최초 호출 시 Shadow DOM을 생성한다.
     */
    ns.show = function() {
        ensureInstance();
        host.style.display = '';
    };

    /**
     * 팝업 숨김
     * Shadow DOM은 유지된다 (destroy하지 않음).
     */
    ns.hide = function() {
        if (!host) return;
        host.style.display = 'none';
    };

    /**
     * Shadow DOM 내 단일 요소 선택
     *
     * @param {string} selector - CSS 선택자
     * @returns {Element|null}
     */
    ns.query = function(selector) {
        if (!shadowRoot) return null;
        return shadowRoot.querySelector(selector);
    };

    /**
     * Shadow DOM 내 모든 요소 선택
     *
     * @param {string} selector - CSS 선택자
     * @returns {NodeList}
     */
    ns.queryAll = function(selector) {
        if (!shadowRoot) return [];
        return shadowRoot.querySelectorAll(selector);
    };

    /**
     * Shadow DOM 내 이벤트 바인딩
     *
     * Shadow DOM 내부 이벤트는 shadow boundary를 넘을 때 retarget되므로,
     * instance.appendElement에서의 이벤트 위임(bindEvents)으로는 잡을 수 없다.
     * 이 메서드로 Shadow DOM 내부에 직접 이벤트를 위임한다.
     *
     * show() 전에 호출해도 된다. Shadow DOM 생성 시 자동 바인딩된다.
     *
     * @param {Object} events - { eventType: { selector: '@eventName' | handler } }
     *   값이 '@'로 시작하는 문자열이면 Weventbus로 전파한다 (customEvents와 동일한 패턴).
     *   함수이면 직접 호출한다.
     */
    ns.bindPopupEvents = function(events) {
        if (shadowRoot) {
            bindInternal(events);
        } else {
            _pendingEvents = events;
        }
    };

    /**
     * Shadow DOM 내 이벤트 해제
     */
    ns.removePopupEvents = function() {
        _popupListeners.forEach(({ eventType, listener }) => {
            if (shadowRoot) shadowRoot.removeEventListener(eventType, listener);
        });
        _popupListeners.length = 0;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.removePopupEvents();
        if (host) {
            host.remove();
            host = null;
        }
        shadowRoot = null;
        _pendingEvents = null;
        ns.show = null;
        ns.hide = null;
        ns.query = null;
        ns.queryAll = null;
        ns.bindPopupEvents = null;
        ns.removePopupEvents = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        instance.popup = null;
    };
}
