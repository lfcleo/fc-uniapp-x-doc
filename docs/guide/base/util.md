# 工具类

## 防抖

```ts
const debouncedSearch = FC.Tool.debounce(() => {

}, 300)
```

## 节流

```ts
const throttledScroll = FC.Tool.throttle(() => {

}, 500)
```

## 延时

```ts
await FC.Tool.sleep(1000)
```

## UUID

```ts
const id = FC.Tool.uuid()
```

## 深克隆

```ts
const clonedData = FC.Tool.clone(data)
```

## 空值

```ts
const empty = FC.Tool.isEmpty(value)
```

## 图片压缩

```ts
const path = await FC.Tool.compressImage(src)
const limited = await FC.Tool.compressImage(src, 400)
```

## 文件大小

```ts
const size = await FC.Tool.getFileSize(src)
```

## 取色

```ts
const color = FC.Tool.randomColor('商品名称')
const darkColor = FC.Tool.randomColor('商品名称', true)
```
