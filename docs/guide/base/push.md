# UniPush 使用说明

推送分两层：`fcuni/push/uni.ts` 封装 UniPush 2.0 客户端能力；业务配置在 `modules/push/uni.ts`。`FC.install()` 会调用 `UniPush.init(uniPushConfig)`，业务侧通过 `FC.UniPush` 使用。

| 平台 | cid / 在线消息 | 本地通知 | 通知渠道 | 角标 |
| --- | --- | --- | --- | --- |
| Android | 支持 | 支持 | 支持 | 支持（小米需通知权限） |
| iOS | 支持 | 支持 | 不支持 | 支持 |
| 鸿蒙 | 支持 | 支持 | 不支持 | 支持 |
| Web / 微信小程序 | 支持 cid 与在线消息 | 不支持 | 不支持 | 不支持 |

APP 端会等隐私授权完成后再启动推送。HBuilderX 5.25+ Android 不再主动申请通知权限，可在配置里用 `requestPermission` 控制 `onPushMessage` 是否顺带申请。

配置或开通厂商通道后需云端打包（或自定义调试基座）才能收到离线推送。

---

## 开通unipush2.0

[uniCloud后台管理](https://unicloud.dcloud.net.cn),开通云空间

登陆[dcloud后台管理](https://dev.dcloud.net.cn)，左侧菜单栏找到 `uni-push`-`2.0（支持全端推送）`.

在页面的顶部，选择项目，根据实际情况设置信息


## 项目配置

在 `manifest.json` 中把 推送打开

## 1. 业务配置

在 `modules/push/uni.ts` 修改 `uniPushConfig`。不要给对象字面量加 `as FCTypeUniPushConfig`，会触发 UTS 名义类型校验。

```ts
export const uniPushConfig = {
  autoGetClientId: true,
  autoListen: true,
  requestPermission: true,
  createLocalOnReceive: false,
  channels: [
    {
      channelId: 'channel-id',
      channelDesc: '默认通知渠道',
      enableLights: true,
      enableVibration: true,
      importance: 4,
      lockscreenVisibility: 1
    }
  ],
  localMessage: {
    cover: false,
    channelId: 'channel-id',
    icon: '/static/logo.png',
    sound: 'system',
    delay: 1
  },
  onClientId: (cid : string) => {
    console.log('[UniPush] cid:', cid)
  },
  onClientIdFail: (error : UniError) => {
    console.error('[UniPush] 获取 cid 失败:', error)
  },
  onReceive: (data : UTSJSONObject) => {
    console.log('[UniPush] 收到消息:', data)
  },
  onClick: (data : UTSJSONObject) => {
    console.log('[UniPush] 点击消息:', data)
  },
  onNeedNotificationPermission: () => {
    uni.showToast({
      title: '请在设置中开启通知权限',
      icon: 'error'
    })
  }
}
```

`FC.install()` 已接入，业务代码不需要再手动 `init`：

```ts
import { uniPushConfig } from '@/modules/push/uni'

UniPush.init(uniPushConfig)
```

### 配置项

| 字段 | 说明 | 默认 |
| --- | --- | --- |
| `autoGetClientId` | 启动后自动获取 cid | `true` |
| `autoListen` | 启动后自动监听推送消息 | `true` |
| `requestPermission` | Android 监听消息时是否申请通知权限 | `true` |
| `createLocalOnReceive` | 收到透传后是否自动创建本地通知 | `false` |
| `channels` | Android 通知渠道，启动和创建本地通知时写入 | 无 |
| `localMessage` | 本地通知缺省值（图标、渠道、声音、delay 等） | 无 |
| `onClientId` | 获取 cid 成功 | 无 |
| `onClientIdFail` | 获取 cid 失败 | 无 |
| `onReceive` | 收到透传 / 在线消息 | 无 |
| `onClick` | 点击通知 | 无 |
| `onMessage` | 原始 `onPushMessage` 回调 | 无 |
| `onNeedNotificationPermission` | 创建本地通知或小米角标时无通知权限 | 无 |

完整类型见 `type.ts` 的 `FCTypeUniPushConfig`。

---

## 2. 业务调用

```ts
FC.UniPush.getClientId().then((cid : string) => {
  console.log(cid)
})

FC.UniPush.createMessage({
  title: '本地通知',
  content: '这是一条本地通知'
})

FC.UniPush.setBadgeNumber(5)
FC.UniPush.setBadgeNumber(0)

const channels = FC.UniPush.getAllChannels()
const authorized = FC.UniPush.hasNotificationPermission()
```

页面级额外监听，离开时记得取消：

```ts
const onPushMessage = (res : OnPushMessageCallbackResult) => {
  console.log(res.type, res.data)
}

onReady(() => {
  FC.UniPush.onMessage(onPushMessage)
})

onUnload(() => {
  FC.UniPush.offMessage(onPushMessage)
})
```

`offMessage()` 不传参数会清空全部额外回调并停止内部监听。

---

## 3. API

| 方法 | 说明 |
| --- | --- |
| `init(config)` | 写入配置。APP 等隐私授权后再启动，其它端立即启动 |
| `listen()` | 开始监听 `uni.onPushMessage` |
| `onMessage(callback)` | 追加页面级回调，未监听时会自动 `listen` |
| `offMessage(callback?)` | 移除指定回调；不传则清空并 `offPushMessage` |
| `getClientId()` | 返回 `Promise<string>`，成功后写入 `FC.UniPush.cid` |
| `createMessage(options)` | APP 创建本地通知，缺省值来自 `localMessage` |
| `setChannel(options)` | Android 写入通知渠道 |
| `getAllChannels()` | Android 返回渠道 id 列表，其它端返回 `[]` |
| `setBadgeNumber(num, options?)` | APP 设置角标。小米/红米必须传通知标题内容，未传时自动补齐；无通知权限走 `onNeedNotificationPermission`。小米前台会清角标，需在 `onAppHide` 调 `flushBadge()` |
| `flushBadge()` | 小米退到后台时重设上次角标，避免前台被系统清空 |
| `hasNotificationPermission()` | `notificationAuthorized == 'authorized'` |
| `resume()` | iOS 从后台回到前台时重新注册 `onPushMessage`，避免回调被回收 |
| `destroy()` | 取消监听并移除隐私授权监听 |

`createMessage` 未传 `channelId` 时，依次使用 `localMessage.channelId`、`channels[0].channelId`。未传 `category` 时，鸿蒙默认 `SOCIAL_COMMUNICATION`，其它 APP 默认 `IM`。iOS 的 `delay` 必须大于 0，封装层会把 `<= 0` 校正为 `1`。

---

## 4. 推荐流水

1. 在开发者中心开通 UniPush 2.0，并配置厂商通道 / iOS 证书。
2. 修改 `modules/push/uni.ts` 的回调、渠道和本地通知缺省值。
3. 需要时在页面调用 `FC.UniPush.getClientId` / `createMessage` / `setBadgeNumber`。
4. 页面监听用 `onMessage`，卸载时 `offMessage`。
5. 永久拒绝通知权限时引导用户 `uni.openAppAuthorizeSetting`。

调试页：`pages/base/push.uvue`。
