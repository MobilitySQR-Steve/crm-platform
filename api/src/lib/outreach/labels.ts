// Server-side display labels for enums — used in the user message we
// send to Claude. Mirrors the frontend's src/constants/enums.js so the
// model sees "100–250" instead of "B_100_250".

import {
  CrossBorderMovesBand,
  EmployeeBand,
  TriggerEvent,
} from '@prisma/client';

export const EMPLOYEE_BAND_LABELS: Record<EmployeeBand, string> = {
  UNKNOWN: 'unknown',
  LT_100: '< 100',
  B_100_250: '100–250',
  B_250_700: '250–700',
  B_700_1000: '700–1,000',
  GT_1000: '1,000+',
};

export const MOVES_BAND_LABELS: Record<CrossBorderMovesBand, string> = {
  UNKNOWN: 'unknown',
  LT_10: '< 10 / yr',
  B_10_50: '10–50 / yr',
  B_50_250: '50–250 / yr',
  B_250_500: '250–500 / yr',
  GT_500: '500+ / yr',
};

export const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
  UNKNOWN: 'unknown',
  NEW_MARKET: 'New market opened',
  INTL_HIRING: 'International hiring',
  AUDIT_FINDING: 'Audit / compliance finding',
  OUTGREW_TOOL: 'Outgrew current tool',
  RFP: 'RFP',
  INBOUND: 'Inbound',
  OTHER: 'Other',
};
