// ==========================================================
// Toaster – Bildirim Toast Sistemi
// ==========================================================
//
// AMAÇ:
//   useToastStore'dan gelen toast listesini sağ alt köşede sıralı gösterir.
//   App.tsx içinde global olarak mount edilir.
//
// BAĞLI STORE:
//   - useToastStore() → toasts: Toast[], dismiss(id)
//   - Toast type: { id, type, message }
//   - type: "success" | "error" | "warning" | "info"
//
// TOAST EKLEMEk (başka bileşenlerden):
//   const { add } = useToastStore();
//   add({ type: "success", message: "Quiz kaydedildi!" });
//   add({ type: "error",   message: "Bir hata oluştu." });
//
// TASARIM NOTLARI:
//   - fixed bottom-4 right-4, z-[100], flex-col gap-2
//   - Her toast: min-w-[280px] max-w-sm, rounded-xl, border, shadow-lg, backdrop-blur-sm
//   - animate-in slide-in-from-bottom-2 → aşağıdan kayarak girer
//   - success: border-success/30 bg-success/10 text-success (✓ ikonu)
//   - error:   border-danger/30 bg-danger/10 text-danger   (✕ ikonu)
//   - warning: border-warning/30 bg-warning/10 text-warning (⚠ ikonu)
//   - info:    border-blue-500/30 bg-blue-500/10 text-blue-500 (ℹ ikonu)
//   - Her toast sağ üstte ✕ kapatma butonu içerir
//   - aria-live="polite" → ekran okuyucu bildirimi
//
// ==========================================================

import { useToastStore, type ToastType } from "@/stores/toastStore";

const iconMap: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
};

const colorMap: Record<ToastType, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error:   "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info:    "border-blue-500/30 bg-blue-500/10 text-blue-500",
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 ${colorMap[t.type]}`}
        >
          <span className="mt-px text-sm font-bold">{iconMap[t.type]}</span>
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
