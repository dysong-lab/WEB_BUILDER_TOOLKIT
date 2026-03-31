/**
 * LineChart — Dashboard Corporate
 *
 * 목적: 데이터를 line 차트로 시각화한다
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
    warm: '#c4553a', olive: '#7a8b6f',
    text: '#2c2c2c', muted: '#b0aa9f', line: '#e8e6e1'
};
const chartFont = { fontFamily: 'DM Sans' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 40, right: 20, bottom: 32, left: 48 },
        xAxis: { type: 'category', axisLine: { lineStyle: { color: palette.line } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: palette.line, type: 'dashed' } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'CPU', type: 'line', smooth: 0.4, symbol: 'none', color: palette.warm, lineStyle: { width: 2.5 } },
            { name: 'Memory', type: 'line', smooth: 0.4, symbol: 'none', color: palette.olive, lineStyle: { width: 2.5 } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: palette.text, borderWidth: 0,
                   textStyle: { color: '#fffffe', fontSize: 12, ...chartFont } },
        legend: { data: ['CPU', 'Memory'], right: 0, top: 0, textStyle: { color: palette.muted, fontSize: 11, ...chartFont },
                  icon: 'roundRect', itemWidth: 12, itemHeight: 3 }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    dashboard_lineChart: [this.echarts.renderData]
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
