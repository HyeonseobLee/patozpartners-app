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

export type RepairHistory = {
  date: string;
  repairItem: string;
  memo: string;
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
  repairHistory: RepairHistory[];
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
    requestNote: '주행 중 뒷바퀴에서 금속 마찰음이 지속되고, 급제동 시 밀리는 느낌이 있어 점검이 필요합니다.',
    deviceModel: 'Road Bike Pro 3',
    serialNumber: 'RBP3-2391-AX',
    intakeNumber: 'IN-2026-0001',
    intakeAt: '2026-02-11T09:10:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-11-20', repairItem: '타이어 교체', memo: '후륜 타이어 균열로 교체 진행' },
      { date: '2025-08-15', repairItem: '브레이크 패드 점검', memo: '패드 잔량 정상, 캘리퍼 정렬 조정' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-11T09:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-1002',
    customerName: '박지우',
    customerPhone: '010-8876-1123',
    customerLocation: '송파구 잠실동',
    requestNote: '완충 후 8km 이내로 배터리가 급격히 소모되고, 저속 제동 시 삐걱거리는 소음이 발생합니다.',
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
    repairHistory: [
      { date: '2025-12-06', repairItem: '배터리 단자 청소', memo: '단자 산화 제거 후 방전 현상 완화' },
      { date: '2025-09-01', repairItem: '브레이크 로터 연마', memo: '로터 편마모 보정' },
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
    requestNote: '체인이 2~3단에서 자주 튀고, 내리막에서 제동력이 약해져 핸들 떨림이 생깁니다.',
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
    repairHistory: [
      { date: '2025-11-02', repairItem: '체인 교체', memo: '마모 한계 초과로 교체 및 윤활' },
      { date: '2025-07-18', repairItem: '브레이크 오일 보충', memo: '레버 유격 조정 포함' },
    ],
    timeline: [
      { status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-10T16:45:00.000Z', completedRepairItems: [] },
      { status: 'ESTIMATE_PENDING', statusLabel: STATUS_LABEL.ESTIMATE_PENDING, updatedAt: '2026-02-10T19:10:00.000Z', completedRepairItems: [] },
      { status: 'ESTIMATE_ACCEPTED', statusLabel: STATUS_LABEL.ESTIMATE_ACCEPTED, updatedAt: '2026-02-11T08:40:00.000Z', completedRepairItems: ['브레이크/제동 상태 점검'] },
    ],
  },
  {
    id: 'RC-2001',
    customerName: '최도윤',
    customerPhone: '010-1111-2201',
    customerLocation: '강서구 화곡동',
    requestNote: '출근길 시동 직후 전원이 꺼지며 계기판이 깜빡입니다. 배터리 잔량 표시도 불안정합니다.',
    deviceModel: 'Patoz Urban X1',
    serialNumber: 'PZ-001',
    intakeNumber: 'IN-2026-0101',
    intakeAt: '2026-02-12T08:10:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-11-20', repairItem: '배터리 BMS 리셋', memo: '간헐적 전원 차단 이슈 재설정 처리' },
      { date: '2025-08-15', repairItem: '충전 포트 점검', memo: '단자 유격 보정' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2002',
    customerName: '오세린',
    customerPhone: '010-1111-2202',
    customerLocation: '양천구 신정동',
    requestNote: '브레이크를 잡을 때마다 고무 타는 냄새와 함께 끼익 소음이 크게 발생합니다.',
    deviceModel: 'Patoz Cargo Z2',
    serialNumber: 'PZ-002',
    intakeNumber: 'IN-2026-0102',
    intakeAt: '2026-02-12T08:25:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-10-03', repairItem: '브레이크 패드 교체', memo: '후륜 패드 조기 마모로 교체' },
      { date: '2025-06-30', repairItem: '유압 라인 에어빼기', memo: '레버 응답 개선 확인' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:25:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2003',
    customerName: '유나경',
    customerPhone: '010-1111-2203',
    customerLocation: '관악구 봉천동',
    requestNote: '주행 중 후륜이 흔들리며 공기압이 빠르게 떨어져 타이어 펑크가 반복됩니다.',
    deviceModel: 'Patoz Fold F9',
    serialNumber: 'PZ-003',
    intakeNumber: 'IN-2026-0103',
    intakeAt: '2026-02-12T08:40:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-12-11', repairItem: '튜브 교체', memo: '밸브 노후로 교체' },
      { date: '2025-09-09', repairItem: '휠 얼라인먼트', memo: '림 변형 교정' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T08:40:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2004',
    customerName: '장현우',
    customerPhone: '010-1111-2204',
    customerLocation: '성동구 성수동',
    requestNote: '언덕길에서 스로틀을 당겨도 모터가 끊기듯 동작하고 출력이 급감합니다.',
    deviceModel: 'Patoz Trail T4',
    serialNumber: 'PZ-004',
    intakeNumber: 'IN-2026-0104',
    intakeAt: '2026-02-12T09:00:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-11-14', repairItem: '모터 컨트롤러 펌웨어 업데이트', memo: '출력 흔들림 개선 패치 반영' },
      { date: '2025-07-22', repairItem: '스로틀 센서 교정', memo: '입력 오차 보정' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:00:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2005',
    customerName: '한소율',
    customerPhone: '010-1111-2205',
    customerLocation: '광진구 자양동',
    requestNote: '핸들을 좌우로 돌릴 때 유격이 커서 코너링 시 앞쪽이 흔들립니다.',
    deviceModel: 'Patoz Commuter C3',
    serialNumber: 'PZ-005',
    intakeNumber: 'IN-2026-0105',
    intakeAt: '2026-02-12T09:12:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-12-01', repairItem: '헤드셋 베어링 교체', memo: '유격 원인 부품 교체' },
      { date: '2025-08-21', repairItem: '스템 토크 재조정', memo: '볼트 토크 재세팅' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:12:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2006',
    customerName: '임지후',
    customerPhone: '010-1111-2206',
    customerLocation: '동작구 사당동',
    requestNote: '변속 레버 조작 시 4단과 5단 사이에서 체인이 헛돌고 단수가 잘 안 맞습니다.',
    deviceModel: 'Patoz City M5',
    serialNumber: 'PZ-006',
    intakeNumber: 'IN-2026-0106',
    intakeAt: '2026-02-12T09:25:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-10-27', repairItem: '변속 케이블 교체', memo: '장력 저하로 케이블 교체' },
      { date: '2025-07-05', repairItem: '디레일러 행어 교정', memo: '미세 휨 복원' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:25:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2007',
    customerName: '정가은',
    customerPhone: '010-1111-2207',
    customerLocation: '은평구 불광동',
    requestNote: '보도블록 구간에서 체인이 자주 이탈하고 페달을 밟을 때 큰 충격음이 납니다.',
    deviceModel: 'Patoz Hybrid H1',
    serialNumber: 'PZ-007',
    intakeNumber: 'IN-2026-0107',
    intakeAt: '2026-02-12T09:40:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-12-08', repairItem: '체인링 점검 및 정렬', memo: '체인라인 편차 수정' },
      { date: '2025-09-14', repairItem: '체인 텐셔너 교체', memo: '스프링 장력 저하 해결' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:40:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2008',
    customerName: '서민재',
    customerPhone: '010-1111-2208',
    customerLocation: '중랑구 면목동',
    requestNote: '충전 케이블을 꽂아도 접촉이 불안정하고 충전 시작/중지가 반복됩니다.',
    deviceModel: 'Patoz Mini V2',
    serialNumber: 'PZ-008',
    intakeNumber: 'IN-2026-0108',
    intakeAt: '2026-02-12T09:55:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-11-25', repairItem: '충전 단자 교체', memo: '핀 손상 확인 후 교체' },
      { date: '2025-08-03', repairItem: '방수 고무 실링 보강', memo: '습기 유입 예방 처리' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T09:55:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2009',
    customerName: '배하린',
    customerPhone: '010-1111-2209',
    customerLocation: '서초구 반포동',
    requestNote: '주행 중 디스플레이가 깜빡이며 속도와 배터리 수치가 순간적으로 0으로 떨어집니다.',
    deviceModel: 'Patoz Trek R7',
    serialNumber: 'PZ-009',
    intakeNumber: 'IN-2026-0109',
    intakeAt: '2026-02-12T10:10:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-10-18', repairItem: '디스플레이 케이블 교체', memo: '단선 구간 재배선' },
      { date: '2025-06-12', repairItem: '계기판 펌웨어 재설치', memo: '오동작 로그 초기화' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T10:10:00.000Z', completedRepairItems: [] }],
  },
  {
    id: 'RC-2010',
    customerName: '문태오',
    customerPhone: '010-1111-2210',
    customerLocation: '노원구 중계동',
    requestNote: '앞 서스펜션에서 오일 자국이 보이고 요철 통과 시 충격 흡수가 거의 되지 않습니다.',
    deviceModel: 'Patoz MTB K8',
    serialNumber: 'PZ-010',
    intakeNumber: 'IN-2026-0110',
    intakeAt: '2026-02-12T10:25:00.000Z',
    status: 'NEW_REQUEST',
    estimates: [],
    repairItems: defaultChecklist,
    repairHistory: [
      { date: '2025-12-19', repairItem: '포크 오일 씰 교체', memo: '누유 재발 방지용 양쪽 교체' },
      { date: '2025-08-28', repairItem: '서스펜션 압력 세팅', memo: '라이더 체중 기준 재세팅' },
    ],
    timeline: [{ status: 'NEW_REQUEST', statusLabel: STATUS_LABEL.NEW_REQUEST, updatedAt: '2026-02-12T10:25:00.000Z', completedRepairItems: [] }],
  },
];

const updateCase = (list: RepairCase[], id: string, updater: (item: RepairCase) => RepairCase): RepairCase[] =>
  list.map((item) => (item.id === id ? updater(item) : item));

const canMoveToRepairCompleted = (repairCase: RepairCase) => repairCase.repairItems.every((repairItem) => repairItem.done);

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
        if (nextStatus === 'REPAIR_COMPLETED' && !canMoveToRepairCompleted(item)) {
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
