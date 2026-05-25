#!/bin/bash
# 自动推送脚本
# 使用方法：./auto-push.sh 或 sh auto-push.sh

cd "$(dirname "$0")"

echo "🚀 开始推送..."
echo ""

# 切换到SSH方式
git remote set-url origin git@github.com:helenheyun0614-collab/he-yun-personal-website.git

# 推送
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
else
    echo ""
    echo "❌ 推送失败，请检查网络或VPN"
fi
