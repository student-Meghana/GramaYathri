import { Route } from './types';

export const STATIC_ROUTES: Route[] = [
  {
    id: 'R1',
    name: 'Grama A ➔ Town Center',
    stops: ['Grama A', 'Old Temple', 'Market Square', 'High School', 'Town Hospital', 'Town Center']
  },
  {
    id: 'R2',
    name: 'North Village ➔ Main Bus Stand',
    stops: ['North Village', 'River Bridge', 'Big Banyan Tree', 'Police Station', 'Main Bus Stand']
  },
  {
    id: 'R3',
    name: 'West Hills ➔ Industrial Area',
    stops: ['West Hills', 'Stone Quarry', 'Lake View', 'Railway Crossing', 'Industrial Area']
  }
];

export const COLORS = {
  primary: '#1976D2',
  success: '#43A047',
  warning: '#E53935',
  background: '#F5F5F5'
};

export const AVG_TIME_PER_STOP = 7; // Average 7 minutes per stop
