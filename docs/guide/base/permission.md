# 系统权限使用说明

权限分两层：`fcuni/permission` 只负责 Android 申请时的全局用途说明；业务文案在 `modules/permission`；真正向系统申请权限由各端 API 完成。

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| - | √ | - | - | √ | - |

库的运行范围与生态兼容：库本身只在 Android 上做顶部权限说明弹窗 + 系统权限监听（`uni.createRequestPermissionListener` 仅 Android 4.0+ 可用），在微信小程序上做拒绝授权引导（`MPShowAuthorize`）。iOS / 鸿蒙 / H5 不需要这个库——iOS 走系统弹窗 + `app-ios.distribute.privacyDescription`；鸿蒙走系统弹窗 + `module.json5` 的 `reason` 字段；H5 无系统权限概念。但四端都各自需要在 manifest / `module.json5` 中声明权限和用途文案，具体见「1.1 平台权限声明」。

已集成的功能有

* 业务侧统一管理文案（`modules/permission/index.ts`）
* Android 顶部权限说明同步弹窗
* 系统定位 / 蓝牙开关关闭时拦截调用
* 小程序拒绝授权引导用户打开设置页

## 安装

终端在项目根目录下执行命令安装模块<span class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</span>

```bash
fc-uniapp-x i permission
```

## 1. 配置客户端

### 1.1 平台权限声明

配置或修改权限后需云端打包（或自定义调试基座）才能生效。标准基座没有 `uni.createRequestPermissionListener`，会出现模块未注册错误。

#### Android

HBuilderX 4.71+ 在 `manifest.json` 源码视图的 `app-android.distribute.permissions` 中额外添加权限。内置模块会自动带上部分权限，不够的再补：

```json
{
  "app-android": {
    "distribute": {
      "modules": {
        "uni-createRequestPermissionListener": {},
        "uni-requestSystemPermission": {},
        "uni-media": {},
        "uni-recorder": {},
        "uni-phoneContact": {},
        "uni-calendar": {},
        "uni-makePhoneCall": {},
        "uni-location": {
          "system": {}
        }
      },
      "permissions": [
        "<uses-permission android:name=\"android.permission.CAMERA\"/>",
        "<uses-permission android:name=\"android.permission.READ_MEDIA_IMAGES\"/>",
        "<uses-permission android:name=\"android.permission.READ_MEDIA_VIDEO\"/>",
        "<uses-permission android:name=\"android.permission.READ_MEDIA_VISUAL_USER_SELECTED\"/>",
        "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>",
        "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_COARSE_LOCATION\"/>",
        "<uses-permission android:name=\"android.permission.ACCESS_FINE_LOCATION\"/>",
        "<uses-permission android:name=\"android.permission.RECORD_AUDIO\"/>",
        "<uses-permission android:name=\"android.permission.READ_CONTACTS\"/>",
        "<uses-permission android:name=\"android.permission.WRITE_CONTACTS\"/>",
        "<uses-permission android:name=\"android.permission.READ_CALENDAR\"/>",
        "<uses-permission android:name=\"android.permission.WRITE_CALENDAR\"/>",
        "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\"/>",
        "<uses-permission android:name=\"android.permission.CALL_PHONE\"/>",
        "<uses-permission android:name=\"android.permission.BLUETOOTH_SCAN\"/>",
        "<uses-permission android:name=\"android.permission.BLUETOOTH_CONNECT\"/>"
      ]
    }
  }
}
```

