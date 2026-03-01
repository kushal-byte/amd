import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ConstraintSet {
  timeRange?: string;
  timeDuration?: number; // in minutes
  timeLimit?: string; // e.g., "17:00"
  budget: number;
  energyLevel: 'low' | 'medium' | 'high';
  walkingTolerance: number;
  walkDistance: number;
  travelMode: 'walking' | 'two-wheeler' | 'four-wheeler';
  indoorPreference: boolean;
  accessibilityNeeds: string[];
  collegeLocation: string;
  userLat?: number;
  userLng?: number;
}

export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  reasoning: string;
  duration: string;
  distance?: string;
  travelTime?: string;
  type: 'class' | 'break' | 'transit' | 'meal';
  coordinates: {
    lat: number;
    lng: number;
  };
  constraints: {
    label: string;
    status: 'met' | 'warning' | 'failed';
    detail: string;
  }[];
}

export interface ForecastDay {
  date: string;
  temp: string;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain' | 'wind';
}

export interface PlanResponse {
  id?: string;
  summary: string;
  weather?: string;
  rainProbability?: number;
  forecast?: ForecastDay[];
  items: ItineraryItem[];
  overallScore: number;
  name?: string;
  createdAt?: string;
  missingParameters?: string[];
}

export interface SavedPlanHeader {
  id: string;
  name: string;
  summary: string;
  overallScore: number;
  createdAt: string;
}
