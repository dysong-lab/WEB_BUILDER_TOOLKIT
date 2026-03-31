/**
 * applyValue — 렌더링 경로 공유 유틸리티
 *
 * 데이터의 값을 DOM 요소에 반영한다.
 * FieldRenderMixin, ListRenderMixin, TreeRenderMixin이 공유한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 렌더링 경로 (4가지, 우선순위 순):
 *
 *   1. datasetAttrs[key]  → el.setAttribute('data-' + name, value)
 *   2. elementAttrs[key]  → el.setAttribute(attr, value)
 *   3. styleAttrs[key]    → el.style[prop] = value + unit
 *   4. 기본               → el.textContent = value
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   datasetAttrs: { status: 'status' }
 *   elementAttrs: { icon: 'src' }
 *   styleAttrs:   { progress: { property: 'width', unit: '%' } }
 *
 *   데이터: { status: 'running', icon: '/icons/on.svg', progress: 72, label: 'Pump' }
 *
 *   결과:
 *     status   → data-status="running"        (datasetAttrs)
 *     icon     → src="/icons/on.svg"           (elementAttrs)
 *     progress → style.width="72%"             (styleAttrs)
 *     label    → textContent="Pump"            (기본)
 *
 * ─────────────────────────────────────────────────────────────
 *
 * @param {Element} el - 대상 DOM 요소
 * @param {string} key - 데이터 키 이름
 * @param {*} value - 설정할 값
 * @param {Object} paths - 렌더링 경로 옵션
 * @param {Object} paths.datasetAttrs - data-* 속성 매핑
 * @param {Object} paths.elementAttrs - 요소 속성 매핑
 * @param {Object} paths.styleAttrs - 스타일 속성 매핑
 */
function applyValue(el, key, value, paths) {
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
