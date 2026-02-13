# 比特币四年周期轮动图 | Bitcoin Four-Year Cycle Map

一张表看懂比特币的四年周期规律。

## 在线访问

**静态页面**：https://yuanxuejpjp.github.io/bitcoin-four-year-cycle-map/

[![Bitcoin Four-Year Cycle Map]](https://yuanxuejpjp.github.io/bitcoin-four-year-cycle-map/)

---

## 功能特性

### 📊 数据展示
- **2011 年至今** 比特币历史价格数据
- **月度涨跌幅矩阵** - 绿涨红跌，颜色深浅直观
- **实时价格更新** - WebSocket 实时推送
- **多维度统计** - 年度、月份平均/中位数

### 🎯 极值标记
- **最高点标记** - 大牛年（bigBull）红色 ▲ 标记年度最高点
- **最低点标记** - 回调年（correction）绿色 ▼ 标记年度最低点
- **智能提示** - 鼠标悬停显示具体日期、价格、距离上次减半/极值天数

### 🔮 预测系统
- **时间范围预测** - 基于历史规律（距上次最高点 363-380 天，距下次减半 513-571 天）
- **价格预测** - 斐波那契回调计算（0.236-0.382）
- **一键复制** - 点击按钮复制预测信息到微信分享
- **每日更新** - GitHub Actions 自动更新月度数据

### 🌐 国际化
- 中英文双语支持（右下角地球图标切换）

### 📱 响应式设计
- 自适应缩放，桌面端和移动端完美展示

---

## 在线访问

### 部署方式
- **GitHub Pages**（推荐）：https://yuanxuejpjp.github.io/bitcoin-four-year-cycle-map/
- **Vercel**（备选）：一键部署到 Vercel
- **本地运行**：`python -m http.server 8080`

### 数据来源
- **实时价格**：Binance WebSocket API
- **历史数据**：blockchain.info
- **减半倒计时**：Blockchair API

---

## 功能特性

### 📊 数据展示
- **2011 年至今** 比特币历史价格数据
- **月度涨跌幅矩阵** - 绿涨红跌，颜色深浅直观
- **实时价格更新** - WebSocket 实时推送
- **多维度统计** - 年度、月份平均/中位数

### 🎯 极值标记
- **最高点标记** - 大牛年（bigBull）红色 ▲ 标记年度最高点
- **最低点标记** - 回调年（correction）绿色 ▼ 标记年度最低点
- **智能提示** - 鼠标悬停显示具体日期、价格、距离上次减半/极值天数

### 🔮 预测系统
- **时间范围预测** - 基于历史规律（距上次最高点 363-380 天，距下次减半 513-571 天）
- **价格预测** - 斐波那契回调计算（0.236-0.382）
- **一键复制** - 点击按钮复制预测信息到微信分享
- **每日更新** - GitHub Actions 自动更新月度数据

### 🌐 国际化
- 中英文双语支持（右下角地球图标切换）

### 📱 响应式设计
- 自适应缩放，桌面端和移动端完美展示

---

## 项目结构

```
bitcoin-four-year-cycle-map-main/
├── index.html                 # 页面入口
├── app.js                     # 主逻辑（数据加载、实时更新、交互）
├── styles.css                 # 样式（含移动端自适应）
├── src/
│   ├── config.js              # 全局配置
│   ├── dataService.js        # 数据获取（REST + WebSocket）
│   ├── metrics.js             # 数据计算（极值、统计）
│   ├── render.js              # 渲染（表格、动画、极值标记）
│   └── i18n.js              # 中英文翻译
├── data/
│   └── monthly-seed.json      # 历史月度数据（blockchain.info）
├── fonts/
│   └── reeji-flash.ttf        # 自定义字体
├── favicon/                   # 网站图标
├── scripts/
│   └── update-monthly-seed.mjs # 月度数据更新脚本
└── .github/workflows/
    └── monthly-update.yml        # GitHub Actions 自动更新
```

---

## 本地运行

### 环境要求
- Python 3.8+ 或 Node.js 16+
- 现代浏览器（Chrome/Edge/Firefox 最新版）

### 启动步骤
```bash
# 克隆仓库
git clone https://github.com/yuanxuejpjp/bitcoin-four-year-cycle-map.git
cd bitcoin-four-year-cycle-map

# 方式 1：Python（推荐）
python3 -m http.server 8080

# 方式 2：Node.js
npx serve

# 方式 3：PHP 内置服务器
php -S localhost:8080
```

浏览器访问：http://localhost:8080

---

## API 使用

### Binance REST API
- **月线数据**：`/api/v3/klines?symbol=BTCUSDT&interval=1M`
- **日数据**：`/api/v3/klines?symbol=BTCUSDT&interval=1d`
- **WebSocket**：`wss://stream.binance.me:9443/stream?streams=btcusdt@kline_1M/btcusdt@trade`

### blockchain.info
- **历史数据**：`https://blockchain.info/q/dateblockchain.info/historical`

### Blockchair
- **减半倒计时**：`https://api.blockchair.com/tools/halvening`

---

## 版本历史

### v2.0 (2026-02-13)
- ✅ 添加最低点预测面板
  - 时间范围预测（距最高点/减半天数）
  - 价格预测（斐波那契 0.236-0.382）
  - 一键复制到微信功能
- ✅ 优化页面布局
  - 标题字体增大到 58px
  - 价格信息独立一行显示
- ✅ 改进极值计算
  - 支持日级别数据精确极值
  - 月度数据支持 high/low 字段
- ✅ 添加调试日志
  - 帮助排查问题

### v1.0
- 初始版本
  - 基础表格展示
  - 实时价格更新
  - 中英文切换
  - 四年周期划分

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## License

MIT

---

## 开发者

[**wolfyxbt**](https://github.com/wolfyxbt)