import React, { createContext, useContext, useMemo, useState } from 'react';

export const STATUS_FLOW = ['NEW_REQUEST', 'ESTIMATE_PENDING', 'ESTIMATE_ACCEPTED', 'INTAKE_COMPLETED', 'IN_REPAIR', 'REPAIR_COMPLETED', 'SHIPMENT_COMPLETED'] as const;
export type RepairStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<RepairStatus, string> = {
  NEW_REQUEST: '신규 요청',
  ESTIMATE_PENDING: '견적 확인 중',
  ESTIMATE_ACCEPTED: '견적 수락',
  INTAKE_COMPLETED: '입고 완료',
  IN_REPAIR: '수리 중',
  REPAIR_COMPLETED: '수리 완료',
  SHIPMENT_COMPLETED: '출고 완료',
};

export const MANUAL_STATUS_START_INDEX = STATUS_FLOW.indexOf('ESTIMATE_ACCEPTED');

export type RepairItem = {
  id: string;
  title: string;
  note?: string;
  done: boolean;
  completedAt?: string;
};

export type Estimate = {
  id: string;
  amount: number;
  note: string;
  sentAt: string;
  additional?: boolean;
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
  customerPhone?: string;
  customerLocation?: string;
  requestNote?: string;
  rating?: number;
  deviceModel: string;
  serialNumber: string;
  intakeNumber: string;
  intakeAt: string;
  status: RepairStatus;
  estimates: Estimate[];
  selectedEstimateId?: string;
  repairItems: RepairItem[];
  timeline: RepairTimeline[];
  completionDueAt?: string;
};

