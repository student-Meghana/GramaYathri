export interface Route {
  id: string;
  name: string;
  stops: string[];
}

export interface Ping {
  id?: string;
  routeId: string;
  stopId: string;
  stopName: string;
  timestamp: any;
  userId: string;
  userName: string;
}

export interface Alert {
  id?: string;
  routeId: string;
  type: 'delayed' | 'cancelled' | 'other';
  message: string;
  timestamp: any;
  userId: string;
  userName: string;
}

export interface UserProfile {
  uid: string;
  userName: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
