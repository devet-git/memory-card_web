import { CollectionItem } from "types";
import { SelectOption } from "components/SearchSelect";

const DEFAULT_CATEGORIES = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Lập trình", "Y học", "Lịch sử", "Giao tiếp", "Tổng hợp"];

/** Categories already used by the user's collections first, then a few common ones, without duplicates. */
export function categoryOptions(collections: CollectionItem[]): SelectOption[] {
  const used = collections.map((c) => (c.category || "").trim()).filter(Boolean);
  const unique: string[] = [];
  [...used, ...DEFAULT_CATEGORIES].forEach((c) => {
    if (!unique.some((u) => u.toLowerCase() === c.toLowerCase())) unique.push(c);
  });
  return unique.map((c) => ({ value: c, label: c }));
}
