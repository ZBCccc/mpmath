# mpMath — 微信公众号公式编辑插件（修复版）

> [!NOTE]
> 本项目是 [latentcat/mpmath](https://github.com/latentcat/mpmath) 的修复分支。
> 原项目于 2024 年中停止维护，本 fork 修复了以下关键问题使其可在当前微信编辑器中正常使用。

## 与原版的区别

原版（latentcat/mpmath v0.2.1）存在的问题：

| 问题 | 原因 | 状态 |
|------|------|------|
| 无法插入新公式 | 微信编辑器 API 变更（`UE.getEditor` 失效） | ✅ 已修复 |
| manifest.json 语法错误 | `background.service_worker` 字段名错误 | ✅ 已修复 |
| MathJax 初始化报错 | 异步加载时序问题 | ✅ 已修复 |
| 草稿保存后公式显示异常 | SVG embed 转换逻辑需适配新 DOM | ✅ 已修复 |
| CRX 无法安装 | Chrome 不再支持 CRX 安装 | ✅ 文档已更新 |
| 公式字体大小无法调整 | 编辑器 DOM 结构变化 | ⚠️ CSS 规则已添加 |

---

想要在微信公众号的编辑器里输入公式吗？来试试这个 Chrome 插件吧～

相信不少人有在微信公众号上输入数学公式的需求，而微信至今没有推出官方的公式编辑器。有人被迫去选择一些新的工作流程，比如 TeX → PDF → SVG 的制作流程，这对普通用户来说都有一定的门槛。有人妥协，选择用截图来插入公式，或是干脆用文字字符来拼凑公式，而这些都是问题。在这样的情况下，我们选择写一个插件来满足公众号输入公式的需求。

完全开源。

### 特性

- 使用 MathJax 渲染 SVG 格式的 LaTeX 公式
- 嵌入微信公众号原生编辑器
- 公式显示清晰、可调字号、支持字体颜色改变、支持 Dark Mode
- 完整的快捷键支持
- 适配通过 [Markdown Nice](https://mdnice.com) 插入的公式

### 下载与安装

#### 下载

- Github（推荐）：[ZBCccc/mpmath](https://github.com/ZBCccc/mpmath/releases)
- Chrome 应用商店：原版 [mpMath](https://chrome.google.com/webstore/detail/mpmath/nodhgmlcnikgcdfnllmiodlimcdglchh)（可能已过时）

#### 安装步骤

1. 下载最新版本的 ZIP 文件（见 [Releases](https://github.com/ZBCccc/mpmath/releases)）
2. 解压下载的 ZIP 文件
3. 在 Chrome 中点击右上角 ︙ -> 更多工具 -> 扩展程序  
   或打开 [chrome://extensions/](chrome://extensions/)
4. 打开右上角**开发者模式**
5. 点击「加载已解压的扩展程序」
6. 选择解压后的 `mpMath` 文件夹
7. 安装完成

### 使用

打开微信公众平台图文编辑界面，若 `公式` 已经出现在页面顶部 `音频` 的右侧，则说明插件成功运行。

点击 `公式` 即可新建公式并插入。点击已经插入的公式即可二次编辑。

> 如果你不太熟悉 LaTeX 语法，可以参考语雀的[数学公式举例](https://www.yuque.com/yuque/help/brzicb)、Apple 的[示例方程](https://support.apple.com/zh-cn/HT202501#sample)，或是这一份 [MathJax 基本教程和快速参考](https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference)（英文）。

> 如果你正在寻找基于 TeX 编写的数学题，推荐一个网站：[橘子数学](https://www.mathcrowd.cn/)。

> 如果你偏好非所见即所得的写作方式，试试这个：[Markdown Nice](https://mdnice.com)，同样对数学公式有着很好的支持。

强烈推荐使用以下快捷键，提高输入效率。

#### 快捷键

| 操作         | 快捷键 |
| ------------ | ------ |
| 新建公式     | <kbd>control</kbd> + <kbd>/</kbd><br /><kbd>command</kbd> + <kbd>/</kbd> |
| 退出公式编辑 | <kbd>esc</kbd> |
| 插入公式     | <kbd>shift</kbd> + <kbd>enter</kbd> |

#### 可能遇到的问题

- 输入行内公式的显式样式
  - 公式前添加 `\displaystyle`
- 公式右侧的空格会与公式捆绑在一起
  - 可以在空格右侧使用 <kbd>shift</kbd> + <kbd>←</kbd> 选中空格并删除
- 公式不能被高亮选中、拖动
  - 可同时选中公式左右侧的字符进行复制等操作

### 开发计划

- [ ] 公式输入提示
- [ ] 如 Typora 等的无模态弹窗公式输入
- [ ] 一键转换 LaTeX 公式

### 反馈

- [GitHub Issues](https://github.com/ZBCccc/mpmath/issues)
- 原作者联系方式见 [上游项目](https://github.com/latentcat/mpmath)

### 许可

[MIT License](https://opensource.org/licenses/MIT)（继承自上游）

### 维护者

- ZBCccc
- 原作者：[ciaochaos](https://github.com/ciaochaos) / [latentcat](https://github.com/latentcat)
