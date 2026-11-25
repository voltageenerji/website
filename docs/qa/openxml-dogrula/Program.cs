// /dengesizlik-maliyeti XLSX dosyalarını Open XML SDK (OpenXmlValidator) ile doğrular.
// !!! Girdi dosyaları UYDURMA TEST VERİSİDİR (docs/qa/dengesizlik-dosya-uret.mjs).
// Kullanım: dotnet run -- <dosya.xlsx> [...]
// Çıktı: dosya başına sürüm ve hata sayısı; hata satırında yalnız hata kimliği, türü ve XPath
// (hücre değeri basılmaz). Herhangi bir hata varsa çıkış kodu 1.
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

var surumler = new[] { FileFormatVersions.Office2019, FileFormatVersions.Office2021, FileFormatVersions.Microsoft365 };
var toplam = 0;
var dosya = 0;
Console.WriteLine($"# DocumentFormat.OpenXml {typeof(OpenXmlValidator).Assembly.GetName().Version}");
foreach (var yol in args)
{
    dosya++;
    try
    {
        using var belge = SpreadsheetDocument.Open(yol, false);
        var sayfa = belge.WorkbookPart?.WorksheetParts.Count() ?? 0;
        foreach (var s in surumler)
        {
            var hatalar = new OpenXmlValidator(s).Validate(belge).ToList();
            toplam += hatalar.Count;
            Console.WriteLine($"{Path.GetFileName(yol)} · {s}: {sayfa} sayfa, {hatalar.Count} hata");
            foreach (var h in hatalar.Take(10))
                Console.WriteLine($"  {h.Id} {h.ErrorType} {h.Path?.XPath} ({h.Part?.Uri})");
        }
    }
    catch (Exception e)
    {
        toplam++;
        Console.WriteLine($"{Path.GetFileName(yol)}: AÇILAMADI ({e.GetType().Name})");
    }
}
Console.WriteLine($"\n{dosya} dosya, toplam {toplam} hata");
return toplam == 0 && dosya > 0 ? 0 : 1;