可视化界面：安卓 App 配置 → 权限配置 → 额外添加的权限。`android:name` 的双引号前必须加转义斜线 `\`。

| Android 权限 | 中文名称 | 用途说明 |
| --- | --- | --- |
| `android.permission.CAMERA` | 相机 | 拍摄照片或扫描二维码 |
| `android.permission.READ_MEDIA_IMAGES` | 相册 | 选择相册中的图片 |
| `android.permission.READ_MEDIA_VIDEO` | 相册 | 选择相册中的视频 |
| `android.permission.READ_MEDIA_VISUAL_USER_SELECTED` | 相册 | 访问用户选择的照片 |
| `android.permission.READ_EXTERNAL_STORAGE` | 存储读取 | 读取设备中的图片和文件 |
| `android.permission.WRITE_EXTERNAL_STORAGE` | 存储写入 | 保存文件到设备存储 |
| `android.permission.ACCESS_COARSE_LOCATION` | 粗略定位 | 获取大致位置信息 |
| `android.permission.ACCESS_FINE_LOCATION` | 精确定位 | 获取精确位置信息 |
| `android.permission.RECORD_AUDIO` | 麦克风 | 录制语音或视频 |
| `android.permission.READ_CONTACTS` | 读通讯录 | 读取联系人信息 |
| `android.permission.WRITE_CONTACTS` | 写通讯录 | 新增或修改联系人 |
| `android.permission.READ_CALENDAR` | 读取日历 | 读取日程安排 |
| `android.permission.WRITE_CALENDAR` | 写入日历 | 添加或修改日程 |
| `android.permission.READ_PHONE_STATE` | 电话状态 | 读取设备电话状态 |
| `android.permission.CALL_PHONE` | 拨打电话 | 发起电话呼叫 |
| `android.permission.BLUETOOTH_SCAN` | 蓝牙 | 扫描附近蓝牙设备 |
| `android.permission.BLUETOOTH_CONNECT` | 蓝牙 | 连接蓝牙设备 |

#### iOS

`uni.requestSystemPermission` 不支持 iOS。在 `app-ios.distribute.privacyDescription` 配置许可描述，系统首次弹窗会展示这段文字。未配置或描述与实际用途不符会被 App Store 拒审。

```json
{
  "app-ios": {
    "distribute": {
      "privacyDescription": {
        "NSCameraUsageDescription": "拍摄照片或扫描二维码",
        "NSPhotoLibraryUsageDescription": "选择相册中的图片",
        "NSPhotoLibraryAddUsageDescription": "保存图片到相册",
        "NSMicrophoneUsageDescription": "录制语音或视频",
        "NSLocationWhenInUseUsageDescription": "获取当前位置",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "持续获取位置信息",
        "NSContactsUsageDescription": "读取或写入联系人",
        "NSCalendarsUsageDescription": "读取或写入日程",
        "NSBluetoothAlwaysUsageDescription": "扫描并连接蓝牙设备",
        "NSBluetoothPeripheralUsageDescription": "使用蓝牙外设"
      }
    }
  }
}
```

可视化界面：iOS App 配置 → 隐私信息访问的许可描述。也可在项目根目录 `Info.plist` 中补充，冲突时 `Info.plist` 会覆盖 manifest。内置模块会写入通用描述，上架前请改成真实业务文案。

#### 鸿蒙

在 `harmony-configs/entry/src/main/module.json5` 的 `requestPermissions` 声明权限，`reason` 就是系统弹窗用途说明。精确定位和模糊定位必须成对出现，否则审核会被驳回。`reason` 文案写在 `harmony-configs/AppScope/resources/base/element/string.json`（覆盖模板时需保留 `app_name`）。

| 鸿蒙权限 | 中文名称 | 用途说明 |
| --- | --- | --- |
| `ohos.permission.CAMERA` | 相机 | 拍摄照片或扫描二维码 |
| `ohos.permission.APPROXIMATELY_LOCATION` | 粗略定位 | 获取当前位置信息 |
| `ohos.permission.LOCATION` | 精确定位 | 获取当前位置信息 |
| `ohos.permission.MICROPHONE` | 麦克风 | 录制语音或视频 |
| `ohos.permission.READ_CONTACTS` | 读通讯录 | 读取联系人信息 |
| `ohos.permission.READ_CALENDAR` | 读取日历 | 读取日程安排 |
| `ohos.permission.WRITE_CALENDAR` | 写入日历 | 添加或修改日程 |
| `ohos.permission.GET_NETWORK_INFO` | 网络信息 | 读取设备网络状态 |
| `ohos.permission.PLACE_CALL` | 拨打电话 | 发起电话呼叫 |
| `ohos.permission.ACCESS_BLUETOOTH` | 蓝牙 | 扫描并连接蓝牙设备 |

以下为受限权限（ACL），默认已在 `module.json5` 中注释。未在 AGC 申请并通过带授权的证书签名时，声明它们会导致无法安装（报「运行所需的权限没有签名授权」）：

| 鸿蒙受限权限 | 中文名称 | 说明 |
| --- | --- | --- |
| `ohos.permission.READ_IMAGEVIDEO` | 相册读取 | 普通选图用 `uni.chooseImage`（系统 Picker，无需该权限） |
| `ohos.permission.WRITE_IMAGEVIDEO` | 相册写入 | 保存图片用 `uni.saveImageToPhotosAlbum` |
| `ohos.permission.WRITE_CONTACTS` | 写通讯录 | `uni.makePhoneCall` 文档要求此权限，需单独申请 |

```json5
{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.CAMERA",
        "reason": "$string:permission_camera_tips",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      },
      {
        "name": "ohos.permission.APPROXIMATELY_LOCATION",
        "reason": "$string:permission_location_tips",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      },
      {
        "name": "ohos.permission.LOCATION",
        "reason": "$string:permission_location_tips",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      }
    ]
  }
}
```

### 1.2 业务文案配置

在 `modules/permission/index.ts` 维护 Android 短名到中文文案（`name` + `explain`）的映射。**key 必须等于 `android.permission.` 后面那段**（如 `CAMERA`、`ACCESS_FINE_LOCATION`），与 Android 权限声明一一对应。

```ts
export const permissionConfig = {
  CAMERA: { name: '相机', explain: '拍摄照片或扫描二维码' },
  ACCESS_FINE_LOCATION: { name: '精确定位', explain: '获取精确位置信息' }
}
```

`PermissionEnum` 接口字段：

| 字段 | 含义 |
| --- | --- |
| `name` | 权限名称（中文，如"相机"） |
| `explain` | 权限说明（中文，如"拍摄照片或扫描二维码"） |

## 2. 初始化（仅 Android）

`pages.json` 已注册 `components/fc-dialog/permission`。在 `App.uvue` 启动时初始化、退出时销毁：

```ts
import { FC } from '@/fcuni'
// #ifdef APP-ANDROID
import { permissionConfig } from '@/modules/permission'
// #endif

