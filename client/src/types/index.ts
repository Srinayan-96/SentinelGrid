export type UserRole = 'CITIZEN' | 'RESPONDER' | 'ADMIN';
export type IncidentUrgency = 'CRITICAL' | 'HIGH' | 'MODERATE';
export type IncidentStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_ALARM';
export type IncidentCategory =
  | 'FLOOD'
  | 'FIRE'
  | 'EARTHQUAKE'
  | 'MEDICAL'
  | 'RESCUE'
  | 'SHELTER'
  | 'FOOD'
  | 'OTHER';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  force_id?: string;
  unit_name?: string;
  skills?: string[];
  is_available?: boolean;
  is_online?: boolean;
  location?: LatLng;
  total_missions?: number;
  total_saves?: number;
  rating?: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  urgency: IncidentUrgency;
  status: IncidentStatus;
  location: LatLng;
  address?: string;
  landmark?: string;
  photo_url?: string;
  reporter_id?: string;
  assigned_to?: string;
  force_id?: string;
  ai_urgency?: IncidentUrgency;
  ai_category?: IncidentCategory;
  ai_spam_score?: number;
  ai_resources_needed?: string[];
  ai_summary?: string;
  people_reported: number;
  people_saved: number;
  resources_deployed?: string[];
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}
