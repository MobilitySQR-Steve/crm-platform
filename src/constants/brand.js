import {
  LayoutDashboard, Users, FileText, CheckSquare, BarChart3,
  Building2, UserCheck, TrendingUp, Workflow,
  Globe, Receipt, FolderOpen,
} from 'lucide-react';

export const BRAND = {
  purple:   '#2563EB',
  orange:   '#F9B878',
  teal:     '#00BFE6',
  green:    '#38AC87',
  lavender: '#8C78FF',
};

export const MODULES = {
  taxsqr: {
    key:      'taxsqr',
    label:    'TaxSQR',
    sublabel: 'D2C · Tax Services',
    color:    '#38AC87',
    colorBg:  'rgba(56,172,135,0.15)',
    Icon:     Receipt,
    basePath: '/taxsqr',
    nav: [
      { id:'dashboard', label:'Dashboard', Icon:LayoutDashboard, path:'/taxsqr/dashboard' },
      { id:'clients',   label:'Clients',   Icon:Users,           path:'/taxsqr/clients',  count:'142' },
      { id:'cases',     label:'Tax Cases', Icon:FolderOpen,      path:'/taxsqr/cases',
        sub:[
          { id:'cases-kanban', label:'Kanban Board', path:'/taxsqr/cases/kanban' },
          { id:'cases-list',   label:'List View',    path:'/taxsqr/cases/list'   },
        ],
      },
      { id:'tasks',   label:'My Tasks', Icon:CheckSquare, path:'/taxsqr/tasks',   badge:5 },
      { id:'reports', label:'Reports',  Icon:BarChart3,   path:'/taxsqr/reports'          },
    ],
  },
  mobility: {
    key:      'mobility',
    label:    'MobilitySQR',
    sublabel: 'B2B · Enterprise',
    color:    '#2563EB',
    colorBg:  'rgba(141,59,157,0.15)',
    Icon:     Globe,
    basePath: '/mobility',
    nav: [
      { id:'dashboard', label:'Dashboard', Icon:LayoutDashboard, path:'/mobility/dashboard' },
      { id:'accounts',  label:'Accounts',  Icon:Building2,       path:'/mobility/accounts',  count:'38' },
      { id:'contacts',  label:'Contacts',  Icon:UserCheck,       path:'/mobility/contacts'              },
      { id:'pipeline',  label:'Pipeline',  Icon:TrendingUp,      path:'/mobility/pipeline',
        sub:[
          { id:'pipeline-kanban', label:'Kanban Board', path:'/mobility/pipeline/kanban' },
          { id:'pipeline-list',   label:'List View',    path:'/mobility/pipeline/list'   },
        ],
      },
      { id:'workflows', label:'Workflows', Icon:Workflow,    path:'/mobility/workflows'          },
      { id:'tasks',     label:'My Tasks',  Icon:CheckSquare, path:'/mobility/tasks',   badge:3   },
      { id:'reports',   label:'Reports',   Icon:BarChart3,   path:'/mobility/reports'            },
    ],
  },
};

// Derive readable breadcrumb label from URL segment
export const BREADCRUMB_LABELS = {
  taxsqr:'TaxSQR', mobility:'MobilitySQR',
  dashboard:'Dashboard', clients:'Clients', cases:'Tax Cases',
  kanban:'Kanban', list:'List View', documents:'Documents',
  tasks:'My Tasks', reports:'Reports', accounts:'Accounts',
  contacts:'Contacts', pipeline:'Pipeline', workflows:'Workflows',
};
