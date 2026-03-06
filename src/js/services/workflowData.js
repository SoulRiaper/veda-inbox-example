/**
 * Centralized workflow data store.
 * Single entry point for list/query data: cache, invalidation, subscriptions, auto-refresh.
 * Components consume data here; mutations (WorkflowService) call invalidate* after changes.
 */

import { Model, Backend } from 'veda-client';
import { storedQueryIds, STORED_QUERIES } from '../utils/storedQuery.js';
import { QUERY_LIMITS } from '../utils/constants.js';

export const DATA_KEYS = {
  NETS: 'nets',
  PROCESSES: 'processes',
  processesByNet: (netUri) => `processesByNet:${netUri}`,
};

const DEFAULT_LIMITS = {
  nets: 500,
  processes: QUERY_LIMITS?.DEFAULT_PROCESSES_LIMIT ?? 500,
  processesByNet: 200,
};

const NOTIFY_DEBOUNCE_MS = 80;
/** Delay before refetch so ClickHouse index has time to include newly saved data. */
const CLICKHOUSE_SYNC_DELAY_MS = 2000;

const _cache = new Map();
const _subscribers = new Map();
const _notifyTimers = new Map();
const _lastInvalidateTime = new Map();
const _refreshTimers = new Map();
const _refreshRefs = new Map();

/**
 * Notify subscribers. By default waits CLICKHOUSE_SYNC_DELAY_MS so stored_query
 * can return newly saved entities. Use { immediate: true } for user Refresh to run at once.
 * @param {string} key
 * @param {{ immediate?: boolean }} opts - immediate: true = notify after debounce only (no 2s delay)
 */
function _notify (key, opts = {}) {
  if (_notifyTimers.has(key)) {
    clearTimeout(_notifyTimers.get(key));
    _notifyTimers.delete(key);
  }
  const delay = opts.immediate
    ? NOTIFY_DEBOUNCE_MS
    : Math.max(NOTIFY_DEBOUNCE_MS, CLICKHOUSE_SYNC_DELAY_MS - (Date.now() - (_lastInvalidateTime.get(key) ?? 0)));

  _notifyTimers.set(key, setTimeout(() => {
    _notifyTimers.delete(key);
    const set = _subscribers.get(key);
    if (set) {
      set.forEach((cb) => { try { cb(); } catch (e) { console.error('workflowData subscriber error', e); } });
    }
  }, delay));
}

function _clearCacheEntry (key) {
  _cache.delete(key);
  _lastInvalidateTime.set(key, Date.now());
}

/**
 * Subscribe to invalidation of a key.
 * When invalidate*(...) is called for that key, callback fires (debounced).
 * @param {string} key - DATA_KEYS.NETS | DATA_KEYS.PROCESSES | DATA_KEYS.processesByNet(netUri)
 * @param {function} callback
 */
export function subscribe (key, callback) {
  if (!_subscribers.has(key)) _subscribers.set(key, new Set());
  _subscribers.get(key).add(callback);
}

/**
 * @param {string} key
 * @param {function} callback
 */
export function unsubscribe (key, callback) {
  const set = _subscribers.get(key);
  if (set) {
    set.delete(callback);
    if (set.size === 0) _subscribers.delete(key);
  }
}

/**
 * Invalidate nets list cache and notify subscribers.
 * @param {{ immediate?: boolean }} opts - immediate: true for user-triggered refresh (no 2s delay)
 */
export function invalidateNets (opts = {}) {
  _clearCacheEntry(DATA_KEYS.NETS);
  _notify(DATA_KEYS.NETS, opts);
}

/**
 * Invalidate processes list cache and notify subscribers.
 * @param {{ immediate?: boolean }} opts - immediate: true for user-triggered refresh (no 2s delay)
 */
export function invalidateProcesses (opts = {}) {
  _clearCacheEntry(DATA_KEYS.PROCESSES);
  _notify(DATA_KEYS.PROCESSES, opts);
  const byNetKeys = [..._cache.keys()].filter((k) => k.startsWith('processesByNet:'));
  byNetKeys.forEach((k) => {
    _clearCacheEntry(k);
    _notify(k, opts);
  });
}

