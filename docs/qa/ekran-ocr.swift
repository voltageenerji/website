// iOS Simülatörü ekran görüntülerinin PİKSELSİZ özeti (macOS Vision OCR).
// !!! Görüntülerdeki rakamlar UYDURMA TEST VERİSİDİR. Çıktı yalnız "beklenen ifade var mı" doğru/yanlış
// ve tanınan satır sayısıdır; tanınan metnin kendisi basılmaz.
//   swift docs/qa/ekran-ocr.swift <görüntü.png> "<ifade1>|<ifade2>|…" ["<olmaması gereken1>|…"]
import Foundation
import Vision
import AppKit

func katla(_ s: String) -> String {
  return s.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: Locale(identifier: "tr_TR")).replacingOccurrences(of: " ", with: "")
}
let a = CommandLine.arguments
guard a.count >= 3, let img = NSImage(contentsOfFile: a[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  print("\(a.count > 1 ? (a[1] as NSString).lastPathComponent : "?"): görüntü okunamadı"); exit(1)
}
let istek = VNRecognizeTextRequest()
istek.recognitionLevel = .accurate
istek.recognitionLanguages = ["tr-TR", "en-US"]
istek.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([istek])
let satirlar = (istek.results ?? []).compactMap { $0.topCandidates(1).first?.string }
let hepsi = katla(satirlar.joined(separator: " "))
let ad = (a[1] as NSString).lastPathComponent
var kotu = 0
var cikti = "\(ad): \(cg.width)x\(cg.height) px, \(satirlar.count) metin satırı"
for i in a[2].split(separator: "|") { let v = hepsi.contains(katla(String(i))); if !v { kotu += 1 }; cikti += " · '\(i)' \(v ? "VAR" : "YOK")" }
if a.count > 3 { for i in a[3].split(separator: "|") { let v = hepsi.contains(katla(String(i))); if v { kotu += 1 }; cikti += " · olmamalı '\(i)' \(v ? "VAR!" : "yok")" } }
print(cikti)
exit(kotu == 0 ? 0 : 1)
