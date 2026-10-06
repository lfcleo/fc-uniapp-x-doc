# 应用更新

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| - | √ | √ | √ | - | - |

只支持 **uni-app x 蒸汽模式** 的 App。非蒸汽模式调用会直接报错。

| 平台 | 热更新（wgt） | 整包 | 说明 |
| --- | --- | --- | --- |
| Android | √ | √ | 整包安装 apk。非强制更新可在通知栏看下载进度 |
| iOS | √ | √ | 整包跳转 App Store |
| 鸿蒙 | - | √ | 不支持 wgt，整包跳转华为应用市场 |

## 安装

终端在项目根目录下执行<span class="marker-evy">（创建项目时已选择该模块可跳过）</span>

```bash
fc-uniapp-x i update
```

装好后即可使用，不用再手动初始化。

## 1. 配置检查地址

打开 `modules/update/index.ts`，填自己的检查接口：

```ts
import type { FCTypeUpdateConfig } from '@/fcuni/types'

export const updateConfig : FCTypeUpdateConfig = {
	checkURL: 'https://your-server.com/api/check-update',
	headers: { 'Authorization': 'Bearer xxx' },
	method: 'GET'
}
```

`method` 默认 `GET`。改成 `POST` 时，下面这些参数会放进 body，否则放在 query 上：

| 参数 | 说明 |
| --- | --- |
| `appId` | 应用 appid |
| `appVersion` | 当前应用版本（manifest 的 versionName） |
| `appWgtVersion` | 已安装的 wgt 版本；没装过则与 `appVersion` 相同 |

有没有更新由服务端判断。无更新时接口体返回 `null`（或经下面的解析后得到 `null`）。

后端包了一层 `{ code, data }` 时，在同一份配置里加上：

```ts
responseSuccess: (response) => {
	const body = response.data as { code?: number } | null
	return response.statusCode == 200 && (body?.code == null || body.code == 0)
},
responseParser: (raw) => {
	const body = raw as { data?: any }
	return body?.data ?? null
}
```

`responseSuccess` 返回 `false` 表示检查失败。`responseParser` 返回 `null` 表示已是最新；返回了 `version` 但没有 `url` 也会当成失败。

## 2. 服务端返回

有更新时返回：

```json
{
  "version": "1.2.3",
  "url": "https://cdn.example.com/app.wgt",
  "type": "wgt",
  "title": "v1.2.3 上线啦",
  "contents": "更新说明，用 \\n 或 | 分行",
  "isMandatory": false,
  "isSilent": false,
  "sha256": "abc123...",
  "size": "30 MB"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `version` | 是 | 这次要更新到的版本号 |
| `url` | 是 | 下载地址，或商店跳转地址。不能为空 |
| `type` | 是 | `wgt` 热更新，`native_app` 整包 |
| `isMandatory` | 否 | `true` 时不能关弹窗，也不能稍后再说 |
| `isSilent` | 否 | `true` 时下载完自动安装并重启 |
| `title` | 否 | 弹窗标题，默认「更新日志」 |
| `contents` | 否 | 更新说明 |
| `sha256` | wgt 必填 | 安装前校验，不一致会拒绝安装 |
| `size` | 否 | 展示用，例如 `30 MB` |

`url` 以 `.wgt` 结尾走热更新；Android 上以 `.apk` 结尾走安装包。iOS、鸿蒙整包把 `url` 设成商店地址（如 `itms-apps://`、华为应用市场链接），弹窗里点按钮会跳过去。

字段用驼峰或下划线都可以，例如 `isMandatory` 和 `is_mandatory`。

## 3. 在页面里调用

在需要提示更新的地方调用，例如设置页，或启动后的首页：

```ts
FC.Update.checkAndShow().catch((err) => {
	uni.showModal({ title: '更新失败', content: `${err}`, showCancel: false })
})
```

只检查、先不弹窗：

```ts
FC.Update.check().then((event) => {
	if (event.hasUpdate) {
		FC.Update.showDialog()
	}
}).catch((err) => {
	uni.showModal({ title: '检查更新失败', content: `${err}`, showCancel: false })
})
```

没有更新不会进 `catch`，`hasUpdate` 为 `false`。`catch` 只表示检查失败，例如网络错误或返回内容不对。

调试页：`pages/base/update.uvue`。

## 4. 改弹窗

文案和样式改 `components/fc-dialog/update.uvue`。

- 文案在文件里的 `DEFAULT_TEXTS`，或用 `FC.i18n.t()`
- 这个页面已经写进 `pages.json`，不要删、不要改路径
- `isMandatory` 为 `true` 时，点蒙层和「稍后再说」都关不掉



**wgt 热更新需要自定义基座或云端打包。标准基座只能看 Android 整包安装。**
