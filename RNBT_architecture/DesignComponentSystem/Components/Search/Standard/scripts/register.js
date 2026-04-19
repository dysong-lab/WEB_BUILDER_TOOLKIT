/**
 * Search — Standard
 *
 * 목적: 키워드/문구 입력으로 관련 정보를 검색하고 제안을 탐색
 * 기능: FieldRenderMixin으로 검색 바 렌더링 + ListRenderMixin으로 제안 목록 렌더링
 *      + 입력/제출/클리어/제안 클릭 이벤트
 *
 * Mixin: FieldRenderMixin + ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        searchBar:   '.search__bar',
        leadingIcon: '.search__leading',
        query:       '.search__input',
        placeholder: '.search__input',
        clearBtn:    '.search__clear',
        submitBtn:   '.search__submit'
    },
    elementAttrs: {
        query:       'value',
        placeholder: 'placeholder'
    }
});

applyListRenderMixin(this, {
    cssSelectors: {
        container:    '.search__suggestions',
        template:     '#search-suggestion-template',
        suggestionid: '.search__suggestion-item',
        leading:      '.search__suggestion-leading',
        label:        '.search__suggestion-label',
        supporting:   '.search__suggestion-supporting'
    },
    datasetAttrs: {
        suggestionid: 'suggestionid'
    }
});

// ======================
// 2. 구독 연결 — Mixin 메서드 참조
// ======================

this.subscriptions = {
    searchBar:         [this.fieldRender.renderData],
    searchSuggestions: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — Mixin 선택자 computed property 참조
// ======================

this.customEvents = {
    input: {
        [this.fieldRender.cssSelectors.query]:       '@searchInput'
    },
    change: {
        [this.fieldRender.cssSelectors.query]:       '@searchSubmitted'
    },
    click: {
        [this.fieldRender.cssSelectors.clearBtn]:    '@searchCleared',
        [this.fieldRender.cssSelectors.submitBtn]:   '@searchSubmitted',
        [this.listRender.cssSelectors.suggestionid]: '@suggestionClicked'
    }
};

bindEvents(this, this.customEvents);
