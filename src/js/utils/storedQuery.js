/**
 * Stored query helpers for veda-workflow-v2.
 * Uses ClickHouse stored queries from veda-workflow-v2-stored-queries.ttl.
 */

import { Backend } from 'veda-client';

export const STORED_QUERIES = {
  NETS: 'v-wf2:QueryNets',
  PROCESSES: 'v-wf2:QueryProcesses',
  PROCESSES_BY_NET: 'v-wf2:QueryProcessesByNet',
  OVERDUE_WORK_ITEMS: 'v-wf2:QueryOverdueWorkItems',
  REMINDER_WORK_ITEMS: 'v-wf2:QueryReminderWorkItems',
  ACTIVE_WORK_ITEMS_BY_PROCESS: 'v-wf2:QueryActiveWorkItemsByProcess',
  FLOWS_FROM: 'v-wf2:QueryFlowsFrom',
  FLOWS_TO: 'v-wf2:QueryFlowsTo',
  START_FORMS_BY_DOCUMENT: 'v-wf2:QueryStartFormsByDocument',
};

function buildParams (storedQueryId, params = {}) {
  const out = {
    '@': 'stored-query-' + Math.random().toString(36).slice(2),
    'rdf:type': [{ data: 'v-s:QueryParams', type: 'Uri' }],
    'v-s:storedQuery': [{ data: storedQueryId, type: 'Uri' }],
  };
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'number') {
      out[k] = [{ data: v, type: 'Integer' }];
    } else {
      out[k] = [{ data: String(v), type: 'String' }];
    }
  }
  return out;
}

/**
 * Run a stored query that returns a single column "id" (cols format).
 * @param {string} storedQueryId - e.g. STORED_QUERIES.NETS
 * @param {Object} params - query params (v-s:limit, v-wf2:instanceOf, etc.)
 * @returns {Promise<string[]>} list of id URIs
 */
export async function storedQueryIds (storedQueryId, params = {}) {
  const body = buildParams(storedQueryId, params);
  const res = await Backend.stored_query(body);
  if (res && Array.isArray(res.id)) {
    return res.id;
  }
  return [];
}
