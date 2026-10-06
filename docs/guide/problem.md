# 常见问题

## 网络无感刷新

> 适用场景：accessToken 过期但 refreshToken 有效。服务端约定 HTTP 200 + 业务码 `401` 表示 token 过期。HTTP 401（refreshToken 也失效或未登录）见下方"与 HTTP 401 的区别"。

### 时序图

```
请求 A ──┐
请求 B ──┼─→ uni.request ──→ response(statusCode=200, code=401)
请求 C ──┘                            │
                                       ▼
                            shouldRefreshToken(response) === true
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ TokenRefreshQueue    │
                            │  push A/B/C 的 retry │
                            │  refreshing = true   │
                            └──────────┬───────────┘
                                       ▼
                        refreshTokenMethod()  ← 仅调用一次
                                       │
                          ┌────────────┴────────────┐
                       成功(true)                失败(false)
                          │                          │
                ┌─────────▼─────────┐      ┌─────────▼─────────┐
                │ userStore.token = │      │ onFailure(err)    │
                │   新 token        │      │ → responseError   │
                └─────────┬─────────┘      └─────────┬─────────┘
                          ▼                          ▼
                对 A/B/C 依次重试              A/B/C 全部 reject(failure)
                execute(options, retried=true)
                          │
                          ▼
重新走 requestInterceptors
                 （注入新 token），最终 resolve
                          │
                          ▼
                ┌─────────┴─────────────────────┐
                │   由最外层 execute 统一收尾   │
                │   hideLoading + responseComplete │
                └───────────────────────────────┘
```

### 关键点

1. **并发收敛**：同一 `Request` 实例下，N 个并发请求同时收到 token 过期码时，`refreshTokenMethod()` **只调用一次**，全部用同一份新 token 重试。
2. **重试携带新 token**：刷新成功后，库用**原始 options** 递归调用 `execute(options, retried=true)`。由于 `requestInterceptors` 每次都会执行，重试时会自动注入新 token（store 已更新）。
3. **Loading 保持**：token 刷新期间原 Promise 仍 pending，外层 `execute` 的 `finally` 不触发；重试结束后由最外层统一 `hideLoading` 并调用 `responseComplete`。
4. **失败收尾**：`refreshTokenMethod()` 返回 `false` 或抛错时，所有等待中的请求统一 `reject(failure)`（`failure` 是 `Error` 对象），并触发一次 `responseError`。`responseSuccess` **不会**再次执行。

### 与 HTTP 401 的区别

| 触发 | 入口 | 处理 |
| --- | --- | --- |
| `HTTP 200` + `code=401` | `shouldRefreshToken` 命中 | 进刷新队列 → 成功后用新 token 重试 |
| `HTTP 401` | `responseSuccess` 命中 | 清空登录态 + 跳登录页 + reject（**不进刷新**，因为 refreshToken 通常也已失效） |

两者职责分离，由 `shouldRefreshToken`（HTTP 200 + 业务码 401）和 `responseSuccess`（HTTP 401）分别承担。

### 图文示例

![1](/problem/1.png)

* 请求test接口，在test接口未返回数据的过程中请求test1接口

![2](/problem/2.png)

* test返回了token过期的数据。请求了刷新token接口。test1也是返回了token过期的数据，会和test接口一样在请求队列中挂起。等待刷新token接口返回新的token。

![3](/problem/3.png)

* 刷新接口返回新token，会使用新token重新请求 test 和 test1 接口。返回了正确的数据。