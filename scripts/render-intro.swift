// CUSTODI intro renderer — produces raw BGRA frames on stdout for ffmpeg, plus high-quality emblem upscales.
// Uses only Apple system frameworks (CoreGraphics, CoreText, CoreImage, ImageIO). No network, no stock footage.
//
//   swift scripts/render-intro.swift upscale                 → custodi-emblem@2x.png / @3x.png (Lanczos)
//   swift scripts/render-intro.swift frames <w> <h>           → raw BGRA frames (30 fps, 9 s) to stdout
//   swift scripts/render-intro.swift poster <w> <h> <t> <out> → one PNG frame
//
// Storyboard (seconds): 0–1 navy atmosphere + particles · 0.8–2.3 light beam · 1.5–3.6 emblem emerges, revealed
// top→bottom · 3.6–4.7 light pass over the metal · 4.3–5.5 emblem settles up · 4.9–6.3 CUSTODI wordmark ·
// 6.0–6.8 rule · 6.4–7.6 tagline · 8.2–9.0 fade to the site's navy.
import CoreGraphics
import CoreImage
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent().deletingLastPathComponent()
let assets = root.appendingPathComponent("apps/web/public/assets")
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

func loadPNG(_ url: URL) -> CGImage {
  let src = CGImageSourceCreateWithURL(url as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
func savePNG(_ img: CGImage, _ url: URL) {
  let dst = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dst, img, nil)
  CGImageDestinationFinalize(dst)
}
func lanczos(_ img: CGImage, scale: CGFloat) -> CGImage {
  let ci = CIImage(cgImage: img)
  let f = CIFilter(name: "CILanczosScaleTransform")!
  f.setValue(ci, forKey: kCIInputImageKey)
  f.setValue(scale, forKey: kCIInputScaleKey)
  f.setValue(1.0, forKey: kCIInputAspectRatioKey)
  let out = f.outputImage!
  let ctx = CIContext(options: [.workingColorSpace: srgb, .outputColorSpace: srgb])
  return ctx.createCGImage(out, from: out.extent.integral, format: .RGBA8, colorSpace: srgb)!
}
func color(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
  CGColor(srgbRed: CGFloat((hex >> 16) & 255) / 255, green: CGFloat((hex >> 8) & 255) / 255, blue: CGFloat(hex & 255) / 255, alpha: a)
}
func smooth(_ a: Double, _ b: Double, _ x: Double) -> CGFloat {
  let t = min(1, max(0, (x - a) / (b - a)))
  return CGFloat(t * t * (3 - 2 * t))
}

let mode = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "frames"
let emblemSrc = loadPNG(assets.appendingPathComponent("custodi-emblem.png"))

if mode == "upscale" {
  for s in [2, 3] {
    let up = lanczos(emblemSrc, scale: CGFloat(s))
    savePNG(up, assets.appendingPathComponent("custodi-emblem@\(s)x.png"))
    FileHandle.standardError.write("wrote custodi-emblem@\(s)x.png \(up.width)x\(up.height)\n".data(using: .utf8)!)
  }
  exit(0)
}

let W = Int(CommandLine.arguments[2])!, H = Int(CommandLine.arguments[3])!
let emblem = lanczos(emblemSrc, scale: 3) // render from the high-quality upscale
let portrait = H > W
let fps = 30.0, duration = 9.0

// Deterministic particles
var seed: UInt64 = 42
func rnd() -> Double { seed = seed &* 6364136223846793005 &+ 1442695040888963407; return Double(seed >> 33) / Double(1 << 31) }
let particles = (0..<(portrait ? 70 : 110)).map { _ in (x: rnd(), y: rnd(), r: rnd() * 1.6 + 0.4, v: rnd() * 0.012 + 0.004, a: rnd() * 0.5 + 0.15) }

func ctLine(_ text: String, font: String, size: CGFloat, kern: CGFloat, italic: Bool = false) -> CTLine {
  var f = CTFontCreateWithName(font as CFString, size, nil)
  if italic, let i = CTFontCreateCopyWithSymbolicTraits(f, size, nil, .traitItalic, .traitItalic) { f = i }
  let attrs: [NSAttributedString.Key: Any] = [.init(kCTFontAttributeName as String): f, .init(kCTKernAttributeName as String): kern, .init(kCTForegroundColorFromContextAttributeName as String): true]
  return CTLineCreateWithAttributedString(NSAttributedString(string: text, attributes: attrs))
}

func render(_ t: Double, into ctx: CGContext) {
  let w = CGFloat(W), h = CGFloat(H)
  ctx.saveGState()
  // Background: midnight navy radial atmosphere
  let bg = CGGradient(colorsSpace: srgb, colors: [color(0x132646), color(0x0a1529), color(0x050a15)] as CFArray, locations: [0, 0.45, 1])!
  ctx.drawRadialGradient(bg, startCenter: CGPoint(x: w / 2, y: h * 0.58), startRadius: 0, endCenter: CGPoint(x: w / 2, y: h * 0.58), endRadius: max(w, h) * 0.75, options: [.drawsAfterEndLocation])

  // Particles drifting upward
  let pAlpha = smooth(0, 1.2, t)
  for p in particles {
    let y = (p.y + p.v * t).truncatingRemainder(dividingBy: 1.04)
    ctx.setFillColor(color(0xaac4eb, CGFloat(p.a) * pAlpha))
    let r = CGFloat(p.r) * (w / 1920 + h / 1920)
    ctx.fillEllipse(in: CGRect(x: CGFloat(p.x) * w - r, y: CGFloat(y) * h - r, width: r * 2, height: r * 2))
  }

  // Controlled light beam behind the centre
  let beam = smooth(0.8, 2.3, t) * (1 - 0.45 * smooth(4.2, 5.4, t))
  if beam > 0 {
    ctx.saveGState()
    ctx.translateBy(x: w / 2, y: h * 0.56)
    ctx.scaleBy(x: 1, y: 1.9)
    let g = CGGradient(colorsSpace: srgb, colors: [color(0x78a0e1, 0.26 * beam), color(0x78a0e1, 0)] as CFArray, locations: [0, 1])!
    ctx.drawRadialGradient(g, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: min(w, h) * 0.42, options: [])
    ctx.restoreGState()
  }

  // Emblem
  let eh = portrait ? min(h * 0.30, w * 0.62 * 334 / 262) : h * 0.42
  let ew = eh * 262 / 334
  let settle = smooth(4.3, 5.5, t)
  let scale = 0.92 + 0.08 * smooth(1.5, 3.4, t) - 0.06 * settle
  let cy = h * (portrait ? 0.60 : 0.58) + h * 0.03 * settle
  let rect = CGRect(x: w / 2 - ew * scale / 2, y: cy - eh * scale / 2, width: ew * scale, height: eh * scale)
  let appear = smooth(1.5, 3.3, t)
  if appear > 0 {
    ctx.saveGState()
    ctx.setAlpha(appear)
    ctx.setShadow(offset: CGSize(width: 0, height: -eh * 0.05), blur: eh * 0.12, color: color(0x000000, 0.55))
    ctx.interpolationQuality = .high
    ctx.draw(emblem, in: rect)
    ctx.restoreGState()

    // Darkness withdraws top → bottom (progressive reveal) and overall brightness rises
    ctx.saveGState()
    ctx.clip(to: rect, mask: emblem)
    let reveal = Double(smooth(1.6, 3.8, t)) * 1.25 - 0.1 // 0 = nothing revealed, 1 = all
    let lineY = rect.maxY - rect.height * CGFloat(reveal)
    let soft = rect.height * 0.22
    let dark = color(0x050a15, 0.92 * (1 - smooth(3.0, 4.0, t) * 0.0) )
    let g = CGGradient(colorsSpace: srgb, colors: [color(0x050a15, 0), dark] as CFArray, locations: [0, 1])!
    ctx.drawLinearGradient(g, start: CGPoint(x: 0, y: lineY + soft / 2), end: CGPoint(x: 0, y: lineY - soft / 2), options: [.drawsAfterEndLocation])
    let dim = 1 - smooth(1.5, 3.6, t)
    if dim > 0 { ctx.setFillColor(color(0x050a15, 0.75 * dim)); ctx.fill(rect) }

    // Single light pass across the metal (3.6–4.7 s)
    let pass = Double(smooth(3.6, 4.7, t))
    if pass > 0 && pass < 1 {
      let x = rect.minX - rect.width * 0.6 + rect.width * 2.2 * CGFloat(pass)
      ctx.setBlendMode(.screen)
      let band = CGGradient(colorsSpace: srgb, colors: [color(0xffffff, 0), color(0xffffff, 0.42), color(0xffffff, 0)] as CFArray, locations: [0, 0.5, 1])!
      ctx.drawLinearGradient(band, start: CGPoint(x: x - rect.width * 0.18, y: rect.midY - rect.height * 0.12), end: CGPoint(x: x + rect.width * 0.18, y: rect.midY + rect.height * 0.12), options: [])
    }
    ctx.restoreGState()
  }

  // Wordmark: CUSTODI in Didot, letter-spacing tightening, metallic silver fill
  let wm = smooth(4.9, 6.3, t)
  let fontSize = portrait ? w * 0.09 : h * 0.085
  let textTop = rect.minY - h * (portrait ? 0.075 : 0.125)
  if wm > 0 {
    let kern = fontSize * (0.85 - 0.55 * wm)
    let line = ctLine("CUSTODI", font: "Didot", size: fontSize, kern: kern)
    let b = CTLineGetBoundsWithOptions(line, .useOpticalBounds)
    let x = w / 2 - (b.width - kern) / 2
    ctx.saveGState()
    ctx.setAlpha(wm)
    ctx.textPosition = CGPoint(x: x, y: textTop)
    ctx.setTextDrawingMode(.clip)
    CTLineDraw(line, ctx)
    let silver = CGGradient(colorsSpace: srgb, colors: [color(0xdde3ea), color(0x8e9aa8), color(0xc4ccd5), color(0xfbfcfd)] as CFArray, locations: [0, 0.48, 0.52, 1])!
    ctx.drawLinearGradient(silver, start: CGPoint(x: 0, y: textTop - fontSize * 0.1), end: CGPoint(x: 0, y: textTop + fontSize * 0.75), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    ctx.restoreGState()
  }

  // Rule
  let rule = smooth(6.0, 6.8, t)
  if rule > 0 {
    let rw = w * (portrait ? 0.16 : 0.06) * rule
    ctx.setFillColor(color(0x9fb4d4, 0.6))
    ctx.fill(CGRect(x: w / 2 - rw / 2, y: textTop - fontSize * 0.42, width: rw, height: max(1, h / 1080)))
  }

  // Tagline (two lines, second italic and dimmer)
  for (i, (txt, it, a)) in [("Think before you trust.", false, 0.92), ("Verify before you act.", true, 0.58)].enumerated() {
    let k = smooth(6.4 + Double(i) * 0.35, 7.2 + Double(i) * 0.35, t)
    if k <= 0 { continue }
    let size = portrait ? w * 0.05 : h * 0.034
    let line = ctLine(txt, font: "Didot", size: size, kern: 0, italic: it)
    let b = CTLineGetBoundsWithOptions(line, .useOpticalBounds)
    ctx.saveGState()
    ctx.setFillColor(color(0xeef2f7, CGFloat(a) * k))
    ctx.textPosition = CGPoint(x: w / 2 - b.width / 2, y: textTop - fontSize * 0.95 - CGFloat(i) * size * 1.35 - (1 - k) * size * 0.4)
    CTLineDraw(line, ctx)
    ctx.restoreGState()
  }

  // Fade into the site's navy (#0a1222) for a seamless hand-off to the homepage
  let out = smooth(8.2, 9.0, t)
  if out > 0 { ctx.setFillColor(color(0x0a1222, out)); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h)) }
  ctx.restoreGState()
}

func makeContext() -> CGContext {
  CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
}

if mode == "poster" {
  let t = Double(CommandLine.arguments[4])!
  let ctx = makeContext()
  render(t, into: ctx)
  savePNG(ctx.makeImage()!, URL(fileURLWithPath: CommandLine.arguments[5]))
  exit(0)
}

let out = FileHandle.standardOutput
let ctx = makeContext()
let frames = Int(duration * fps)
for i in 0..<frames {
  ctx.clear(CGRect(x: 0, y: 0, width: W, height: H))
  render(Double(i) / fps, into: ctx)
  let data = Data(bytes: ctx.data!, count: W * H * 4)
  out.write(data)
}
