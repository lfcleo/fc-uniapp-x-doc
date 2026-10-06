# 路由跳转和拦截

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

FC-Uniapp 已经集成了路由跳转和拦截功能。
路由跳转可以很方便的传递参数
路由拦截，则可以设置白名单、拦截条件和跳转页面。

## 1. 配置（pages.json）

在 `pages.json` 中为需要拦截的页面配置 `verify`：

```json
{
  "pages": [
    {
      "path": "pages/home",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/detail",
      "verify": true    // 设置 verify 字段为true，则此页面开启路由拦截校验
    }
  ],
  "subPackages": [ ... ]
}
```

**说明：**
- 配置 `"verify": true` 的页面才会触发路由拦截器。
- 适配【小程序】分包。
- 未配置 `verify` 的页面直接放行，无需拦截。

## 2. 配置拦截逻辑（modules/router/index.ts）

路由是否拦截、拦截后跳转到哪里，在 `modules/router/index.ts` 的 `FCTypeRouterConfig` 中配置。框架初始化时会自动读取该对象，业务侧不需要手动调用 `Router.init`。

```ts
import { useUserStore } from "@/modules/stores/user"

export const FCTypeRouterConfig = {
    // 返回 true 表示拦截。仅对 pages.json 中 verify: true 的页面生效
    shouldInterceptRoute(): boolean {
        return useUserStore().token == ""
    },
    // 被拦截后执行，例如跳转登录页
    interceptFunc() {
        uni.navigateTo({ url: "/pages/login/index" })
    }
}
```

**说明：**
- `shouldInterceptRoute` 返回 `true` 时拦截本次跳转，返回 `false` 时放行。
- `interceptFunc` 在拦截后执行。内部再调用 `navigateTo` 等前向路由时，本次跳转会直接放行，避免递归。
- 未配置 `verify: true` 的页面不会进入这两个方法。

## 3. 调用方式

### 推荐：`FC.Router.go`（首选）

```ts
// 无参数
FC.Router.go('pages/test/index')

// 带参数
FC.Router.go('pages/detail', { id: 123, name: '测试' })
```

### 使用 uni 原生 API

如果需要 `animationType`、`animationDuration` 等原生选项：

```ts
const params = FC.Router.parseParams({ id: 123, token: 'abc' })

uni.navigateTo({
  url: '/pages/test/index' + params,
  animationType: 'pop-out',
  animationDuration: 300
})

uni.redirectTo({
  url: '/pages/login' + FC.Router.parseParams({ token: 'abc' })
})
```

`FC.Router.parseParams(params)` 会自动序列化参数（`null`/`undefined` 跳过，对象/数组转为 JSON + `encodeURIComponent`），无前导 `?` 时返回 `''`。

**注意：** 原生 API 的 `url` 必须以 `/` 开头。`navigateBack` 不参与拦截，直接放行。

## 4. 页面接收参数

uni-app x 原生所有 query 参数都是字符串，在页面 `onLoad` 中读取：

```vue
<!-- pages/test/index.uvue -->
<script setup lang="ts">
const id = ref(0)
const name = ref('')
const data = ref<Record<string, any>>({})

onLoad((e?: Record<string, any>) => {
  if (e == null) return
  id.value = Number(e.id ?? 0) // 基础类型
  // 对象/数组参数
  name.value = FC.Router.parse(e['name'], '') as string
  data.value = FC.Router.parse(e['data'], {}) as Record<string, any>
})
</script>
```

**注意：**
- 使用 `FC.Router.parse<T>(value, fallback)` 接收对象/数组参数。
- 该方法自动执行 `decodeURIComponent` 和 `JSON.parse`，参数为空或解析失败时返回 `fallback`。

## 5. 参数序列化规则

```ts
FC.Router.go('pages/xxx', {
  id: 123,
  name: 'alice',
  active: true,
  filter: { type: 'book', tags: ['new', 'sale'] },
  nickname: null  // 跳过
})
```

- `string` / `number` / `boolean` → `encodeURIComponent(String(value))`
- `object` / `array` → `encodeURIComponent(JSON.stringify(value))`
- `null` / `undefined` → 跳过，不生成参数

## 6. 拦截器说明

FC Router 在初始化时读取 `pages.json`。

只有配置了 `"verify": true` 的页面，才会调用拦截器。

支持拦截：
- `FC.Router.go`
- `uni.navigateTo`
- `uni.redirectTo`
- `uni.switchTab`
- `uni.reLaunch`

`uni.navigateBack` 始终直接放行。

**额外：** 拦截器内置递归保护机制，防止死循环。

---

**使用建议：**
- 日常开发优先使用 `FC.Router.go` 方式，保持一致性。
- 复杂动画需求时使用 uni 原生 API + `parseParams`。