/**
 * Invalidate processes-by-net cache for one net (and optionally the global processes list).
 * @param {string} netUri
 * @param {boolean} alsoProcesses - if true, also invalidate global processes list
 * @param {{ immediate?: boolean }} opts - immediate: true for user-triggered refresh (no 2s delay)
 */
export function invalidateProcessesByNet (netUri, alsoProcesses = false, opts = {}) {
  const key = DATA_KEYS.processesByNet(netUri);
  _clearCacheEntry(key);
  _notify(key, opts);
  if (alsoProcesses) invalidateProcesses(opts);
}

/**
 * Invalidate all cached list data and notify all subscribers.
 */
export function invalidateAll () {
  _cache.clear();
  _subscribers.forEach((_set, key) => _notify(key));
}

// ---------------------------------------------------------------------------
// Data fetching (URI lists, cached)
// ---------------------------------------------------------------------------

/**
 * Fetch nets (URIs). Uses cache unless invalidated or options.force.
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<string[]>}
 */
export async function getNets (opts = {}) {
  const limit = opts.limit ?? DEFAULT_LIMITS.nets;
  const cacheKey = DATA_KEYS.NETS;
  if (!opts.force && _cache.has(cacheKey)) {
    return _cache.get(cacheKey).uris;
  }
  const uris = await storedQueryIds(STORED_QUERIES.NETS, { 'v-s:limit': limit });
  _cache.set(cacheKey, { uris, ts: Date.now() });
  return uris;
}

/**
 * Fetch processes (URIs). Uses cache unless invalidated or options.force.
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<string[]>}
 */
export async function getProcesses (opts = {}) {
  const limit = opts.limit ?? DEFAULT_LIMITS.processes;
  const cacheKey = DATA_KEYS.PROCESSES;
  if (!opts.force && _cache.has(cacheKey)) {
    return _cache.get(cacheKey).uris;
  }
  const uris = await storedQueryIds(STORED_QUERIES.PROCESSES, { 'v-s:limit': limit });
  _cache.set(cacheKey, { uris, ts: Date.now() });
  return uris;
}

/**
 * Fetch process URIs for one net. Uses cache unless invalidated or options.force.
 * @param {string} netUri
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<string[]>}
 */
export async function getProcessesByNet (netUri, opts = {}) {
  if (!netUri) return [];
  const limit = opts.limit ?? DEFAULT_LIMITS.processesByNet;
  const cacheKey = DATA_KEYS.processesByNet(netUri);
  if (!opts.force && _cache.has(cacheKey)) {
    return _cache.get(cacheKey).uris;
  }
  const uris = await storedQueryIds(STORED_QUERIES.PROCESSES_BY_NET, {
    'v-wf2:instanceOf': netUri,
    'v-s:limit': limit,
  });
  _cache.set(cacheKey, { uris, ts: Date.now() });
  return uris;
}

// ---------------------------------------------------------------------------
// Model hydration helpers (load + subscribe)
// Model caches instances by URI at class level (Model(uri) returns same instance).
// Model.load() is idempotent — skips refetch when data is already loaded.
// ---------------------------------------------------------------------------

/**
 * Load nets as Models (load + subscribe).
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<Model[]>}
 */
export async function getNetsAsModels (opts = {}) {
  const uris = await getNets(opts);
  return Promise.all(
    uris.map(async (uri) => {
      const m = new Model(uri);
      await m.load();
      m.subscribe();
      return m;
    })
  );
}

/**
 * Load processes as Models for the global list.
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<Model[]>}
 */
export async function getProcessesAsModels (opts = {}) {
  const uris = await getProcesses(opts);
  return Promise.all(
    uris.map(async (uri) => {
      const m = new Model(uri);
      await m.load();
      m.subscribe();
      return m;
    })
  );
}

/**
 * Load processes as Models for one net.
 * @param {string} netUri
 * @param {{ limit?: number, force?: boolean }} opts
 * @returns {Promise<Model[]>}
 */
