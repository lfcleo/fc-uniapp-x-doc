# 文件下载

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

已集成的功能有
* 自定义header
* 无感刷新token
* 下载进度回调


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i download
```

## 1. 配置客户端

在 `modules/network/download.ts` 用 `new FC.Download({...})` 创建实例并默认导出。**应保证全局单例**（推荐模块顶层 `new` 一次），每个实例各自持有独立的 token 刷新队列；多实例会导致同一并发下载被多次刷新 token。页面不要直接 new，通过 `services` 调用。

```ts
import { useUserStore } from '@/modules/stores/user'

const DevBaseURL = 'https://web-assets.dcloud.net.cn/'
const ProBaseURL = 'https://web-assets.dcloud.net.cn/'
const baseURL = process.env.NODE_ENV === 'production' ? ProBaseURL : DevBaseURL

const download = new FC.Download({
	baseURL,
	timeout: 60000,
	loadingText: '下载中...',

	// 每次下载（含刷新后的重试）都会重新执行，在这里注入最新 token
	downloadInterceptors: (config : DownloadFileOptions) => {
		const userStore = useUserStore()
		config.header = {
			...config.header,
			Authorization: `Bearer ${userStore.token}`,
		}
	},

	// 先于 downloadSuccess。下载场景响应体是文件流，没有业务码空间，
	// 所以用 HTTP 401 表达 token 过期（与 Request/Upload 不同）
	shouldRefreshToken: (response : DownloadFileSuccess) : boolean => {
		return response.statusCode == 401
	},

	// 成功返回 true，并先把新 token 写入 store。App 端不要 await uni.request
	refreshTokenMethod: () : Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			const userStore = useUserStore()
			uni.request({
				url: baseURL + 'mock/570d229f6088000/token/refresh',
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${userStore.refreshToken}`,
				},
				success: (response) => {
					const data = response.data as UTSJSONObject | null
					if (response.statusCode == 200 && data != null && data['code'] == 200) {
						const payload = data['data'] as UTSJSONObject
						userStore.token = payload['token'] as string
						resolve(true)
						return
					}
					resolve(false)
				},
				fail: () => resolve(false),
			})
		})
	},

	// 未进入刷新时才会走到这里。返回 true 才 resolve，false 则 reject 整个 response
	downloadSuccess: (response : DownloadFileSuccess) : boolean => {
		// HTTP 401 不会走到这里（shouldRefreshToken 先于本回调判断，命中后会进入刷新队列）
		if (response.statusCode >= 200 && response.statusCode < 300) {
			return true
		}
		uni.showToast({ title: '下载失败', icon: 'error' })
		return false
	},

	// uni.downloadFile 网络层失败，或同一次 token 刷新失败（只调用一次）
	downloadError: (_error : any) => {
		uni.showToast({ title: '下载失败', icon: 'error' })
	},

	// 本次 download() 结束时调用，包含 token 刷新和重试
	downloadComplete: () => {},
})

export default download
```

`url` 以 `http://` 或 `https://` 开头时不拼接 `baseURL`。未配置 `downloadSuccess` 时，HTTP 2xx 视为成功。默认超时 120000ms。

未配置 `downloadParser` 时，`download()` 返回完整 `DownloadFileSuccess`，本地路径在 `tempFilePath`。

| 配置 | 作用 |
| --- | --- |
| `baseURL` | 相对地址的前缀 |
| `timeout` | 单次下载超时，可被 `DownloadFileOptions.timeout` 覆盖 |
| `loadingText` | 第二个参数为 `true` 时的 Loading 文案 |
| `downloadInterceptors` | 发下载前改 `DownloadFileOptions`。可直接修改入参，也可返回新对象（返回 `DownloadFileOptions` 时优先使用），可返回 Promise |
| `shouldRefreshToken` | 返回 `true` 时进入刷新队列，同一实例并发下载只刷新一次 |
| `refreshTokenMethod` | 刷新成功返回 `true`。必须先写入新 token，重试会再次走拦截器 |
| `downloadSuccess` | 返回 `true` 视为成功，`false` 则 reject；返回 `undefined` 等同未配置（按 HTTP 2xx 判定） |
| `downloadParser` | 未配置时直接返回完整 `DownloadFileSuccess` |
| `downloadError` | 两种时机：`uni.downloadFile` 网络层失败时（reject 值为 `DownloadFileFail`）；同一次 `download()` 内 token 刷新失败时（reject 值为 `Error`） |
| `downloadComplete` | 本次 `download()` 结束时执行，包含 token 刷新和重试 |

刷新失败时，等待中的下载都会 reject，且不会再走 `downloadSuccess`。

### 与 Request/Upload 的 token 协议差异

| 客户端 | token 过期信号 | 处理 |
| --- | --- | --- |
| Request / Upload | `HTTP 200` + `code=401` | 刷新后重试 |
| Download | `HTTP 401` | 刷新后重试（响应体是文件流，没有业务码空间） |

如果服务端约定 `HTTP 401` 表示"refreshToken 也失效"，请在 `downloadError` 或业务侧 `catch` 中处理跳转登录页。

## 2. 封装接口

URL 和方法写在 `services/download.ts`，页面只传业务参数：

```ts
import download from '@/modules/network/download'

export function downloadFileApi(
	extra ?: boolean | FCDownloadOptions,
	onProgressUpdate ?: (progress : OnProgressDownloadResult) => void,
) : Promise<DownloadFileSuccess> {
	return download.download<DownloadFileSuccess>({
		url: 'hello-uni-app-x/uni-app.png',
		method: 'GET',
	}, extra, onProgressUpdate)
}
```

第二个参数：

- 不传 / `false`：不显示 Loading
- `true`：使用配置里的 `loadingText`
- 对象：可覆盖文案，并拿到 `DownloadTask`

第三个参数是下载进度回调：

```ts
download.download<DownloadFileSuccess>({
	url: 'hello-uni-app-x/uni-app.png',
	method: 'GET',
}, {
	showLoading: true,
	loadingText: '下载中...',
	onTask: (task : DownloadTask) => {
		// task.abort()
	},
}, (progress : OnProgressDownloadResult) => {
	console.log(progress.progress, progress.totalBytesWritten, progress.totalBytesExpectedToWrite)
})
```

并发下载共用一个 Loading 计数，全部结束后才 `hideLoading`。token 刷新和重试期间 Loading 保持，直到本次 `download()` 结束。

## 3. 页面调用

```ts
import { downloadFileApi } from '@/services/download'

let downloadTask : DownloadTask | null = null

const start = async () => {
	const response = await downloadFileApi({
		showLoading: true,
		loadingText: '下载中...',
		onTask: (task : DownloadTask) => {
			downloadTask = task
		},
	}, (progress : OnProgressDownloadResult) => {
		console.log(progress.progress)
	})
	console.log(response.tempFilePath)
}

const cancel = () => {
	downloadTask?.abort()
}
```

`download<T>()` 未配置 `downloadParser` 时 resolve 的是完整 `DownloadFileSuccess`。