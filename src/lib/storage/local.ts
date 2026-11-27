import { openDB, type IDBPDatabase } from "idb";
import { emptySnapshot, type Snapshot, type StorageAdapter } from "./types";

/** Guest storage: the whole snapshot in one IndexedDB record (small: progress, cards, settings). */
const DB_NAME = "diloul";
const STORE = "kv";
const KEY = "snapshot";

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE);
    },
  });
  return dbPromise;
}

export const localAdapter: StorageAdapter = {
  kind: "local",
  async load() {
    try {
      const s = (await (await db()).get(STORE, KEY)) as Snapshot | undefined;
      return s?.version === 1 ? s : emptySnapshot();
    } catch {
      // Private mode or blocked storage: run with an empty, in-memory profile.
      return emptySnapshot();
    }
  },
  async write(values) {
    await (await db()).put(STORE, values, KEY);
  },
  async writeAll(values) {
    await (await db()).put(STORE, values, KEY);
  },
  async clear() {
    await (await db()).delete(STORE, KEY);
  },
};
