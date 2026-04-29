// ==========================================================
// DemoBanner – Demo Modu Uyarı Bandı
// ==========================================================
//
// KOŞUL:
//   VITE_DEMO_MODE env değişkeni truthy değilse → null döner (render yok)
//   VITE_DEMO_MODE=true ise → sayfanın altında sabit uyarı bandı görünür
//
// TASARIM NOTLARI:
//   - fixed bottom-0, full width, z-50
//   - bg-amber-500, text-amber-950 (sarı/koyu kontrast)
//   - Sol: "Demo Modu — Backend bağlantısı yok. Veriler seed datadan gelmektedir."
//   - Sağ (sm+ ekranlarda): giriş bilgileri (admin + user)
//     - E-posta ve şifre: <code> stili bg-amber-600/30 px-1 rounded
//   - App.tsx'te <Toaster /> ile birlikte global olarak eklenir
//
// KULLANIM:
//   App.tsx içinde bir kez eklenir, tüm sayfalarda görünür
//   <DemoBanner />
//
// ==========================================================

export default function DemoBanner() {
  if (!import.meta.env.VITE_DEMO_MODE) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-6 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <span>
        Demo Modu — Backend bağlantısı yok. Veriler seed datadan gelmektedir.
      </span>
      <span className="hidden gap-4 sm:flex">
        <span>
          Admin: <code className="rounded bg-amber-600/30 px-1">admin@demo.com</code>
          {" / "}
          <code className="rounded bg-amber-600/30 px-1">demo1234</code>
        </span>
        <span>
          Kullanıcı: <code className="rounded bg-amber-600/30 px-1">user@demo.com</code>
          {" / "}
          <code className="rounded bg-amber-600/30 px-1">demo1234</code>
        </span>
      </span>
    </div>
  );
}
