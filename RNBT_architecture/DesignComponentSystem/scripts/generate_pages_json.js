/**
 * DarkTech / Minimal pages.json 생성 스크립트
 *
 * Corporate pages.json을 템플릿으로, 테마별 CSS/HTML/scripts를 읽어
 * 새 pages.json을 생성한다.
 *
 * Usage: node generate_pages_json.js <theme>
 *   theme: darktech | minimal
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const theme = process.argv[2];
if (!theme || !['darktech', 'minimal'].includes(theme)) {
    console.error('Usage: node generate_pages_json.js <darktech|minimal>');
    process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const CORPORATE_JSON = path.resolve('c:/Users/junsungkim/Downloads/pages.json');

// ── Theme Config ──
const THEMES = {
    darktech: {
        dirName: 'Dashboard_DarkTech',
        styleSuffix: '02_dark_tech',
        viewSuffix: '02_dark_tech',
        pageName: 'DarkTech.html',
        bgColor: 'rgb(10, 14, 23)',
        pageIdPrefix: 'page-dashboard-darktech'
    },
    minimal: {
        dirName: 'Dashboard_Minimal',
        styleSuffix: '03_minimal',
        viewSuffix: '03_minimal',
        pageName: 'Minimal.html',
        bgColor: 'rgb(252, 252, 251)',
        pageIdPrefix: 'page-dashboard-minimal'
    }
};

const config = THEMES[theme];

// ── ID Generation ──
function genId() {
    const hex4 = () => crypto.randomBytes(4).toString('hex');  // 8 hex chars
    const hex6 = () => crypto.randomBytes(6).toString('hex');  // 12 hex chars
    return `id${hex4()}-${hex6()}-${hex6()}`;  // id + 8 + - + 12 + - + 12 = 36 chars
}

const IDS = {
    page: genId(),
    header: genId(),
    groupBody: genId(),
    sidebar: genId(),
    groupContent: genId(),
    lineChart: genId(),
    barChart: genId(),
    pieChart: genId(),
    gaugeChart: genId(),
    table: genId(),
    eventBrowser: genId()
};

console.log('Generated IDs:', JSON.stringify(IDS, null, 2));

// ── File Readers ──
function readFile(filePath) {
    const full = path.resolve(ROOT, filePath);
    if (!fs.existsSync(full)) {
        console.warn('WARNING: File not found:', full);
        return '';
    }
    return fs.readFileSync(full, 'utf-8');
}

function readDashboardFile(relPath) {
    return readFile(`Examples/${config.dirName}/${relPath}`);
}

function readComponentView(component) {
    return readFile(`Components/${component}/views/${config.viewSuffix}.html`);
}

function readDashboardCSS(component) {
    return readDashboardFile(`page/components/${component}/styles/${config.styleSuffix}.css`);
}

function readDashboardRegister(component) {
    return readDashboardFile(`page/components/${component}/scripts/register.js`);
}

function readDashboardBeforeDestroy(component) {
    return readDashboardFile(`page/components/${component}/scripts/beforeDestroy.js`);
}

function readMixin(name) {
    return readFile(`Mixins/${name}.js`);
}

// ── CSS Selector Transform ──
// #xxx-container → .{instanceId}
// 컨테이너 블록의 width에 !important 추가 (웹 플랫폼 필수)
function transformCSS(css, containerIdName, instanceId) {
    let result = css.replace(new RegExp('#' + containerIdName, 'g'), '.' + instanceId);
    // /* container */ 블록 내 width 값에 !important 추가
    result = result.replace(
        new RegExp('(\\.' + instanceId + '\\s*\\{[^}]*?width:\\s*[^;!]+)(;)', 'g'),
        '$1 !important$2'
    );
    return result;
}

// ── Load Corporate template ──
const corporate = JSON.parse(fs.readFileSync(CORPORATE_JSON, 'utf-8'));
const templatePage = corporate.page_info_list[0].page_info;
const templateContent = corporate.page_info_list[0].content_info;

