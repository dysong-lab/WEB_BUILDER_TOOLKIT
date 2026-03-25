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
 *   this.popup.show();
 *   this.popup.query(this.popup.cssSelectors.title).textContent = 'Hello';
 *   this.popup.hide();
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.popup):
 *
 *   this.popup.cssSelectors  — 주입된 선택자 (computed property 참조용)
 *   this.popup.datasetAttrs  — 주입된 dataset 속성
 *   this.popup.show          — 팝업 표시 (lazy init)
 *   this.popup.hide          — 팝업 숨김
 *   this.popup.query         — Shadow DOM 내 요소 선택
 *   this.popup.queryAll      — Shadow DOM 내 모든 요소 선택
 *   this.popup.destroy       — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyPopupMixin(instance, options) {
    const { cssSelectors = {}, datasetAttrs = {}, onCreated } = options;

    var template = cssSelectors.template;

    var ns = {};
    instance.popup = ns;

    ns.cssSelectors = {};
    var key;
    for (key in cssSelectors) {
        if (cssSelectors.hasOwnProperty(key)) {
            ns.cssSelectors[key] = cssSelectors[key];
        }
    }

    ns.datasetAttrs = {};
    for (key in datasetAttrs) {
        if (datasetAttrs.hasOwnProperty(key)) {
            ns.datasetAttrs[key] = datasetAttrs[key];
        }
    }

    var host = null;
    var shadowRoot = null;

    /**
     * Shadow DOM 생성 (lazy init)
     */
    function ensureInstance() {
        if (shadowRoot) return;

        var templateEl = instance.appendElement.querySelector(template);
        if (!templateEl) throw new Error('[PopupMixin] template not found: ' + template);

        host = document.createElement('div');
        instance.appendElement.appendChild(host);

        shadowRoot = host.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(templateEl.content.cloneNode(true));

        host.style.display = 'none';

        if (onCreated) onCreated(shadowRoot);
    }

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
     * 정리
     */
    ns.destroy = function() {
        if (host) {
            host.remove();
            host = null;
        }
        shadowRoot = null;
        ns.show = null;
        ns.hide = null;
        ns.query = null;
        ns.queryAll = null;
        ns.cssSelectors = null;
        ns.datasetAttrs = null;
        instance.popup = null;
    };
}
