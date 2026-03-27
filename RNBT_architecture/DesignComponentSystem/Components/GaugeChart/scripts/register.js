/**
 * GaugeChart 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: EChartsMixin + mapData로 단일 수치를 게이지로 시각화한다
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { value: Number, name: String }
 */


// ── 1. Mixin 적용 ──
applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        series: [{
            type: 'gauge',
            min: 0,
            max: 100,
            detail: { formatter: '{value}%', fontSize: 20 },
            axisLine: { lineStyle: { width: 15 } }
        }]
    },
    mapData: function(data, option) {
        option.series[0].data = [{ value: data.value, name: data.name }];
        return option;
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    gaugeData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
