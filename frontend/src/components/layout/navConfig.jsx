import {
  Dashboard,
  Assessment,
  Receipt,
  People,
  NoteAdd,
  ShoppingCart,
  LocalShipping,
  Description,
  CompareArrows,
  CalendarMonth,
  Inventory2,
  Groups,
  CardMembership,
  Settings,
  Lightbulb,
  AccountBalanceWallet,
  Warehouse,
  AccountBalance,
  AssessmentOutlined,
  AdminPanelSettings,
} from '@mui/icons-material';

/**
 * Grouped navigation structure shared by the sidebar.
 * Each group has a section label and a list of items.
 */
export const NAV_GROUPS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { label: 'Reports', path: '/reports', icon: <Assessment /> },
      { label: 'Insights', path: '/insights', icon: <Lightbulb /> },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Invoices', path: '/invoices', icon: <Receipt /> },
      { label: 'Customers', path: '/customers', icon: <People /> },
      { label: 'Credit/Debit Notes', path: '/credit-debit-notes', icon: <NoteAdd /> },
      { label: 'E-Way Bills', path: '/eway-bills', icon: <LocalShipping /> },
    ],
  },
  {
    section: 'Purchases',
    items: [
      { label: 'Purchases', path: '/purchases', icon: <ShoppingCart /> },
      { label: 'Suppliers', path: '/suppliers', icon: <LocalShipping /> },
    ],
  },
  {
    section: 'GST',
    items: [
      { label: 'GST Returns', path: '/gst-returns', icon: <Description /> },
      { label: '2A/2B Reconciliation', path: '/gstr2-reconciliation', icon: <CompareArrows /> },
      { label: 'TDS / TCS', path: '/tds-tcs', icon: <AccountBalanceWallet /> },
      { label: 'Compliance Calendar', path: '/compliance-calendar', icon: <CalendarMonth /> },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { label: 'Products', path: '/products', icon: <Inventory2 /> },
      { label: 'Inventory', path: '/inventory', icon: <Warehouse /> },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Bank Reconciliation', path: '/bank-reconciliation', icon: <AccountBalance /> },
      { label: 'Financials', path: '/financials', icon: <AssessmentOutlined /> },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Team', path: '/team', icon: <Groups /> },
      { label: 'Admin', path: '/admin', icon: <AdminPanelSettings /> },
      { label: 'Pricing', path: '/pricing', icon: <CardMembership /> },
      { label: 'Settings', path: '/settings', icon: <Settings /> },
    ],
  },
];

/** Flat map of path -> label, plus a couple of extra routes for the top-bar title. */
export const PATH_TITLES = {
  ...NAV_GROUPS.reduce((acc, group) => {
    group.items.forEach((item) => {
      acc[item.path] = item.label;
    });
    return acc;
  }, {}),
  '/profile': 'Profile',
};

export function getPageTitle(pathname) {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  // Fall back to the closest matching prefix (e.g. /invoices/123)
  const match = Object.keys(PATH_TITLES).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  return match ? PATH_TITLES[match] : 'GST Compliance';
}
