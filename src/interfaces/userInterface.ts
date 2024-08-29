import { JsonValue } from '@prisma/client/runtime/library';

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
  badgesWin?: JsonValue;
  company?: string;
  url?: string;
  school?: string;
  github?: string;
  presentation?: string;
  Histories?: Histories;
  userRanking?: UserRanking;
  userTournament?: UserTournament;
  userMatch?: UserMatch;
  puzzlesEntreprise?: PuzzlesEntreprise;
  commandeEntreprise?: CommandeEntreprise;
  siren?: string;
}

export interface Titles {
  id?: number;
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
    data: {
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
      groups?: Groups;
    };
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
  groupsId?: number;
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
  numberRegistered?: number;
}

export interface Match {
  id: number;
  date: Date;
  time: Date;
  location: string;
  status: string;
  score: string;
  tournamentID: number;
  tournament: Tournament;
  rankingsID: number;
  rankings: Ranking;
  winnerId: number;
  winnerPoints: number;
  loserId: number;
  loserPoints: number;
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
  maxPoints: number;
  minPoints: number;
  puzzle: puzzles[];
}

export interface UserRanking {
  id?: number;
  userID: number;
  user: User;
  rankingsID?: number;
  rankings: Ranking;
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
  startDate: Date;
  endDate: Date;
  playerMax: number;
  title: string;
  description: string;
  rewards: string;
  organize: string;
  createPuzzles?: boolean;
  priceAdjustment?: number;
  basePrice?: number;
  priceDetails?: JsonValue;
  matches?: Match[];
  userEvent?: UserEvent[];
  puzzles?: PuzzlesEntreprise[];
  accepted?: boolean;
  numberRegistered?: number;
}

export interface priceDetails {
  id: number;
  basePrice: number;
  proximityCharge: number;
  durationCharge: number;
  puzzlesCharge: number;
  adjustmentCharge: number;
  finalPrice: number;
}

export interface UserEvent {
  id: number;
  userID: number;
  user: User;
  eventsID: number;
  events: Event;
  points: number;
  numberRegistered: number;
}

export interface ResponseCreateUser {
  bool: boolean;
  type: string;
}

export interface puzzles {
  id: number;
  rankingsID: number;
  rankings: Ranking;
  tournamentID: number;
  tournament: Tournament;
  eventID: number;
  events: Event;
  tests: JsonValue;
  title: string;
  details: string;
}

export interface Puzzle {
  details: string;
  test: [];
}

export interface CommandeEntreprise {
  id: number;
  idSession: string;
  objetSession: JsonValue;
  idPayment: string;
  item: string;
  userID: number;
  dateCommande: Date;
  etatCommande: string;
  nbCreateTest: number;
  customerId?: string;
}

export interface PuzzlesEntreprise {
  id: number;
  userID?: number;
  user?: User;
  tests: JSON;
  details: string;
}

export interface CvUser {
  id: number;
  cvName: string;
  userID: number;
  user: User;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  technicalSkills: TechnicalSkill[];
  softSkills: SoftSkill[];
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface TechnicalSkill {
  name: string;
}

export interface SoftSkill {
  name: string;
}
