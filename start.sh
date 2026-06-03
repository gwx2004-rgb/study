#!/bin/bash
# 使用项目内置 Node.js（无需系统安装 npm）
DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS="$DIR/.tools/bin"

if [ ! -x "$TOOLS/npm" ]; then
  echo "找不到 Node.js。"
  echo "请任选其一："
  echo "  1) 安装 Homebrew Node:  brew install node"
  echo "  2) 从旧项目复制:  cp -R ../language-acquisition-partner/.tools \"$DIR/.tools\""
  exit 1
fi

export PATH="$TOOLS:$PATH"
cd "$DIR"

if [ ! -d "node_modules" ]; then
  echo "首次运行，正在安装依赖..."
  npm install
fi

echo ""
echo "启动 Sofia → http://localhost:8080"
echo "首次进入：登录 → onboarding → 聊天"
echo "按 Ctrl+C 停止"
echo ""
npm run dev
