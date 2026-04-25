// Display labels + status colors for every Prisma enum used in the UI.
// Single source of truth — components import LABELS[enumValue] and
// STATUS_COLORS[enumValue], never hard-code the raw enum string.

export const EMPLOYEE_BAND = {
  UNKNOWN:    'Unknown',
  LT_100:     '< 100',
  B_100_250:  '100–250',
  B_250_700:  '250–700',
  B_700_1000: '700–1,000',
  GT_1000:    '1,000+',
};

export const MOVES_BAND = {
  UNKNOWN:    'Unknown',
  LT_10:      '< 10 / yr',
  B_10_50:    '10–50 / yr',
  B_50_250:   '50–250 / yr',
  B_250_500:  '250–500 / yr',
  GT_500:     '500+ / yr',
};

export const TRIGGER_EVENT = {
  UNKNOWN:        'Unknown',
  NEW_MARKET:     'New market opened',
  INTL_HIRING:    'International hiring',
  AUDIT_FINDING:  'Audit / compliance finding',
  OUTGREW_TOOL:   'Outgrew current tool',
  RFP:            'RFP',
  INBOUND:        'Inbound',
  OTHER:          'Other',
};

export const PURSUIT_STATUS = {
  NEW:           'New',
  RESEARCHING:   'Researching',
  CONTACTING:    'Contacting',
  ACTIVE_OPP:    'Active opportunity',
  CUSTOMER:      'Customer',
  DISQUALIFIED:  'Disqualified',
};

export const PURSUIT_COLORS = {
  NEW:           '#9CA3AF',
  RESEARCHING:   '#00BFE6',
  CONTACTING:    '#F59E0B',
  ACTIVE_OPP:    '#8C78FF',
  CUSTOMER:      '#38AC87',
  DISQUALIFIED:  '#EF4444',
};

export const OPP_STAGE = {
  PROSPECT:     'Prospect',
  DISCOVERY:    'Discovery',
  DEMO:         'Demo',
  PROPOSAL:     'Proposal',
  NEGOTIATION:  'Negotiation',
  CLOSED_WON:   'Closed won',
  CLOSED_LOST:  'Closed lost',
  ON_HOLD:      'On hold',
};

export const OPP_STAGE_COLORS = {
  PROSPECT:     '#9CA3AF',
  DISCOVERY:    '#00BFE6',
  DEMO:         '#8C78FF',
  PROPOSAL:     '#F59E0B',
  NEGOTIATION:  '#FB923C',
  CLOSED_WON:   '#38AC87',
  CLOSED_LOST:  '#EF4444',
  ON_HOLD:      '#6B7280',
};

// Default forward order for the kanban (excludes terminal/paused).
export const OPP_STAGE_ORDER = [
  'PROSPECT', 'DISCOVERY', 'DEMO', 'PROPOSAL', 'NEGOTIATION',
  'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD',
];

export const ACCOUNT_SOURCE = {
  MANUAL:      'Manual',
  ENRICHMENT:  'Auto-enrichment',
  REFERRAL:    'Referral',
  INBOUND:     'Inbound',
  CONFERENCE:  'Conference',
  IMPORT:      'Import',
};

export const CONTACT_PERSONA = {
  ECONOMIC_BUYER:  'Economic Buyer',
  CHAMPION:        'Champion',
  TECHNICAL:       'Technical Evaluator',
  END_USER:        'End User',
  EXEC_SPONSOR:    'Executive Sponsor',
  OTHER:           'Other',
};

export const CONTACT_PERSONA_COLORS = {
  ECONOMIC_BUYER:  '#2563EB',
  CHAMPION:        '#38AC87',
  TECHNICAL:       '#00BFE6',
  END_USER:        '#9CA3AF',
  EXEC_SPONSOR:    '#F59E0B',
  OTHER:           '#6B7280',
};

export const ACTIVITY_TYPE = {
  CALL:     'Call',
  EMAIL:    'Email',
  MEETING:  'Meeting',
  NOTE:     'Note',
  SYSTEM:   'System',
};

export const ACTIVITY_COLORS = {
  CALL:     '#38AC87',
  EMAIL:    '#00BFE6',
  MEETING:  '#2563EB',
  NOTE:     '#8C78FF',
  SYSTEM:   '#9CA3AF',
};

export const ACTIVITY_ICONS = {
  CALL:     '📞',
  EMAIL:    '✉',
  MEETING:  '📅',
  NOTE:     '📝',
  SYSTEM:   '⚙',
};

export const ENRICHMENT_STATUS_COLORS = {
  PENDING:  '#9CA3AF',
  RUNNING:  '#00BFE6',
  SUCCESS:  '#38AC87',
  PARTIAL:  '#F59E0B',
  FAILED:   '#EF4444',
};

// ── Helpers ──────────────────────────────────────────────────────

export const initials = (name) =>
  name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const fmtMoney = (n) => {
  if (n == null) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};
