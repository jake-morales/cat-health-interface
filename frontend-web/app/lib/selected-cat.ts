const SELECTED_CAT_KEY = "selected_cat_id";

export function getSelectedCatId(): string | null {
  return localStorage.getItem(SELECTED_CAT_KEY);
}

export function setSelectedCatId(catId: string): void {
  localStorage.setItem(SELECTED_CAT_KEY, catId);
}

export function clearSelectedCatId(): void {
  localStorage.removeItem(SELECTED_CAT_KEY);
}
