/**
 * PieChart — Dashboard Minimal
 *
 * 목적: 데이터를 pie 차트로 시각화한다
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

const c = { dark: '#1d1d1f', mid: '#86868b', light: '#d2d2d7' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'pie', radius: ['50%', '72%'], center: ['40%', '52%'],
            label: { show: true, formatter: '{b}', color: c.mid, fontSize: 11, fontFamily: 'Instrument Sans' },
            labelLine: { lineStyle: { color: c.light } },
            itemStyle: { borderColor: '#fcfcfb', borderWidth: 3 }
        }],
        tooltip: { trigger: 'item', backgroundColor: c.dark, borderWidth: 0,
                   textStyle: { color: '#fff', fontSize: 12, fontFamily: 'Instrument Sans' } },
        color: [c.dark, '#86868b', '#aeaeb2', '#d2d2d7', '#e8e8ed']
    },
    mapData: function(data, option) { option.series[0].data = data.items; return option; }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = { dashboard_pieChart: [this.echarts.renderData] };

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
