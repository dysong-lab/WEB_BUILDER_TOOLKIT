/**
 * ScatterChart 컴포넌트
 *
 * 목적: 데이터를 산점도로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다
 *
 * Mixin: EChartsMixin (mapData 사용)
 * 데이터 규약: mapData로 커스텀 — [{ name, data: [[x,y], ...] }]
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
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [],
        tooltip: { trigger: 'item' }
    },
    mapData: function(data, optionCopy) {
        optionCopy.series = data.series.map(function(s) {
            return {
                name: s.name,
                type: 'scatter',
                data: s.data,
                symbolSize: s.symbolSize || 10
            };
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
    scatterChartData: [this.echarts.renderData]
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
