import type { RepairItem } from '../context/RepairCasesContext';

export type PartnerEstimatePayload = {
  estimateId: string;
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
      estimateId: payload.estimateId,
    };
  },
  async getInbox(): Promise<PartnerEstimatePayload[]> {
    return mockConsumerEstimateInbox;
  },
};
