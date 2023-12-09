export interface User {
  id?: number;
  userName: string;
  password: string;
  email: string;
  emailVerified?: boolean;
  createdAt?: Date;
  lastLogin?: Date;
  status?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  groupsId?: number;
  languagePreference?: string;
  groups?: Groups;
}

export interface Groups {
  id: number;
  name: string;
  roles: string[];
}

export interface UserConnect {
  userName: string;
  password?: string;
  email?: string;
}