// ── Mixin sources ──
const MIXINS = {
    FieldRenderMixin: readMixin('FieldRenderMixin'),
    ListRenderMixin: readMixin('ListRenderMixin'),
    EChartsMixin: readMixin('EChartsMixin'),
    TabulatorMixin: readMixin('TabulatorMixin'),
    ShadowPopupMixin: readMixin('ShadowPopupMixin')
};

// ── Page Scripts ──
const pageCSS = readDashboardFile('page/page.css');
const beforeLoad = readDashboardFile('page/page_scripts/before_load.js');
const loaded = readDashboardFile('page/page_scripts/loaded.js');
const beforeUnload = readDashboardFile('page/page_scripts/before_unload.js');

// ── Build Components ──
function buildComponent(templateComp, overrides) {
    const comp = JSON.parse(JSON.stringify(templateComp));

    comp.page_id = IDS.page;
    comp.id = overrides.id;
    comp.name = overrides.name || comp.name;

    if (overrides.cssCode !== undefined) comp.props.publishCode.cssCode = overrides.cssCode;
    if (overrides.htmlCode !== undefined) comp.props.publishCode.htmlCode = overrides.htmlCode;
    if (overrides.register !== undefined) comp.props.events.register = overrides.register;
    if (overrides.beforeDestroy !== undefined) comp.props.events.beforeDestroy = overrides.beforeDestroy;
    if (overrides.groupInfo !== undefined) comp.props.setter.groupInfo = overrides.groupInfo;
    if (overrides.itemList !== undefined) comp.props.setter.itemList = overrides.itemList;
    if (overrides.depth !== undefined) comp.props.setter.depth = overrides.depth;

    return comp;
}

// ── Read & Transform each component ──

// Header
const headerCSS = transformCSS(readDashboardCSS('Header'), 'header-container', IDS.header);
const headerHTML = readComponentView('Header');
const headerRegister = readDashboardRegister('Header') + '\n\n' + MIXINS.FieldRenderMixin;
const headerDestroy = readDashboardBeforeDestroy('Header');

// Sidebar
const sidebarCSS = transformCSS(readDashboardCSS('Sidebar'), 'sidebar-container', IDS.sidebar);
const sidebarHTML = readComponentView('Sidebar');
const sidebarRegister = readDashboardRegister('Sidebar') + '\n\n' + MIXINS.ListRenderMixin;
const sidebarDestroy = readDashboardBeforeDestroy('Sidebar');

// Charts
function buildChartData(component, containerName, instanceId) {
    const css = transformCSS(readDashboardCSS(component), containerName, instanceId);
    const html = readComponentView(component);
    const register = readDashboardRegister(component) + '\n\n' + MIXINS.EChartsMixin;
    const destroy = readDashboardBeforeDestroy(component);
    return { css, html, register, destroy };
}

const lineChart = buildChartData('LineChart', 'line-chart-container', IDS.lineChart);
const barChart = buildChartData('BarChart', 'bar-chart-container', IDS.barChart);
const pieChart = buildChartData('PieChart', 'pie-chart-container', IDS.pieChart);
const gaugeChart = buildChartData('GaugeChart', 'gauge-chart-container', IDS.gaugeChart);

// Table
const tableCSS = transformCSS(readDashboardCSS('Table'), 'table-container', IDS.table);
const tableHTML = readComponentView('Table');
const tableRegister = readDashboardRegister('Table') + '\n\n' + MIXINS.TabulatorMixin;
const tableDestroy = readDashboardBeforeDestroy('Table');

// EventBrowser
const ebCSS = transformCSS(readDashboardCSS('EventBrowser'), 'event-browser-container', IDS.eventBrowser);
const ebHTML = readComponentView('EventBrowser');
const ebRegister = readDashboardRegister('EventBrowser') + '\n\n' + MIXINS.ShadowPopupMixin + '\n\n' + MIXINS.ListRenderMixin;
const ebDestroy = readDashboardBeforeDestroy('EventBrowser');

// ── Build two_layer array (use corporate templates) ──
const twoLayer = templateContent.two_layer;

