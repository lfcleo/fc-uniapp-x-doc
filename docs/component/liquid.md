# FC-Modal弹窗

基于uni-app的弹窗组件，可覆盖原生导航栏和tabbar。支持普通/毛玻璃效果。

| H5  | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :-: | :--: | :--: | :--: | :--------: | :--------: |
|  √  |  √   |  √   |  √   |     √      |     -      |

## 安装

[插件市场](https://ext.dcloud.net.cn/plugin?id=29789)点击右侧 `下载插件并导入HBuilderX`

### 安卓/苹果/鸿蒙

需要在`pages.json`中注册`fc-modal`页面.

```json:line-numbers {4-18}
{
    "pages": [
        ...
        {
            "path": "uni_modules/fc-modal/components/fc-modal/fc-modal", // 弹窗插件，不能放在第一项
            "style": {
                "app-plus": {
                    "animationDuration": 200,
                    "animationType": "fade-in",
                    "background": "transparent",
                    "backgroundColorTop": "transparent",
                    "popGesture": "none",
                    "scrollIndicator": false,
                    "titleNView": false
                },
                "disableScroll": true
            }
        },
        ...
    ]
}
```

::: danger 提示
注意不能把`fc-modal`页面放在第一项。

如果你使用的是`fc-uniapp-x`框架，不要忘了把页面`/uni_modules/fc-modal/components/fc-modal/fc-modal`添加到路由白名单中。
:::

### 全局挂载（选项式使用会方便些）

如果你的项目使用的是选项式API，建议全局挂载`FCModal`组件，这样调用会方便一些。（组合式也可以使用，但并没有带来多大的便利）

在`main.ts`中挂载`FCModal`组件：

```ts:line-numbers
...
import FCModal from '@/uni_modules/fc-modal'

export function createApp() {
    const app = createSSRApp(App);
    app.config.globalProperties.$showModal = FCModal.showModal
    return app
}
...
```

这样就可以在项目中，使用 `this.$showModal({})` 调用弹窗组件。

## 基本用法

### 对话框模式

::: code-group

```ts:line-numbers [选项式]
<script setup lang="ts">
import FCModal from '@/uni_modules/fc-modal'

function showModal() {
    FCModal.showModal({
        title: '提示',
        content: '请输入内容',
        confirm: () => {
            console.log("确认按钮点击事件");;
            return true;
        },
        cancel: () => {
            console.log("取消按钮点击事件");
            return true;    // 返回true关闭弹窗
        },
    })
}
</script>
```

```ts:line-numbers [组合式]
<script lang="ts">
export default {
    ...,
    methods: {
        showModal() {
            this.$showModal({
                title: '提示',
                content: '请输入内容',
                confirm: () => {
                    console.log("确认按钮点击事件");;
                    return true;
                },
                cancel: () => {
                    console.log("取消按钮点击事件");
                    return true;    // 返回true关闭弹窗
                },
            })
        },
    }
}
</script>
```

:::

### 输入框模式

```ts

```
