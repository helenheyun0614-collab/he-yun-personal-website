# 何芸个人官网

AI TIME负责人何芸的个人官方网站，展示其在AI教育领域的专业成就和贡献。

## 🌟 功能特点

- **响应式设计** - 适配桌面和移动设备
- **现代化UI** - 使用 Tailwind CSS 和 Framer Motion
- **性能优化** - Next.js 14 + TypeScript
- **SEO友好** - 支持元数据和结构化数据
- **动画效果** - 流畅的页面滚动和交互动画

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 首页
├── components/         # React 组件
│   ├── navbar.tsx      # 导航栏
│   ├── footer.tsx      # 页脚
│   ├── hero.tsx        # 首页英雄区
│   ├── about.tsx       # 关于我
│   ├── achievements.tsx # 主要成就
│   ├── activities.tsx  # AI TIME 活动
│   ├── timeline.tsx    # 发展历程
│   └── contact.tsx     # 联系方式
├── lib/               # 工具函数
└── styles/            # 样式文件
```

## 🎨 自定义配置

### 修改颜色主题

编辑 `tailwind.config.js` 文件：

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#0ea5e9',    // 修改主色调
        600: '#0284c7',
        // ...
      },
    },
  },
}
```

### 修改个人信息

在 `src/components/` 下的相应组件中修改：

- `hero.tsx` - 修改名字和标题
- `about.tsx` - 修改个人介绍
- `achievements.tsx` - 修改成就数据
- `activities.tsx` - 修改活动信息

## 🔧 部署

### GitHub Pages

```bash
# 安装 gh-pages
npm install gh-pages --save-dev

# 修改 package.json
"scripts": {
  "deploy": "gh-pages -d out"
}

# 构建并部署
npm run build
npm run deploy
```

### Vercel

1. 推送代码到 GitHub
2. 连接 Vercel 账户
3. 导入项目并自动部署

### Netlify

1. 推送代码到 GitHub
2. 在 Netlify 中导入仓库
3. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `out`

## 📝 开发指南

### 添加新页面

1. 在 `src/app/` 下创建新文件夹
2. 添加 `page.tsx` 文件
3. 在导航栏添加链接

### 修改组件

- 所有组件都使用 TypeScript
- 使用 Framer Motion 实现动画
- 响应式设计使用 Tailwind CSS 类

### 添加新功能

1. 在 `src/lib/` 添加工具函数
2. 在 `src/components/` 添加新组件
3. 在相应页面中使用组件

## 📞 联系方式

如有问题或建议，请联系：
- 邮箱：contact@ai-time.org

## 📄 许可证

本项目采用 MIT 许可证。