import React, { createContext, useContext, useMemo, useState } from 'react';
import { ConsumerEstimateInboxApi, PartnerEstimatePayload } from '../services/consumerEstimateApi';

export const STATUS_FLOW = ['REGISTERED', 'INSPECTING', 'PARTS_PENDING', 'REPAIRING', 'FINISHED'] as const;

export type RepairStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<RepairStatus, string> = {
  REGISTERED: '접수 완료',
  INSPECTING: '점검 중',
  PARTS_PENDING: '부품 준비',
  REPAIRING: '수리 진행 중',
  FINISHED: '수령 완료',
};

export type RepairItem = {
  id: string;
  title: string;
  note?: string;
  expectedHours?: number;
  actualHours?: number;
  done: boolean;
  completedAt?: string;
};

export type Inspection = {
  brake: boolean;
  tire: boolean;
  battery: boolean;
  drivetrain: boolean;
  other: boolean;
  otherText?: string;
  memo?: string;
};

export type Estimate = {
  id: string;
  amount: number;
  note: string;
  sentAt: string;
  additional?: boolean;
  consumerConfirmed?: boolean;
  consumerConfirmedAt?: string;
};

export type RepairTimeline = {
  status: RepairStatus;
  statusLabel: string;
  updatedAt: string;
  completedRepairItems: string[];
};

export type RepairCase = {
  id: string;
  customerName?: string;
  customerLocation?: string;
  requestNote?: string;
  aiDiagnosis?: string;
  rating?: number;
  deviceModel: string;
  serialNumber: string;
  intakeNumber: string;
  intakeAt: string;
  status: RepairStatus;
  inspection?: Inspection;
  estimates: Estimate[];
  selectedEstimateId?: string;
  repairItems: RepairItem[];
  timeline: RepairTimeline[];
  etaText?: string;
  repairCompletedAt?: string;
  pickupCompletedAt?: string;
};

type RepairCasesContextType = {
  cases: RepairCase[];
  setStatus: (id: string, status: RepairStatus) => boolean;
  goToNextStatus: (id: string) => void;
  goToPrevStatus: (id: string) => void;
  saveInspection: (id: string, payload: Inspection) => void;
  addRepairItem: (id: string, item: Omit<RepairItem, 'id'>) => void;
  saveEta: (id: string, etaText: string) => void;
  toggleRepairItem: (id: string, itemId: string) => void;
  sendEstimate: (id: string, amount: number, note: string, options?: { additional?: boolean }) => Promise<void>;
  confirmEstimateByConsumer: (id: string, estimateId: string) => void;
  findCase: (id?: string) => RepairCase | undefined;
};

const RepairCasesContext = createContext<RepairCasesContextType | null>(null);

const nowIso = () => new Date().toISOString();

const createTimeline = (status: RepairStatus, repairItems: RepairItem[]): RepairTimeline => ({
  status,
  statusLabel: STATUS_LABEL[status],
  updatedAt: nowIso(),
  completedRepairItems: repairItems.filter((item) => item.done).map((item) => item.title),
});

const hasConfirmedEstimate = (repairCase: RepairCase) =>
  repairCase.estimates.some((estimate) => estimate.consumerConfirmed);

const canMoveToStatus = (repairCase: RepairCase, status: RepairStatus) => {
  if (status === 'PARTS_PENDING' && !hasConfirmedEstimate(repairCase)) {
    return false;
  }
  return true;
};

const withStatusTransition = (repairCase: RepairCase, status: RepairStatus): RepairCase => {
  if (!canMoveToStatus(repairCase, status)) {
    return repairCase;
  }

  const nextCase: RepairCase = {
    ...repairCase,
    status,
    timeline: [...repairCase.timeline, createTimeline(status, repairCase.repairItems)],
  };

  if (status === 'FINISHED' && !repairCase.repairCompletedAt) {
    const completedAt = nowIso();
    nextCase.repairCompletedAt = completedAt;
    nextCase.pickupCompletedAt = completedAt;
  }

  return nextCase;
};

