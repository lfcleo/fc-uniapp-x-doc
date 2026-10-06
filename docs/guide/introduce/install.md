# 安装使用

用 `fc-code` 脚手架创建 **uni-app x 蒸汽模式** 项目。创建时按需勾选模块，用多少引多少。项目自带 Skill 与 Rule，用 HBuilderX 或 Cursor 打开后，AI 也能按框架约定往下写。

## 环境

创建前请先装好：

- `Node.js >= 20`（作者版本 v24.16.0）
- `npm >= 9`（作者版本 v11.13.0）
- `HBuilderX >= 5.25`（作者版本 v5.27，仅 Windows、macOS）
- `git`（作者版本 v2.39.3）

## 创建项目

全局安装脚手架，只需执行一次：

```bash
npm i -g fc-code
```

::: tip 提示
之后创建新项目不用重复安装。

macOS 如果提示权限不足，再在命令前加 `sudo`。更新脚手架同样处理：`npm update -g fc-code`。
:::

在目标目录执行：

```bash
fc-uniapp-x
```

按提示填写项目名称，勾选需要的模块。创建完成后，用 HBuilderX 打开项目。

创建细节、可勾选模块、安装和卸载、切换安装源，见 [脚手架命令](/guide/introduce/cli)。

## 运行

运行前建议重新获取 AppID：`manifest.json` → `基础配置` → `uni-app应用标识(AppID)` → `重新获取`。避免后面部分功能报错。

用 HBuilderX 运行到目标平台即可。使用部分模块时，需要打自定义基座。

## Demo

完整示例见 [uni-app 插件市场](https://ext.dcloud.net.cn/plugin?id=26616)。
