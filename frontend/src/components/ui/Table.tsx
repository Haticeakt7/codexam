// ==========================================================
// Table – Generic Veri Tablosu Bileşeni
// ==========================================================
//
// PROPS (generic T):
//   - columns:      Column<T>[]  → sütun tanımları
//     - key:          string     → satır objesindeki alan adı (fallback render için)
//     - header:       string     → sütun başlığı (uppercase, text-muted)
//     - render?:      (row: T) => ReactNode → özel hücre render
//     - className?:   string     → sütun bazlı CSS
//   - data:          T[]         → satır verisi
//   - keyExtractor:  (row: T) => string → her satır için benzersiz key
//   - loading?:      boolean     → Spinner gösterir (default: false)
//   - emptyText?:    string      → boş durum metni (default: "No data found")
//
// TASARIM NOTLARI:
//   - overflow-x-auto + rounded-xl + border-border wrapper
//   - thead: bg-surface, text-xs uppercase tracking-wide text-muted
//   - tbody satır: hover:bg-surface2, border-b border-border/50, son satır no-border
//   - loading: tam genişlik Spinner satırı, py-12
//   - boş: tek hücre, text-muted, py-12
//   - render() yoksa: String(row[col.key]) ile fallback
//
// KULLANIM ÖRNEKLERİ:
//   <Table
//     columns={[
//       { key: "name", header: "Ad" },
//       { key: "status", header: "Durum", render: (r) => <Badge>{r.status}</Badge> },
//       { key: "actions", header: "", render: (r) => <Button onClick={() => del(r.id)}>Sil</Button> },
//     ]}
//     data={users}
//     keyExtractor={(r) => r.id}
//     loading={isLoading}
//     emptyText="Kullanıcı bulunamadı"
//   />
//
// ==========================================================

import { type ReactNode } from "react";
import Spinner from "@/components/ui/Spinner";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = "No data found",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <Spinner className="mx-auto" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-muted"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-border/50 bg-surface transition-colors last:border-0 hover:bg-surface2"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-text ${col.className ?? ""}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
