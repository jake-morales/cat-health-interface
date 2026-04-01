import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://cat-health-interface.onrender.com";

const TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

const _cache: { token: string | null; userId: string | null } = {
  token: null,
  userId: null,
};

export async function loadAuthFromStorage(): Promise<void> {
  const [token, userId] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_ID_KEY),
  ]);
  _cache.token = token;
  _cache.userId = userId;
}

export function getToken(): string | null {
  return _cache.token;
}

export function getUserId(): string | null {
  return _cache.userId;
}

export async function setAuth(token: string, userId: string): Promise<void> {
  _cache.token = token;
  _cache.userId = userId;
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_ID_KEY, userId),
  ]);
}

export async function clearAuth(): Promise<void> {
  _cache.token = null;
  _cache.userId = null;
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_ID_KEY),
  ]);
}

export function isLoggedIn(): boolean {
  return !!_cache.token;
}
