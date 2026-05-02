// ==========================================================
// Input – Metin Girdi Bileşeni
// ==========================================================
//
// PROPS:
//   - label?:    string → üstteki etiket (htmlFor ile input'a bağlı)
//   - error?:    string → hata mesajı (gösterilince kenarlık kırmızıya döner)
//   - helper?:   string → yardımcı açıklama (error varsa gizlenir)
//   - id?:       string → label-input bağı (verilmezse label'dan türetilir)
//   - ...rest:   tüm standart HTMLInputElement prop'ları geçer
//   - ref:       forwardRef ile dışarıya açık (react-hook-form uyumlu)
//
// TASARIM NOTLARI:
//   - bg-surface2, border-border, rounded-lg, text-sm
//   - focus: border-primary + ring-2 ring-primary/20
//   - error: border-danger + ring-2 ring-danger/20
//   - placeholder: text-muted
//   - label: text-sm font-medium text-text
//   - error mesajı: text-xs text-danger
//   - helper mesajı: text-xs text-muted
//
// KULLANIM ÖRNEKLERİ:
//   <Input label="E-posta" type="email" placeholder="ornek@mail.com" />
//   <Input label="Ad" error="Bu alan zorunludur" />
//   <Input label="Açıklama" helper="Maksimum 200 karakter" />
//
// ==========================================================

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-lg border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? "border-danger focus:ring-danger/20" : "border-border"} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helper && !error && <p className="text-xs text-muted">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
