// ==========================================================
// Textarea – Çok Satırlı Metin Girdi Bileşeni
// ==========================================================
//
// PROPS:
//   - label?:    string → üstteki etiket
//   - error?:    string → hata mesajı
//   - helper?:   string → yardımcı açıklama (error varsa gizlenir)
//   - id?:       string → label-textarea bağı (verilmezse label'dan türetilir)
//   - ...rest:   tüm standart HTMLTextAreaElement prop'ları
//   - ref:       forwardRef (react-hook-form uyumlu)
//
// TASARIM NOTLARI:
//   - Input ve Select ile aynı görsel dil
//   - resize-y: kullanıcı dikey olarak boyutlandırabilir
//   - min-h-[80px]: minimum yükseklik
//   - focus, error, label, helper stilleri Input ile özdeş
//
// KULLANIM ÖRNEKLERİ:
//   <Textarea label="Açıklama" placeholder="Quiz açıklaması..." rows={4} />
//   <Textarea label="Not" helper="Opsiyonel" />
//
// ==========================================================

import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className = "", id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`rounded-lg border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y min-h-[80px] ${error ? "border-danger" : "border-border"} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helper && !error && <p className="text-xs text-muted">{helper}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export default Textarea;