const components = [
    // 01 Header
    buildComponent(twoLayer[0], {
        id: IDS.header, name: '01_Header', depth: 10001,
        cssCode: headerCSS, htmlCode: headerHTML,
        register: headerRegister, beforeDestroy: headerDestroy,
        groupInfo: ''
    }),
    // 02 GroupBody
    buildComponent(twoLayer[1], {
        id: IDS.groupBody, name: '02_GroupBody', depth: 10002,
        itemList: [IDS.sidebar, IDS.groupContent],
        groupInfo: ''
    }),
    // 03 Sidebar
    buildComponent(twoLayer[2], {
        id: IDS.sidebar, name: '03_SideBar', depth: 10003,
        cssCode: sidebarCSS, htmlCode: sidebarHTML,
        register: sidebarRegister, beforeDestroy: sidebarDestroy,
        groupInfo: IDS.groupBody
    }),
    // 04 GroupContent
    buildComponent(twoLayer[3], {
        id: IDS.groupContent, name: '04_GroupContents', depth: 10005,
        itemList: [IDS.lineChart, IDS.barChart, IDS.pieChart, IDS.gaugeChart, IDS.table, IDS.eventBrowser],
        groupInfo: IDS.groupBody
    }),
    // 05 LineChart
    buildComponent(twoLayer[4], {
        id: IDS.lineChart, name: '05_LineChart', depth: 10004,
        cssCode: lineChart.css, htmlCode: lineChart.html,
        register: lineChart.register, beforeDestroy: lineChart.destroy,
        groupInfo: IDS.groupContent
    }),
    // 06 BarChart
    buildComponent(twoLayer[5], {
        id: IDS.barChart, name: '06_BarChart', depth: 10006,
        cssCode: barChart.css, htmlCode: barChart.html,
        register: barChart.register, beforeDestroy: barChart.destroy,
        groupInfo: IDS.groupContent
    }),
    // 07 PieChart
    buildComponent(twoLayer[6], {
        id: IDS.pieChart, name: '07_PieChart', depth: 10007,
        cssCode: pieChart.css, htmlCode: pieChart.html,
        register: pieChart.register, beforeDestroy: pieChart.destroy,
        groupInfo: IDS.groupContent
    }),
    // 08 GaugeChart
    buildComponent(twoLayer[7], {
        id: IDS.gaugeChart, name: '08_GaugeChart', depth: 10008,
        cssCode: gaugeChart.css, htmlCode: gaugeChart.html,
        register: gaugeChart.register, beforeDestroy: gaugeChart.destroy,
        groupInfo: IDS.groupContent
    }),
    // 09 Table
    buildComponent(twoLayer[8], {
        id: IDS.table, name: '09_Table', depth: 10009,
        cssCode: tableCSS, htmlCode: tableHTML,
        register: tableRegister, beforeDestroy: tableDestroy,
        groupInfo: IDS.groupContent
    }),
    // 10 EventBrowser
    buildComponent(twoLayer[9], {
        id: IDS.eventBrowser, name: '10_EventBrowser', depth: 10010,
        cssCode: ebCSS, htmlCode: ebHTML,
        register: ebRegister, beforeDestroy: ebDestroy,
        groupInfo: IDS.groupContent
    })
];

// ── Build page_info ──
const page = JSON.parse(JSON.stringify(templatePage));
page.id = IDS.page;
page.name = config.pageName;
page.props.publishCode.cssCode = pageCSS;
page.props.setter.background.color = config.bgColor;
page.props.events.beforeLoad = beforeLoad;
page.props.events.loaded = loaded;
page.props.events.beforeUnLoad = beforeUnload;

// ── Assemble ──
const output = {
    page_info_list: [{
        page_info: page,
        content_info: {
            master_layer: {},
            two_layer: components,
            three_layer: []
        }
    }]
};

// ── Write ──
const outPath = path.resolve(ROOT, `Examples/${config.dirName}/pages.json`);
fs.writeFileSync(outPath, JSON.stringify(output), 'utf-8');
console.log(`\nWritten: ${outPath}`);
console.log('Done!');