const initialCases: RepairCase[] = [
  {
    id: 'RC-1001',
    customerName: '김민수',
    customerLocation: '강남구 역삼동',
    requestNote: '출퇴근 전 빠른 점검 요청',
    aiDiagnosis: '브레이크 마모 가능성 높음(신뢰도 87%)',
    deviceModel: 'Road Bike Pro 3',
    serialNumber: 'RBP3-2391-AX',
    intakeNumber: 'IN-2026-0001',
    intakeAt: '2026-02-11T09:10:00.000Z',
    status: 'REGISTERED',
    estimates: [],
    repairItems: [],
    timeline: [{ status: 'REGISTERED', statusLabel: STATUS_LABEL.REGISTERED, updatedAt: '2026-02-11T09:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-1002',
    customerName: '박지우',
    customerLocation: '송파구 잠실동',
    requestNote: '배터리 지속시간 저하 및 제동 소음',
    aiDiagnosis: '배터리 셀 불균형 + 패드 교체 필요 가능성',
    deviceModel: 'Urban E-Bike M2',
    serialNumber: 'UEM2-7710-QP',
    intakeNumber: 'IN-2026-0002',
    intakeAt: '2026-02-11T10:25:00.000Z',
    status: 'INSPECTING',
    inspection: {
      brake: true,
      tire: false,
      battery: true,
      drivetrain: true,
      other: false,
      memo: '배터리 잔량 저하 이슈 확인 필요',
    },
    estimates: [
      {
        id: 'EST-2026-10021',
        amount: 98000,
        note: '배터리 밸런싱 + 브레이크 패드 교체',
        sentAt: '2026-02-11T11:05:00.000Z',
      },
    ],
    repairItems: [],
    timeline: [
      { status: 'REGISTERED', statusLabel: STATUS_LABEL.REGISTERED, updatedAt: '2026-02-11T10:25:00.000Z', completedRepairItems: [] },
      { status: 'INSPECTING', statusLabel: STATUS_LABEL.INSPECTING, updatedAt: '2026-02-11T10:40:00.000Z', completedRepairItems: [] },
    ],
  },
  {
    id: 'RC-1003',
    customerName: '이서연',
    customerLocation: '마포구 상암동',
    requestNote: '체인 소음 및 뒷바퀴 흔들림',
    aiDiagnosis: '체인 장력 저하 및 브레이크 패드 마모',
    rating: 4.7,
    deviceModel: 'City Fold Mini',
    serialNumber: 'CFM-3221-KK',
    intakeNumber: 'IN-2026-0003',
    intakeAt: '2026-02-10T16:45:00.000Z',
    status: 'REPAIRING',
    estimates: [
      {
        id: 'EST-2026-10031',
        amount: 120000,
        note: '브레이크 패드 + 체인 장력 조정',
        sentAt: '2026-02-10T18:00:00.000Z',
        consumerConfirmed: true,
        consumerConfirmedAt: '2026-02-10T18:12:00.000Z',
      },
    ],
    selectedEstimateId: 'EST-2026-10031',
    repairItems: [
      {
        id: 'ITEM-1',
        title: '브레이크 패드 교체',
        note: '앞바퀴 패드 마모 심함',
        expectedHours: 1,
        done: true,
        completedAt: '2026-02-11T07:45:00.000Z',
      },
      {
        id: 'ITEM-2',
        title: '체인 장력 조정',
        expectedHours: 0.5,
        done: false,
      },
    ],
    timeline: [
      { status: 'REGISTERED', statusLabel: STATUS_LABEL.REGISTERED, updatedAt: '2026-02-10T16:45:00.000Z', completedRepairItems: [] },
      { status: 'INSPECTING', statusLabel: STATUS_LABEL.INSPECTING, updatedAt: '2026-02-10T17:20:00.000Z', completedRepairItems: [] },
      { status: 'PARTS_PENDING', statusLabel: STATUS_LABEL.PARTS_PENDING, updatedAt: '2026-02-10T18:15:00.000Z', completedRepairItems: [] },
      { status: 'REPAIRING', statusLabel: STATUS_LABEL.REPAIRING, updatedAt: '2026-02-10T19:10:00.000Z', completedRepairItems: [] },
    ],
  },
];

const updateCase = (list: RepairCase[], id: string, updater: (item: RepairCase) => RepairCase): RepairCase[] =>
  list.map((item) => (item.id === id ? updater(item) : item));

export const RepairCasesProvider = ({ children }: { children: React.ReactNode }) => {
  const [cases, setCases] = useState<RepairCase[]>(initialCases);

  const setStatus = (id: string, status: RepairStatus) => {
    let updated = false;
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        const nextItem = withStatusTransition(item, status);
        updated = nextItem !== item;
        return nextItem;
      }),
    );
    return updated;
  };

  const goToNextStatus = (id: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        const currentIdx = STATUS_FLOW.indexOf(item.status);
        if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) {
          return item;
        }
        return withStatusTransition(item, STATUS_FLOW[currentIdx + 1]);
      }),
    );
  };

  const goToPrevStatus = (id: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        const currentIdx = STATUS_FLOW.indexOf(item.status);
        if (currentIdx <= 0) {
          return item;
        }
        return withStatusTransition(item, STATUS_FLOW[currentIdx - 1]);
      }),
    );
  };

  const saveInspection = (id: string, payload: Inspection) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        inspection: payload,
        status: item.status === 'REGISTERED' ? 'INSPECTING' : item.status,
      })),
    );
  };

  const addRepairItem = (id: string, payload: Omit<RepairItem, 'id'>) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        repairItems: [...item.repairItems, { ...payload, id: `${id}-I-${Date.now()}` }],
      })),
    );
  };

  const saveEta = (id: string, etaText: string) => {
    setCases((prev) => updateCase(prev, id, (item) => ({ ...item, etaText })));
  };

  const toggleRepairItem = (id: string, itemId: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        repairItems: item.repairItems.map((repairItem) =>
          repairItem.id === itemId
            ? {
                ...repairItem,
                done: !repairItem.done,
                completedAt: !repairItem.done ? nowIso() : undefined,
              }
            : repairItem,
        ),
      })),
    );
  };

  const sendEstimate = async (id: string, amount: number, note: string, options?: { additional?: boolean }) => {
    const repairCase = cases.find((item) => item.id === id);
    if (!repairCase) {
      return;
    }

    const estimateId = `EST-${Date.now()}`;
    const payload: PartnerEstimatePayload = {
      estimateId,
      caseId: repairCase.id,
      intakeNumber: repairCase.intakeNumber,
      customerName: repairCase.customerName,
      deviceModel: repairCase.deviceModel,
      repairItems: repairCase.repairItems,
      amount,
      note,
      additional: options?.additional,
      sentAt: nowIso(),
    };

    await ConsumerEstimateInboxApi.pushEstimate(payload);

    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        estimates: [
          {
            id: estimateId,
            amount,
            note,
            sentAt: payload.sentAt,
            additional: options?.additional,
          },
          ...item.estimates,
        ],
      })),
    );
  };

  const confirmEstimateByConsumer = (id: string, estimateId: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        selectedEstimateId: estimateId,
        estimates: item.estimates.map((estimate) => ({
          ...estimate,
          consumerConfirmed: estimate.id === estimateId,
          consumerConfirmedAt: estimate.id === estimateId ? nowIso() : estimate.consumerConfirmedAt,
        })),
      })),
    );
  };

  const findCase = (id?: string) => cases.find((item) => item.id === id);

  const value = useMemo(
    () => ({
      cases,
      setStatus,
      goToNextStatus,
      goToPrevStatus,
      saveInspection,
      addRepairItem,
      saveEta,
      toggleRepairItem,
      sendEstimate,
      confirmEstimateByConsumer,
      findCase,
    }),
    [cases],
  );

  return <RepairCasesContext.Provider value={value}>{children}</RepairCasesContext.Provider>;
};

export const useRepairCases = () => {
  const ctx = useContext(RepairCasesContext);
  if (!ctx) {
    throw new Error('useRepairCases must be used within RepairCasesProvider');
  }
  return ctx;
};
