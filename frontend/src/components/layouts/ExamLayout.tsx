// ==========================================================
// ExamLayout – Sınav Alma Ekranı Kabuğu
// KULLANIM: QuizTake.tsx tarafından kullanılır (/q/:id/take)
// ==========================================================
//
// AMAÇ:
//   Fullscreen sınav ekranı için sabit yükseklik (h-screen), scroll-free yapı.
//   Üst header bar, sol sidebar (soru listesi), sağ main (editör/cevap alanı)
//   ve opsiyonel alt footer bar şeklinde üç bölümlü layout sağlar.
//
// PROPS:
//   - header:  ReactNode → üst bar içeriği (quiz başlığı, soru nav, sayaç)
//   - sidebar: ReactNode → soru listesi (numaralar, durum ikonları)
//   - editor:  ReactNode → cevap alanı (Monaco, radio, text input)
//   - footer?: ReactNode → opsiyonel alt bar (çalıştır/gönder butonları)
//
// TASARIM NOTU:
//   - h-screen + overflow-hidden: taşma yok, tüm alan kullanılır
//   - header: h-12, bg-surface, sticky, border-b
//   - sidebar: w-64, shrink-0, overflow-y-auto → uzun soru listesi için scroll
//   - main (editor): flex-1, overflow-hidden → Monaco kendi scroll'unu yönetir
//   - footer: h-11, bg-surface, border-t (opsiyonel)
//
//   ┌──────────────────────────────────────────────────────────┐
//   │  header (h-12)                                           │
//   ├──────────────┬───────────────────────────────────────────┤
//   │ sidebar      │  main / editor area (flex-1)              │
//   │ (w-64)       │                                           │
//   │              │                                           │
//   │              │                                           │
//   ├──────────────┴───────────────────────────────────────────┤
//   │  footer (h-11, opsiyonel)                                │
//   └──────────────────────────────────────────────────────────┘
//
// ==========================================================

import { type ReactNode } from "react";

interface ExamLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  editor: ReactNode;
  footer?: ReactNode;
}

export default function ExamLayout({ header, sidebar, editor, footer }: ExamLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-bg text-text overflow-hidden">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-4">
        {header}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-border bg-surface overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          {editor}
        </main>
      </div>

      {footer && (
        <footer className="flex h-11 shrink-0 items-center border-t border-border bg-surface px-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
