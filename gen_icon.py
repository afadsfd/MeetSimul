#!/usr/bin/env python3
"""生成苹果风格 App 图标 - 翻译/语音主题"""
from PIL import Image, ImageDraw, ImageFont
import math

def create_apple_icon(size=1024):
    """苹果风格圆角矩形图标 - 深蓝渐变 + 白色波形"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 苹果圆角比例 (约 22.37% 的超椭圆)
    r = int(size * 0.2237)
    
    # 绘制渐变背景
    for y in range(size):
        t = y / size
        # 深蓝到靛蓝渐变 (类似 Apple Translate 风格)
        cr = int(10 + t * 30)
        cg = int(30 + t * 50)
        cb = int(80 + t * 100)
        color = (cr, cg, cb, 255)
        draw.line([(0, y), (size, y)], fill=color)
    
    # 裁剪为圆角矩形 (超椭圆)
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=r, fill=255)
    img.putalpha(mask)
    
    # 绘制白色声波图案
    cx, cy = size // 2, size // 2
    wave_color = (255, 255, 255)
    
    # 中心竖线
    bar_w = int(size * 0.035)
    bar_h = int(size * 0.30)
    x = cx - bar_w // 2
    y = cy - bar_h // 2
    draw.rounded_rectangle([(x, y), (x + bar_w, y + bar_h)], radius=bar_w//2, fill=wave_color)
    
    # 左右对称的声波条
    gaps = int(size * 0.065)
    heights = [0.22, 0.16, 0.10]
    
    for i, h_ratio in enumerate(heights):
        bh = int(size * h_ratio)
        offset = gaps * (i + 1)
        by = cy - bh // 2
        
        # 左
        lx = cx - offset - bar_w // 2
        draw.rounded_rectangle([(lx, by), (lx + bar_w, by + bh)], radius=bar_w//2, fill=wave_color)
        # 右
        rx = cx + offset - bar_w // 2
        draw.rounded_rectangle([(rx, by), (rx + bar_w, by + bh)], radius=bar_w//2, fill=wave_color)
    
    # 底部半透明弧线 (麦克风暗示)
    arc_r = int(size * 0.22)
    arc_w = int(size * 0.02)
    arc_y = cy + int(size * 0.08)
    arc_bbox = [(cx - arc_r, arc_y), (cx + arc_r, arc_y + arc_r * 2)]
    
    for offset in range(arc_w):
        arc_color = (255, 255, 255, 60)
        draw.arc(
            [(arc_bbox[0][0]-offset, arc_bbox[0][1]-offset), 
             (arc_bbox[1][0]+offset, arc_bbox[1][1]+offset)],
            200, 340, fill=arc_color, width=2
        )
    
    return img

def main():
    base = "/Users/zero/Desktop/EchoClone_Project/frontend/src-tauri/icons"
    
    # 生成 1024x1024 基础图标
    icon = create_apple_icon(1024)
    icon.save(f"{base}/icon.png")
    print("✅ icon.png (1024x1024)")
    
    # 生成各尺寸
    sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
    }
    
    for name, sz in sizes.items():
        resized = icon.resize((sz, sz), Image.LANCZOS)
        resized.save(f"{base}/{name}")
        print(f"✅ {name} ({sz}x{sz})")
    
    # 生成 .icns (macOS)
    # sips 可以从 png 转换
    import os
    os.system(f"sips -s format icns {base}/icon.png --out {base}/icon.icns 2>/dev/null")
    print("✅ icon.icns")
    
    # 生成 .ico (Windows)
    icon_32 = icon.resize((32, 32), Image.LANCZOS)
    icon_64 = icon.resize((64, 64), Image.LANCZOS)
    icon_128 = icon.resize((128, 128), Image.LANCZOS)
    icon_256 = icon.resize((256, 256), Image.LANCZOS)
    icon_256.save(f"{base}/icon.ico", format='ICO', sizes=[(32,32),(64,64),(128,128),(256,256)])
    print("✅ icon.ico")

if __name__ == "__main__":
    main()
