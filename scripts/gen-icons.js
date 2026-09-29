/**
 * 生成盲盒交友 TabBar PNG 图标
 * 纯 Node.js，无第三方依赖
 * 尺寸：81×81px
 *
 * 图标设计：
 *   发现页  → 爱心（盲盒交友核心情感符号）
 *   投放页  → 礼盒（盲盒符号，线框+蝴蝶结）
 *   我的    → 人形（头圆+身体弧线）
 */

const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE    = 81
const OUT_DIR = path.join(__dirname, '../static/images/nav')

const COLOR_OFF = [0x8b, 0x7a, 0xa0]  // #8b7aa0 未选中灰紫
const COLOR_ON  = [0xd4, 0xa8, 0xff]  // #d4a8ff 选中亮紫

// ─── PNG 编码 ────────────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}
function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii')
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length)
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([lb, tb, data, cb])
}
function makePNG(buf) {
  const sig  = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8; ihdr[9] = 6  // RGBA
  const raw = []
  for (let y = 0; y < SIZE; y++) {
    raw.push(0)
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      raw.push(buf[i], buf[i+1], buf[i+2], buf[i+3])
    }
  }
  const idat = zlib.deflateSync(Buffer.from(raw))
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ─── 画布工具 ────────────────────────────────────────────
class Canvas {
  constructor() { this.px = new Uint8Array(SIZE * SIZE * 4) }

  // 单像素（带 alpha 混合到透明背景）
  _put(x, y, r, g, b, a) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || a <= 0) return
    const i = (y * SIZE + x) * 4
    const aa = a / 255
    this.px[i]   = Math.round(r * aa + this.px[i]   * (1 - aa) * (this.px[i+3]/255)) 
    this.px[i+1] = Math.round(g * aa + this.px[i+1] * (1 - aa) * (this.px[i+3]/255))
    this.px[i+2] = Math.round(b * aa + this.px[i+2] * (1 - aa) * (this.px[i+3]/255))
    this.px[i+3] = Math.min(255, this.px[i+3] + Math.round(a * (1 - this.px[i+3]/255)))
  }

  // 实心圆（带边缘 AA）
  disc(cx, cy, radius, r, g, b, alpha = 255) {
    const r2 = radius * radius
    const x0 = Math.floor(cx - radius - 1), x1 = Math.ceil(cx + radius + 1)
    const y0 = Math.floor(cy - radius - 1), y1 = Math.ceil(cy + radius + 1)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        const a = Math.max(0, Math.min(1, radius + 0.5 - dist))
        if (a > 0) this._put(x, y, r, g, b, Math.round(a * alpha))
      }
    }
  }

  // 粗线段（用 disc 沿路径扫描）
  line(x0, y0, x1, y1, w, r, g, b, alpha = 255) {
    const dx = x1 - x0, dy = y1 - y0
    const len = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.ceil(len * 2))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      this.disc(x0 + dx * t, y0 + dy * t, w / 2, r, g, b, alpha)
    }
  }

  // 描边弧（起止角度，顺时针）
  arc(cx, cy, radius, startA, endA, w, r, g, b, alpha = 255) {
    const steps = Math.ceil(Math.abs(endA - startA) * radius * 2)
    for (let i = 0; i <= steps; i++) {
      const a = startA + (endA - startA) * i / steps
      const x = cx + radius * Math.cos(a)
      const y = cy + radius * Math.sin(a)
      this.disc(x, y, w / 2, r, g, b, alpha)
    }
  }

  // 填充水平扫描线矩形
  fillRect(x, y, w, h, r, g, b, alpha = 255) {
    for (let py = Math.floor(y); py <= Math.ceil(y + h); py++) {
      for (let px = Math.floor(x); px <= Math.ceil(x + w); px++) {
        this._put(px, py, r, g, b, alpha)
      }
    }
  }

  toPNG() { return makePNG(this.px) }
}

// ─── 图标设计 ────────────────────────────────────────────
const CX = SIZE / 2   // 40.5
const CY = SIZE / 2

/**
 * 爱心（发现页）
 * 两个圆 + 底部 V 形，统一用路径采样
 */
function drawHeart(c, [r, g, b]) {
  const W = 3.5  // 笔触宽度

  // 爱心路径参数方程（标准心形曲线）
  // x = 16 sin³(t)
  // y = 13 cos(t) − 5 cos(2t) − 2 cos(3t) − cos(4t)
  const scale = 2.55
  const offY  = 4   // 向上微调让图标垂直居中

  const steps = 400
  let prevX, prevY
  for (let i = 0; i <= steps; i++) {
    const t  = (i / steps) * 2 * Math.PI
    const hx = 16 * Math.sin(t) ** 3
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))
    const px = CX + hx * scale
    const py = CY + hy * scale + offY

    if (i > 0) {
      c.line(prevX, prevY, px, py, W, r, g, b)
    }
    prevX = px; prevY = py
  }
  // 中心小点缀
  c.disc(CX, CY + offY + 2, 3.5, r, g, b)
}

/**
 * 礼盒（投放页）
 * 盒身线框 + 盒盖 + 蝴蝶结
 */
