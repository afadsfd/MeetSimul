# EchoClone 安装指南

## 环境要求
- macOS 10.15+ 
- Python 3.8+
- Node.js 16+

## 1. 安装 BlackHole 2ch（音频路由）

### 方法一：Homebrew（推荐）
```bash
brew install blackhole-2ch
```

### 方法二：手动安装
1. 下载 BlackHole：https://github.com/ExistentialAudio/BlackHole/releases
2. 双击安装包，按提示完成安装

### 授权音频扩展
1. 打开 **系统偏好设置** → **安全性与隐私** → **隐私**
2. 选择 **麦克风**（或音频输入）
3. 添加 **BlackHole 2ch** 到允许的应用列表

## 2. 配置音频路由

### 在音频 MIDI 设置中创建聚合设备
1. 打开 **应用程序** → **实用工具** → **音频 MIDI 设置**
2. 点击左下角 **+** → 创建 **聚合设备**
3. 勾选：
   - 内建麦克风
   - BlackHole 2ch

### 设置系统音频输出
1. 点击菜单栏音量图标
2. 选择 **聚合设备** 作为输出

## 3. 安装 Python 依赖

```bash
# 进入项目目录
cd EchoClone_Project

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

## 4. 启动应用

### 启动后端
```bash
python3 api_engine.py
```

### 启动前端（新终端）
```bash
cd frontend
npm install
npm run dev
```

## 5. 使用

1. 打开浏览器访问：http://localhost:3000
2. 确保系统音频输出设置为 **BlackHole 2ch** 或 **聚合设备**
3. 开始使用！

## 故障排除

### 问题：没有声音
- 检查 BlackHole 2ch 是否在"辅助功能"中授权
- 确认音频输出设备是否正确

### 问题：麦克风无法使用
- 在系统偏好设置中授权麦克风权限
