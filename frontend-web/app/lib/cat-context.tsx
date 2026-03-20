import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE, clearAuth, getToken } from "~/lib/auth";
import { clearSelectedCatId, getSelectedCatId, setSelectedCatId } from "~/lib/selected-cat";

export interface Cat {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  birthday: string | null;
}

interface CatContextValue {
  cats: Cat[];
  selectedCat: Cat | null;
  loadingCats: boolean;
  setSelectedCat: (catId: string) => void;
  refreshCats: () => Promise<void>;
}

const CatContext = createContext<CatContextValue | null>(null);

export function CatProvider({ children, onUnauthorized }: { children: React.ReactNode; onUnauthorized: () => void }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCatId, setSelectedCatIdState] = useState<string | null>(getSelectedCatId());
  const [loadingCats, setLoadingCats] = useState(true);

  const fetchCats = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch(`${API_BASE}/cats/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        clearAuth();
        clearSelectedCatId();
        onUnauthorized();
        return;
      }
      const data: Cat[] = await res.json();
      setCats(data);

      // Resolve selected cat: use stored ID if still valid, else default to first
      const storedId = getSelectedCatId();
      const stillValid = storedId && data.some((c) => c.id === storedId);
      if (!stillValid && data.length > 0) {
        setSelectedCatId(data[0].id);
        setSelectedCatIdState(data[0].id);
      } else if (!stillValid) {
        clearSelectedCatId();
        setSelectedCatIdState(null);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingCats(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  function setSelectedCat(catId: string) {
    setSelectedCatId(catId);
    setSelectedCatIdState(catId);
  }

  const selectedCat = cats.find((c) => c.id === selectedCatId) ?? null;

  return (
    <CatContext.Provider value={{ cats, selectedCat, loadingCats, setSelectedCat, refreshCats: fetchCats }}>
      {children}
    </CatContext.Provider>
  );
}

export function useCats(): CatContextValue {
  const ctx = useContext(CatContext);
  if (!ctx) throw new Error("useCats must be used inside CatProvider");
  return ctx;
}
