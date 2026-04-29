// ==========================================================
// Modal – Merkezi Diyalog/Popup Bileşeni
// ==========================================================
//
// PROPS:
//   - open:          boolean   → modal açık mı?
//   - onClose:       () => void → backdrop tıklama veya Escape'de çağrılır
//   - title?:        string    → modal başlığı + ✕ kapat butonu
//   - children:      ReactNode → modal gövdesi
//   - size?:         "sm" | "md" | "lg"  (default: "md")
//   - footer?:       ReactNode → sağ hizalı buton satırı (border-t)
//
// TASARIM NOTLARI:
//   - createPortal ile document.body'e mount edilir (z-index sorunsuz)
//   - Backdrop: bg-black/50 backdrop-blur-sm, tıklanınca onClose
//   - Modal kutu: rounded-xl, border-border, bg-surface, shadow-xl
//   - Escape tuşu → onClose (useEffect ile listener)
//   - open=false ise null döner (unmount, portal temizlenir)
//   - title varsa: header satırı → title (font-semibold) + ✕ butonu
//   - footer varsa: alt satır border-t, flex justify-end gap-2
//   - size: sm=max-w-sm, md=max-w-md, lg=max-w-lg
//
// KULLANIM ÖRNEKLERİ:
//   <Modal open={isOpen} onClose={() => setOpen(false)} title="Yeni Soru Ekle"
//     footer={<><Button variant="ghost" onClick={...}>İptal</Button><Button>Kaydet</Button></>}>
//     ...form içeriği...
//   </Modal>
//
// ==========================================================

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
}

const sizeCls = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export default function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeCls[size]} rounded-xl border border-border bg-surface shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
