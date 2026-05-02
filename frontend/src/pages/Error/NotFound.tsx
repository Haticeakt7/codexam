// ==========================================================
// NotFound – 404 Sayfası
// ROUTE: /404  (App.tsx'de * → /404 yönlendirmesi)
// ==========================================================
//
// AMAÇ:
//   Kullanıcı var olmayan bir URL'ye gittiğinde gösterilir.
//   Anasayfaya veya önceki sayfaya dönüş imkânı verir.
//
// UI TASARIM:
//   Sayfa ortasında hata bloğu, minimal ve net.
//
//   ┌─────────────────────────────────────┐
//   │                                     │
//   │    404                              │
//   │    Sayfa bulunamadı                 │
//   │                                     │
//   │    "Aradığınız sayfa mevcut         │
//   │     değil veya taşınmış olabilir."  │
//   │                                     │
//   │    [ Ana Sayfaya Dön ]              │
//   │                                     │
//   └─────────────────────────────────────┘
//
//   Tasarım notları:
//     - "404" rakamı büyük ve muted renkte
//     - Açıklayıcı alt metin küçük ve muted
//     - Buton: / rotasına yönlendirir
//     - Sayfa background: bg-bg
//
// NAVIGASYON:
//   - Buton / Link → / (Ana sayfa)
// ==========================================================

export default function NotFound() {
  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  return null;
}
