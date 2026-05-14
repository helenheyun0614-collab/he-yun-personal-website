# JourneyTimeline（历程）组件

## 组件位置
- **文件路径**：`/Users/helen/he-yun-personal-website/src/components/journey-timeline.tsx`
- **导入方式**：在 `src/app/page.tsx` 中使用 `import { JourneyTimeline } from '@/components/journey-timeline'`

## 功能说明

### 自动轮播功能
JourneyTimeline 组件会自动轮播展示不同年份的故事，每 5 秒切换一次。

### 数据配置
- **故事数据**：中英文双语，包含年份、标题、观察和图片路径
- **图片路径**：`/public/images/1.jpg` 到 `/public/images/8.jpg`
- **控制逻辑**：通过 `useState` 管理当前索引和播放状态

### 使用方法

1. **查看组件内容**：
   ```bash
   cat /Users/helen/he-yun-personal-website/src/components/journey-timeline.tsx
   ```

2. **修改图片**：
   - 替换 `public/images/` 目录中的图片文件
   - 确保文件名和路径正确

3. **调整轮播速度**：
   - 修改 `setInterval` 的时间（当前是 5000ms）

### 交互功能
- **左侧/右侧按钮**：`prevSlide()` 和 `nextSlide()`
- **底部指示器**：显示当前位置的圆点
- **暂停/播放按钮**：切换 `isPlaying` 状态

---

**当前版本**：所有组件都恢复并正常工作
- Hero（主页）
- ThinkingStream（思想流）
- Ecosystem（生态网络）
- AIConsole（聊天）
- Contact（联系）
- JourneyTimeline（历程 - 自动轮播）

**日期**：2026-05-14
