# 版本说明

## v2026-05-14-stable

**发布日期：** 2026-05-14

**Git 标签：** `v2026-05-14-stable`

**提交哈希：** `86db2c0`

---

### 主要更新

#### 1. 修复问题
- ✅ 修复 `journey-timeline.tsx` 缺失的 `useLanguage` 导入
- ✅ 修复 `next.config.js` webpack 函数未返回 config 的问题
- ✅ 修复邮箱地址：`yun.he@miner.cn` → `yun.he@aminer.cn`

#### 2. 内容更新

**产业伙伴**
- 更新为企业列表：智谱、字节跳动、阿里达摩院、腾讯、滴滴、OPPO、......
- 中英文版本同步更新

**海外网络**（原社区生态）
- 更新为海外高校：达特茅斯学院、麻省理工学院、卡内基梅隆大学、俄亥俄州立大学、杜克大学、香港大学
- 中英文版本同步更新

#### 3. 导航栏优化
- 新增 `Interact` 模块链接
- 导航顺序：Ecosystem → Interact → Journey → Contact

#### 4. AI 交互模块人设优化

**核心变化：**
- 从"定义型人格"改为"观察型"
- 去除"正确的大词"：长期主义、系统思维等
- 增加不确定性：允许"我怀疑""可能""还在理解"
- 不总输出观点，更多描述观察
- 增加现场感："最近发现""很多学生已经"
- 去金句化：半句话、未完成、偶尔口语

**目标：**
- 不像"人设"，更像"人"
- 不像"前沿思想者"，更像"长期观察现场的人"
- 让用户感觉"Helen好像真的长期在那个世界里"

#### 5. 默认问题更新

**中文：**
- Scaling 之后还剩什么？
- Agent 更像员工还是组织？
- 为什么 research taste 很重要？
- 什么会比模型更稀缺？
- AI 会重写组织结构吗？
- 搜索今天的AI热点新闻

**英文：**
- What's left after Scaling?
- Are Agents more like employees or organizations?
- Why does research taste matter?
- What will be scarcer than models?
- Will AI rewrite organizational structures?
- Search for today's AI news

#### 6. Contact 区域重新设计

**左侧：CONTACT**
- yun.he@aminer.cn
- 北京，中国 / Beijing, China

**右侧：OPEN THREADS / 开放中的思考**
- Most systems fail slowly.
- Communities are harder to scale than models.
- The next bottleneck may not be intelligence.
- Still connecting the dots between research, systems, and people.
- Open to thoughtful conversations.

**设计理念：**
- 去除三个 CTA 按钮
- 去除订阅表单
- 增加"研究者工作台"气质
- 保持克制感
- 不是"欢迎合作联系我"，而是"这里持续发生一些关于 AGI、系统与人的思考"

---

### 文件变更

```
modified:   next.config.js
modified:   src/app/api/chat/route.ts
modified:   src/app/page.tsx
modified:   src/components/ai-console.tsx
modified:   src/components/contact.tsx
modified:   src/components/ecosystem.tsx
modified:   src/components/footer.tsx
modified:   src/components/journey-timeline.tsx
modified:   src/components/navbar.tsx
modified:   src/contexts/language-context.tsx
```

---

### 回退方法

```bash
cd /Users/helen/he-yun-personal-website

# 查看所有标签
git tag -l

# 回退到这个版本
git checkout v2026-05-14-stable

# 回到最新版本
git checkout main
```

---

## 之前版本

### v20260513235239

**发布日期：** 2026-05-13

**Git 标签：** `v20260513235239`

初始稳定版本。

---

## 版本管理

创建新版本标签：
```bash
git tag -a v版本名 -m "版本描述"
git push origin --tags
```

查看版本历史：
```bash
git log --oneline
git tag -l
```
