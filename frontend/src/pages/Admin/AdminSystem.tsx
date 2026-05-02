// ==========================================================
// AdminSystem – Sistem Logları
// ROUTE: /admin/system  (Admin only)
// ==========================================================
//
// AMAÇ:
//   API, Runner ve Nginx kaynaklı hata loglarını listeler.
//   Kaynak ve tarih bazlı filtreleme sunar.
//
// BAĞLI HOOKLAR:
//   - useAdminSystemLogs()   → @/hooks/useAdmin → GET /api/admin/logs
//                              data: SystemErrorLog[], isLoading: boolean
//                              Her kayıt: { id, sourceService, errorTitle,
//                                          errorMessage, stackTrace, createdAt }
//
// LOCAL STATE:
//   - sourceFilter: "all" | "API" | "Runner" | "Nginx"
//   - expandedLog: string | null → genişletilmiş log ID (stack trace görüntülemek için)
//
// UI TASARIM:
//   AdminLayout içinde filtre + log listesi.
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Sistem Logları                                             │
//   │  [Tümü ▾] ← kaynak filtresi (API / Runner / Nginx)         │
//   ├─────────────────────────────────────────────────────────────┤
//   │  Zaman         Kaynak    Başlık                   [Detay]  │
//   │  14:32 bugün   [API]     Null reference exception    [▼]   │
//   │  ├── Mesaj: Object reference not set to an...              │
//   │  └── StackTrace: at CodExam.Api.Controllers...             │
//   │  13:15 bugün   [Runner]  Container timeout            [▼]   │
//   │  ...                                                        │
//   └─────────────────────────────────────────────────────────────┘
//
//   Log satırı tasarım notları:
//     - Kaynak badge: API=mavi, Runner=turuncu, Nginx=gri
//     - [▼/▲] toggle ile stack trace genişletilir/daraltılır
//     - Stack trace: monospace font, soluk renk, max yükseklik + scroll
//     - Zaman: "14:32 · 29 Nis 2026" formatı
//     - isLoading: Spinner
//     - Boş: EmptyState "Log kaydı bulunamadı"
//
// NAVIGASYON:
//   - Herhangi bir özel navigasyon yok
// ==========================================================

import { useAdminSystemLogs } from "@/hooks/useAdmin";

export default function AdminSystem() {
  // const { data: logs, isLoading } = useAdminSystemLogs();
  // const [sourceFilter, setSourceFilter] = useState<"all" | "API" | "Runner" | "Nginx">("all");
  // const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAdminSystemLogs;
  return null;
}
