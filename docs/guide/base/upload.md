# 文件上传

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

已集成的功能有
* 自定义header
* 泛型解析
* 无感刷新token
* 上传进度回调


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i upload
```

## 1. 配置客户端

在 `modules/network/upload.ts` 用 `new FC.Upload({...})` 创建实例并默认导出。**应保证全局单例**（推荐模块顶层 `new` 一次），每个实例各自持有独立的 token 刷新队列；多实例会导致同一并发上传被多次刷新 token。页面不要直接 new，通过 `services` 调用。

```ts
import { useUserStore } from '@/modules/stores/user'

const DevBaseURL = 'https://unidemo.dcloud.net.cn/'
const ProBaseURL = 'https://unidemo.dcloud.net.cn/'
const baseURL = process.env.NODE_ENV === 'production' ? ProBaseURL : DevBaseURL

export interface ApiResponse<T = any> {
	code : number
	msg : string
	data : T
}

const upload = new FC.Upload({
	baseURL,
	timeout: 60000,
	loadingText: '上传中...',

	// 每次上传（含刷新后的重试）都会重新执行，在这里注入最新 token
	uploadInterceptors: (config : UploadFileOptions) => {
		const userStore = useUserStore()
		config.header = {
			...config.header,
			Authorization: `Bearer ${userStore.token}`,
		}
	},

	// 先于 uploadSuccess。返回 true 时排队刷新，成功后用原始参数重试一次
	shouldRefreshToken: (response : UploadFileSuccess) : boolean => {
		const data = response.data as unknown as ApiResponse<any> | null
		return response.statusCode == 200 && data != null && data.code == 401
	},

	// 成功返回 true，并先把新 token 写入 store。App 端不要 await uni.request
	refreshTokenMethod: () : Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			const userStore = useUserStore()
			uni.request<ApiResponse<{ token : string }>>({
				url: baseURL + 'mock/570d229f6088000/token/refresh',
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${userStore.refreshToken}`,
				},
				success: (response) => {
					const data = response.data
					if (response.statusCode == 200 && data != null && data.code == 200) {
						userStore.token = data.data.token
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
	uploadSuccess: (response : UploadFileSuccess) : boolean => {
		// HTTP 401：token 失效，直接清空登录态并跳登录页（不走刷新流程）
		if (response.statusCode == 401) {
			useUserStore().reset()
			uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
			FC.Router.go('pages/login/index')
			return false
		}
		const data = response.data as unknown as ApiResponse<any> | null
		if (response.statusCode == 200 && data != null && data.code == 200) {
			return true
		}
		uni.showToast({ title: data?.msg ?? '上传失败', icon: 'error' })
		return false
	},

	// upload() 的返回值。response.data 是字符串，按业务结构自行转换
	uploadParser: (data : string) : any => {
		return (data as unknown as ApiResponse<any>).data
	},

	// uni.uploadFile 网络层失败，或同一次 token 刷新失败（只调用一次）
	uploadError: (_error : any) => {
		uni.showToast({ title: '上传失败', icon: 'error' })
	},

	// 本次 upload() 结束时调用，包含 token 刷新和重试
	uploadComplete: () => {},
})

export default upload
```

`url` 以 `http://` 或 `https://` 开头时不拼接 `baseURL`。未配置 `uploadSuccess` 时，HTTP 2xx 视为成功。默认超时 120000ms。

| 配置 | 作用 |
| --- | --- |
| `baseURL` | 相对地址的前缀 |
| `timeout` | 单次上传超时，可被 `UploadFileOptions.timeout` 覆盖 |
| `loadingText` | 第二个参数为 `true` 时的 Loading 文案 |
| `uploadInterceptors` | 发上传前改 `UploadFileOptions`。可直接修改入参，也可返回新对象（返回 `UploadFileOptions` 时优先使用），可返回 Promise |
| `shouldRefreshToken` | 返回 `true` 时进入刷新队列，同一实例并发上传只刷新一次 |
| `refreshTokenMethod` | 刷新成功返回 `true`。必须先写入新 token，重试会再次走拦截器 |
| `uploadSuccess` | 返回 `true` 视为成功，`false` 则 reject；返回 `undefined` 等同未配置（按 HTTP 2xx 判定） |
| `uploadParser` | 从字符串响应中抽出业务数据，作为 `upload()` 的返回值 |
| `uploadError` | 两种时机：`uni.uploadFile` 网络层失败时（reject 值为 `UploadFileFail`）；同一次 `upload()` 内 token 刷新失败时（reject 值为 `Error`） |
| `uploadComplete` | 本次 `upload()` 结束时执行，包含 token 刷新和重试 |

刷新失败���，等待中的上传都会 reject，且不会再走 `uploadSuccess`。不要在 `shouldRefreshToken` 和 `uploadSuccess` 里对同一条件做相反处理：刷新判断在前，命中后不会进入 `uploadSuccess`。

### 与 HTTP 401 的区别

| 触发 | 入口 | 处理 |
| --- | --- | --- |
| `HTTP 200` + `code=401` | `shouldRefreshToken` 命中 | 进刷新队列 → 成功后用新 token 重试 |
| `HTTP 401` | `uploadSuccess` 命中 | 清空登录态 + 跳登录页 + reject（**不进刷新**，因为 refreshToken 通常也已失效） |

## 2. 封装接口

URL 和方法写在 `services/upload.ts`，页面只传业务参数：

```ts
import upload from '@/modules/network/upload'

export type UploadFileResponseType = {
	success : boolean
	url : string
	file : string
	name : string
}

export function uploadFileApi(
	filePath : string,
	extra ?: boolean | FCUploadOptions,
	onProgressUpdate ?: (progress : OnProgressUpdateResult) => void,
) : Promise<UploadFileResponseType> {
	return upload.upload<UploadFileResponseType>({
		url: 'upload',
		method: 'POST',
		name: 'file',
		filePath,
		header: {
			'Content-Type': 'multipart/form-data',
		},
	}, extra, onProgressUpdate)
}
```

`name` 是表单字段名，`filePath` 是本地文件路径。

第二个参数：

- 不传 / `false`：不显示 Loading
- `true`：使用配置里的 `loadingText`
- 对象：可覆盖文案，并拿到 `UploadTask`

第三个参数是上传进度回调：

```ts
upload.upload<UploadFileResponseType>({
	url: 'upload',
	method: 'POST',
	name: 'file',
	filePath,
}, {
	showLoading: true,
	loadingText: '上传中...',
	onTask: (task : UploadTask) => {
		// task.abort()
	},
}, (progress : OnProgressUpdateResult) => {
	console.log(progress.progress, progress.totalBytesSent, progress.totalBytesExpectedToSend)
})
```

并发上传共用一个 Loading 计数，全部结束后才 `hideLoading`。token 刷新和重试期间 Loading 保持，直到本次 `upload()` 结束。

## 3. 页面调用

```ts
import { uploadFileApi } from '@/services/upload'

let uploadTask : UploadTask | null = null

const start = async (filePath : string) => {
	const result = await uploadFileApi(filePath, {
		showLoading: true,
		loadingText: '上传中...',
		onTask: (task : UploadTask) => {
			uploadTask = task
		},
	}, (progress : OnProgressUpdateResult) => {
		console.log(progress.progress)
	})
	console.log(result.url)
}

const cancel = () => {
	uploadTask?.abort()
}
```

`upload<T>()` resolve 的是 `uploadParser` 的返回值，不是完整 `UploadFileSuccess`。