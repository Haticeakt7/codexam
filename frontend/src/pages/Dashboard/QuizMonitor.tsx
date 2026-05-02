// ==========================================================
// QuizMonitor – Canlı Sınav İzleme
// ROUTE: /dashboard/quiz/:id/monitor  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Quiz sahibinin aktif sınavı gerçek zamanlı izlemesini sağlar.
//   Katılımcıların anlık kod durumunu, anti-cheat olaylarını görür;
//   uyarı gönderebilir ve katılımcıyı sınavdan düşürebilir.
//
// URL PARAMS:
//   - :id → quiz ID
//
// BAĞLI HOOKLAR:
//   - useActiveSessions(id)   → @/hooks/useSessions → GET /api/quizzes/:id/sessions/active
//                               Sayfa açılınca ilk katılımcı listesini yükler
//
//   (İleride SignalR gerçekten bağlanacak - şu an stub):
//   - useSignalR hook veya doğrudan @microsoft/signalr bağlantısı
//     Dinlenecek olaylar:
//       "session.joined"      → yeni katılımcı kart eklenir
//       "session.codeChanged" → ilgili katılımcının son kodu güncellenir
//       "session.heartbeat"   → son aktivite zamanı güncellenir
//       "session.event"       → anti-cheat badge sayacı artar; High=kırmızı kart
//     Gönderilecek olaylar:
//       "monitor.warn"        → { sessionId, message } → katılımcıya uyarı
//       "monitor.terminate"   → { sessionId } → katılımcıyı sınavdan düşür
//
// LOCAL STATE:
//   - participants: SessionView[] → katılımcı listesi (SignalR ile güncellenir)
//   - selectedParticipant: SessionView | null → yan panelde gösterilecek
//   - warnTarget: SessionView | null → uyarı gönderme modalı
//   - warnMessage: string → uyarı mesajı
//   - terminateTarget: SessionView | null → sınavdan düşürme onayı
//
// UI TASARIM:
//   DashboardLayout içinde katılımcı grid + yan panel.
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Canlı İzleme: [Quiz Başlığı]     [● Canlı] [X katılımcı]  │
//   ├──────────────────────────────┬──────────────────────────────┤
//   │  Katılımcı Grid              │  Seçili Katılımcı Paneli    │
//   │  ─────────────────────────   │  ─────────────────────────  │
//   │  ┌──────┐ ┌──────┐ ┌──────┐ │  Ad: Ahmet Yılmaz           │
//   │  │ Ahmet│ │ Ayşe │ │ Mert │ │  Soru: 2/5                  │
//   │  │ 2/5  │ │ 3/5  │ │ 1/5  │ │  Son aktivite: 30sn önce    │
//   │  │ ⚠3   │ │      │ │ 🔴5  │ │                             │
//   │  │[Uyarı│ │[Uyarı│ │[Uyarı│ │  [Monaco readonly editörü]  │
//   │  │][Düş]│ │][Düş]│ │][Düş]│ │  Son kod snapshot'ı burada │
//   │  └──────┘ └──────┘ └──────┘ │                             │
//   │                              │  [Uyarı Gönder]  [Düşür]   │
//   └──────────────────────────────┴──────────────────────────────┘
//
//   Katılımcı kartı tasarım notları:
//     - Üst: form verisi (Ad Soyad veya seçilen alan)
//     - Orta: aktif soru numarası / tamamlanan
//     - Son aktivite: "X sn önce" (heartbeat'ten hesaplanır)
//     - Anti-cheat badge: sarı (Low/Medium) veya kırmızı (High) olay sayısı
//       → High event varsa kartın kenarı kırmızıya döner
//     - Tıklanınca selectedParticipant set edilir, yan panel açılır
//     - [Uyarı] ve [Düşür] mini butonlar kart üzerinde
//
//   Uyarı Gönder modalı:
//     - "Katılımcıya mesaj gönder" başlığı
//     - textarea: uyarı mesajı
//     - [Gönder] → monitor.warn SignalR event
//
//   Sınavdan Düşür onayı:
//     - ConfirmDialog: "Bu katılımcı sınavdan düşürülecek"
//     - [Onayla] → monitor.terminate → backend session'ı kilitler
//
//   Yan panel:
//     - Katılımcı bilgileri
//     - Monaco editörü (readOnly: true) → participants'ın son kod snapshot'ı
//     - Tam ekran butonu (opsiyonel)
//
// NAVIGASYON:
//   - ← Geri → /dashboard
//   - Sonuçlar için → /dashboard/quiz/:id/results (link)
// ==========================================================

import { useParams } from "react-router-dom";
import { useActiveSessions } from "@/hooks/useSessions";
import type { QuizSession } from "@/api/types";

export default function QuizMonitor() {
  // const { id } = useParams<{ id: string }>();
  // const { data: sessions } = useActiveSessions(id!);

  // const [participants, setParticipants] = useState<QuizSession[]>([]);
  // const [selectedParticipant, setSelectedParticipant] = useState<QuizSession | null>(null);
  // const [warnTarget, setWarnTarget] = useState<QuizSession | null>(null);
  // const [warnMessage, setWarnMessage] = useState("");
  // const [terminateTarget, setTerminateTarget] = useState<QuizSession | null>(null);

  // SignalR bağlantısı (henüz stub):
  // useEffect(() => {
  //   const connection = new HubConnectionBuilder()
  //     .withUrl("/hubs/monitor", { accessTokenFactory: () => authStore.getState().accessToken ?? "" })
  //     .withAutomaticReconnect()
  //     .build();
  //   connection.on("session.joined", (session) => setParticipants(prev => [...prev, session]));
  //   connection.on("session.codeChanged", ({ sessionId, code }) => { ... });
  //   connection.on("session.event", ({ sessionId, severity }) => { ... });
  //   connection.start();
  //   return () => { connection.stop(); };
  // }, [id]);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useParams; void useActiveSessions;
  const _: QuizSession | null = null; void _;
  return null;
}
