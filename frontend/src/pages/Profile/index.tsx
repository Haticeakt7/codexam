// ==========================================================
// Profile – Kullanıcı Profili
// ROUTE: /profile  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Giriş yapmış kullanıcının hesap bilgilerini görüntülemesi ve güncellemesi.
//
// BAĞLI STORE'LAR:
//   - useAuthStore() → user (id, email, displayName, role) → profil bilgileri
//
// BAĞLI HOOKLAR:
//   (İleride eklenecek)
//   - useUpdateProfile() → PUT /api/auth/me → görünen ad güncelleme
//   - useChangePassword() → PUT /api/auth/password → şifre değiştirme
//
// LOCAL STATE:
//   - displayName: string → düzenlenebilir görünen ad
//   - currentPassword: string
//   - newPassword: string
//   - confirmNewPassword: string
//   - successMessage: string → güncelleme başarılıysa gösterilecek
//   - errorMessage: string
//
// UI TASARIM:
//   DashboardLayout içinde iki bölümlü kart yapısı.
//
//   ┌─────────────────────────────────────────────┐
//   │  Profil Bilgileri                           │
//   │  ─────────────────────────────────────────  │
//   │  Görünen Ad:   [________] [Kaydet]          │
//   │  E-posta:       user@example.com (readonly) │
//   │  Rol:           User | Admin (badge)        │
//   │  Üyelik tarihi: 12 Ocak 2026               │
//   └─────────────────────────────────────────────┘
//
//   ┌─────────────────────────────────────────────┐
//   │  Şifre Değiştir                             │
//   │  ─────────────────────────────────────────  │
//   │  Mevcut Şifre:  [________]                  │
//   │  Yeni Şifre:    [________] (min 8 karakter) │
//   │  Onay:          [________]                  │
//   │                                             │
//   │  [! Hata mesajı - varsa]                   │
//   │  [✓ Başarı mesajı - varsa]                 │
//   │                                             │
//   │  [Şifreyi Güncelle]                         │
//   └─────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Rol badge: User=default renk, Admin=primary renk
//     - E-posta alanı: disabled/readonly, değiştirilemez
//     - Şifre alanı validasyonu: yeni şifre min 8 karakter, onay eşleşmeli
//
// NAVIGASYON:
//   - Ayrı navigasyon yok; DashboardLayout sidebar'dan diğer sayfalara geçilir
// ==========================================================

import { useAuthStore } from "@/stores/authStore";

export default function Profile() {
  // const { user } = useAuthStore();
  // const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  // const [currentPassword, setCurrentPassword] = useState("");
  // const [newPassword, setNewPassword] = useState("");
  // const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAuthStore;
  return null;
}
