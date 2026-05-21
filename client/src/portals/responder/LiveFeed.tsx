import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Users, Zap, CheckCircle2, Loader2, Filter } from 'lucide-react';
import { useIncidentStore } from '../../store/incidentStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useRealtimeMap } from '../../hooks/useRealtimeMap';
import { useIncidents } from '../../hooks/useIncidents';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/incidents/StatusBadge';
import { UrgencyBadge } from '../../components/incidents/UrgencyBadge';
import type { Incident, IncidentCategory, IncidentUrgency } from '../../types';

const URGENCY_ORDER: Record<IncidentUrgency, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2 };

const CATEGORY_ICONS: Record<IncidentCategory, string> = {
  FLOOD: '🌊', FIRE: '🔥', EARTHQUAKE: '🏚️', MEDICAL: '🚑',
  RESCUE: '🪢', SHELTER: '⛺', FOOD: '🍱', OTHER: '⚠️',
};

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LiveFeed() {
  useRealtimeMap();
  const { data } = useIncidents();
  const setIncidents = useIncidentStore((s) => s.setIncidents);
  const incidents = useIncidentStore((s) => s.incidents);
  const user = useAuthStore((s) => s.user);
  const geo = useGeolocation();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterMaxDist, setFilterMaxDist] = useState<number>(9999);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (data) setIncidents(data);
  }, [data, setIncidents]);

  // Detect new incidents for slide-in animation
  useEffect(() => {
    const currentIds = new Set(incidents.map((i) => i.id));
    const added = [...currentIds].filter((id) => !prevIds.current.has(id));
    if (added.length > 0) {
      setNewIds((prev) => new Set([...prev, ...added]));
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          added.forEach((id) => next.delete(id));
          return next;
        });
      }, 2000);
    }
    prevIds.current = currentIds;
  }, [incidents]);

  async function handleClaim(incidentId: string) {
    setClaiming(incidentId);
    try {
      await api.patch(`/incidents/${incidentId}/claim`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim';
      alert(msg);
    } finally {
      setClaiming(null);
    }
  }

  const filtered = incidents
    .filter((i) => {
      if (i.status === 'RESOLVED' || i.status === 'FALSE_ALARM') return false;
      if (filterUrgency !== 'ALL' && i.urgency !== filterUrgency) return false;
      if (filterCategory !== 'ALL' && i.category !== filterCategory) return false;
      if (geo.coords) {
        const dist = getDistanceKm(geo.coords.lat, geo.coords.lng, i.location.lat, i.location.lng);
        if (dist > filterMaxDist) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const uDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      if (uDiff !== 0) return uDiff;
      if (geo.coords) {
        const dA = getDistanceKm(geo.coords.lat, geo.coords.lng, a.location.lat, a.location.lng);
        const dB = getDistanceKm(geo.coords.lat, geo.coords.lng, b.location.lat, b.location.lng);
        return dA - dB;
      }
      return 0;
    });

  const urgencyBar: Record<IncidentUrgency, string> = {
    CRITICAL: 'bg-critical',
    HIGH: 'bg-high',
    MODERATE: 'bg-moderate',
  };

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-3 border border-border bg-surface p-3 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="bg-bg border border-border text-xs font-mono text-white px-2 py-1.5 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Urgencies</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MODERATE">MODERATE</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-bg border border-border text-xs font-mono text-white px-2 py-1.5 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Categories</option>
          {(['FLOOD','FIRE','EARTHQUAKE','MEDICAL','RESCUE','SHELTER','FOOD','OTHER'] as const).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterMaxDist}
          onChange={(e) => setFilterMaxDist(Number(e.target.value))}
          className="bg-bg border border-border text-xs font-mono text-white px-2 py-1.5 focus:outline-none focus:border-accent"
        >
          <option value={9999}>Any Distance</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
          <option value={50}>Within 50 km</option>
          <option value={100}>Within 100 km</option>
        </select>
        <span className="ml-auto font-mono text-xs text-gray-400">{filtered.length} incidents</span>
      </div>

      {filtered.length === 0 && (
        <div className="border border-border bg-surface p-8 text-center text-sm text-gray-500 font-mono">
          [ NO ACTIVE INCIDENTS MATCH FILTERS ]
        </div>
      )}

      {filtered.map((incident) => {
        const isMine = incident.assigned_to === user?.id;
        const isOpen = incident.status === 'OPEN';
        const dist = geo.coords
          ? getDistanceKm(geo.coords.lat, geo.coords.lng, incident.location.lat, incident.location.lng).toFixed(1)
          : null;

        return (
          <article
            key={incident.id}
            className={`flex border border-border bg-surface transition-all duration-500 ${
              newIds.has(incident.id)
                ? 'translate-x-0 opacity-100 border-accent/60 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                : ''
            }`}
            style={
              newIds.has(incident.id)
                ? { animation: 'slideIn 0.4s ease-out' }
                : {}
            }
          >
            {/* Urgency color bar */}
            <div className={`w-1 shrink-0 ${urgencyBar[incident.urgency as IncidentUrgency]}`} />

            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgencyBadge urgency={incident.urgency} />
                  <StatusBadge status={incident.status} />
                  <span className="font-mono text-xs text-gray-500">
                    {CATEGORY_ICONS[incident.category as IncidentCategory]} {incident.category}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Claim / Status Button */}
                <div className="shrink-0">
                  {isMine ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-accent border border-accent/40 bg-accent/10 px-3 py-1.5">
                      <CheckCircle2 size={12} /> EN ROUTE
                    </span>
                  ) : isOpen ? (
                    <button
                      onClick={() => handleClaim(incident.id)}
                      disabled={claiming === incident.id}
                      className="flex items-center gap-1.5 text-xs font-mono text-bg bg-accent px-3 py-1.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                      {claiming === incident.id ? <Loader2 size={12} className="animate-spin" /> : null}
                      CLAIM MISSION
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-gray-600 px-3 py-1.5 border border-border">
                      {incident.status}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mt-2 font-semibold text-white">{incident.title}</h3>
              {incident.ai_summary && (
                <p className="mt-1 text-xs text-gray-400">{incident.ai_summary}</p>
              )}

              <div className="mt-2 flex items-center gap-4 text-xs font-mono text-gray-500">
                {incident.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {incident.address}
                  </span>
                )}
                {dist && (
                  <span className="text-accent">{dist} km away</span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={11} /> {incident.people_reported} affected
                </span>
              </div>

              {incident.ai_resources_needed && incident.ai_resources_needed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {incident.ai_resources_needed.map((r: string) => (
                    <span key={r} className="text-[10px] font-mono bg-bg border border-border/60 px-1.5 py-0.5 text-gray-400">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
