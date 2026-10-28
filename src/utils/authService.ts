import { UserAccount, UserRole, RegionType } from '../types';

const STORAGE_USERS_KEY = 'aqua_smart_registered_users_v1';
const STORAGE_SESSION_KEY = 'aqua_smart_active_session_v1';

export interface StoredUserRecord extends UserAccount {
  passwordHash: string;
}

// Initial pre-configured accounts: local residents first, followed by historical technician accounts
const DEFAULT_USERS: StoredUserRecord[] = [
  {
    id: 'usr-res-1',
    username: 'resident',
    passwordHash: 'waterhome',
    name: 'Rahul Sharma',
    role: 'resident',
    roleTitle: 'Local Resident',
    facility: 'Green Valley Homes, Ward 4',
    defaultRegion: 'urban',
    createdAt: '2026-06-01 09:00:00',
  },
  {
    id: 'usr-res-2',
    username: 'priya',
    passwordHash: 'waterhome',
    name: 'Priya Patel',
    role: 'homeowner',
    roleTitle: 'Homeowner',
    facility: 'Borewell Community, Block B',
    defaultRegion: 'groundwater',
    createdAt: '2026-06-15 14:30:00',
  },
  {
    id: 'usr-1',
    username: 'sameer',
    passwordHash: 'smartwater2025',
    name: 'Dr. Sameer Dalvi',
    role: 'analyst',
    roleTitle: 'Quality Lead Analyst',
    facility: 'Central Municipal Water Testing Lab',
    defaultRegion: 'groundwater',
    createdAt: '2026-01-15 08:30:00',
  },
  {
    id: 'usr-2',
    username: 'aman',
    passwordHash: 'water2026',
    name: 'Aman Sharma',
    role: 'technician',
    roleTitle: 'Field Lab Technician',
    facility: 'District Pumping Station 4B',
    defaultRegion: 'urban',
    createdAt: '2026-03-10 11:15:00',
  },
];

export const ROLE_DETAILS: Record<UserRole, { title: string; badgeColor: string; description: string }> = {
  resident: {
    title: 'Local Resident',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Check home water, save test records, and track family drinking safety.',
  },
  homeowner: {
    title: 'Homeowner',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Track well/borewell water, appliances, and filter replacement dates.',
  },
  business: {
    title: 'Local Shop / Cafe',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Monitor drinking water quality for customers, food prep, and coffee brewing.',
  },
  analyst: {
    title: 'Quality Lead Analyst',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Full testing, calibration, analytical review, and CSV export permissions.',
  },
  technician: {
    title: 'Field Lab Technician',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Authorized to run sample analyses and log data. Restricted from clearing archives.',
  },
  auditor: {
    title: 'Compliance Auditor',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Read-only access to historical quality logs, safety trends, and regulatory exports.',
  },
  manager: {
    title: 'Facility Manager',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'High-level operational overview, demand forecasting, and system configuration.',
  },
};

/**
 * Load users from persistent storage or initialize with defaults
 */
function getUsersFromStorage(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading user store:', err);
  }
  return DEFAULT_USERS;
}

function saveUsersToStorage(users: StoredUserRecord[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed saving user store:', err);
  }
}

/**
 * Auth Service API
 */
export const authService = {
  /**
   * Retrieves active user session
   */
  getCurrentUser(): UserAccount | null {
    try {
      const session = localStorage.getItem(STORAGE_SESSION_KEY);
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.error('Session retrieval error:', e);
    }
    // Default to the first analyst account for instant ease of use
    return DEFAULT_USERS[0];
  },

  /**
   * Login user with credentials
   */
  async login(username: string, password: string): Promise<UserAccount> {
    // Artificial latency for realistic async state transitions (Rule 8)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password.trim()) {
      throw new Error('Please enter both your username and password.');
    }

    const users = getUsersFromStorage();
    const found = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.passwordHash === password
    );

    if (!found) {
      throw new Error('Invalid username or password. Check your credentials or select a demo account.');
    }

    const account: UserAccount = {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
      roleTitle: found.roleTitle,
      facility: found.facility,
      defaultRegion: found.defaultRegion,
      createdAt: found.createdAt,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(account));
    return account;
  },

  /**
   * Register a new user account
   */
  async register(params: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    facility?: string;
    defaultRegion?: RegionType;
  }): Promise<UserAccount> {
    await new Promise((resolve) => setTimeout(resolve, 550));

    const cleanUsername = params.username.trim().toLowerCase();
    const cleanPassword = params.password.trim();
    const cleanName = params.name.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must contain at least 3 characters.');
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      throw new Error('Password must contain at least 4 characters.');
    }
    if (!cleanName) {
      throw new Error('Please provide your full analyst name.');
    }

    const users = getUsersFromStorage();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${cleanUsername}" is already registered. Please choose another.`);
    }

    const roleInfo = ROLE_DETAILS[params.role];
    const newUser: StoredUserRecord = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      passwordHash: cleanPassword,
      name: cleanName,
      role: params.role,
      roleTitle: roleInfo.title,
      facility: (params.facility || 'Regional Water Laboratory').trim(),
      defaultRegion: params.defaultRegion || 'groundwater',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedList = [...users, newUser];
    saveUsersToStorage(updatedList);

    const account: UserAccount = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      roleTitle: newUser.roleTitle,
      facility: newUser.facility,
      defaultRegion: newUser.defaultRegion,
      createdAt: newUser.createdAt,
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(account));
    return account;
  },

  /**
   * Logout user and clear session
   */
  logout(): void {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  },

  /**
   * Role-based authorization checks (Rule 7)
   */
  canRunTests(role: UserRole): boolean {
    return role === 'resident' || role === 'homeowner' || role === 'business' || role === 'analyst' || role === 'technician' || role === 'manager';
  },

  canClearRecords(role: UserRole): boolean {
    return role === 'resident' || role === 'homeowner' || role === 'analyst' || role === 'manager';
  },

  canExportData(_role: UserRole): boolean {
    return true; // All authenticated roles are authorized to export compliance reports
  },

  canModifySettings(role: UserRole): boolean {
    return role === 'analyst' || role === 'manager';
  },
};
