import {JsonValue} from "@prisma/client/runtime/library";

export interface User {
  id?: number;
  userName: string;
  email?: string;
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
  titlesId?: number;
  titles?: Titles[];
  data?: JsonValue;
  badges?: string;
  company?: string;
  url?: string;
  school?: string;
  github?: string;
  presentation?: string;
  Histories?: Histories;
  userRanking?: UserRanking;
  userTournament?: UserTournament;
  userMatch?: UserMatch;
}

export interface Titles {
  id: number;
  value: string;
  label: string;
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

export interface shortUser {
  userName: string;
  password?: string;
  email?: string;
  id?: number;
  firstName?: string;
  lastName?: string;
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

export interface Histories {
  id: number;
  userID: number;
  user: User;
  modificationType: string;
  details: string;
  modificationDate: Date;
  oldValue: string;
  newValue: string;
}

export interface Tournament {
  id: number;
  startDate: Date;
  endDate: Date;
  playerMax: number;
  title: string;
  description: string;
  rewards: string;
}

export interface Match {
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

export interface Ranking {
  id: number;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  rewards: string;
  matches: Match[];
  userRanking: UserRanking[];
}

export interface UserRanking {
  id?: number;
  userID: number;
  user: User;
  rankingsID?: number;
  points?: number;
}

export interface UserTournament {
  id: number;
  userID: number;
  user: User;
  tournamentID: number;
  tournament: Tournament;
  points: number;
}

export interface UserMatch {
  id: number;
  userID: number;
  user: User;
  matchID: number;
  match: Match;
}

export interface Event {
  id?: number;
  startDate?: Date;
  endDate?: Date;
  playerMax?: number;
  title?: string;
  description?: string;
  rewards?: string;
  organize?: string;
  matches?: Match[];
  userEvent?: UserEvent[];
}

export interface UserEvent {
  id: number;
  userID: number;
  user: User;
  eventsID: number;
  events: Event;
  points: number;
}