type RepairCasesContextType = {
  cases: RepairCase[];
  setStatus: (id: string, status: RepairStatus) => boolean;
  goToNextStatus: (id: string) => boolean;
  canManuallyMoveToNextStatus: (repairCase?: RepairCase) => boolean;
  getNextStatus: (repairCase?: RepairCase) => RepairStatus | null;
  saveCompletionDueAt: (id: string, completionDueAt: string) => void;
  toggleRepairItem: (id: string, itemId: string) => void;
  addRepairItem: (id: string, payload: { title: string; note?: string }) => void;
  sendEstimate: (id: string, amount: number, note: string, options?: { additional?: boolean }) => Promise<void>;
  acceptEstimate: (id: string, estimateId?: string) => void;
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

const withStatusTransition = (repairCase: RepairCase, status: RepairStatus): RepairCase => {
  if (repairCase.status === status) {
    return repairCase;
  }

  return {
    ...repairCase,
    status,
    timeline: [...repairCase.timeline, createTimeline(status, repairCase.repairItems)],
  };
};

const defaultChecklist = [
  { id: 'CHECK-1', title: '브레이크/제동 상태 점검', note: '패드 마모 및 유압 라인 확인', done: false },
  { id: 'CHECK-2', title: '배터리 및 전장 상태 점검', note: '충전 사이클/셀 밸런스 확인', done: false },
  { id: 'CHECK-3', title: '구동계/체인 장력 점검', note: '체인/스프라켓 소음 여부 확인', done: false },
];

const initialCases: RepairCase[] = [
  {
    id: 'RC-1001',
    customerName: '김민수',
    customerPhone: '010-3210-4321',
    customerLocation: '강남구 역삼동',
    requestNote: '출퇴근 전 빠른 점검 요청',
    deviceModel: 'Road Bike Pro 3',
    serialNumber: 'RBP3-2391-AX',
    intakeNumber: 'IN-2026-0001',
    intakeAt: '2026-02-11T09:10:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-11T09:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-1002',
    customerName: '박지우',
    customerPhone: '010-8876-1123',
    customerLocation: '송파구 잠실동',
    requestNote: '배터리 지속시간 저하 및 제동 소음',
    deviceModel: 'Urban E-Bike M2',
    serialNumber: 'UEM2-7710-QP',
    intakeNumber: 'IN-2026-0002',
    intakeAt: '2026-02-11T10:10:00.000Z',
    status: 'ESTIMATE_PENDING',
    estimates: [
      {
        id: 'EST-2026-10021',
        amount: 180000,
        note: '배터리 셀 밸런싱 + 브레이크 패드 교체',
        sentAt: '2026-02-11T10:20:00.000Z',
      },
    ],
    selectedEstimateId: 'EST-2026-10021',
    repairItems: [
      { id: 'CHECK-1', title: '브레이크/제동 상태 점검', done: true, completedAt: '2026-02-11T11:05:00.000Z' },
      { id: 'CHECK-2', title: '배터리 및 전장 상태 점검', done: true, completedAt: '2026-02-11T11:12:00.000Z' },
      { id: 'CHECK-3', title: '구동계/체인 장력 점검', done: false },
    ],
    timeline: [
      { status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-11T10:10:00.000Z', completedRepairItems: [] },
      { status: 'ESTIMATE_PENDING', statusLabel: STATUS_LABEL.ESTIMATE_PENDING, updatedAt: '2026-02-11T11:20:00.000Z', completedRepairItems: ['브레이크/제동 상태 점검'] },
    ],
  },
  {
    id: 'RC-1003',
    customerName: '이지은',
    customerPhone: '010-2100-5632',
    customerLocation: '마포구 서교동',
    requestNote: '체인 소음 및 제동력 저하',
    deviceModel: 'City Fold Mini',
    serialNumber: 'CFM-3221-KK',
    intakeNumber: 'IN-2026-0003',
    intakeAt: '2026-02-10T16:45:00.000Z',
    status: 'ESTIMATE_ACCEPTED',
    estimates: [
      {
        id: 'EST-2026-10031',
        amount: 120000,
        note: '브레이크 패드 + 체인 장력 조정',
        sentAt: '2026-02-10T18:00:00.000Z',
      },
    ],
    selectedEstimateId: 'EST-2026-10031',
    repairItems: [
      { id: 'CHECK-1', title: '브레이크/제동 상태 점검', note: '앞바퀴 패드 마모 확인', done: true, completedAt: '2026-02-11T07:45:00.000Z' },
      { id: 'CHECK-2', title: '배터리 및 전장 상태 점검', done: false },
      { id: 'CHECK-3', title: '구동계/체인 장력 점검', done: false },
    ],
    timeline: [
      { status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-10T16:45:00.000Z', completedRepairItems: [] },
      { status: 'ESTIMATE_PENDING', statusLabel: STATUS_LABEL.ESTIMATE_PENDING, updatedAt: '2026-02-10T19:10:00.000Z', completedRepairItems: [] },
      {
        status: 'ESTIMATE_ACCEPTED',
        statusLabel: STATUS_LABEL.ESTIMATE_ACCEPTED,
        updatedAt: '2026-02-11T08:40:00.000Z',
        completedRepairItems: ['브레이크/제동 상태 점검'],
      },
    ],
  },
  {
    id: 'RC-2001',
    customerName: '최도윤',
    customerPhone: '010-1111-2201',
    customerLocation: '강서구 화곡동',
    requestNote: 'AI 진단: 배터리 방전',
    deviceModel: 'Patoz Urban X1',
    serialNumber: 'PZ-001',
    intakeNumber: 'IN-2026-0101',
    intakeAt: '2026-02-12T08:10:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2002', customerName: '오세린', customerPhone: '010-1111-2202', customerLocation: '양천구 신정동',
    requestNote: 'AI 진단: 브레이크 소음', deviceModel: 'Patoz Cargo Z2', serialNumber: 'PZ-002', intakeNumber: 'IN-2026-0102', intakeAt: '2026-02-12T08:25:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:25:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2003', customerName: '유나경', customerPhone: '010-1111-2203', customerLocation: '관악구 봉천동',
    requestNote: 'AI 진단: 타이어 펑크', deviceModel: 'Patoz Fold F9', serialNumber: 'PZ-003', intakeNumber: 'IN-2026-0103', intakeAt: '2026-02-12T08:40:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:40:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2004', customerName: '장현우', customerPhone: '010-1111-2204', customerLocation: '성동구 성수동',
    requestNote: 'AI 진단: 모터 출력 저하', deviceModel: 'Patoz Trail T4', serialNumber: 'PZ-004', intakeNumber: 'IN-2026-0104', intakeAt: '2026-02-12T09:00:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:00:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2005', customerName: '한소율', customerPhone: '010-1111-2205', customerLocation: '광진구 자양동',
    requestNote: 'AI 진단: 핸들 유격 발생', deviceModel: 'Patoz Commuter C3', serialNumber: 'PZ-005', intakeNumber: 'IN-2026-0105', intakeAt: '2026-02-12T09:12:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:12:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2006', customerName: '임지후', customerPhone: '010-1111-2206', customerLocation: '동작구 사당동',
    requestNote: 'AI 진단: 변속 불량', deviceModel: 'Patoz City M5', serialNumber: 'PZ-006', intakeNumber: 'IN-2026-0106', intakeAt: '2026-02-12T09:25:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:25:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2007', customerName: '정가은', customerPhone: '010-1111-2207', customerLocation: '은평구 불광동',
    requestNote: 'AI 진단: 체인 이탈 반복', deviceModel: 'Patoz Hybrid H1', serialNumber: 'PZ-007', intakeNumber: 'IN-2026-0107', intakeAt: '2026-02-12T09:40:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:40:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2008', customerName: '서민재', customerPhone: '010-1111-2208', customerLocation: '중랑구 면목동',
    requestNote: 'AI 진단: 충전 단자 손상', deviceModel: 'Patoz Mini V2', serialNumber: 'PZ-008', intakeNumber: 'IN-2026-0108', intakeAt: '2026-02-12T09:55:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:55:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2009', customerName: '배하린', customerPhone: '010-1111-2209', customerLocation: '서초구 반포동',
    requestNote: 'AI 진단: 디스플레이 점멸', deviceModel: 'Patoz Trek R7', serialNumber: 'PZ-009', intakeNumber: 'IN-2026-0109', intakeAt: '2026-02-12T10:10:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T10:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2010', customerName: '문태오', customerPhone: '010-1111-2210', customerLocation: '노원구 중계동',
    requestNote: 'AI 진단: 서스펜션 누유 의심', deviceModel: 'Patoz MTB K8', serialNumber: 'PZ-010', intakeNumber: 'IN-2026-0110', intakeAt: '2026-02-12T10:25:00.000Z', status: 'NEW_REQUEST', estimates: [], repairItems: defaultChecklist,
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T10:25:00.000Z', completedRepairItems: [] }],
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

  const canManuallyMoveToNextStatus = (repairCase?: RepairCase) => {
    if (!repairCase) return false;
    const currentIdx = STATUS_FLOW.indexOf(repairCase.status);
    return currentIdx >= MANUAL_STATUS_START_INDEX && currentIdx < STATUS_FLOW.length - 1;
  };

  const getNextStatus = (repairCase?: RepairCase): RepairStatus | null => {
    if (!repairCase) return null;
    const currentIdx = STATUS_FLOW.indexOf(repairCase.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) {
      return null;
    }
    return STATUS_FLOW[currentIdx + 1];
  };

  const goToNextStatus = (id: string) => {
    let moved = false;
    setCases((prev) =>
      updateCase(prev, id, (item) => {
        if (!canManuallyMoveToNextStatus(item)) {
          return item;
        }
        const nextStatus = getNextStatus(item);
        if (!nextStatus) {
          return item;
        }
        moved = true;
        return withStatusTransition(item, nextStatus);
      }),
    );
    return moved;
  };

  const saveCompletionDueAt = (id: string, completionDueAt: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        completionDueAt,
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

  const addRepairItem = (id: string, payload: { title: string; note?: string }) => {
    const title = payload.title.trim();
    if (!title) {
      return;
    }

    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...item,
        repairItems: [...item.repairItems, { id: `ITEM-${Date.now()}`, title, note: payload.note?.trim(), done: false }],
      })),
    );
  };

  const sendEstimate = async (id: string, amount: number, note: string, options?: { additional?: boolean }) => {
    const estimateId = `EST-${Date.now()}`;
    const sentAt = nowIso();

    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...withStatusTransition(item, 'ESTIMATE_PENDING'),
        selectedEstimateId: estimateId,
        estimates: [
          {
            id: estimateId,
            amount,
            note,
            sentAt,
            additional: options?.additional,
          },
          ...item.estimates,
        ],
      })),
    );
  };

  const acceptEstimate = (id: string, estimateId?: string) => {
    setCases((prev) =>
      updateCase(prev, id, (item) => ({
        ...withStatusTransition(item, 'ESTIMATE_ACCEPTED'),
        selectedEstimateId: estimateId ?? item.selectedEstimateId ?? item.estimates[0]?.id,
      })),
    );
  };

  const findCase = (id?: string) => cases.find((item) => item.id === id);

  const value = useMemo(
    () => ({
      cases,
      setStatus,
      goToNextStatus,
      canManuallyMoveToNextStatus,
      getNextStatus,
      saveCompletionDueAt,
      toggleRepairItem,
      addRepairItem,
      sendEstimate,
      acceptEstimate,
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
