/**
 * 3DShadowPopupMixin
 *
 * 3D 컴포넌트에서 Shadow DOM 팝업을 표시한다.
 *
 * 3D 컴포넌트의 appendElement는 THREE.Group이므로 DOM에 직접 팝업을 붙일 수 없다.
 * 대신 page.appendElement(HTMLDivElement)에 Shadow DOM 호스트를 생성하고,
 * HTML/CSS를 문자열(getHTML/getStyles)로 받아 주입한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 2D ShadowPopupMixin과의 차이:
 *
 *   | 항목          | 2D (ShadowPopupMixin)       | 3D (3DShadowPopupMixin)       |
 *   |---------------|-----------------------------|-------------------------------|
 *   | 콘텐츠 소스   | DOM <template> 태그 탐색     | getHTML() / getStyles() 문자열 |
 *   | Host 부착     | instance.appendElement      | instance.page.appendElement   |
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   apply3DShadowPopupMixin(this, {
 *       getHTML:   () => '<div class="popup">...</div>',
 *       getStyles: () => '.popup { ... }',
 *       onCreated: (shadowRoot) => { ... }
 *   });
 *
 *   this.shadowPopup.show();
 *   this.shadowPopup.query('.popup-title').textContent = 'BATT-01';
 *   this.shadowPopup.hide();
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.shadowPopup):
 *
 *   this.shadowPopup.show              — 팝업 표시 (lazy init)
 *   this.shadowPopup.hide              — 팝업 숨김
 *   this.shadowPopup.query             — Shadow DOM 내 요소 선택
 *   this.shadowPopup.queryAll          — Shadow DOM 내 모든 요소 선택
 *   this.shadowPopup.bindPopupEvents   — Shadow DOM 내 이벤트 바인딩
 *   this.shadowPopup.removePopupEvents — Shadow DOM 내 이벤트 해제
 *   this.shadowPopup.destroy           — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function apply3DShadowPopupMixin(instance, options) {
    const { getHTML, getStyles, onCreated } = options;

    const ns = {};
    instance.shadowPopup = ns;

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
     *
     * 2D와의 핵심 차이:
     * - page.appendElement에 호스트를 부착 (3D appendElement는 THREE.Group)
     * - getHTML()/getStyles()로 콘텐츠를 문자열로 받아 주입
     */
    function ensureInstance() {
        if (shadowRoot) return;

        host = document.createElement('div');
        instance.page.appendElement.appendChild(host);

        shadowRoot = host.attachShadow({ mode: 'open' });

        const htmlContent = getHTML.call(instance);
        const cssContent = getStyles.call(instance);

        shadowRoot.innerHTML = `<style>${cssContent}</style>${htmlContent}`;

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
     * show() 전에 호출해도 된다. Shadow DOM 생성 시 자동 바인딩된다.
     *
     * @param {Object} events - { eventType: { selector: '@eventName' | handler } }
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
        instance.shadowPopup = null;
    };
}
