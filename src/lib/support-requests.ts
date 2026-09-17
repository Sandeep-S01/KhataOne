export const supportCategories = [
  { value: "access", label: "Login or access" },
  { value: "whatsapp", label: "WhatsApp intake" },
  { value: "review", label: "AI review" },
  { value: "accounting", label: "Ledger, GST or exports" },
  { value: "performance", label: "Speed or display" },
  { value: "other", label: "Something else" },
] as const;

export function supportCategoryLabel(value: string) {
  return supportCategories.find((category) => category.value === value)?.label ?? "Other";
}
