// ==========================================================
// Forbidden – 403 Sayfası
// ROUTE: /403  (PrivateRoute: rol uyumsuzluğunda buraya yönlendirir)
// ==========================================================
//
// AMAÇ:
//   Kullanıcı yetkisi olmayan bir sayfaya erişmeye çalıştığında gösterilir.
//   PrivateRoute bileşeni rol kontrolü yapar; uyumsuzlukta /403'e yönlendirir.
//
// UI TASARIM:
//   NotFound ile benzer yapı, farklı mesaj.
//
//   ┌─────────────────────────────────────┐
//   │                                     │
//   │    403                              │
//   │    Erişim Reddedildi                │
//   │                                     │
//   │    "Bu sayfaya erişim yetkiniz      │
//   │     bulunmuyor."                    │
//   │                                     │
//   │    [ Ana Sayfaya Dön ]              │
//   │                                     │
//   └─────────────────────────────────────┘
//
//   Tasarım notları:
//     - 404 sayfasıyla tutarlı stil
//     - "403" rakamı danger/kırmızı renkte olabilir (yetkisizliği vurgular)
//     - Buton: kullanıcı rolüne göre /dashboard veya / rotasına yönlendirir
//       → authStore.user?.role kontrol edilebilir
//
// BAĞLI STORE'LAR:
//   - useAuthStore() → user.role → yönlendirme kararı için opsiyonel
//
// NAVIGASYON:
//   - Buton → / veya /dashboard (role göre)
// ==========================================================

export default function Forbidden() {
  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  return null;
}
