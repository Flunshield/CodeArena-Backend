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
  group?: Groups;
}

export interface Groups {
  id: number;
  name: string;
  roles: string;
}

export interface DecodedTokenController {
  sub: number;
  aud: {
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
    group?: Groups;
  };
  iat: number;
  exp: number;
}
export interface UserConnect {
  userName: string;
  password?: string;
  email?: string;
}

export interface DecodedTokenMail {
  id?: number;
  userName: string;
  iat: number;
  exp: number;
}

export interface UserMail {
  id?: number;
  userName?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  groupsId?: number;
}
