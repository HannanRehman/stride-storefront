"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Product } from "@/lib/catalog";
type BagItem = { productId: string; size: string; quantity: number };
type Stored = { favorites: string[]; bag: BagItem[] };
type ShoppingResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "loading"
        | "busy"
        | "unavailable"
        | "stock_limit"
        | "storage"
        | "save_failed"
        | "session";
      message: string;
    };
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
  user: { id: string; email: string } | null;
  catalog: Product[];
  ready: boolean;
  saving: boolean;
  syncError: string;
  toggleFavorite: (id: string) => void;
  addToBag: (id: string, size: string) => Promise<ShoppingResult>;
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
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<Store["user"]>(null);
  const [account, setAccount] = useState<Stored | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const generation = useRef(0);
  const userId = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    let mounted = true;
    async function load() {
      const version = ++generation.current;
      setSessionReady(false);
      setAccount(null);
      setSyncError("");
      try {
        const response = await fetch("/api/account/session", {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!mounted || version !== generation.current) return;
        userId.current = result.user?.id || null;
        setUser(result.user);
        if (result.user) {
          const snapshot = read();
          let guest: Stored;
          try {
            const raw = JSON.parse(snapshot);
            guest = {
              bag: Array.isArray(raw.bag)
                ? raw.bag
                    .slice(0, 100)
                    .filter(
                      (item: BagItem) =>
                        item &&
                        typeof item.productId === "string" &&
                        typeof item.size === "string" &&
                        Number.isInteger(item.quantity) &&
                        item.quantity > 0 &&
                        item.quantity <= 100,
                    )
                : [],
              favorites: Array.isArray(raw.favorites)
                ? raw.favorites
                    .slice(0, 100)
                    .filter((id: unknown) => typeof id === "string")
                : [],
            };
          } catch {
            guest = { bag: [], favorites: [] };
          }
          const hasGuest = guest.bag?.length || guest.favorites?.length;
          let payload: Record<string, unknown> = {};
          if (hasGuest) {
            const stored = localStorage.getItem("stride-guest-merge");
            const receipt = stored ? JSON.parse(stored) : null;
            const mergeId =
              receipt?.snapshot === snapshot
                ? receipt.mergeId
                : crypto.randomUUID();
            localStorage.setItem(
              "stride-guest-merge",
              JSON.stringify({ snapshot, mergeId }),
            );
            payload = { bag: guest.bag, favorites: guest.favorites, mergeId };
          }
          const saved = await fetch("/api/account/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: hasGuest ? "merge" : "read",
              payload,
            }),
          });
          const data = await saved.json();
          if (!saved.ok) throw new Error(data.error);
          if (!mounted || version !== generation.current) return;
          setAccount(data);
          if (hasGuest && read() === snapshot) {
            localStorage.removeItem(KEY);
            localStorage.removeItem("stride-guest-merge");
            window.dispatchEvent(new Event("stride-store"));
          }
        }
        setSessionReady(true);
      } catch {
        if (mounted && version === generation.current)
          setSyncError(
            "Your account could not sync. Your guest selections are kept on this device. Retry before making changes.",
          );
      }
    }
    function change() {
      void queue.current.then(load);
    }
    function storage(event: StorageEvent) {
      if (event.key === "stride-account-event") change();
    }
    refresh.current = change;
    void load();
    window.addEventListener("stride-account", change);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", change);
    return () => {
      mounted = false;
      window.removeEventListener("stride-account", change);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", change);
    };
  }, []);
  const ready = hydrated && sessionReady && (!user || account !== null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const state: Stored = useMemo(() => {
    try {
      const raw = account ?? JSON.parse(snapshot);
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
  }, [snapshot, catalog, account]);
  const save = useCallback(
    (
      next: Stored,
      message: string,
      action: string,
      payload: Record<string, unknown>,
    ): Promise<ShoppingResult> => {
      if (!ready || syncError) {
        const message = syncError
          ? "Your bag could not sync. Use Retry syncing before making changes."
          : "Your bag is still loading. Please wait before making changes.";
        setNotice(message);
        return Promise.resolve({
          ok: false,
          reason: syncError ? "save_failed" : "loading",
          message,
        });
      }
      if (savingRef.current) {
        return Promise.resolve({
          ok: false,
          reason: "busy",
          message: "Your previous change is still saving. Please wait.",
        });
      }
      savingRef.current = true;
      setSaving(true);
      setNotice("");
      const identity = user?.id ?? null;
      const version = generation.current;
      const operation = (async (): Promise<ShoppingResult> => {
        try {
          if (identity) {
            const response = await fetch("/api/account/store", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action, payload }),
            });
            const data = await response.json();
            if (!response.ok) {
              if (data.code === "stock_limit" || data.code === "unavailable") {
                const message =
                  data.code === "stock_limit"
                    ? "That size or quantity is no longer available. Refresh your bag or choose another size."
                    : "This product is no longer available.";
                setNotice(message);
                return { ok: false, reason: data.code, message };
              }
              if (response.status === 401) {
                const message =
                  "Your session has expired. Sign in again before saving your selections.";
                setSyncError(message);
                setNotice(message);
                return { ok: false, reason: "session", message };
              }
              throw new Error("Account save failed");
            }
            if (identity !== userId.current || version !== generation.current) {
              return {
                ok: false,
                reason: "session",
                message:
                  "Your account changed before this save completed. Reload your bag to check your selections.",
              };
            }
            if (!Array.isArray(data?.bag) || !Array.isArray(data?.favorites))
              throw new Error("Invalid saved selections");
            setAccount(data);
            try {
              localStorage.setItem("stride-account-event", crypto.randomUUID());
            } catch {
              /* Cross-tab sync is best effort. */
            }
          } else {
            localStorage.setItem(KEY, JSON.stringify(next));
            window.dispatchEvent(new Event("stride-store"));
          }
          setNotice(message);
          return { ok: true };
        } catch {
          const failureMessage = identity
            ? "Could not confirm this change was saved. Use Retry syncing to reload your saved selections before trying again."
            : "Your browser could not save changes. Allow local storage and try again.";
          if (identity) {
            if (identity === userId.current && version === generation.current) {
              setSyncError(failureMessage);
            }
          }
          setNotice(failureMessage);
          return {
            ok: false,
            reason: identity ? "save_failed" : "storage",
            message: failureMessage,
          };
        } finally {
          savingRef.current = false;
          setSaving(false);
        }
      })();
      queue.current = operation.then(() => {});
      return operation;
    },
    [ready, syncError, user],
  );
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
      "favorite",
      { productId: id },
    );
  }
  async function addToBag(id: string, size: string): Promise<ShoppingResult> {
    if (!ready || syncError)
      return {
        ok: false,
        reason: syncError ? "save_failed" : "loading",
        message: syncError
          ? "Your bag could not sync. Use Retry syncing before adding an item."
          : "Your bag is still loading. Please wait before adding an item.",
      };
    if (savingRef.current)
      return {
        ok: false,
        reason: "busy",
        message: "Your previous change is still saving. Please wait.",
      };
    const product = catalog.find((p) => p.id === id);
    const stock = product?.sizes.find((s) => s.code === size)?.stock ?? 0;
    const existing = state.bag.find(
      (i) => i.productId === id && i.size === size,
    );
    if (!product || stock < 1)
      return {
        ok: false,
        reason: "unavailable",
        message: "This size is unavailable. Choose another available size.",
      };
    if (stock <= (existing?.quantity ?? 0))
      return {
        ok: false,
        reason: "stock_limit",
        message:
          "Your bag already contains the available quantity for this size.",
      };
    const bag = existing
      ? state.bag.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        )
      : [...state.bag, { productId: id, size, quantity: 1 }];
    return save(
      { ...state, bag },
      `${product?.name} added to your bag.`,
      "add",
      { productId: id, size },
    );
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
      "quantity",
      { productId: id, size, quantity },
    );
  }
  function removeItem(id: string, size: string) {
    save(
      {
        ...state,
        bag: state.bag.filter((i) => !(i.productId === id && i.size === size)),
      },
      "Removed from your bag.",
      "remove",
      { productId: id, size },
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
      "move",
      { productId: id, size },
    );
  }
  return (
    <Context.Provider
      value={{
        ...state,
        user,
        catalog,
        ready,
        saving,
        syncError,
        toggleFavorite,
        addToBag,
        updateQuantity,
        removeItem,
        moveToFavorites,
        notice,
      }}
    >
      {children}
      {syncError && (
        <div className="account-sync-error" role="alert">
          <p>{syncError}</p>
          <button onClick={() => refresh.current()}>Retry syncing</button>
        </div>
      )}
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
