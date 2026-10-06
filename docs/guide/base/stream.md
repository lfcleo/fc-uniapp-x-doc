# 流式响应

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

已集成的功能有
* 自定义header
* UTF-8 流式解析
* 无感刷新token
* 可中断、可重订阅


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i stream
```

## 1. 配置客户端

在 `modules/network/stream.ts` 用 `new FC.Stream({...})` 创建实例并默认导出。**应保证全局单例**（推荐模块顶层 `new` 一次），每个实例各自持有独立的 token 刷新队列；多实例会导致同一并发流被多次刷新 token。页面不要直接 new，通过 `services` 调用。

```ts
import { useUserStore } from '@/modules/stores/user'

const DevBaseURL = 'https://api.example.com/'
const ProBaseURL = 'https://api.example.com/'
const baseURL = process.env.NODE_ENV === 'production' ? ProBaseURL : DevBaseURL

export interface ApiResponse<T = any> {
	code : number
	msg : string
	data : T
}

const stream = new FC.Stream({
	baseURL,
	timeout: 60000,

	// 每次请求（含刷新后的重试）都会重新执行，在这里注入最新 token
	requestInterceptors: (config : RequestOptions<any>) => {
		const userStore = useUserStore()
		config.header = {
			...config.header,
			Authorization: `Bearer ${userStore.token}`,
		}
	},

	// 先于 responseSuccess。chunked 模式下 response.data 通常为空，
	// 因此这里只看 HTTP 状态码。
	shouldRefreshToken: (response : RequestSuccess<any>) : boolean => {
		return response.statusCode == 401
	},

	// 成功返回 true，并先把新 token 写入 store。App 端不要 await uni.request
	refreshTokenMethod: () : Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			const userStore = useUserStore()
			uni.request<ApiResponse<{ token : string }>>({
				url: baseURL + 'token/refresh',
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

	// 未进入刷新时才会走到这里。返回 true 才 resolve 为 onDone，false 则触发 onError。
	// chunked 模式下 response.data 通常为 null/空字符串，因此只看 HTTP 2xx。
	responseSuccess: (response : RequestSuccess<any>) : boolean => {
		return response.statusCode >= 200 && response.statusCode < 300
	},

	// 流式请求不适用 responseParser。成功数据通过 onChunk 逐行给出。

	// 网络层 / 业务层失败回调：业务侧弹 toast 或上报日志
	responseError: (error : any) => {
		const msg = (error as RequestFail | null)?.errMsg ?? '流式请求错误'
		uni.showToast({ title: msg, icon: 'error' })
	},

	// 本次 stream() 结束时调用，包含 token 刷新和重试
	responseComplete: () => {},
})

export default stream
```

`url` 以 `http://` 或 `https://` 开头时不拼接 `baseURL`。未配置 `responseSuccess` 时，HTTP 2xx 视为成功。默认超时 120000ms。

| 配置 | 作用 |
| --- | --- |
| `baseURL` | 相对地址的前缀 |
| `timeout` | 单次超时，可被 `RequestOptions.timeout` 覆盖 |
| `requestInterceptors` | 发请求前改 `RequestOptions`。可直接修改入参，也可返回新对象（返回 `RequestOptions` 时优先使用），可返回 Promise |
| `shouldRefreshToken` | 返回 `true` 时进入刷新队列，同一实例并发流只刷新一次。命中后会**丢弃已收到的 chunk** 重试 |
| `refreshTokenMethod` | 刷新成功返回 `true`。必须先写入新 token，重试会再次走拦截器 |
| `responseSuccess` | 返回 `true` 触发 `onDone`，`false` 触发 `onError`；返回 `undefined` 等同未配置（按 HTTP 2xx 判定） |
| `responseParser` | 流式请求不生效。成功数据通过 `onChunk` 逐行给出 |
| `responseError` | 多种时机（见下表），业务侧可用作日志/上报 |
| `responseComplete` | 本次 `stream()` 结束时调用，包含 token 刷新和重试 |

刷新失败时，等待中的流都会触发 `onError`，且不会再走 `responseSuccess`。不要在 `shouldRefreshToken` 和 `responseSuccess` 里对同一条件做相反处理：刷新判断在前，命中后不会进入 `responseSuccess`。

### `responseError` 调用时机

| 触发 | 说明 |
| --- | --- |
| `uni.request` 网络层失败（`fail` 回调） | 值为 `RequestFail` |
| HTTP 状态码非 2xx 且未命中 `shouldRefreshToken` | 值为 `RequestSuccess<any>` |
| `requestInterceptors` 同步抛错或返回的 Promise reject | 值为原始异常 |
| `shouldRefreshToken` 命中后刷新失败 | 值为 `Error`（同一次 stream 内仅触发一次） |
| 解析 chunk（`utf8Decoder.decode` / `parseLine` / `onChunk`）抛错 | 值为原始异常（业务侧可记录解析失败） |

主动 `abort()` 不调用 `responseError`。`onError` 与 `responseError` 都会触发，但语义不同：`onError` 面向 UI（带结构化 `kind` 字段），`responseError` 面向日志/上报。

### 与普通请求的差异

- **不显示 Loading**：流式响应通常较长，强制 Loading 会阻塞交互。如需提示请自行处理。
- **`responseParser` 不生效**：成功数据通过 `onChunk` 逐行给出，业务侧在 `parseLine` 里按业务结构解析。
- **重试会丢弃已收到的 chunk**：token 刷新成功后，原 stream 的 `fullText` / `pendingLine` 会被清空，从头重新接收。

## 2. 封装接口

URL 和方法写在 `services/stream.ts`，页面只传业务参数。SSE 的 `data:` 行在 services 里解析成业务类型，页面直接用解析结果。

```ts
import stream from '@/modules/network/stream'
import type { FCStreamController } from '@/fcuni/types'

export type LLMMessageType = {
	role : string
	content : string
}

export type LLMStreamRequestType = {
	model : string
	messages : LLMMessageType[]
	stream : boolean
}

export type LLMStreamResponseType = {
	type : string
	delta : {
		text : string | null
	} | null
}

function parseSSELine(line : string) : LLMStreamResponseType | null {
	const trimmed = line.trim()
	if (trimmed.length == 0 || trimmed.startsWith(':') || !trimmed.startsWith('data:')) {
		return null
	}
	const data = trimmed.slice(5).trim()
	if (data.length == 0 || data == '[DONE]') return null
	return JSON.parse<LLMStreamResponseType>(data)
}

export function getSSEApi(
	data : LLMStreamRequestType,
	onChunk : (chunk : LLMStreamResponseType, full : string) => void,
	onDone ?: (full : string) => void,
	onError ?: (error : any) => void,
) : FCStreamController {
	return stream.stream<LLMStreamResponseType>({
		url: '/v1/messages',
		method: 'POST',
		data,
	}, onChunk, onDone, onError, parseSSELine)
}
```

`stream()` 不返回 Promise。调用后立即拿到 `FCStreamController`，用 `abort()` 中断。

回调签名：

- `onChunk(chunk, full)`：每解析出一行调用一次。`chunk` 是 `parseLine` 的返回值，`full` 是已拼接的原文。
- `onDone(full)`：HTTP 成功且流结束后调用。
- `onError(error)`：网络失败、HTTP 失败、主动 `abort` 或解析异常时调用。`error.kind` 为 `abort`、`http`、`network`、`parse`。`onDone` 和 `onError` 只会触发一个。

`parseLine` 返回 `null` 的行会被跳过。不传时，每一行会作为字符串交给 `onChunk`，此时泛型 `T` 必须是 `string`。服务端若使用 `\r\n`，行内容里会带 `\r`，在 `parseLine` 里自行处理。

## 3. 页面调用

```vue
<script setup lang="ts">
import { getSSEApi } from '@/services/stream'
import type { FCStreamController } from '@/fcuni/types'

const streamText = ref('')
const streamStatus = ref('未开始')
let streamController : FCStreamController | null = null

const onStart = () => {
	streamController?.abort()
	streamText.value = ''
	streamStatus.value = '流式请求中...'
	streamController = getSSEApi(
		{
			model: 'auto',
			messages: [{ role: 'user', content: '你是谁？' }],
			stream: true,
		},
		(chunk, _full) => {
			streamText.value += chunk.delta?.text ?? ''
		},
		(full) => {
			streamStatus.value = `结束，长度 ${full.length}`
		},
		(error) => {
			streamStatus.value = describeStreamError(error)
		},
	)
}

const onAbort = () => {
	streamController?.abort()
	streamStatus.value = '已手动中断'
}

const describeStreamError = (error : any) : string => {
	const kind = error?.kind
	if (kind === 'abort') return '已手动中断'
	if (kind === 'http') return `失败：服务端返回 ${error.statusCode}`
	if (kind === 'network') return '失败：网络异常'
	if (kind === 'parse') return '失败：解析响应行时抛出异常'
	return '失败：未知错误'
}

onUnload(() => {
	streamController?.abort()
})
</script>
```

再次发起前先 `abort()` 上一次请求。页面卸载时也要中断。