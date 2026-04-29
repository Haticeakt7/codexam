// ==========================================================
// Home – Ana Sayfa (Anonim Kod Editörü)
// ROUTE: /  (public, auth gerekmez)
// ==========================================================
//
// AMAÇ:
//   Kayıtsız kullanıcıların dil seçip kod yazıp çalıştırabildiği sayfa.
//   CodExam'ın vitrini; platformu tanıtan ilk ekran.
//
// BAĞLI HOOKLAR:
//   - useRunCode()    → @/hooks/useExecute  → POST /api/execute (polling ile çalıştırma)
//                       run({ language, code, stdin? }) → editorStore.output güncellenir
//                       editorStore.isRunning → true iken çalışıyor
//
// BAĞLI STORE'LAR:
//   - useEditorStore() → language, setLanguage, code, setCode,
//                        stdin, setStdin, output, isRunning
//     Not: output = { stdout, stderr, status, timeMs, memKb } | null
//     Dil değişince STARTERS map'ten starter snippet otomatik set edilir (editorStore içinde)
//
//   - useThemeStore()  → uiTheme → Monaco temasını senkronize etmek için
//                        uiTheme === "dark" → "vs-dark", diğer → "vs"
//
// LOCAL STATE:
//   - stdinOpen: boolean → stdin panelini aç/kapat (varsayılan: false)
//
// ÇALIŞTIRMA AKIŞI:
//   [▶ Çalıştır] buton tıkla → run({ language, code, stdin: stdinOpen ? stdin : undefined })
//   editorStore.isRunning = true → output panelinde spinner
//   useExecute polling → sonuç gelince editorStore.output güncellenir, isRunning = false
//   output.status: "Passed" → yeşil badge, "Error"/"TLE"/"Failed" → kırmızı badge
//
// UI TASARIM:
//   AppLayout içinde tam yükseklik (vh - header) iki panel split layout.
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  [AppLayout Header: logo, i18n, tema, dil seçimi, Run btn] │
//   ├───────────────────────────┬──────────────────────────────────┤
//   │                           │  Çıktı Başlığı  [Status Badge]  │
//   │   Monaco Editör           │  ─────────────────────────────── │
//   │   (editorStore.code)      │  > Hello, World!                 │
//   │   height: 100%            │                                  │
//   │                           │  [Spinner - isRunning ise]       │
//   │  [stdin panel - açıksa]   │  stdout veya stderr içeriği      │
//   │  ┌─────────────────────┐  │                                  │
//   │  │  stdin textarea     │  │  ─────────────────────────────── │
//   │  └─────────────────────┘  │  Süre: 42ms · Bellek: 8 MB      │
//   └───────────────────────────┴──────────────────────────────────┘
//
//   Araç çubuğu (header altı, editör üstü):
//     - Dil seçici dropdown: Python 3 / Node.js / C++ 17
//       onChange → editorStore.setLanguage() → starter snippet güncellenir
//     - "stdin" toggle butonu → stdinOpen state
//     - [▶ Çalıştır] butonu: isRunning ise loading, tıkla → handleRun()
//
//   Output paneli (sağ taraf, sabit 360px genişlik):
//     - Başlık: "ÇIKTI" (uppercase, muted)
//     - Durum badge: Passed=yeşil, Failed/Error/TLE=kırmızı, Running/Pending=mavi
//     - isRunning: Spinner + "Çalışıyor..." yazısı
//     - Tamamlandı: <pre> içinde stdout/stderr, monospace font
//     - Boş (hiç çalıştırılmadı): "Kodu çalıştırmak için ▶ butonuna basın" ipucu metni
//     - Alt kısım: timeMs ve memKb bilgisi (varsa)
//
//   Monaco Editor seçenekleri:
//     - fontSize: 14, fontFamily: 'JetBrains Mono', monospace
//     - minimap: disabled, scrollBeyondLastLine: false
//     - lineNumbers: on, bracketPairColorization: true
//     - theme: themeStore'dan senkronize (vs / vs-dark)
//
// ==========================================================

import { useEditorStore } from "@/stores/editorStore";
import { useThemeStore } from "@/stores/themeStore";
import { useRunCode } from "@/hooks/useExecute";

export default function Home() {
  // const { language, setLanguage, code, setCode, stdin, setStdin, output, isRunning } = useEditorStore();
  // const { uiTheme } = useThemeStore();
  // const { run } = useRunCode();
  // const [stdinOpen, setStdinOpen] = useState(false);

  // const handleRun = () => {
  //   run({ language, code, stdin: stdinOpen ? stdin : undefined });
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useEditorStore; void useThemeStore; void useRunCode;
  return null;
}
