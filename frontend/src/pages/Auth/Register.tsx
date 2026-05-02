// ==========================================================
// Register – Kayıt Sayfası
// ROUTE: /register  (GuestRoute korumalı)
// ==========================================================
//
// AMAÇ:
//   Yeni kullanıcı oluşturur. Başarılı kayıtta otomatik giriş yapılır;
//   GuestRoute kullanıcıyı /dashboard'a yönlendirir.
//
// BAĞLI HOOKLAR:
//   - useRegister()  → @/hooks/useAuth  → POST /api/auth/register
//                      isPending: istek sürüyor mu
//                      onSuccess: authStore güncellenir, GuestRoute yönlendirir
//                      onError: form hatası gösterilecek
//
// FORM STATE:
//   - displayName: string  → Görünen ad (ad soyad)
//   - email: string
//   - password: string
//   - confirmPassword: string
//   - errors: Record<string, string>  → Alan bazlı hata mesajları + form geneli hata
//
// VALIDASYON (client-side, submit öncesi):
//   - displayName: boş olmamalı
//   - email: "@" içermeli
//   - password: minimum 8 karakter
//   - confirmPassword: password ile eşleşmeli
//
// SUBMIT AKIŞI:
//   form.onSubmit → validate() → hata yoksa register({ displayName, email, password })
//                → isPending → buton loading
//                → onError → errors.form mesajı
//                → onSuccess → GuestRoute yönlendirir
//
// UI TASARIM:
//   Login ile aynı kart yapısı, 4 input alanı.
//
//   ┌───────────────────────────────────────────┐
//   │  [CodExam]                                │
//   │  "Yeni hesap oluşturun"                  │
//   │                                           │
//   │  ┌───────────────────────────────────┐    │
//   │  │  Görünen Ad           [________] │    │
//   │  │  E-posta              [________] │    │
//   │  │  Şifre                [________] │    │
//   │  │  Şifre Onayı          [________] │    │
//   │  │                                   │    │
//   │  │  [! Genel hata - varsa]          │    │
//   │  │                                   │    │
//   │  │  [ Kayıt Ol         ] ← buton   │    │
//   │  └───────────────────────────────────┘    │
//   │                                           │
//   │  "Zaten hesabınız var mı?" [Giriş Yap]   │
//   └───────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Her input altında alan bazlı hata mesajı gösterilebilir (Input.error prop)
//     - Şifre alanı: "minimum 8 karakter" helper text
//     - Form geneli hata: kırmızı arka planlı metin kutusu
//     - Login ile aynı kart stili (tutarlılık)
//     - Responsive: max-w-sm
//
// NAVIGASYON:
//   - "Giriş Yap" link → /login
//   - Başarılı kayıt → GuestRoute yönlendirir (User → /dashboard)
// ==========================================================

import { useState } from "react";
import { useRegister } from "@/hooks/useAuth";

export default function Register() {
  // const { mutate: register, isPending } = useRegister();
  // const [displayName, setDisplayName] = useState("");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [errors, setErrors] = useState<Record<string, string>>({});

  // const validate = () => {
  //   const next: Record<string, string> = {};
  //   if (!displayName.trim()) next.displayName = "Ad gereklidir";
  //   if (!email.includes("@")) next.email = "Geçerli bir e-posta girin";
  //   if (password.length < 8) next.password = "En az 8 karakter";
  //   if (password !== confirmPassword) next.confirmPassword = "Şifreler eşleşmiyor";
  //   setErrors(next);
  //   return Object.keys(next).length === 0;
  // };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!validate()) return;
  //   register(
  //     { displayName, email, password },
  //     { onError: () => setErrors({ form: "Kayıt oluşturulamadı. Lütfen tekrar deneyin." }) }
  //   );
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useRegister;
  return null;
}
