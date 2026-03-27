/**
 * LineChart — Dashboard Minimal
 *
 * 팔레트: 흑백 그레이스케일
 * 폰트: Instrument Sans
 */

const c = { dark: '#1d1d1f', mid: '#86868b', light: '#d2d2d7', faint: '#f5f5f7' };
const font = { fontFamily: 'Instrument Sans' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 32, right: 8, bottom: 28, left: 40 },
        xAxis: { type: 'category', axisLine: { show: false },
                 axisLabel: { color: c.mid, fontSize: 11, ...font }, axisTick: { show: false },
                 splitLine: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: c.faint } },
                 axisLabel: { color: c.light, fontSize: 11, ...font }, axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'CPU', type: 'line', smooth: 0.5, symbol: 'none', color: c.dark, lineStyle: { width: 2 } },
            { name: 'Memory', type: 'line', smooth: 0.5, symbol: 'none', color: c.light, lineStyle: { width: 2 } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: c.dark, borderWidth: 0,
                   textStyle: { color: '#fff', fontSize: 12, ...font } },
        legend: { data: ['CPU', 'Memory'], right: 0, top: 0, textStyle: { color: c.mid, fontSize: 11, ...font },
                  icon: 'roundRect', itemWidth: 12, itemHeight: 2 }
    }
});

this.subscriptions = { dashboard_lineChart: [this.echarts.renderData] };
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
