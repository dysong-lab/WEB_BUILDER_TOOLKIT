/**
 * RadarChart 컴포넌트
 *
 * 목적: 데이터를 레이더/방사형 차트로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다
 *
 * Mixin: EChartsMixin (mapData 사용)
 * 데이터 규약: mapData로 커스텀 — { indicator, series }
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        radar: { indicator: [] },
        series: [{ type: 'radar', data: [] }],
        tooltip: {}
    },
    mapData: function(data, optionCopy) {
        optionCopy.radar.indicator = data.indicator;
        optionCopy.series[0].data = data.series.map(function(s) {
            return { name: s.name, value: s.value };
        });
        if (data.legend) {
            optionCopy.legend = { data: data.legend };
        }
        return optionCopy;
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    radarChartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
