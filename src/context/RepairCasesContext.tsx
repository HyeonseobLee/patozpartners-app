import React, { createContext, useContext, useMemo, useState } from 'react';

export const STATUS_FLOW = [
  '점검대기',
  '점검중',
  '견적 전달',
  '부품 준비',
  '수리 진행 중',
  '수리 완료',
  '수령 완료',
] as const;

export type RepairStatus = (typeof STATUS_FLOW)[number];

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
  amount?: number;
  note?: string;
  sentAt?: string;
};

export type RepairCase = {
  id: string;
  customerName?: string;
  deviceModel: string;
  serialNumber: string;
  intakeNumber: string;
  intakeAt: string;
  status: RepairStatus;
  inspection?: Inspection;
  estimate?: Estimate;
  repairItems: RepairItem[];
  repairCompletedAt?: string;
  pickupCompletedAt?: string;
};

type RepairCasesContextType = {
  cases: RepairCase[];
  setStatus: (id: string, status: RepairStatus) => void;
  goToNextStatus: (id: string) => void;
  goToPrevStatus: (id: string) => void;
  saveInspection: (id: string, payload: Inspection) => void;
  addRepairItem: (id: string, item: Omit<RepairItem, 'id'>) => void;
  toggleRepairItem: (id: string, itemId: string) => void;
  sendEstimate: (id: string, amount: number, note: string) => void;
  findCase: (id?: string) => RepairCase | undefined;
};

const RepairCasesContext = createContext<RepairCasesContextType | null>(null);

const nowIso = () => new Date().toISOString();

const initialCases: RepairCase[] = [
  {
    id: 'RC-1001',
    customerName: '김민수',
    deviceModel: 'Road Bike Pro 3',
    serialNumber: 'RBP3-2391-AX',
    intakeNumber: 'IN-2026-0001',
    intakeAt: '2026-02-11T09:10:00.000Z',
    status: '점검대기',
    repairItems: [],
  },
  {
    id: 'RC-1002',
    customerName: '박지우',
    deviceModel: 'Urban E-Bike M2',
    serialNumber: 'UEM2-7710-QP',
    intakeNumber: 'IN-2026-0002',
    intakeAt: '2026-02-11T10:25:00.000Z',
    status: '점검중',
    inspection: {
      brake: true,
      tire: false,
      battery: true,
      drivetrain: true,
      other: false,
      memo: '배터리 잔량 저하 이슈 확인 필요',
    },
    repairItems: [],
  },
  {
    id: 'RC-1003',
    customerName: '이서연',
    deviceModel: 'City Fold Mini',
    serialNumber: 'CFM-3221-KK',
    intakeNumber: 'IN-2026-0003',
    intakeAt: '2026-02-10T16:45:00.000Z',
    status: '수리 진행 중',
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
  },
];

const updateCase = (list: RepairCase[], id: string, updater: (item: RepairCase) => RepairCase): RepairCase[] =>
  list.map((item) => (item.id === id ? updater(item) : item));

export const RepairCasesProvider = ({ children }: { children: React.ReactNode }) => {
  const [cases, setCases] = useState<RepairCase[]>(initialCases);

  const setStatus = (id: string, status: RepairStatus) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        const next: RepairCase = { ...item, status };
        if (status === '수리 완료' && !item.repairCompletedAt) {
          next.repairCompletedAt = nowIso();
        }
        if (status === '수령 완료' && !item.pickupCompletedAt) {
          next.pickupCompletedAt = nowIso();
        }
        return next;
      }),
    );
  };

  const goToNextStatus = (id: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        const currentIdx = STATUS_FLOW.indexOf(item.status);
        if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) {
          return item;
        }
        const nextStatus = STATUS_FLOW[currentIdx + 1];
        if (nextStatus === '부품 준비' && !item.estimate?.sentAt) {
          return item;
        }
        const nextItem: RepairCase = { ...item, status: nextStatus };
        if (nextStatus === '수리 완료' && !item.repairCompletedAt) {
          nextItem.repairCompletedAt = nowIso();
        }
        if (nextStatus === '수령 완료' && !item.pickupCompletedAt) {
          nextItem.pickupCompletedAt = nowIso();
        }
        return nextItem;
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
        return { ...item, status: STATUS_FLOW[currentIdx - 1] };
      }),
    );
  };

  const saveInspection = (id: string, payload: Inspection) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        inspection: payload,
        status: item.status === '점검대기' ? '점검중' : item.status,
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

  const sendEstimate = (id: string, amount: number, note: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        estimate: {
          amount,
          note,
          sentAt: nowIso(),
        },
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
      toggleRepairItem,
      sendEstimate,
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
