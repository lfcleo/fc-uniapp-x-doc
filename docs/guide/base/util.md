# 工具类

FC-Uniapp 提供了一些比较实用的工具类，用于简化开发过程。持续更新

终端执行命令安装模块<sapn class="marker-evy">（如若创建项目时已选择了该模块，可略过这一步）</sapn>

```bash
fcuni c utils
```

## 常用

### 防抖

防抖是指在事件触发后，等待一定时间后再执行回调函数。如果在等待时间内事件再次触发，则重新计时。

```ts
<button type="primary" class="mt-20rpx w-full" @click="testDebounce">同步防抖</button>
<button type="primary" class="mt-20rpx w-full" @click="testAsyncDebounce">异步防抖</button>
...
// 使用防抖函数包装同步方法
const testDebounce = FC.Utils.debounce(() => {
    uni.showToast({
        title: "同步防抖测试执行了",
        icon: "none"
    })
    // 这里可以添加实际的同步操作
}, 500, false);

// 使用防抖函数包装异步API调用
const testAsyncDebounce = FC.Utils.debounce(async () => {
    try {
        const result = await apiTestGet();
        console.log('异步防抖API结果:', result);
        uni.showToast({
            title: "异步防抖网络请求成功",
            icon: "none"
        })
    } catch (error) {
        console.error('API请求失败:', error);
    }
}, 500, false);
```

| 属性        | 类型       | 描述                           |
| ----------- | ---------- | ------------------------------ |
| `args`      | `Function` | 要包装的函数                   |
| `delay`     | `number`   | 等待时间，单位毫秒,默认500毫秒 |
| `immediate` | `boolean`  | 是否立即执行第一次调用         |

### 节流

节流是指在事件触发后，等待一定时间后再执行回调函数。如果在等待时间内事件再次触发，则忽略该次触发。

```ts
<button type="primary" class="mt-20rpx w-full" @click="testThrottle">同步节流</button>
<button type="primary" class="mt-20rpx w-full" @click="testAsyncThrottle">异步节流</button>
...
// 使用节流函数包装同步方法
const testThrottle = FC.Utils.throttle(() => {
    uni.showToast({
        title: "同步节流测试执行了",
        icon: "none"
    })
    // 这里可以添加实际的同步操作
}, 1000);

// 使用节流函数包装异步API调用
const testAsyncThrottle = FC.Utils.throttle(async () => {
    try {
        console.log('开始节流调用API接口');
        const result = await apiTestGet();
        console.log('异步节流API结果:', result);
        uni.showToast({
            title: "异步节流网络请求成功",
            icon: "none"
        })
    } catch (error) {
        console.error('节流API请求失败:', error);
    }
});
```

| 属性               | 类型       | 描述                                 |
| ------------------ | ---------- | ------------------------------------ |
| `args`             | `Function` | 要包装的函数                         |
| `delay`            | `number`   | 等待时间，单位毫秒,默认500           |
| `options.leading`  | `boolean`  | 是否立即执行第一次调用               |
| `options.trailing` | `boolean`  | 是否在等待时间结束后执行最后一次调用 |

### px 转换为 rpx

在不同设备上，1px 等于不同的 rpx。返回值为保留3位小数，可以取整使用。

```ts
// 将 100px 转换为 rpx 单位
const rpx = FC.Utils.px2Rpx(100);
```

| 属性 | 类型     | 描述           |
| ---- | -------- | -------------- |
| `px` | `number` | 要转换的 px 值 |

### rpx 转换为 px

在不同设备上，1rpx 等于不同的 px。返回值为保留3位小数，可以取整使用。

```ts
// 将 100rpx 转换为 px 单位
const px = FC.Utils.rpx2Px(100);
```

| 属性  | 类型     | 描述            |
| ----- | -------- | --------------- |
| `rpx` | `number` | 要转换的 rpx 值 |

### 获取（组件或元素）的布局位置信息

获取指定元素(class 或 id)的布局位置信息，返回一个对象，包含元素的上，下，左，右，宽度，高度等信息。

各个信息的返回值为保留3位小数，可以取整使用。

```ts
...
<button type="primary" class="button1">同步防抖</button>
...
// 获取元素的布局位置信息（返回单位为px），class使用点号前缀，id使用#号前缀
const position = await FC.Utils.getComponentPosition('.button1');
console.log(position);
// 获取元素的布局位置信息（返回单位为rpx），class使用点号前缀，id使用#号前缀
const position1 = await FC.Utils.getComponentPosition('.button1', true);
console.log(position1);
```

| 属性        | 类型      | 描述                           |
| ----------- | --------- | ------------------------------ |
| `component` | `string`  | 要获取布局位置信息的元素选择器 |
| `isRpx`     | `boolean` | 是否返回单位为rpx，默认false   |

## 加密/解密

### base64 加密/解密

```ts:line-numbers
// 加密
const encrypted = FC.Utils.base64Encode('hello world');
console.log(encrypted);

// 解密
const decrypted = FC.Utils.base64Decode(encrypted);
console.log(decrypted);
```

### md5 加密

```ts:line-numbers
// 加密
const md5 = FC.Utils.md5('hello world');
console.log(md5);
```

### sha1 加密

```ts:line-numbers
// 加密
const sha1 = FC.Utils.sha1('hello world');
console.log(sha1);
```

### sha256 加密

```ts:line-numbers
// 加密
const sha256 = FC.Utils.sha256('hello world');
console.log(sha256);
```
