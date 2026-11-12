# 晒名片 · 微信小程序

原生微信小程序工程，复用已部署的「晒名片」H5 后端 API，导入微信开发者工具即可运行。

## 导入运行

1. 微信开发者工具 → 导入项目 → 选择本目录 `miniprogram/`
2. AppID 填自己的小程序 AppID；没有可选「测试号」（工程默认 `touristappid`）
3. 详情 → 本地设置 → 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
4. 编译即可看到名片首页

## 配置

- 后端地址：`utils/config.js` 中的 `BASE_URL`，默认指向已部署服务 `https://37j93srfi2hyzkq3et5.traesite.cn`
- 正式发布前，在小程序后台「开发管理 → 服务器域名」把该域名同时加入 **request 合法域名** 和 **downloadFile 合法域名**（分享页二维码与保存相册需要）
- 更换后端时只需修改 `BASE_URL`，接口协议不变

## 页面

| 页面 | 说明 |
| --- | --- |
| `pages/index` | 名片首页：Hero、统计、快捷入口、简介/产品/案例/资质/视频、自定义菜单、中英切换、小程序分享 |
| `pages/chat` | AI 数字分身对话：知识库来源、建议追问、两轮后内联留资入口 |
| `pages/lead` | 无好友留言，提交后返回意向评分与等级 |
| `pages/booking` | 预约诊断：日期/时段（含占用态）、线上或到厂 |
| `pages/pay` | 方案商店：产品选择、微信/支付宝/跨境支付演示下单 |
| `pages/share` | 二维码分享、复制链接、保存二维码到相册、NFC 说明 |

## 复用的接口

`GET /api/bootstrap`、`POST /api/track`、`POST /api/ai/chat`、`POST /api/leads`、`GET /api/slots`、`POST /api/appointments`、`POST /api/orders`、`GET /api/qr`

## 说明

- 支付、NFC 写入为可交互演示流程，接入真实微信支付需在服务端下单并调用 `wx.requestPayment`
- 视频播放需替换为企业视频源；当前点击给出演示提示
- 名片内容、知识库、团队继承等仍在 H5 企业后台维护，小程序读取同一份数据，做到「一次修改，全端同步」
