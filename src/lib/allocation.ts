export type AllocationRules = {
  saveRate: number;
  spendRate: number;
  investRate: number;
  investFloor: number;
};

export const DEFAULT_ALLOCATION_RULES: AllocationRules = {
  saveRate: 0.2,
  spendRate: 0.3,
  investRate: 0.5,
  investFloor: 500,
};

export type CategorySpend = {
  categoryId: string;
  name: string;
  color: string | null;
  icon: string | null;
  isFixed: boolean;
  isInvestment: boolean;
  total: number;
};
