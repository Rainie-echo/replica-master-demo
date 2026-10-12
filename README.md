# 复刻大师 Web Demo

静态交互 Demo，包含模板制作、口播编辑、批量方案与批量结果。

## 在线发布

将这些文件上传至 GitHub 仓库根目录，在 Settings → Pages 选择 Deploy from a branch，分支 main，目录 / (root)。

## 本地运行

```sh
python3 -m http.server 8880
```

打开 http://localhost:8880/。

演示交互运行于浏览器，AI 解析与视频生成使用模拟逻辑。任务和修改保存于各访客浏览器，不会共享到其他访客。
