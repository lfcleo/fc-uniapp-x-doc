# 隐私协议

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| - | √ | √ | √ | √ | - |

uni-app x 与 uni-app 的隐私机制不同：uni-app 框架提供原生弹框，自定义性差；uni-app x **不提供内置弹框**，由开发者用 `dialogPage`（uvue 页面）自定义 UI，通过 `FC.Privacy` 单例触发。

已集成的功能有
* 自定义 uvue 弹窗
* 重复调用防护（`opening` + `hasOpened()` 双重检查）
* 自动选择父页面（无页面时按 50ms 重试，最多 60 次）
* 与 uni.getPrivacySetting / resetPrivacyAuthorization 等隐私 API 协同


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i privacy
```

> 同时会自动安装 `/components/fc-dialog/privacy` 弹窗页面（uvue 文件）。

## 1. 初始化

模块已默认导出 `FC.Privacy` 单例。**无需任何初始化代码**，业务侧只需要在合适的时机调用 `FC.Privacy.open()` 即可。

`/components/fc-dialog/privacy.uvue` 是默认的弹窗页面，包含：

- 应用 logo（`/static/logo.png`）
- "个人信息保护指引"标题
- 协议正文（含《用户服务协议》《隐私政策》链接）
- "不同意"按钮：调 `uni.resetPrivacyAuthorization()` 后 `uni.exit()` 退出
- "同意"按钮：`open-type="agreePrivacyAuthorization"` 自动通知 uni 系统 + `uni.closeDialogPage()` 关闭弹窗
- `onBackPress` 返回 `true` 拦截系统返回键，强制用户做出选择

> **iOS 平台**：根据 `manifest.json` 的 `app.initPrivacyAuthorization` 配置，初始隐私状态默认为 `agree`。如需强制首次启动展示弹窗，需在 `onLaunch` 调用 `uni.getPrivacySetting` 主动判断。

## 2. 触发弹窗

| 平台 | 推荐触发时机 |
| --- | --- |
| App | `App.uvue` 的 `onLaunch` 生命周期（同步触发，确保所有受隐私约束的 SDK 都遵守） |
| 微信小程序 | `App.uvue` 的 `onLaunch`，并配合 `wx.getPrivacySetting` 的 `needAuthorization` 判断 |
| 鸿蒙 | 与 App 相同 |

```ts
// App.uvue
import { Privacy } from '@/fcuni/privacy'

const onLaunch = () => {
    // #ifdef APP || MP-WEIXIN || APP-HARMONY
    Privacy.open()
    // #endif
}
```

`open()` 内部会自动：

1. **重复调用防护**：若已在打开中（`opening=true`）或已有隐私 dialogPage 存在，直接 return。
2. **选择父页面**：取 `getCurrentPages()` 最后一个页面作为 `parentPage`。
3. **页面未就绪时重试**：若 `getCurrentPages()` 为空，按 50ms 间隔重试，最多 60 次（约 3 秒）。超时放弃。
4. **真正打开**：调用 `uni.openDialogPage({ url: '/components/fc-dialog/privacy', disableEscBack: true, parentPage })`。

## 3. 自定义弹窗

如果默认弹窗样式不满足业务需求，可：

1. **方案 A：覆盖组件**

   在自己项目下创建同名 `/components/fc-dialog/privacy.uvue`，easycom 会优先匹配项目内组件。**注意必须保留以下逻辑**：

   - "同意"按钮必须带 `open-type="agreePrivacyAuthorization"`
   - "不同意"按钮必须调 `uni.resetPrivacyAuthorization()` + `uni.exit()`
   - `onUnload` 必须调 `FC.Privacy.markClosed()`（仅 App 平台），解除 opening 标志
   - `onLoad` 必须调 `isDuplicated()` 检查，防止重复打开

2. **方案 B：完全自定义**

   不使用 `FC.Privacy` 单例，直接用 `uni.openDialogPage` + `uni.getPrivacySetting` 自实现。模块只提供 `FC.Privacy.open()` 的便捷封装，业务侧可以绕过。

## 4. 隐私状态查询与监听

uni-app x 提供以下隐私 API（不受本模块限制，可独立使用）：

| API | 作用 | 兼容性 |
| --- | --- | --- |
| `uni.getPrivacySetting` | 获取当前是否需要用户授权隐私协议 | App 4.31+ / 微信 4.41+ |
| `uni.resetPrivacyAuthorization` | 重置隐私协议状态（适用于协议变更需要重新同意） | App 4.31+ |
| `uni.onPrivacyAuthorizationChange` | 监听隐私协议状态变更 | App 4.31+ |
| `uni.offPrivacyAuthorizationChange` | 取消监听 | App 4.31+ |
| `<button open-type="agreePrivacyAuthorization">` | 专用同意按钮（用户真实点击才能同意，避免插件绕过） | App 4.31+ |

```ts
// 监听隐私状态变更
const id = uni.onPrivacyAuthorizationChange((res) => {
    console.log('needAuthorization:', res.needAuthorization)
})

onUnload(() => {
    uni.offPrivacyAuthorizationChange(id)
})
```

## 5. manifest.json 配置

```json
{
    "app": {
        "initPrivacyAuthorization": "auto"
    }
}
```

`initPrivacyAuthorization` 取值：

| 值 | Android / HarmonyOS | iOS |
| --- | --- | --- |
| `auto`（默认） | disagree | agree |
| `disagree` | disagree | disagree |
| `agree` | agree | agree |

**注意**：iOS 默认 `agree` 意味着系统弹框不会主动弹出；如需 iOS 强制展示，需要在 `onLaunch` 主动 `uni.getPrivacySetting` 判断 `needAuthorization` 后再调用 `FC.Privacy.open()`。

## 6. 公开 API

| 方法 / 属性 | 说明 |
| --- | --- |
| `FC.Privacy.open()` | 打开隐私协议弹窗。已打开或正在打开则跳过 |
| `FC.Privacy.markClosed()` | 弹窗关闭时由 `/components/fc-dialog/privacy.uvue` 的 `onUnload` 调用，业务侧通常无需手动调用 |

## 7. 与其他模块的关系

- **FC.Privacy 与 uni.getPrivacySetting 是配合关系**：`FC.Privacy.open()` 只负责打开弹窗 UI，**真正的"用户是否同意"状态由 uni 系统维护**。业务侧需要获取状态时调 `uni.getPrivacySetting`。
- **不建议业务侧手动调用 `uni.resetPrivacyAuthorization`**：除非协议发生变更需要重新让用户确认。重复重置会让用户每次启动都看到弹窗。
- **App 启动时序**：`FC.Privacy.open()` 在 `onLaunch` 中调用，确保在调用任何受隐私约束的 API（如 `uni.getPushClientId`、`uni.request` 携带个人信息等）**之前**完成。