export async function getProcessesByNetAsModels (netUri, opts = {}) {
  const uris = await getProcessesByNet(netUri, opts);
  return Promise.all(
    uris.map(async (uri) => {
      const m = new Model(uri);
      await m.load();
      m.subscribe();
      return m;
    })
  );
}

// ---------------------------------------------------------------------------
// Auto-refresh with ref-counting
// ---------------------------------------------------------------------------
// Multiple components can request autoRefresh for the same key.
// The timer is created on the first request and destroyed only when the last
// consumer calls stopAutoRefresh (or stopAllAutoRefresh).

/**
 * Request periodic auto-refresh for a key.
 * The timer uses the intervalMs of the first caller; subsequent calls just
 * increment the ref-count without changing the interval.
 * @param {string} key
 * @param {number} intervalMs
 */
export function startAutoRefresh (key, intervalMs) {
  const refs = (_refreshRefs.get(key) ?? 0) + 1;
  _refreshRefs.set(key, refs);
  if (refs === 1) {
    // First consumer — create the timer
    _refreshTimers.set(key, setInterval(() => {
      _clearCacheEntry(key);
      _notify(key);
    }, intervalMs));
  }
}

/**
 * Release one auto-refresh reference. Timer is stopped only when
 * the last consumer calls this.
 * @param {string} key
 */
export function stopAutoRefresh (key) {
  const refs = (_refreshRefs.get(key) ?? 0) - 1;
  if (refs <= 0) {
    _refreshRefs.delete(key);
    if (_refreshTimers.has(key)) {
      clearInterval(_refreshTimers.get(key));
      _refreshTimers.delete(key);
    }
  } else {
    _refreshRefs.set(key, refs);
  }
}

/**
 * Stop all auto-refresh timers (e.g. on app teardown).
 */
export function stopAllAutoRefresh () {
  _refreshTimers.forEach((id) => clearInterval(id));
  _refreshTimers.clear();
  _refreshRefs.clear();
}

// ---------------------------------------------------------------------------
// Decision classes (subclasses of v-wf:Decision)
// ---------------------------------------------------------------------------

const DECISION_CLASSES_CACHE_KEY = 'decisionClasses';

/**
 * Fetch available decision class URIs from the database.
 * Queries for owl:Class individuals that are subclasses of v-wf:Decision.
 * Pre-loads Models so that about/property rendering is instant.
 * Results are cached until invalidateDecisionClasses() is called.
 * @param {{ force?: boolean }} opts
 * @returns {Promise<string[]>}
 */
export async function getDecisionClasses (opts = {}) {
  if (!opts.force && _cache.has(DECISION_CLASSES_CACHE_KEY)) {
    return _cache.get(DECISION_CLASSES_CACHE_KEY).uris;
  }
  try {
    const queryStr = "'rdf:type'=='owl:Class' && 'rdfs:subClassOf'=='v-wf:Decision'";
    const res = await Backend.query(queryStr, undefined, undefined, 100);
    const uris = res?.result || [];
    await Promise.all(uris.map(async (uri) => {
      try {
        const m = new Model(uri);
        await m.load();
      } catch { /* Model will be loaded lazily by about/property if needed */ }
    }));
    _cache.set(DECISION_CLASSES_CACHE_KEY, { uris, ts: Date.now() });
    return uris;
  } catch (err) {
    console.error('Failed to fetch decision classes:', err);
    return [];
  }
}

/**
 * Invalidate cached decision classes.
 */
export function invalidateDecisionClasses () {
  _clearCacheEntry(DECISION_CLASSES_CACHE_KEY);
}

// ---------------------------------------------------------------------------
// Facade object (convenient single import for components)
// ---------------------------------------------------------------------------

export const workflowData = {
  getNets,
  getProcesses,
  getProcessesByNet,
  getNetsAsModels,
  getProcessesAsModels,
  getProcessesByNetAsModels,
  getDecisionClasses,
  invalidateNets,
  invalidateProcesses,
  invalidateProcessesByNet,
  invalidateDecisionClasses,
  invalidateAll,
  subscribe,
  unsubscribe,
  startAutoRefresh,
  stopAutoRefresh,
  stopAllAutoRefresh,
};
