"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Product } from "@/lib/catalog";
type BagItem = { productId: string; size: string; quantity: number };
type Stored = { favorites: string[]; bag: BagItem[] };
const KEY = "stride-store-v1";
const EMPTY = '{"favorites":[],"bag":[]}';
function read() {
  try {
    return localStorage.getItem(KEY) || EMPTY;
  } catch {
    return EMPTY;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("stride-store", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("stride-store", callback);
  };
}
type Store = Stored & {
  catalog: Product[];
  ready: boolean;
  toggleFavorite: (id: string) => void;
  addToBag: (id: string, size: string) => boolean;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  removeItem: (id: string, size: string) => void;
  moveToFavorites: (id: string, size: string) => void;
  notice: string;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({
  catalog,
  children,
}: {
  catalog: Product[];
  children: React.ReactNode;
}) {
  const snapshot = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const state: Stored = useMemo(() => {
    try {
      const raw = JSON.parse(snapshot);
      const favorites = Array.isArray(raw.favorites)
        ? [
            ...new Set<string>(
              raw.favorites.filter(
                (id: unknown) =>
                  typeof id === "string" && catalog.some((p) => p.id === id),
              ),
            ),
          ]
        : [];
      const bag: BagItem[] = [];
      if (Array.isArray(raw.bag))
        for (const item of raw.bag.slice(0, 100)) {
          if (!item || typeof item !== "object") continue;
          const p = catalog.find((p) => p.id === item.productId);
          const size = p?.sizes.find((s) => s.code === item.size);
          if (!p || !size || size.stock < 1 || !Number.isFinite(item.quantity))
            continue;
          const quantity = Math.min(
            size.stock,
            Math.max(1, Math.floor(item.quantity)),
          );
          const duplicate = bag.find(
            (b) => b.productId === p.id && b.size === size.code,
          );
          if (duplicate)
            duplicate.quantity = Math.min(
              size.stock,
              duplicate.quantity + quantity,
            );
          else bag.push({ productId: p.id, size: size.code, quantity });
        }
      return { favorites, bag };
    } catch {
      return { favorites: [], bag: [] };
    }
  }, [snapshot, catalog]);
  const save = useCallback((next: Stored, message: string) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("stride-store"));
      setNotice(message);
      return true;
    } catch {
      setNotice(
        "Your browser could not save changes. Allow local storage and try again.",
      );
      return false;
    }
  }, []);
  function toggleFavorite(id: string) {
    const saved = state.favorites.includes(id);
    save(
      {
        ...state,
        favorites: saved
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id],
      },
      saved ? "Removed from favorites." : "Saved to favorites.",
    );
  }
  function addToBag(id: string, size: string) {
    const product = catalog.find((p) => p.id === id);
    const stock = product?.sizes.find((s) => s.code === size)?.stock ?? 0;
    const existing = state.bag.find(
      (i) => i.productId === id && i.size === size,
    );
    if (stock <= (existing?.quantity ?? 0)) {
      setNotice("This size has reached its available quantity.");
      return false;
    }
    const bag = existing
      ? state.bag.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        )
      : [...state.bag, { productId: id, size, quantity: 1 }];
    return save({ ...state, bag }, `${product?.name} added to your bag.`);
  }
  function updateQuantity(id: string, size: string, quantity: number) {
    const stock =
      catalog.find((p) => p.id === id)?.sizes.find((s) => s.code === size)
        ?.stock ?? 0;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > stock) return;
    save(
      {
        ...state,
        bag: state.bag.map((i) =>
          i.productId === id && i.size === size ? { ...i, quantity } : i,
        ),
      },
      "Bag updated.",
    );
  }
  function removeItem(id: string, size: string) {
    save(
      {
        ...state,
        bag: state.bag.filter((i) => !(i.productId === id && i.size === size)),
      },
      "Removed from your bag.",
    );
  }
  function moveToFavorites(id: string, size: string) {
    save(
      {
        favorites: state.favorites.includes(id)
          ? state.favorites
          : [...state.favorites, id],
        bag: state.bag.filter((i) => !(i.productId === id && i.size === size)),
      },
      "Moved to favorites.",
    );
  }
  return (
    <Context.Provider
      value={{
        ...state,
        catalog,
        ready,
        toggleFavorite,
        addToBag,
        updateQuantity,
        removeItem,
        moveToFavorites,
        notice,
      }}
    >
      {children}
      <div
        className={notice ? "store-toast" : "sr-only"}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is missing");
  return store;
}
