# WebSocket 长连接

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

已集成的功能有
* 心跳保活 + 心跳超时断连
* 指数退避自动重连
* 消息队列缓存（未连接时入队，连上后自动重发）
* 多回调注册 / 解注册


## 安装
终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i websocket
```

## 1. 配置客户端

在 `modules/network/websocket.ts` 用 `new FC.WebSocket({...})` 创建实例并默认导出。**应保证全局单例**（推荐模块顶层 `new` 一次），多个实例各自维护独立连接状态。页面不要直接 new，通过 `services` 调用。

> ⚠️ 创建后不会自动连接，需要手动调用 `connect()`。

```ts
import type { FCTypeWebSocketConfig } from '@/fcuni/types'

const DevURL = 'wss://echo.websocket.org'
const ProURL = 'wss://echo.websocket.org'

const ws = new FC.WebSocket({
	url: process.env.NODE_ENV === 'production' ? ProURL : DevURL,
	heartTime: 5,
	heartMessage: 'ping',
	heartTimeoutTime: 10,
	maxReconnectAttempts: 3,
	reconnectDelay: 3000,
	maxReconnectDelay: 30000,
	reconnectDelayMultiplier: 2,
	messageQueueMaxSize: 100,

	// 连接前修改 header、子协议等
	requestInterceptors: (config : ConnectSocketOptions) => {
		config.header = {
			...config.header,
			Authorization: 'Bearer token',
		}
	},

	onOpen: (event) => {
		console.log('连接已建立', event)
	},
	onMessage: (data) => {
		console.log('收到消息:', data)
	},
	onError: (error) => {
		console.error('连接错误:', error)
	},
	onClose: (event) => {
		console.log('连接已关闭', event)
	},
	onReconnectAttempt: (attempt, delay) => {
		console.log(`第 ${attempt} 次重连，延迟 ${delay}ms`)
	},
	onReconnectSuccess: () => {
		console.log('重连成功')
	},
	onReconnectFailed: (totalAttempts) => {
		console.log(`重连 ${totalAttempts} 次后失败`)
	},
} as FCTypeWebSocketConfig)

export default ws
```

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `url` | 必填 | WebSocket 服务端地址 |
| `heartTime` | `30` | 心跳间隔，单位秒。`<= 0` 不发心跳 |
| `heartMessage` | `'ping'` | 心跳内容 |
| `heartTimeoutTime` | `heartTime * 2` | 心跳超时时间，单位秒。**业务消息也会重置超时** |
| `maxReconnectAttempts` | `5` | 最大重连次数。`-1` 表示无限重连 |
| `reconnectDelay` | `3000` | 首次重连延迟，单位毫秒 |
| `maxReconnectDelay` | `30000` | 重连延迟上限 |
| `reconnectDelayMultiplier` | `2` | 指数退避倍数 |
| `messageQueueMaxSize` | `100` | 消息队列上限。超过后丢弃最早的消息并触发 `onError` |
| `requestInterceptors` | 空函数 | 连接前修改 `ConnectSocketOptions`（header、子协议等） |
| `onOpen` / `onMessage` / `onError` / `onClose` | - | 初始事件回调（与 `onOpen` 等注册方法并存） |
| `onReconnectAttempt` / `onReconnectSuccess` / `onReconnectFailed` | - | 重连事件回调 |

回调也可通过 `wsClient.onOpen(...)` / `wsClient.onMessage(...)` 等方法追加注册，**多次注册会并存**，不覆盖。

### 心跳机制说明

- 每 `heartTime` 秒发送一次心跳消息，发送后启动 `heartTimeoutTime` 秒超时计时。
- **收到任意消息（包括业务消息）都会重置超时计时**——业务消息本身被视为对端活跃的证明，无需等待心跳响应。
- 超时后调用 `task.close()` 并触发 `onClose`，由 `tryReconnect` 安排指数退避重连。
- 收到 `'pong'` 字面量会被静默忽略，不触发业务侧 `onMessage`。如果心跳响应是 JSON 包装，需要在 `onMessage` 里自行过滤。

### 重连机制说明

- `onClose` / `handleConnectionError` / `send` 时若 socketTask 为 null，都会触发 `tryReconnect`。
- 重连延迟按指数退避计算：`reconnectDelay * reconnectDelayMultiplier^attempt`，上限 `maxReconnectDelay`。
- 达到 `maxReconnectAttempts`（`-1` 除外）后停止重连，触发 `onReconnectFailed(totalAttempts)`。
- `disconnect()` 后调用 `connect()` 会重置 `_isManualDisconnected` 标志，允许再次自动重连。
- **过期 task 防护**：`disconnect → connect` 后旧 task 的 `onClose` 不会触发新 task 的重连（内部闭包检查 `this.socketTask !== currentTask`）。

## 2. 调用

```vue
<script setup lang="ts">
import wsClient from '@/modules/network/websocket'

