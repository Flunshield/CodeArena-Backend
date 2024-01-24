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
  group?: Groups;
  languagePreference?: string;
  localisation?: string;
  titles?: string;
  badges?: string;
  company?: string;
  url?: string;
  school?: string;
  github?: string;
  Histories?: Histories;
  userRanking?: UserRanking;
  userTournament?: UserTournament;
  userMatch?: UserMatch;
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

interface Histories {
  id: number;
  userID: number;
  user: User;
  modificationType: string;
  details: string;
  modificationDate: Date;
  oldValue: string;
  newValue: string;
}

interface Tournament {
  id: number;
  startDate: Date;
  endDate: Date;
  playerMax: number;
  title: string;
  description: string;
  rewards: string;
  matches: Match[];
  userTournaments: UserTournament[];
}

interface Match {
  id: number;
  date: Date;
  time: Date;
  location: string;
  status: string;
  score: number;
  tournamentID: number;
  tournament: Tournament;
  rankingsID: number;
  rankings: Ranking;
}

interface Ranking {
  id: number;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  rewards: string;
  matches: Match[];
  userRanking: UserRanking[];
}

interface UserRanking {
  id: number;
  userID: number;
  user: User;
  rankingsID: number;
  rankings: Ranking;
  points: number;
}

interface UserTournament {
  id: number;
  userID: number;
  user: User;
  tournamentID: number;
  tournament: Tournament;
  points: number;
}

interface UserMatch {
  id: number;
  userID: number;
  user: User;
  matchID: number;
  match: Match;
}
