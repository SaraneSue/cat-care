# 猫咪照料 · 自用 PWA

一个只给自己用的猫咪照料清单：打开就知道今天要做什么，勾完就完事。

- 无账号、无服务器、无通知：数据只存在你手机的浏览器里
- 支持多个家庭，每个家庭多只猫：全家共享的任务（加水加粮）和每只猫自己的任务（体检、剪指甲）
- 可添加/切换家庭，各家庭的数据互相隔离
- 6 类照料模板、周期任务与预约任务
- 每天多次的任务可逐次记录；称体重可记录数值并查看趋势图
- 可安装到手机桌面，断网也能用

## 本地预览

```bash
cd pwa
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

想先看看填满数据的样子，加 `?seed=1`：`http://localhost:8000/?seed=1`

## 部署到 GitHub Pages

1. 在 GitHub 新建一个 **public** 仓库，名字随意，比如 `cat-care`。
2. 在本目录执行（把地址换成你的仓库）：

```bash
git init -b main
git add .
git commit -m "猫咪照料 PWA v1"
git remote add origin https://github.com/<你的用户名>/cat-care.git
git push -u origin main
```

3. 打开仓库 → **Settings → Pages**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**，目录选 **/ (root)**
   - 保存
4. 等 1–2 分钟，访问 `https://<你的用户名>.github.io/cat-care/`

> 仓库必须是 public（免费账号的 Pages 不支持私有仓库），代码里没有任何隐私数据，数据都在手机本地。

## 装到手机桌面

Android Chrome 打开上面的网址 → 右上角菜单 → **添加到主屏幕 / 安装应用**。之后从桌面图标打开就是全屏，和 App 一样。

iPhone 用 Safari 打开 → 分享 → **添加到主屏幕**（PWA 在 iOS 上能用，但存储可能被系统清理，自用 Android 不受影响）。

## 数据与备份

- 数据存在浏览器的 `localStorage`，**换手机、清缓存、卸载浏览器都会丢**。
- 所以「我的 → 导出备份」会下载一个 JSON 文件，换设备时用「导入恢复」。
- 建议每两周导一次，文件丢到网盘或发给自己。

## 开发

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面骨架 |
| `styles.css` | 所有样式（奶油薄荷配色） |
| `logic.js` | 纯逻辑：到期判断、排序、完成/跳过/顺延、周统计 |
| `app.js` | 渲染、事件、存储、导入导出 |
| `sw.js` | 离线缓存 |
| `manifest.webmanifest` | PWA 配置 |

跑逻辑测试：

```bash
node test/logic.test.js
```

改完代码要更新 `sw.js` 里的 `CACHE` 版本号（如 `catcare-v2`），否则手机上可能还是旧缓存。
