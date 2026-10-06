# Pinia持久化存储

| H5 | 安卓 | 苹果 | 鸿蒙 | 微信小程序 | 其它小程序 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| √ | √ | √ | √ | √ | - |

项目已经在 FC 安装阶段创建并挂载 Pinia，业务代码不需要再次调用 `createPinia()` 或 `app.use()`。

## 业务 Store

业务 Store 统一放在 `modules/stores`。以下是用户状态示例：

```ts
// modules/stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const age = ref(0)

  const reset = () : void => {
    token.value = ''
    age.value = 0
  }

  return {
    token,
    age,
    reset
  }
}, {
  persist: {
    key: 'fc-user'
  }
})
```

页面中导入并使用 Store：

```vue
<script setup lang="ts">
import { useUserStore } from '@/modules/stores/user'

const userStore = useUserStore()

const setUser = () => {
  userStore.token = 'abcdefg'
  userStore.age = 18
}

const clearUser = () => {
  userStore.reset()
}
</script>
```

模板中可以直接访问 Store 状态：

```vue
<text>{{ userStore.token }}</text>
<text>{{ userStore.age }}</text>
```

## 持久化

在 `defineStore` 的第三个参数中配置 `persist` 即可开启跨平台持久化：

```ts
persist: {
  key: 'fc-user'
}
```

配置项：

| 配置 | 必填 | 说明 |
| --- | --- | --- |
| `key` | 是 | uni Storage 中使用的唯一 key |
| `paths` | 否 | 只持久化指定字段；不填写时持久化全部 state |
| `debounceMs` | 否 | 保留配置项；当前实现为保证字节码模式稳定性，在 mutation 后同步写入 |

只持久化部分字段：

```ts
persist: {
  key: 'fc-user',
  paths: ['token']
}
```

持久化底层使用 `uni.getStorageSync`、`uni.setStorageSync` 和 `uni.removeStorageSync`。Store 创建时自动恢复数据，状态发生 mutation 后自动写入，不需要业务代码手动读写 Storage。

Store 中的状态应保持可被 `JSON.stringify` 序列化，不要保存函数、循环引用或平台原生对象。

## FC 系统 Store

`fcuni/store/system.ts` 是 FC 框架内部定义的系统 Store，不是普通业务 Store。当前包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `language` | `string` | 应用语言；`auto` 或空字符串表示跟随系统 |
| `theme` | `string` | 应用主题状态，供主题功能统一管理 |

该 Store 使用持久化 key `fc-system`。页面通过 FC 公开入口访问：

```ts
const fcSystemStore = FC.useFcSystemStore()

fcSystemStore.language = 'zh-Hans'
fcSystemStore.theme = 'dark'
```

注意：

- 不要在 `modules/stores` 中重新定义同名的 `fcSystem` Store。
- 不要直接修改 `fcuni/store/system.ts` 来保存业务数据；业务状态应新建在 `modules/stores`。
- `language` 已与 FC 国际化模块联动，修改后会自动更新 i18n。
- 系统 Store 与业务 Store 共用同一个 Pinia 实例和持久化插件。

## 使用原则

- FC 框架级状态：使用 `FC.useFcSystemStore()`。
- 用户、订单、权限等业务状态：在 `modules/stores` 中独立定义 Store。
- 每个持久化 Store 必须使用不同的 `persist.key`，避免覆盖其他 Store 数据。