onLaunch(() => {
  // #ifdef APP-ANDROID
  FC.Permission.init(permissionConfig)
  // #endif
})

onExit(() => {
  // #ifdef APP-ANDROID
  FC.Permission.destroy()
  // #endif
})
```

`init()` 做两件事：

1. 监听定位 / 蓝牙开关（`uni.getLocation`、`uni.chooseLocation`、`uni.openBluetoothAdapter`）。系统开关关闭时拦截调用并提示去设置。
2. 创建 `uni.createRequestPermissionListener`。任意业务代码弹出系统权限框时，顶部同步展示用途说明。

不要在页面里单独 `init` / `destroy`，否则会漏掉其它页面触发的权限申请。鸿蒙、iOS 上 `init` 为空操作，仅打印 `console.warn` 提示。

公开 API：

| API | 平台 | 说明 |
| --- | --- | --- |
| `FC.Permission.init(config)` | Android | 初始化拦截器与系统权限监听器；非 Android 为空操作 |
| `FC.Permission.destroy()` | Android | 停止监听并移除拦截器；非 Android 为空操作 |
| `FC.Permission.MPShowAuthorize(scope, text)` | 小程序 | 用户拒绝授权后引导打开设置页；非小程序平台 `Promise.reject` |

## 3. 业务侧申请权限

三端统一：直接调用会触发权限的业务 API，不要在业务里显式调用 `uni.requestSystemPermission`。Android 上 `FC.Permission.init` 会在系统权限框弹出时同步展示用途说明。

| 能力 | 业务 API |
| --- | --- |
| 相机 | `uni.chooseImage({ sourceType: ['camera'] })` |
| 相册 | `uni.chooseImage({ sourceType: ['album'], albumMode: 'custom' })` |
| 定位 | `uni.getLocation` |
| 麦克风 | `uni.getRecorderManager().start` |
| 存储写入 | `uni.saveImageToPhotosAlbum` |
| 读通讯录 | `uni.chooseContact` |
| 写通讯录 | `uni.addPhoneContact` |
| 写入日历 | `uni.addPhoneCalendar` / `uni.addPhoneRepeatCalendar` |

以下 API 不会申请危险权限，测试页已去掉：`uni.chooseFile`（系统文件选择器）、`uni.makePhoneCall`（系统拨号页）、`uni.chooseImage({ albumMode: 'system' })`。读取日历、读取电话状态、App 端蓝牙目前没有会申请权限的业务 API。查询授权状态用 `uni.getAppAuthorizeSetting()`。蒸汽模式下不要调用 `UTSAndroid.checkSystemPermissionGranted`。

通讯录、日历、录音、拨号、选图等 API 依赖原生模块。HBuilderX 会按代码摇树，但改模块或新增这些 API 后必须重新打包自定义基座，标准基座和旧自定义基座会报 `UTS module is not registered`。

被永久拒绝后无法再次弹系统框，引导用户打开设置：

```ts
uni.openAppAuthorizeSetting({})
```

### 小程序拒绝授权

```ts
try {
  const ok = await FC.Permission.MPShowAuthorize('scope.userLocation', '获取当前位置')
  console.log('授权成功', ok)
} catch (err) {
  console.warn('授权失败', err)
}
```

`MPShowAuthorize` 在非小程序平台会 `reject`，业务侧请用 `// #ifdef MP-WEIXIN` 包起来。

完整对照见 `pages/base/permission.uvue`。

## 4. 推荐流程

1. 按平台在 manifest / `module.json5` / `privacyDescription` 声明权限和用途文案。
2. 在 `modules/permission/index.ts` 补齐 Android 短名对应的 `name`、`explain`。
3. `App.uvue` 调用 `FC.Permission.init(permissionConfig)`。
4. 业务在需要时直接调用对应 API，由系统弹出权限框。
5. 根据业务 API 的 success / fail 处理结果。
6. 永久拒绝时调用 `uni.openAppAuthorizeSetting`。
7. 应用退出时 `FC.Permission.destroy()`。

调试页：`pages/base/permission.uvue`。