function drawGiftBox(c, [r, g, b]) {
  const W = 3.2

  // 盒身外框
  const bx = 13, by = 35, bw = 55, bh = 34
  c.line(bx, by, bx+bw, by, W, r, g, b)           // 顶边
  c.line(bx, by+bh, bx+bw, by+bh, W, r, g, b)     // 底边
  c.line(bx, by, bx, by+bh, W, r, g, b)            // 左边
  c.line(bx+bw, by, bx+bw, by+bh, W, r, g, b)     // 右边
  // 盒身中竖线
  c.line(CX, by, CX, by+bh, W*0.8, r, g, b)

  // 盒盖（盖在盒身上方，稍宽）
  const lx = 10, ly = 26, lw = 61, lh = 12
  c.line(lx, ly, lx+lw, ly, W, r, g, b)           // 盖顶边
  c.line(lx, ly+lh, lx+lw, ly+lh, W, r, g, b)    // 盖底边（=盒身顶边）
  c.line(lx, ly, lx, ly+lh, W, r, g, b)           // 盖左边
  c.line(lx+lw, ly, lx+lw, ly+lh, W, r, g, b)    // 盖右边
  // 盖中竖线
  c.line(CX, ly, CX, ly+lh, W*0.8, r, g, b)

  // 蝴蝶结：左弧
  c.arc(CX - 8, 20, 8, -Math.PI * 0.1, Math.PI * 1.1, W*0.9, r, g, b)
  // 蝴蝶结：右弧
  c.arc(CX + 8, 20, 8, -Math.PI * 1.1, Math.PI * 0.1, W*0.9, r, g, b)
  // 结点
  c.disc(CX, 20, 4.5, r, g, b)
}

/**
 * 人形（我的页）
 * 空心头圆 + 身体轮廓线
 */
function drawPerson(c, [r, g, b]) {
  const W = 3.5

  // 头部（空心圆）
  c.arc(CX, 22, 13, 0, 2 * Math.PI, W, r, g, b)

  // 身体：两肩斜线 + 底部弧
  // 肩部宽度
  const shoulderW = 22
  // 颈部接头位置
  const neckY = 35
  // 身体底部
  const bodyBottom = 72

  // 左侧身体线
  c.line(CX - 7,  neckY, CX - shoulderW, bodyBottom, W, r, g, b)
  // 右侧身体线
  c.line(CX + 7,  neckY, CX + shoulderW, bodyBottom, W, r, g, b)
  // 底部连线
  c.line(CX - shoulderW, bodyBottom, CX + shoulderW, bodyBottom, W, r, g, b)
}

/**
 * 漂流瓶（漂流瓶页）
 * 瓶身轮廓 + 瓶颈 + 软木塞 + 瓶内两条信纸线
 *
 * 垂直布局（y）：
 *   软木塞  y = 9  ~ 16
 *   瓶颈    y = 16 ~ 27
 *   肩部    y = 27 ~ 36 (斜线)
 *   瓶身    y = 36 ~ 55 (直身段)
 *   底弧    圆心 y = 55, r = 19 → 底边 y = 74
 *   整体中心 ≈ (9+74)/2 = 41.5 ≈ CY ✓
 */
function drawBottle(c, [r, g, b]) {
  const W = 3.2

  // 瓶身底部弧（下半圆）
  c.arc(CX, 55, 19, 0, Math.PI, W, r, g, b)

  // 瓶身两侧竖线
  c.line(CX - 19, 36, CX - 19, 55, W, r, g, b)
  c.line(CX + 19, 36, CX + 19, 55, W, r, g, b)

  // 肩部斜线
  c.line(CX - 19, 36, CX - 8, 27, W, r, g, b)
  c.line(CX + 19, 36, CX + 8, 27, W, r, g, b)

  // 瓶颈
  c.line(CX - 8, 16, CX - 8, 27, W, r, g, b)
  c.line(CX + 8, 16, CX + 8, 27, W, r, g, b)

  // 瓶口横线
  c.line(CX - 8, 16, CX + 8, 16, W, r, g, b)

  // 软木塞（略宽于瓶颈的矩形）
  c.line(CX - 10, 9,  CX + 10, 9,  W, r, g, b)   // 塞顶
  c.line(CX - 10, 16, CX + 10, 16, W, r, g, b)   // 塞底（与瓶口重合）
  c.line(CX - 10, 9,  CX - 10, 16, W, r, g, b)   // 塞左
  c.line(CX + 10, 9,  CX + 10, 16, W, r, g, b)   // 塞右

  // 瓶内信纸（两条短横线，暗示装着信件）
  c.line(CX - 11, 43, CX + 11, 43, W * 0.75, r, g, b)
  c.line(CX - 8,  50, CX + 8,  50, W * 0.75, r, g, b)
}

// ─── 生成 ────────────────────────────────────────────────
const icons = [
  { name: 'tab-discover-off',  fn: drawHeart,    color: COLOR_OFF },
  { name: 'tab-discover-on',   fn: drawHeart,    color: COLOR_ON  },
  { name: 'tab-box-off',       fn: drawGiftBox,  color: COLOR_OFF },
  { name: 'tab-box-on',        fn: drawGiftBox,  color: COLOR_ON  },
  { name: 'tab-bottle-off',    fn: drawBottle,   color: COLOR_OFF },
  { name: 'tab-bottle-on',     fn: drawBottle,   color: COLOR_ON  },
  { name: 'tab-profile-off',   fn: drawPerson,   color: COLOR_OFF },
  { name: 'tab-profile-on',    fn: drawPerson,   color: COLOR_ON  },
]

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const icon of icons) {
  const cv = new Canvas()
  icon.fn(cv, icon.color)
  const buf  = cv.toPNG()
  const file = path.join(OUT_DIR, icon.name + '.png')
  fs.writeFileSync(file, buf)
  console.log(`✓ ${icon.name}.png  (${buf.length} bytes)`)
}
console.log('\nDone →', OUT_DIR)
