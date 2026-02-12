import type { RepairItem } from '../context/RepairCasesContext';

export type PartnerEstimatePayload = {
  caseId: string;
  intakeNumber: string;
  customerName?: string;
  deviceModel: string;
  repairItems: RepairItem[];
  amount: number;
  note: string;
  additional?: boolean;
  sentAt: string;
};

const mockConsumerEstimateInbox: PartnerEstimatePayload[] = [];

export const ConsumerEstimateInboxApi = {
  async pushEstimate(payload: PartnerEstimatePayload): Promise<{ ok: true; estimateId: string }> {
    mockConsumerEstimateInbox.unshift(payload);
    return {
      ok: true,
      estimateId: `EST-${Date.now()}`,
    };
  },
  async getInbox(): Promise<PartnerEstimatePayload[]> {
    return mockConsumerEstimateInbox;
  },
};
