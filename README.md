# DevOmni Developer Tools

<div align="center">

**一款专为开发者打造的现代化、跨平台桌面工具箱。**

基于 Electron, React, TypeScript 和 Tailwind CSS 构建。  
拥有精美的 UI、丰富的主题系统以及能够自动识别剪贴板内容的“智能粘贴”功能。

</div>

---

## ✨ 核心特性

DevOmni 集成了 20+ 种常用的开发工具，所有处理均在**本地离线**完成，确保数据安全。

### 🚀 智能特性 (Smart Features)
- **智能粘贴 (Smart Paste)**: 自动分析剪贴板内容（如 JSON, SQL, JWT, 时间戳等），自动跳转到对应工具并填充内容。
- **多主题支持**: 内置 Dark (OLED), Light, Graphite, Cream (Warm), Glass (磨砂玻璃) 等多种精美主题。
- **VS Code 风格编辑器**: 支持行号、代码高亮、折叠和错误提示。

### 🛠️ 格式化与转换 (Converters)
- **JSON 工具**: 格式化、压缩、自动修复 (JSON Repair)、排序、树状视图查看。
- **SQL 格式化**: 支持 Standard, PostgreSQL, MySQL, SQLite 方言美化。
- **JSON <> YAML**: JSON 与 YAML 实时双向转换。
- **JWT 调试**: 解析 JWT Token Header/Payload，支持时间戳格式化。
- **进制转换**: 二进制、八进制、十进制、十六进制实时互转。
- **Base64**: 文本与 Base64 编码互转。
- **图片 Base64**: 图片转 Data URI，Base64 字符串转图片预览及下载。
- **URL 编码**: URL Encode/Decode。

### ⚡ 生成器 (Generators)
- **UUID 生成器**: 批量生成 UUID v4，支持连字符、大小写、括号自定义。
- **Hash/MD5**: 同时计算 MD5, SHA1, SHA256, SHA512 哈希值。
- **Cron 表达式**: 可视化 Cron 生成器，支持预览最近 5 次运行时间。
- **二维码 (QR Code)**: 生成自定义颜色的二维码，支持从图片/剪贴板识别二维码。
- **时间戳**: Unix 时间戳与日期互转，支持实时“当前时间”模式。
- **随机字符串**: 自定义长度、字符集（数字/符号/大小写）生成随机串。
- **取色器**: 调色板生成（互补色、三色等），支持 HEX/RGB/HSL/CMYK 转换。

### 📝 文本工具 (Text Tools)
- **文本对比 (Diff)**: 左右分栏对比文本差异，支持忽略空格、行内高亮。
- **正则测试 (Regex)**: 实时正则匹配，支持常用预设（邮箱、URL等）和 Flag 调整。
- **去重 (Dedupe)**: 文本行去重与统计。
- **文本处理 (Joiner)**: 文本行合并、拆分，支持自定义分隔符。
- **大小写转换**: Camel, Snake, Kebab, Pascal, Constant 等多种命名风格转换。

---

## 💻 技术栈

- **Core**: [Electron](https://www.electronjs.org/), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Key Libraries**: 
  - `jsonrepair` (JSON 修复)
  - `js-yaml` (YAML 转换)
  - `cron-parser` (Cron 解析)
  - `qrcode` / `jsqr` (二维码处理)

---

## 📦 安装与运行

### 前置要求
确保本地已安装 Node.js (推荐 v18+)。

### 1. 克隆项目
```bash
git clone https://github.com/your-username/devomni-tools.git
cd devomni-tools
```

### 2. 安装依赖
```bash
npm install
# 或者
yarn install
```

### 3. 开发模式运行
同时启动 Vite 开发服务器和 Electron 窗口：
```bash
npm run electron:dev
```

### 4. 打包构建
构建生产环境应用（输出目录通常为 `release/` 或 `dist/`）：
```bash
npm run build
```

---

## 🎨 目录结构

```
src/
├── components/
│   ├── common/        # 通用 UI 组件 (如带行号的编辑器)
│   ├── modals/        # 模态框 (设置页面)
│   ├── tools/         # 具体工具实现 (JsonFormatter, HashTool 等)
│   └── Sidebar.tsx    # 侧边栏导航
├── context/           # React Context (主题、全局设置)
├── utils/             # 工具函数 (剪贴板检测逻辑)
├── App.tsx            # 主应用入口
├── main.js            # Electron 主进程
└── index.css          # 全局样式与 Tailwind 配置
```

## 📄 License

MIT License
