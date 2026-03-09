#!/bin/bash

# EchoClone 一键启动脚本

# 检查 BlackHole 2ch 是否安装
echo "🔍 检查 BlackHole 2ch..."

# 检查是否安装了 BlackHole
if [ -d "/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver" ] || [ -d "$HOME/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver" ]; then
    BLACKHOLE_INSTALLED=true
else
    # 尝试通过 brew 检查
    if command -v brew &> /dev/null; then
        if brew list --cask | grep -q "blackhole-2ch"; then
            BLACKHOLE_INSTALLED=true
        else
            BLACKHOLE_INSTALLED=false
        fi
    else
        BLACKHOLE_INSTALLED=false
    fi
fi

# 如果没有安装 BlackHole，显示安装指南
if [ "$BLACKHOLE_INSTALLED" = false ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           请先安装 BlackHole 2ch 音频路由                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # 显示安装指南
    cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📥 安装 BlackHole 2ch

  方法一：Homebrew（推荐）
  ─────────────────────────
  1. 打开终端，运行：
     
     brew install blackhole-2ch
  
  方法二：手动下载
  ─────────────────────────
  1. 访问：https://github.com/ExistentialAudio/BlackHole/releases
  2. 下载 BlackHole2ch.dmg
  3. 双击安装

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚙️ 授权音频扩展

  1. 打开「系统设置」→「隐私与安全性」→「麦克风」
  2. 允许 BlackHole 2ch 访问

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️ 安装完成后，请重新运行此脚本！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

    echo ""
    read -p "按回车键退出..."
    exit 1
fi

echo "✅ 检测到 BlackHole 2ch，开始启动..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未检测到 Python，请先安装 Python 3"
    read -p "按回车键退出..."
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "📦 安装依赖..."
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# 启动后端
echo "🔧 启动后端服务..."
python3 api_engine.py &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端
cd frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# 等待服务启动
sleep 3

# 自动打开浏览器
open http://localhost:3000

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      ✅ 启动成功！                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "   🌐 正在打开浏览器: http://localhost:3000"
echo ""
echo "   按 Ctrl+C 停止服务"
echo ""

# 捕获退出信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 保持运行
wait