const messages = ref<string[]>([])
const inputMessage = ref('')
const isOpen = ref(false)
const statusText = ref('未连接')

const refreshStatus = () => {
	isOpen.value = wsClient.isOpen
	if (wsClient.isOpen) {
		statusText.value = '已连接'
	} else if (wsClient.isManualDisconnected) {
		statusText.value = '已断开'
	} else if (wsClient.currentReconnectAttempts > 0) {
		statusText.value = `重连中，第 ${wsClient.currentReconnectAttempts} 次`
	} else {
		statusText.value = '未连接'
	}
}

const onConnect = () => {
	wsClient.connect()
}

const onDisconnect = () => {
	wsClient.disconnect()
}

const onSend = () => {
	const text = inputMessage.value.trim()
	if (text.length == 0) return
	wsClient.send(text)
	inputMessage.value = ''
}

wsClient.onOpen(() => {
	refreshStatus()
})

wsClient.onMessage((data : string) => {
	messages.value.push(data)
})

wsClient.onError(() => {
	refreshStatus()
})

wsClient.onClose(() => {
	refreshStatus()
})

wsClient.onReconnectAttempt(() => {
	refreshStatus()
})

wsClient.onReconnectFailed(() => {
	refreshStatus()
})

onBeforeUnmount(() => {
	wsClient.disconnect()
})
</script>

<template>
	<button :disabled="isOpen" @click="onConnect">连接</button>
	<button :disabled="!isOpen" @click="onDisconnect">断开</button>
	<button :disabled="!isOpen || inputMessage.length == 0" @click="onSend">发送</button>
	<p>{{ statusText }}</p>
	<ul>
		<li v-for="(msg, i) in messages" :key="i">{{ msg }}</li>
	</ul>
</template>
```

### 公开 API

| 方法 / 属性 | 说明 |
| --- | --- |
| `connect()` | 开始连接。已连接时不会重复发起 |
| `disconnect()` | 主动断开，之后不再自动重连。离开页面时调用，避免后台持续重连 |
| `destroy()` | 关闭连接并清空回调和定时器。单例若还要在其他页面复用，离开时只用 `disconnect()` |
| `send(message : string \| ArrayBuffer)` | 发送消息。未连接时进入队列，连上后自动重发；队列满时丢弃最早消息并触发 `onError` |
| `isOpen : boolean` | 只读，是否已连接 |
| `isManualDisconnected : boolean` | 只读，是否处于手动断开状态 |
| `currentReconnectAttempts : number` | 只读，当前重连尝试次数 |
| `onOpen(cb) / offOpen(cb)` | 注册/解注册连接打开回调 |
| `onMessage(cb) / offMessage(cb)` | 注册/解注册消息回调。`cb(data : string)`，`ArrayBuffer` 自动按 UTF-8 解码 |
| `onError(cb) / offError(cb)` | 注册/解注册错误回调 |
| `onClose(cb) / offClose(cb)` | 注册/解注册连接关闭回调 |
| `onReconnectAttempt(cb) / offReconnectAttempt(cb)` | 注册/解注册重连尝试回调 |
| `onReconnectSuccess(cb) / offReconnectSuccess(cb)` | 注册/解注册重连成功回调 |
| `onReconnectFailed(cb) / offReconnectFailed(cb)` | 注册/解注册重连失败回调 |

`isOpen` / `isManualDisconnected` / `currentReconnectAttempts` 不是响应式数据，界面状态需要在回调里刷新或定时读取。
