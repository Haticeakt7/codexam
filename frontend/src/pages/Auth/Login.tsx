// ==========================================================
// Login – Giriş Sayfası
// ROUTE: /login  (GuestRoute korumalı: giriş yapılmışsa /dashboard veya /admin'e yönlendirir)
// ==========================================================
//
// AMAÇ:
//   Kullanıcının e-posta ve şifresiyle giriş yapmasını sağlar.
//   Başarılı girişte authStore güncellenir; GuestRoute rolüne göre yönlendirir.
//
// BAĞLI HOOKLAR:
//   - useLogin()  → @/hooks/useAuth  → POST /api/auth/login
//                   isPending: giriş isteği sürüyor mu
//                   onSuccess: authStore otomatik güncellenir, GuestRoute yönlendirir
//                   onError: hata mesajı form içinde gösterilecek
//
// FORM STATE:
//   - email: string
//   - password: string
//   - error: string  → API'den dönen hata mesajı (ör. "Geçersiz kimlik bilgileri")
//
// SUBMIT AKIŞI:
//   form.onSubmit → e.preventDefault() → login({ email, password })
//                → isPending → buton disabled + loading spinner
//                → onError → setError("Giriş başarısız")
//                → onSuccess → GuestRoute otomatik yönlendirir (rol bazlı)
//
// UI TASARIM:
//   Sayfa tam ekran, orta yatay + dikey hizalanmış kart yapısı.
//
//   ┌───────────────────────────────────────────┐
//   │  [CodExam]  ← büyük, kalın marka yazısı  │
//   │  "Hesabınıza giriş yapın" ← alt yazı     │
//   │                                           │
//   │  ┌───────────────────────────────────┐    │
//   │  │  E-posta              [________] │    │
//   │  │  Şifre                [________] │    │
//   │  │                                   │    │
//   │  │  [! Hata mesajı - yalnızca hata] │    │
//   │  │                                   │    │
//   │  │  [ Giriş Yap        ] ← buton   │    │
//   │  └───────────────────────────────────┘    │
//   │                                           │
//   │  "Hesabınız yok mu?" [Kayıt Ol] link     │
//   └───────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Form kart: beyaz/surface arka plan, border, rounded-xl, shadow-sm
//     - Buton: full-width, primary renk, loading state destekli
//     - Hata mesajı: kırmızı arka planlı küçük metin kutusu (danger/10)
//     - Marka yazısı: indigo/primary renk
//     - Register linki: /register'a yönlendirir
//     - Responsive: mobil ve desktop'ta aynı kart görünümü, max-w-sm
//
// NAVIGASYON:
//   - "Kayıt Ol" link → /register
//   - Başarılı login → GuestRoute yönlendirir (User → /dashboard, Admin → /admin)
// ==========================================================

import { useState } from "react";
import { useLogin } from "@/hooks/useAuth";

export default function Login() {
  // const { mutate: login, isPending } = useLogin();
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [error, setError] = useState("");

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");
  //   login(
  //     { email, password },
  //     { onError: () => setError("Geçersiz e-posta veya şifre.") }
  //   );
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useLogin;
  return null;
}
