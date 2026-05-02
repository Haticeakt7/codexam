// ==========================================================
// Select – Açılır Liste Bileşeni
// ==========================================================
//
// PROPS:
//   - label?:       string          → üstteki etiket
//   - error?:       string          → hata mesajı
//   - options:      SelectOption[]  → { value: string, label: string }[]
//   - placeholder?: string          → ilk disabled seçenek (value="")
//   - id?:          string          → label-select bağı (verilmezse label'dan türetilir)
//   - ...rest:      tüm standart HTMLSelectElement prop'ları
//   - ref:          forwardRef (react-hook-form uyumlu)
//
// TASARIM NOTLARI:
//   - Input ile aynı görsel dil: bg-surface2, border-border, rounded-lg, text-sm
//   - focus: border-primary + ring-2 ring-primary/20
//   - error: border-danger
//   - placeholder option: disabled, seçilemez, value=""
//   - error mesajı: text-xs text-danger
//
// KULLANIM ÖRNEKLERİ:
//   <Select
//     label="Rol"
//     options={[{ value: "User", label: "Kullanıcı" }, { value: "Admin", label: "Admin" }]}
//     placeholder="Rol seçin"
//   />
//   <Select label="Dil" options={langOptions} error="Zorunlu alan" />
//
// ==========================================================

import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`rounded-lg border bg-surface2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? "border-danger" : "border-border"} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
