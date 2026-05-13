# GLM API 配置说明

## 获取 GLM API Key

1. 访问智谱AI开放平台：https://open.bigmodel.cn/
2. 注册/登录账号
3. 进入控制台，创建API Key
4. 复制生成的API Key

## 配置步骤

1. 打开项目根目录下的 `.env.local` 文件
2. 将 `your-glm-api-key-here` 替换为你的真实API Key
3. 保存文件

```bash
GLM_API_KEY=your-actual-glm-api-key-here
```

## 重启开发服务器

配置完成后，重启开发服务器以加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
yarn dev
```

## 功能说明

现在你的网站将使用真正的GLM AI模型进行对话：

- **智能对话**：基于GLM-4模型，支持中文和英文
- **人设设定**：AI会以Helen（AI TIME创始人）的身份回答问题
- **上下文理解**：能够记住对话历史，进行连续对话
- **安全设计**：API Key在服务器端存储，不会暴露给前端

## 测试

访问 http://localhost:3000，找到 "Ask Helen" 部分：

1. 输入任何问题，如 "AI TIME是什么？"
2. 点击发送或按回车
3. AI会基于GLM模型给出智能回复

## 常见问题

**Q: API调用失败怎么办？**
- 检查API Key是否正确
- 确认智谱AI账户有足够的调用额度
- 检查网络连接

**Q: 如何切换模型？**
- 编辑 `src/app/api/chat/route.ts` 文件
- 修改 `model: 'glm-4'` 为其他模型，如 `'glm-3-turbo'`

**Q: 如何调整AI的回答风格？**
- 编辑 `src/app/api/chat/route.ts` 中的 `systemMessage`
- 修改系统提示词来调整AI的人设和回答风格

## 技术架构

```
用户 → AI Console组件 → /api/chat路由 → GLM API → AI回复
```

这种架构确保了API Key的安全性，同时提供了流畅的用户体验。
