# 目录结构

初始化项目的目录文件结构
```tree
├── fcuni                       # fc-uniapp-x 框架封装目录，不要修改其中的内容
├── modules                     # 模块配置目录，各个模块配置在这里
│   └── router
├── pages                       # 页面目录
│   └── index
├── static                      # 静态资源目录
│   └── logo.png
├── .editorconfig
├── .gitignore
├── App.uvue                    # 应用入口文件
├── index.html
├── main.uts
├── manifest.json
├── pages.json
├── platformConfig.json
├── uni.scss
└── vite.config.ts
```

相比较官方的uniapp-x项目目录结构，仅增加了`fcuni`,`modules`目录和`vite.config.ts`文件。主要关注下`modules`目录，各个模块的配置都在这里设置。注意不要修改 `fcuni` 目录中的内容。
