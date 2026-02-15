import { adminApiClient } from './adminClient';

export const adminOpsApi = {
  importNavToday: async () => {
    const response = await adminApiClient.post('/test/nav/import-today');
    return response.data;
  },

  importNavHistorical: async (date: string) => {
    const response = await adminApiClient.post('/test/nav/import-historical', null, {
      params: { date },
    });
    return response.data;
  },

  runPendingAllotment: async () => {
    const response = await adminApiClient.post('/test/investment-allotment/run-pending');
    return response.data;
  },

  runNavPendingAllotment: async () => {
    const response = await adminApiClient.post('/test/investment-allotment/run-nav-pending');
    return response.data;
  },

  executeSips: async () => {
    const response = await adminApiClient.post('/test/sip-execution/execute');
    return response.data;
  },

  importTradingHoliday: async () => {
    const response = await adminApiClient.post('/test/trading-holiday-import');
    return response.data;
  },
};
