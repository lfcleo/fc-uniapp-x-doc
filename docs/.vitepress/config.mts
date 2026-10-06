import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "FC-Uniapp-X",
    description: "uniapp-x快速开发框架",
    base: "/fc-uniapp-x-doc/",
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    cleanUrls: true,
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: { src: '/favicon.ico', type: "image/png", width: 24, height: 24 },
        nav: [
            { text: '指南', link: '/guide/introduce/install' },
            { text: '组件', link: '/component/introduce' },
            { text: '插件市场', link: 'https://ext.dcloud.net.cn/plugin?id=26616' },
        ],

        outline: 'deep',    // 侧边栏目录深度

        search: {
            provider: 'local',
            options: {
                locales: {
                    root: {
                        translations: {
                            button: {
                                buttonText: '搜索文档',
                                buttonAriaLabel: '搜索文档'
                            },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换',
                                    closeText: '关闭'
                                }
                            }
                        }
                    }
                }
            }
        },

        sidebar: {
            '/guide/': {
                base: '/guide/',
                items: [
                    {
                        base: "/guide/introduce",
                        text: "简介",
                        collapsed: false,
                        items: [
                            { text: '什么是FC-Uniapp-X?', link: '/index' },
                            { text: '安装使用', link: '/install' },
                            { text: '脚手架命令', link: '/cli' },
                            { text: '目录结构', link: '/directory' },
                        ]
                    },
                    {
                        base: "/guide/base",
                        text: "功能模块",
                        collapsed: false,
                        items: [
                            { text: '【store】全局变量状态', link: '/store' },
                            { text: '【router】路由跳转和拦截', link: '/router' },
                            { text: '【theme】应用主题', link: '/theme' },
                            { text: '【i18n】多语言', link: '/i18n' },
                            { text: '【request】网络请求', link: '/request' },
                            { text: '【upload】网络上传', link: '/upload' },
                            { text: '【download】网络下载', link: '/download' },
                            { text: '【stream】流式响应', link: '/stream' },
                            { text: '【websocket】长链接', link: '/websocket' },
                            { text: '【privacy】隐私协议', link: '/privacy' },
                            { text: '【permission】系统权限', link: '/permission' },
                            { text: '【push】通知推送', link: '/push' },
                            { text: '【update】应用更新', link: '/update' },
                            { text: '【tool】工具类', link: '/util' },
                        ]
                    },
                    {
                        base: "/guide/app",
                        text: "APP/小程序专题",
                        collapsed: false,
                        items: [
                            { text: '苹果证书申请', link: '/apple' },
                            { text: '鸿蒙证书申请', link: '/harmony' },
                            { text: 'dcloud推送配置', link: '/dcloud' },
                        ]
                    },
                    {
                        text: '常见问题',
                        link: '/problem'
                    }
                ]
            },
            '/component/': {
                base: '/component/',
                items: [
                    { text: '介绍', link: '/introduce' },
                    { text: 'fc-liquid-glass液态玻璃', link: '/liquid' },
                ]
            },
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/lfcleo/fc-uniapp-x' },
            { icon: 'gitee', link: 'https://gitee.com/lfcleo/fc-uniapp-x' },
        ]
    }
})
