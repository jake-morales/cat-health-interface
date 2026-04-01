import AsyncStorage from "@react-native-async-storage/async-storage";

const SELECTED_CAT_KEY = "selected_cat_id";

let _selectedCatId: string | null = null;

export async function loadSelectedCatFromStorage(): Promise<void> {
  _selectedCatId = await AsyncStorage.getItem(SELECTED_CAT_KEY);
}

export function getSelectedCatId(): string | null {
  return _selectedCatId;
}

export async function setSelectedCatId(catId: string): Promise<void> {
  _selectedCatId = catId;
  await AsyncStorage.setItem(SELECTED_CAT_KEY, catId);
}

export async function clearSelectedCatId(): Promise<void> {
  _selectedCatId = null;
  await AsyncStorage.removeItem(SELECTED_CAT_KEY);
}
