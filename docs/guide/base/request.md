# 网络请求

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

已集成的功能有
* 自定义header
* 泛型解析
* 无感刷新token


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i request
```

## 1. 配置客户端

在 `modules/network/request.ts` 用 `new FC.Request({...})` 创建实例并默认导出。**应保证全局单例**（推荐模块顶层 `new` 一次），每个实例各自持有独立的 token 刷新队列；多实例会导致同一并发请求被多次刷新 token。页面不要直接 new，通过 `services` 调用。

最简配置示例

```ts
const DevBaseURL = ''		// 开发环境baseurl
const ProBaseURL = ''		// 生产环境baseurl
const baseURL = process.env.NODE_ENV === 'production' ? ProBaseURL : DevBaseURL		// 根据项目运行环境选择baseurl

/**
 * HTTP 客户端实例。
 */
const request = new FC.Request({
	baseURL,
	timeout: 10000,
	loadingText: '加载中...',

	// 请求拦截：自动注入 token
	requestInterceptors: (config : RequestOptions<any>) => {

	},

	// 响应成功拦截
	responseSuccess: (response : RequestSuccess<any>) : boolean => {
		return true
	},

	// 请求失败：网络层异常
	responseError: (error : RequestFail) => {
		console.error(error)
		uni.showToast({
			title: '网络请求错误',
			icon: 'error',
		})
	},

	// 数据解析：抽出 data 字段
	responseParser: (data : any) : any => {
		return data
	},
})

export default request
```

`url` 以 `http://` 或 `https://` 开头时不拼接 `baseURL`。未配置 `responseSuccess` 时，HTTP 2xx 视为成功。默认超时 120000ms。

| 配置 | 作用 |
| --- | --- |
| `baseURL` | 相对地址的前缀 |
| `timeout` | 单次请求超时，可被 `RequestOptions.timeout` 覆盖 |
| `loadingText` | 第二个参数为 `true` 时的 Loading 文案 |
| `requestInterceptors` | 发请求前改 `RequestOptions`。可直接修改入参，也可返回新对象（返回 `RequestOptions` 时优先使用），可返回 Promise |
| `shouldRefreshToken` | 返回 `true` 时进入刷新队列，同一实例并发请求只刷新一次 |
| `refreshTokenMethod` | 刷新成功返回 `true`。必须先写入新 token，重试会再次走拦截器 |
| `responseSuccess` | 返回 `true` 视为成功，`false` 则 reject；返回 `undefined` 等同未配置（按 HTTP 2xx 判定） |
| `responseParser` | 抽出业务数据，作为 `request()` 的返回值 |
| `responseError` | 两种时机：`uni.request` 网络层失败时（reject 值为 `RequestFail`）；同一次 `request()` 内 token 刷新失败时（reject 值为 `Error`） |
| `responseComplete` | 本次 `request()` 结束时执行，包含 token 刷新和重试 |

刷新失败时，等待中的请求都会 reject，且不会再走 `responseSuccess`。不要在 `shouldRefreshToken` 和 `responseSuccess` 里对同一条件做相反处理：刷新判断在前，命中后不会进入 `responseSuccess`。

## 2. 封装接口

例如封装的接口方法写在 `services/api.ts`，页面只传业务参数：

```ts
import request from '@/modules/network/request'

export function getApi() : Promise<string> {
	return request.request<string>({
		url: 'mock/570d229f6088000/get',
		method: 'GET',
	}, true)
}

export function postApiWithData(data : object) : Promise<string> {
	return request.request<string>({
		url: 'mock/570d229f6088000/post',
		method: 'POST',
		data,
	}, true)
}
```

第二个参数：

- 不传 / `false`：不显示 Loading
- `true`：使用配置里的 `loadingText`
- 对象：可覆盖文案，并拿到 `RequestTask`

```ts
request.request<string>({
	url: 'mock/570d229f6088000/get',
	method: 'GET',
}, {
	showLoading: true,
	loadingText: '提交中...',
	onTask: (task : RequestTask) => {
		// task.abort()
	},
})
```

并发请求共用一个 Loading 计数，全部结束后才 `hideLoading`。token 刷新和重试期间 Loading 保持，直到本次 `request()` 结束。

## 3. 页面调用

