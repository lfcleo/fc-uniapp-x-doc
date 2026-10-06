# 脚手架命令

`fc-uniapp-x` 是 `fc-code` 提供的创建命令。环境、全局安装和第一次跑起来见 [安装使用](/guide/introduce/install)。这里列命令，以及创建时可以勾选的模块。

## 命令一览

```bash
fc-uniapp-x                      # 交互式创建项目
fc-uniapp-x my-app               # 项目名预填 my-app，仍会确认
fc-uniapp-x --force              # 目标目录已存在且非空时覆盖

fc-uniapp-x i                    # 列出可安装模块
fc-uniapp-x i i18n               # 给当前项目安装 i18n
fc-uniapp-x i i18n --force       # 模块文件已存在时覆盖
fc-uniapp-x install i18n         # 与 i 相同

fc-uniapp-x uninstall i18n       # 卸载 i18n
fc-uniapp-x un i18n              # 与 uninstall 相同

fc-uniapp-x source               # 查看当前安装源
fc-uniapp-x source gitee         # 切换到 Gitee
fc-uniapp-x source github        # 切换到 GitHub

fc-uniapp-x --help               # 帮助
fc-uniapp-x --version            # 版本
```

## 创建项目

在要放项目的目录执行：

```bash
fc-uniapp-x
```

会依次询问：

1. 项目名称。只能包含字母、数字、下划线 `_` 和短横线 `-`。不输入时，默认是 `fc-uniapp-x`。也可以先带上名称，例如 `fc-uniapp-x my-app`，名称会预填，仍需要确认。
2. 要安装的模块。`↑` / `↓` 移动，空格选中，`A` 全选，`I` 反选，回车确认。可以多选，也可以一个都不选。

确认后会：

- 按当前安装源 `git clone` 模板（浅克隆，完成后去掉 `.git`）
- 把项目里 `package.json` 的 `name` 改成项目名
- 安装选中的模块

完成后提示：

```text
已创建项目：项目名
接下来可以：
  使用 HBuilderX 运行项目
```

目录已经存在且不是空目录时，加上 `--force` 或 `-f`：

```bash
fc-uniapp-x --force
```

空目录可以直接创建，不需要 `--force`。

## 安装模块

在已有项目的根目录执行：

```bash
fc-uniapp-x i
fc-uniapp-x i i18n
```

安装会拉取该模块的文件，写到当前项目。如果还带了补丁，会同时改已有文件，例如去掉指定行的 `//`。

文件已经存在时：

```bash
fc-uniapp-x i i18n --force
```

`i` 和 `install` 等价。`--force` 和 `-f` 等价。

## 卸载模块

在项目根目录执行：

```bash
fc-uniapp-x uninstall i18n
```

会删掉该模块的文件或目录。如果安装时改过已有文件，卸载时会反向恢复，例如把对应行重新加上 `//`。

`uninstall` 和 `un` 等价。不写模块名时，会列出可用模块：

```bash
fc-uniapp-x uninstall
```

## 切换安装源

默认使用 Gitee。查看或切换：

```bash
fc-uniapp-x source
fc-uniapp-x source github
fc-uniapp-x source gitee
```

选择保存在本机 `~/.fc-cli.json`，只影响之后新建的项目，不会改已经创建好的项目。

| 安装源 | 仓库 |
| --- | --- |
| gitee | https://gitee.com/fc-code-space/fc-uniapp-x.git |
| github | https://github.com/fc-code-space/fc-uniapp-x.git |

## 模块一览

`store`、`router` 随项目自带，不能移除。其余模块创建时按需勾选，也可以之后用 `fc-uniapp-x i <模块名>` 单独安装。

| 模块 | 说明 | 支持平台 | 默认集成 | 可移除 |
| --- | --- | --- | --- | --- |
| `store` | [状态管理](/guide/base/store) | 随项目 | 是 | 否 |
| `router` | [路由](/guide/base/router) | 随项目 | 是 | 否 |
| `tool` | [工具类](/guide/base/util) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `i18n` | [多语言](/guide/base/i18n) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `theme` | [应用主题](/guide/base/theme) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `request` | [网络请求](/guide/base/request) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `upload` | [网络上传](/guide/base/upload) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `download` | [网络下载](/guide/base/download) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `stream` | [流式响应](/guide/base/stream) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `websocket` | [WebSocket](/guide/base/websocket) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `privacy` | [隐私协议](/guide/base/privacy) | iOS、Android、鸿蒙 OS | 否 | 是 |
| `permission` | [系统权限](/guide/base/permission) | iOS、Android、鸿蒙 OS | 否 | 是 |
| `push` | [通知推送](/guide/base/push) | iOS、Android、鸿蒙 OS、Web、微信小程序 | 否 | 是 |
| `update` | [应用更新](/guide/base/update) | iOS、Android、鸿蒙 OS | 否 | 是 |
