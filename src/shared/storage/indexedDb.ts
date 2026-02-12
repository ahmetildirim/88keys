import type { PersistedSessionRun, PersistedSettings } from "./types";

const DB_NAME = "88keys-db";
const DB_VERSION = 1;
const SETTINGS_STORE = "app_settings";
const SESSION_RUNS_STORE = "session_runs";
const SETTINGS_KEY = "user_settings";
const CREATED_AT_INDEX = "createdAt";

type SettingsRecord = {
  key: string;
  value: PersistedSettings;
};

function supportsIndexedDb(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function isThemeMode(value: unknown): value is PersistedSettings["themeMode"] {
  return value === "light" || value === "dark" || value === "system";
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    isThemeMode(candidate.themeMode) &&
    typeof candidate.selectedMidiDevice === "string" &&
    typeof candidate.minNote === "string" &&
    typeof candidate.maxNote === "string" &&
    typeof candidate.totalNotes === "number" &&
    Number.isFinite(candidate.totalNotes) &&
    typeof candidate.updatedAt === "number" &&
    Number.isFinite(candidate.updatedAt)
  );
}

function isPersistedSessionRun(value: unknown): value is PersistedSessionRun {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const config = candidate.config as Record<string, unknown> | undefined;
  const improvements = candidate.improvements;
  const hasValidImprovements =
    Array.isArray(improvements) &&
    improvements.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const improvement = item as Record<string, unknown>;
      return (
        typeof improvement.note === "string" &&
        typeof improvement.misses === "number" &&
        Number.isFinite(improvement.misses)
      );
    });

  return (
    typeof candidate.id === "string" &&
    typeof candidate.sessionId === "string" &&
    typeof candidate.createdAt === "number" &&
    Number.isFinite(candidate.createdAt) &&
    typeof candidate.durationSeconds === "number" &&
    Number.isFinite(candidate.durationSeconds) &&
    typeof candidate.accuracy === "number" &&
    Number.isFinite(candidate.accuracy) &&
    typeof candidate.speedNpm === "number" &&
    Number.isFinite(candidate.speedNpm) &&
    typeof candidate.speedDelta === "number" &&
    Number.isFinite(candidate.speedDelta) &&
    hasValidImprovements &&
    typeof config?.minNote === "string" &&
    typeof config?.maxNote === "string" &&
    typeof config?.totalNotes === "number" &&
    Number.isFinite(config?.totalNotes)
  );
}

function openDb(): Promise<IDBDatabase | null> {
  if (!supportsIndexedDb()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains(SESSION_RUNS_STORE)) {
          const store = db.createObjectStore(SESSION_RUNS_STORE, { keyPath: "id" });
          store.createIndex(CREATED_AT_INDEX, CREATED_AT_INDEX, { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T>,
): Promise<T | null> {
  return openDb().then((db) => {
    if (!db) return null;

    try {
      return action(db.transaction(storeName, mode).objectStore(storeName)).finally(() => {
        db.close();
      });
    } catch {
      db.close();
      return null;
    }
  });
}

export async function loadSettings(): Promise<PersistedSettings | null> {
  const result = await withStore(SETTINGS_STORE, "readonly", (store) =>
    new Promise<unknown>((resolve) => {
      const request = store.get(SETTINGS_KEY);
      request.onsuccess = () => {
        const record = request.result as SettingsRecord | undefined;
        resolve(record?.value ?? null);
      };
      request.onerror = () => resolve(null);
    }),
  );

  if (!result || !isPersistedSettings(result)) {
    return null;
  }

  return result;
}

export async function saveSettings(settings: PersistedSettings): Promise<void> {
  const result = await withStore(SETTINGS_STORE, "readwrite", (store) =>
    new Promise<boolean>((resolve) => {
      const request = store.put({ key: SETTINGS_KEY, value: settings } satisfies SettingsRecord);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    }),
  );

  if (result === null) {
    return;
  }
}

export async function listSessionRuns(): Promise<PersistedSessionRun[]> {
  const result = await withStore(SESSION_RUNS_STORE, "readonly", (store) =>
    new Promise<unknown[]>((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => resolve([]);
    }),
  );

  if (!result) {
    return [];
  }

  return result
    .filter((entry): entry is PersistedSessionRun => isPersistedSessionRun(entry))
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function addSessionRun(run: PersistedSessionRun): Promise<void> {
  const result = await withStore(SESSION_RUNS_STORE, "readwrite", (store) =>
    new Promise<boolean>((resolve) => {
      const request = store.put(run);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    }),
  );

  if (result === null) {
    return;
  }
}