```ts
import { getApi, postApiWithData } from '@/services/api'

const load = async () => {
	try {
		const text = await getApi()
		const result = await postApiWithData({ id: 1 })
		console.log(text, result)
	} catch (error) {
		console.error(error)
	}
}
```

`request<T>()` resolve 的是 `responseParser` 的返回值，不是完整 `RequestSuccess`。

## 4. 完整配置示例

例如项目有以下要求：

1. 项目要求每个请求的header都必须携带 `Authorization` 校验token。

2. http响应 code = 200 代表数据响应成功。 code = 401 代表token无效。需要清除用户信息和token等本地存储数据，并跳转登录页面让用户重新登录。

3. http响应 code = 200 的情况下，服务器返回数据格式如下

```json
{
	"code": 200,
    "msg": "success",
    "data": 返回的数据结果，类型不固定（泛型）
}
```

其中自定义 code = 200 代表请求有效，返回正常数据。自定义 code = 401 代表token过期，需要使用refreshToken请求刷新token接口重新获取token。其它值则提示网络请求错误。

注意这里的自定义code和上面的http响应code 的区别哦。

配置示例如下：

```js
import { useUserStore } from '@/modules/stores/user'	// 本地存储的全局变量，保存的是用户信息和token

const DevBaseURL = 'https://aaa.xxxx.com/'		// 开发环境baseurl
const ProBaseURL = 'https://bbb.xxxx.com/'		// 生产环境baseurl
const baseURL = process.env.NODE_ENV === 'production' ? ProBaseURL : DevBaseURL		// 根据项目运行环境选择baseurl

// 刷新token 接口地址
const refreshURL = baseURL + 'api/token/refresh'

/**
 * 业务统一响应结构。
 * data 字段由 responseParser 抽出，request 方法直接返回 data。
 */
export interface ApiResponse<T = any> {
	code : number
	msg : string
	data : T
}

/**
 * Token 刷新接口返回结构。
 * 实际字段以后端为准。
 */
interface TokenPayload {
	token : string
}

/**
 * HTTP 客户端实例。
 */
const request = new FC.Request({
	baseURL,
	timeout: 10000,
	loadingText: '加载中...',

	// 请求拦截：自动注入 token
	requestInterceptors: (config : RequestOptions<any>) => {
		// 从本地存储的全局变量，设置请求头，验证token
		const userStore = useUserStore()
		config.header = {
			...config.header,
			Authorization: `Bearer ${userStore.token}`,
		}
	},

	// 响应成功拦截：业务码 200 视为成功，其他错误统一 Toast。
	// HTTP 401：token 失效，直接清空登录态并跳登录页（不走刷新流程）。
	// HTTP 200 + code=401：由 shouldRefreshToken 拦截并进入刷新队列，不进这里。
	responseSuccess: (response : RequestSuccess<any>) : boolean => {
		if (response.statusCode == 401) {
			useUserStore().reset()
			FC.Router.go('pages/login/index')
			return false
		}

		const data = response.data as ApiResponse<any> | null
		if (response.statusCode == 200 && data != null && data.code == 200) {
			return true
		}

		uni.showToast({
			title: data?.msg ?? '网络请求错误',
			icon: 'error',
		})
		return false
	},

	// 请求失败：网络层异常
	responseError: (error : RequestFail) => {
		console.error(error)
		uni.showToast({
			title: '网络请求错误',
			icon: 'error',
		})
	},

	// 数据解析：抽出 data 字段
	responseParser: (data : any) : any => {
		return (data as ApiResponse<any>).data
	},

	// 业务码 401 即视为 token 过期
	shouldRefreshToken: (response : RequestSuccess<any>) : boolean => {
		const data = response.data as ApiResponse<any> | null
		return response.statusCode == 200 && data != null && data.code == 401
	},

	// Token 刷新：使用调式 uni.request 包装为 Promise，App 端不支持 await uni.request
	refreshTokenMethod: () : Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			const userStore = useUserStore()
			uni.request<ApiResponse<TokenPayload>>({
				url: refreshURL,
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${userStore.refreshToken}`,
				},
				success: (response : RequestSuccess<ApiResponse<TokenPayload>>) => {
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
})

export default request

```

这样就实现了要求和无感刷新token。

## 5. 无感刷新 token

见 [无感刷新token流程](/guide/problem#网络无感刷新)
