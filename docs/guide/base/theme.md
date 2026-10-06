# 应用主题

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

## 安装
终端在项目根目录下执行命令安装模块<sapn class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</sapn>

```bash
fc-uniapp-x i theme
```

主题颜色由根目录 `theme.json` 统一维护。`FC.Theme.setTheme()` 负责切换、持久化，并同步导航栏和 tabBar.

## 1. 配置主题颜色（theme.json）

根目录下的 `theme.json` 文件中 `light` 和 `dark` 必须使用完全相同的字段：

```json
{
  "light": {
    "navigationBarTextStyle": "black",
    "backgroundTextStyle": "dark",
    "tabBarBorderStyle": "black",
    "androidThreeButtonNavigationBackgroundColor": "#f5f7fa",
    "page": "#f5f7fa",
    "surface": "#ffffff",
    "content": "#333333",
    "muted": "#64748b",
    "border": "#e2e8f0",
    "primary": "#2563eb"
  },
  "dark": {
    "navigationBarTextStyle": "white",
    "backgroundTextStyle": "light",
    "tabBarBorderStyle": "white",
    "androidThreeButtonNavigationBackgroundColor": "#0f172a",
    "page": "#0f172a",
    "surface": "#111827",
    "content": "#f8fafc",
    "muted": "#94a3b8",
    "border": "#334155",
    "primary": "#60a5fa"
  }
}
```

系统字段只给 `pages.json` 用 `@字段名` 引用，不会生成 class：

| 字段 | 取值 | 用途 |
| --- | --- | --- |
| `navigationBarTextStyle` | `black` / `white` | 导航栏标题颜色 |
| `backgroundTextStyle` | `dark` / `light` | 下拉 loading 样式 |
| `tabBarBorderStyle` | `black` / `white` | tabBar 上边框颜色 |
| `androidThreeButtonNavigationBackgroundColor` | 颜色值 | Android 三键导航区域背景色，仅 App-Android |

其余颜色字段会生成 UnoCSS 主题类，并可供 `pages.json` 引用：

| 字段 | pages.json | class |
| --- | --- | --- |
| `page` | `backgroundColor` | `fc-bg-page` |
| `surface` | `navigationBarBackgroundColor`、`tabBar.backgroundColor` | `fc-bg-surface` |
| `content` | - | `fc-text-content` |
| `muted` | `tabBar.color` | `fc-text-muted` |
| `border` | - | `fc-b-border` |
| `primary` | `tabBar.selectedColor` | `fc-bg-primary`、`fc-text-primary` |

例如 `page`、`content`、`border`：

```vue
<view class="fc-bg-page">
  <text class="fc-text-content">正文</text>
  <view class="fc-b-border"></view>
</view>
```

常用前缀：`fc-bg-`、`fc-text-`、`fc-c-`、`fc-color-`、`fc-b-`、`fc-border-`、`fc-fill-`、`fc-stroke-`。

新增业务颜色时，在 `light` 和 `dark` 中同时加上同名 字段，例如 `danger`，页面里使用 `fc-text-danger`。开发服务会监听 `theme.json`，未立即生效时重新运行项目。

::: tip 提示
使用主题字段，其实就是在unocss类前面加上 `fc-` 。
:::

## 2. 配置 pages.json

导航栏、页面背景和 tabBar 用 `@字段名` 引用 `theme.json`，才能随主题自动切换：

```json
{
  "globalStyle": {
    "navigationBarTextStyle": "@navigationBarTextStyle",
    "navigationBarBackgroundColor": "@surface",
    "backgroundColor": "@page",
    "backgroundTextStyle": "@backgroundTextStyle",
    // #ifdef APP-ANDROID
    "androidThreeButtonNavigationBackgroundColor": "@androidThreeButtonNavigationBackgroundColor"
    // #endif
  },
  "tabBar": {
    "color": "@muted",
    "selectedColor": "@primary",
    "backgroundColor": "@surface",
    "borderStyle": "@tabBarBorderStyle"
  }
}
```

`@字段名` 只能写在 `pages.json`。页面样式使用 `fc-bg-*`、`fc-text-*` 等主题类，不要在页面里写死颜色。

## 3. 开启平台主题（manifest.json）

```json
{
  "app": {
    "defaultAppTheme": "auto"
  },
  "mp-weixin": {
    "darkmode": true
  },
  "web": {
    "darkmode": true
  }
}
```

- App 的 `defaultAppTheme` 支持 `auto`、`light`、`dark`。
- Web 和微信小程序开启 `darkmode` 后，`pages.json` 的 `@字段名` 跟随宿主主题，不能单独改宿主原生 UI。
- 修改 `manifest.json` 后需要重新编译运行。

## 4. 切换主题

`FC.Theme.setTheme()` 接受 `auto`、`light`、`dark`：

| 值 | 说明 |
| --- | --- |
| `auto` | 跟随系统或宿主主题 |
| `light` | 强制明亮 |
| `dark` | 强制暗黑 |

```vue
<template>
  <view class="page fc-bg-page">
    <text class="fc-text-content">当前设置：{{ fcSystemStore.theme }}</text>
    <button @click="setTheme('auto')">跟随系统</button>
    <button @click="setTheme('light')">明亮</button>
    <button @click="setTheme('dark')">暗黑</button>
  </view>
</template>

<script setup lang="uts">
import type { FCTypeThemeSetting } from '@/fcuni/types'

const fcSystemStore = FC.useFcSystemStore()

const setTheme = (value : FCTypeThemeSetting) => {
  FC.Theme.setTheme(value)
}
</script>
```

## 5. 读取当前主题

```ts
const fcSystemStore = FC.useFcSystemStore()

// 用户选择：auto、light、dark
console.log(fcSystemStore.theme)

// 实际生效：light 或 dark（auto 会解析成具体模式）
console.log(FC.Theme.state.mode)
```

模板里按实际模式切换内容时用 `FC.Theme.state.mode`：

```vue
<text>{{ FC.Theme.state.mode == 'dark' ? '暗黑模式' : '明亮模式' }}</text>
```

## 6. 列表复用

`list-view`、`waterflow` 会复用节点。从其他页切主题再返回时，单元格可能还是旧颜色。给列表绑定主题 `key`，主题变化时重建：

```vue
<list-view class="flex-1" show-scrollbar="false" :key="'list-' + FC.Theme.state.mode">
  <list-item v-for="item in featureList" :key="item.title">
  </list-item>
</list-view>
```

## 7. 平台差异

- App 支持 `auto`、`light`、`dark`。`uni.setAppTheme()` 会同时更新 pages.json 里的导航栏和 tabBar。
- Web、微信小程序没有 `appTheme`。开启 `darkmode` 后 `@字段名` 跟随 `hostTheme` / `prefers-color-scheme`。
- `setTheme('light')` / `setTheme('dark')` 会保存设置并更新 FC 页面样式。导航栏走 `uni.setNavigationBarColor()`；tabBar 由 fcuni 处理（App / 微信小程序在 tabBar 页调用 `uni.setTabBarStyle()`，Web 额外写 DOM）。
- `auto` 时，App 监听应用主题，Web 和微信小程序监听宿主主题，页面会自动更新。
