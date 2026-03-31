/**
 * BarChart — Dashboard Corporate
 *
 * 목적: 데이터를 bar 차트로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

const palette = {
    sand: '#b0926a', neutral: '#d4d0c8',
    text: '#2c2c2c', muted: '#b0aa9f', line: '#e8e6e1'
};
const chartFont = { fontFamily: 'DM Sans' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 40, right: 12, bottom: 32, left: 48 },
        xAxis: { type: 'category', axisLine: { lineStyle: { color: palette.line } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: palette.line, type: 'dashed' } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'Input', type: 'bar', barWidth: '32%', itemStyle: { color: palette.sand, borderRadius: [2, 2, 0, 0] } },
            { name: 'Output', type: 'bar', barWidth: '32%', itemStyle: { color: palette.neutral, borderRadius: [2, 2, 0, 0] } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: palette.text, borderWidth: 0,
                   textStyle: { color: '#fffffe', fontSize: 12, ...chartFont } },
        legend: { data: ['Input', 'Output'], right: 0, top: 0, textStyle: { color: palette.muted, fontSize: 11, ...chartFont },
                  icon: 'roundRect', itemWidth: 12, itemHeight: 3 }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    dashboard_barChart: [this.echarts.renderData]
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
