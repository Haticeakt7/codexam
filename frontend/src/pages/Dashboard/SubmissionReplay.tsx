// ==========================================================
// SubmissionReplay – Submission Replay Oynatıcı
// ROUTE: /dashboard/quiz/:id/replay/:sessionId  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Bir katılımcının belirli bir soruya verdiği cevabın yazım sürecini
//   diff-bazlı olarak adım adım oynatır.
//   Anti-cheat olayları zaman çizelgesinde gösterilir.
//
// URL PARAMS:
//   - :id        → quiz ID
//   - :sessionId → session ID
//
// BAĞLI HOOKLAR:
//   - useReplay(sessionId)    → @/hooks/useSessions → GET /api/sessions/:sessionId/replay
//                               data: { diffs: ReplayDiff[], events: AntiCheatEvent[] }
//                               isLoading: boolean
//
//   ReplayDiff: { time_ms: number, diff: string } | { type: "snapshot", code: string, time_ms: number }
//   AntiCheatEvent: { timestamp, eventType, severity }
//
// LOCAL STATE:
//   - currentIndex: number → şu an gösterilen diff index'i
//   - isPlaying: boolean → otomatik oynatma devam ediyor mu
//   - speed: 0.5 | 1 | 2 → oynatma hızı çarpanı
//   - currentCode: string → Monaco'da gösterilen kod (diff'ler uygulanarak hesaplanır)
//
// OYNATMA MANTIĞI:
//   - Play: her (1000 / speed) ms'de currentIndex++ ve diff uygula
//   - Diff uygulama: önceki kod + diff → yeni kod (diff formatı belirlenecek)
//   - Snapshot görülünce: doğrudan currentCode = snapshot.code (diff zincirsizleştirme)
//   - İleri/Geri ok: currentIndex ±1
//   - Timeline slider: currentIndex / diffs.length bağlantılı
//   - Oynatma bitince: isPlaying = false, son konumda durur
//
// UI TASARIM:
//   DashboardLayout içinde tam yükseklik oynatıcı.
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Replay: [Katılımcı Adı] – [Quiz Başlığı]   ← Geri         │
//   ├──────────────────────────────────────────────────────────────┤
//   │                                                              │
//   │  [Monaco Editör – readOnly: true]                           │
//   │  Kodun diff animasyonla güncellendi görüntüsü               │
//   │                                                              │
//   ├──────────────────────────────────────────────────────────────┤
//   │  Anti-Cheat Olayları Timeline (renkli noktalar):            │
//   │  ──●────────●────────────●────────────────────────────────  │
//   │    ↑(Low)   ↑(Medium)    ↑(High=kırmızı)                   │
//   ├──────────────────────────────────────────────────────────────┤
//   │  [|◀] [◀] [▶/⏸] [▶|]    ●─────────────○   [0.5x][1x][2x] │
//   │  Başa  Geri  Oynat İleri  Timeline slider   Hız seçimi      │
//   │                           [00:14 / 02:30]                   │
//   └──────────────────────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Monaco: readOnly=true, language diff'ten belirlenir
//     - Timeline slider: 0 → toplam süre (ms veya saniye)
//     - Anti-cheat noktaları: Low=sarı, Medium=turuncu, High=kırmızı
//       Hover'da tooltip: "TabSwitch – 00:30"
//     - Hız butonları: aktif olan vurgulu
//     - isLoading: tüm içerik yerine Spinner
//     - Replay verisi yoksa EmptyState: "Bu soru için replay kaydı yok"
//
// NAVIGASYON:
//   - ← Geri → /dashboard/quiz/:id/results
// ==========================================================

import { useParams } from "react-router-dom";
import { useReplay } from "@/hooks/useSessions";

export default function SubmissionReplay() {
  // const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  // const { data, isLoading } = useReplay(sessionId!);

  // const [currentIndex, setCurrentIndex] = useState(0);
  // const [isPlaying, setIsPlaying] = useState(false);
  // const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  // const [currentCode, setCurrentCode] = useState("");
  // const intervalRef = useRef<number | null>(null);

  // Play/Pause mantığı:
  // useEffect(() => {
  //   if (isPlaying) {
  //     intervalRef.current = setInterval(() => {
  //       setCurrentIndex(prev => {
  //         if (prev >= diffs.length - 1) { setIsPlaying(false); return prev; }
  //         applyDiff(diffs[prev + 1]);
  //         return prev + 1;
  //       });
  //     }, 1000 / speed);
  //   }
  //   return () => clearInterval(intervalRef.current!);
  // }, [isPlaying, speed]);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useParams; void useReplay;
  return null;
}
