# mpMath — 微信公众号公式编辑插件（修复 & 增强版）

> [!NOTE]
> 本项目 fork 自 [latentcat/mpmath](https://github.com/latentcat/mpmath)。
> 原项目于 2024 年中停止维护，本 fork 在修复原版全部已知问题的基础上，新增了 Markdown 公式自动转换等功能。

---

想要在微信公众号的编辑器里输入公式吗？来试试这个 Chrome 插件吧～

相信不少人有在微信公众号上输入数学公式的需求，而微信至今没有推出官方的公式编辑器。有人被迫去选择一些新的工作流程，比如 TeX → PDF → SVG 的制作流程，这对普通用户来说都有一定的门槛。有人妥协，选择用截图来插入公式，或是干脆用文字字符来拼凑公式，而这些都是问题。在这样的情况下，我们选择写一个插件来满足公众号输入公式的需求。

完全开源。

## 与原版的区别

### Bug 修复

原版（latentcat/mpmath v0.2.1）存在以下问题，本 fork 均已修复：

| 问题 | 原因 | 状态 |
|------|------|------|
| 无法插入新公式 | 微信编辑器 API 变更（`UE.getEditor` 失效） | ✅ 已修复 |
| manifest.json 语法错误 | `background.service_worker` 字段名错误 | ✅ 已修复 |
| MathJax 初始化报错 | 异步加载时序问题 | ✅ 已修复 |
| 草稿保存后公式显示异常 | SVG embed 转换逻辑需适配新 DOM | ✅ 已修复 |
| CRX 无法安装 | Chrome 不再支持 CRX 安装 | ✅ 文档已更新 |
| 公式字体大小无法调整 | 编辑器 DOM 结构变化 | ✅ CSS 规则已添加 |
| 脚本重复注入 | 注入脚本加载后自删，防重复检查失效 | ✅ 已修复 |
| 插入/取消按钮有时点击无效 | `focusout` 事件强制抢回焦点 | ✅ 已修复 |
| 快速操作可能重复插入公式 | 异步操作缺少并发锁 | ✅ 已修复 |
| 非法 LaTeX 仍可插入 | MathJax 渲染错误未被检测 | ✅ 已修复 |
| 修复SVG 功能在新版编辑器报错 | 未区分新旧编辑器 | ✅ 已修复 |
| DOM 变动时回调过于频繁 | MutationObserver 未做防抖 | ✅ 已修复 |
| 快速输入时重复触发渲染 | 输入事件未做防抖 | ✅ 已修复 |

### 新功能

#### Markdown 公式自动转换

粘贴含有 LaTeX 公式的 Markdown 文本时，插件会**自动识别并渲染其中的公式**，无需逐条手动插入。

- 行内公式：`$...$` → 渲染为行内 SVG 公式
- 行间公式：`$$...$$` → 渲染为居中块级 SVG 公式
- 公式渲染失败时自动降级，原样保留 LaTeX 文本，不影响其他公式

示例——将以下内容直接粘贴进微信编辑器：

```
质能方程 $E = mc^2$ 是物理学最著名的公式之一。

薛定谔方程：

$$i\hbar\frac{\partial}{\partial t}\Psi = \hat{H}\Psi$$

二次方程的根为 $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$。
```

粘贴后文字保留，所有公式自动渲染插入。

---

## 特性

- 使用 MathJax 渲染 SVG 格式的 LaTeX 公式
- 嵌入微信公众号原生编辑器
- 公式显示清晰、可调字号、支持字体颜色改变、支持 Dark Mode
- 完整的快捷键支持
- 粘贴 Markdown 时自动转换 `$...$` / `$$...$$` 公式
- 适配通过 [Markdown Nice](https://mdnice.com) 插入的公式

## 下载与安装

#### 下载

- Github（推荐）：[ZBCccc/mpmath](https://github.com/ZBCccc/mpmath/releases)
- Chrome 应用商店：原版 [mpMath](https://chrome.google.com/webstore/detail/mpmath/nodhgmlcnikgcdfnllmiodlimcdglchh)（已过时，不推荐）

#### 安装步骤

1. 下载最新版本的 ZIP 文件（见 [Releases](https://github.com/ZBCccc/mpmath/releases)）
2. 解压下载的 ZIP 文件
3. 在 Chrome 中点击右上角 ︙ -> 更多工具 -> 扩展程序  
   或打开 [chrome://extensions/](chrome://extensions/)
4. 打开右上角**开发者模式**
5. 点击「加载已解压的扩展程序」
6. 选择解压后的 `mpMath` 文件夹
7. 安装完成

## 使用

打开微信公众平台图文编辑界面，若 `公式` 已经出现在页面顶部 `音频` 的右侧，则说明插件成功运行。

点击 `公式` 即可新建公式并插入。点击已经插入的公式即可二次编辑。

> 如果你不太熟悉 LaTeX 语法，可以参考语雀的[数学公式举例](https://www.yuque.com/yuque/help/brzicb)、Apple 的[示例方程](https://support.apple.com/zh-cn/HT202501#sample)，或是这一份 [MathJax 基本教程和快速参考](https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference)（英文）。

> 如果你正在寻找基于 TeX 编写的数学题，推荐一个网站：[橘子数学](https://www.mathcrowd.cn/)。

> 如果你偏好非所见即所得的写作方式，试试这个：[Markdown Nice](https://mdnice.com)，同样对数学公式有着很好的支持。

强烈推荐使用以下快捷键，提高输入效率。

### 快捷键

| 操作         | 快捷键 |
| ------------ | ------ |
| 新建公式     | <kbd>control</kbd> + <kbd>/</kbd><br /><kbd>command</kbd> + <kbd>/</kbd> |
| 退出公式编辑 | <kbd>esc</kbd> |
| 插入公式     | <kbd>shift</kbd> + <kbd>enter</kbd> |

### 可能遇到的问题

#### 微信提示「浏览器插件存在安全隐患」

打开图文编辑页面时，可能弹出如下提示：

> 当前使用的浏览器插件存在安全隐患，可能影响编辑器功能的正常使用，请禁用插件并联系插件开发者处理。

**这是正常现象，点击「我知道了」忽略即可，不影响插件正常使用。**

出现该弹窗的原因：mpMath 为了将公式插入编辑器，需要向微信页面注入脚本并调用编辑器内部 API（`window.__MP_Editor_JSAPI__`）。微信的安全检测机制会识别到有第三方插件修改了页面 DOM，因此触发此警告。这一行为是所有同类编辑器增强插件的通用原理，并非真实的安全风险。mpMath 完全开源，不收集任何用户数据，代码可在 [GitHub](https://github.com/ZBCccc/mpmath) 上自行审查。

#### 其他问题

- 输入行内公式的显式样式
  - 公式前添加 `\displaystyle`
- 公式右侧的空格会与公式捆绑在一起
  - 可以在空格右侧使用 <kbd>shift</kbd> + <kbd>←</kbd> 选中空格并删除
- 公式不能被高亮选中、拖动
  - 可同时选中公式左右侧的字符进行复制等操作

## 开发计划

- [x] 修复原版与当前微信编辑器的兼容性问题
- [x] Markdown 粘贴自动转换 LaTeX 公式
- [ ] 公式输入提示
- [ ] 如 Typora 等的无模态弹窗公式输入
- [ ] 一键转换 LaTeX 公式

## 反馈

- [GitHub Issues](https://github.com/ZBCccc/mpmath/issues)
- 原作者联系方式见 [上游项目](https://github.com/latentcat/mpmath)

## 许可

[MIT License](https://opensource.org/licenses/MIT)（继承自上游）

## 维护者

- ZBCccc（本 fork 维护者）
- 原作者：[ciaochaos](https://github.com/ciaochaos) / [latentcat](https://github.com/latentcat)
