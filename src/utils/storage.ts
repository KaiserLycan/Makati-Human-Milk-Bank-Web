// Storage helper utility for MHMB staff portal frontend prototype

export interface RawMilkCollection {
  id: string;
  donorName: string;
  dateCollected: string;
  expectedVolume: number; // in mL
  actualVolume: number | null;
  status: 'Collected' | 'Pooled' | 'Pending';
}

export interface PooledMilkBatch {
  id: string;
  sourceIds: string[];
  expectedVolume: number;
  actualVolume: number;
  status: 'Pooled' | 'Pasteurized';
  datePooled: string;
}

export interface MilkInventoryItem {
  id: string;
  sourceBatchId: string;
  volume: number;
  datePasteurized: string;
  expirationDate: string;
  status: 'Available' | 'Expired' | 'Dispensed';
}

export interface MilkRequest {
  id: string;
  beneficiaryName: string;
  hospital: string;
  requestedVolume: number;
  dateRequested: string;
  status: 'Pending' | 'Fulfilled' | 'Declined';
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff';
  status: 'Active' | 'Inactive';
  password?: string;
  phone?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface UserProfile {
  name: string;
  id: string;
  email: string;
  role: 'manager' | 'staff';
  phone?: string;
  profile_image_url?: string | null;
  created_at?: string;
  status?: string;
}

// Default datasets
const defaultCollections: RawMilkCollection[] = [
  { id: 'RM001', donorName: 'Olivia Carter', dateCollected: '2026-06-18', expectedVolume: 150, actualVolume: null, status: 'Collected' },
  { id: 'RM002', donorName: 'Emma Phillips', dateCollected: '2026-06-19', expectedVolume: 200, actualVolume: null, status: 'Collected' },
  { id: 'RM003', donorName: 'Sophia Mitchell', dateCollected: '2026-06-20', expectedVolume: 250, actualVolume: null, status: 'Collected' },
  { id: 'RM004', donorName: 'Liam Turner', dateCollected: '2026-06-21', expectedVolume: 300, actualVolume: null, status: 'Collected' },
];

const defaultPools: PooledMilkBatch[] = [
  { id: 'PM001', sourceIds: ['RM001', 'RM002'], expectedVolume: 350, actualVolume: 340, status: 'Pooled', datePooled: '2026-06-20' },
];

const defaultInventory: MilkInventoryItem[] = [
  { id: 'INV001', sourceBatchId: 'PM001', volume: 340, datePasteurized: '2026-06-20', expirationDate: '2026-12-20', status: 'Available' },
];

const defaultRequests: MilkRequest[] = [
  { id: 'REQ001', beneficiaryName: 'Leo Carter', hospital: 'Makati Medical Center', requestedVolume: 200, dateRequested: '2026-06-19', status: 'Pending' },
  { id: 'REQ002', beneficiaryName: 'Noah Phillips', hospital: 'St. Jude Hospital', requestedVolume: 150, dateRequested: '2026-06-20', status: 'Fulfilled' },
];

const defaultUsers: StaffUser[] = [
  { id: 'U001', name: 'Alice May Miller', email: 'staff@mhmb.gov', role: 'manager', status: 'Active' },
  { id: 'U002', name: 'John Smith', email: 'smith.j@mhmb.gov', role: 'staff', status: 'Active' },
  { id: 'U003', name: 'Dr. Bob Jones', email: 'bob.jones@mhmb.gov', role: 'staff', status: 'Active' },
];

const defaultAudits: AuditLog[] = [
  { id: 'AUD001', timestamp: '2026-06-20 14:30:00', user: 'Alice May Miller', action: 'Created Pool Batch', details: 'Pooled RM001, RM002 into PM001' },
  { id: 'AUD002', timestamp: '2026-06-20 16:45:00', user: 'Alice May Miller', action: 'Approved Request', details: 'Approved REQ002 for 150mL' },
];

const defaultProfile: UserProfile = {
  name: 'Alice May Miller',
  id: '2024102114',
  email: 'staff@mhmb.gov',
  role: 'manager',
};

// Safe localStorage checks
const isBrowser = typeof window !== 'undefined';

export function initializeStorage() {
  if (!isBrowser) return;

  if (!localStorage.getItem('mhmb_collections')) {
    localStorage.setItem('mhmb_collections', JSON.stringify(defaultCollections));
  }
  if (!localStorage.getItem('mhmb_pools')) {
    localStorage.setItem('mhmb_pools', JSON.stringify(defaultPools));
  }
  if (!localStorage.getItem('mhmb_inventory')) {
    localStorage.setItem('mhmb_inventory', JSON.stringify(defaultInventory));
  }
  if (!localStorage.getItem('mhmb_requests')) {
    localStorage.setItem('mhmb_requests', JSON.stringify(defaultRequests));
  }
  if (!localStorage.getItem('mhmb_users')) {
    localStorage.setItem('mhmb_users', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('mhmb_audits')) {
    localStorage.setItem('mhmb_audits', JSON.stringify(defaultAudits));
  }
  if (!localStorage.getItem('mhmb_profile')) {
    localStorage.setItem('mhmb_profile', JSON.stringify(defaultProfile));
  }
}

// Load helpers
export function loadCollections(): RawMilkCollection[] {
  if (!isBrowser) return defaultCollections;
  initializeStorage();
  const data = localStorage.getItem('mhmb_collections');
  return data ? JSON.parse(data) : defaultCollections;
}

export function loadPools(): PooledMilkBatch[] {
  if (!isBrowser) return defaultPools;
  initializeStorage();
  const data = localStorage.getItem('mhmb_pools');
  return data ? JSON.parse(data) : defaultPools;
}

export function loadInventory(): MilkInventoryItem[] {
  if (!isBrowser) return defaultInventory;
  initializeStorage();
  const data = localStorage.getItem('mhmb_inventory');
  return data ? JSON.parse(data) : defaultInventory;
}

export function loadRequests(): MilkRequest[] {
  if (!isBrowser) return defaultRequests;
  initializeStorage();
  const data = localStorage.getItem('mhmb_requests');
  return data ? JSON.parse(data) : defaultRequests;
}

export function loadUsers(): StaffUser[] {
  if (!isBrowser) return defaultUsers;
  initializeStorage();
  const data = localStorage.getItem('mhmb_users');
  return data ? JSON.parse(data) : defaultUsers;
}

export function loadAudits(): AuditLog[] {
  if (!isBrowser) return defaultAudits;
  initializeStorage();
  const data = localStorage.getItem('mhmb_audits');
  return data ? JSON.parse(data) : defaultAudits;
}

export function loadProfile(): UserProfile {
  if (!isBrowser) return defaultProfile;
  initializeStorage();
  const data = localStorage.getItem('mhmb_profile');
  return data ? JSON.parse(data) : defaultProfile;
}

// Save helpers
export function saveCollections(collections: RawMilkCollection[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_collections', JSON.stringify(collections));
}

export function savePools(pools: PooledMilkBatch[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_pools', JSON.stringify(pools));
}

export function saveInventory(inventory: MilkInventoryItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_inventory', JSON.stringify(inventory));
}

export function saveRequests(requests: MilkRequest[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_requests', JSON.stringify(requests));
}

export function saveUsers(users: StaffUser[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_users', JSON.stringify(users));
}

export function saveAudits(audits: AuditLog[]) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_audits', JSON.stringify(audits));
}

export function saveProfile(profile: UserProfile) {
  if (!isBrowser) return;
  localStorage.setItem('mhmb_profile', JSON.stringify(profile));
  // Also synchronize Alice May Miller's role in the user list
  const users = loadUsers();
  const updatedUsers = users.map((u) => u.id === 'U001' ? { ...u, role: profile.role } : u);
  saveUsers(updatedUsers);
}
