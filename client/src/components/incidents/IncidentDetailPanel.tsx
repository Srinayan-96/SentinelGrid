import { useState, useEffect } from 'react';
import type { Incident } from '../../types';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { api } from '../../api/client';
import { format } from 'date-fns';

interface Props {
  incident: Incident | null;
  onRefresh?: () => void;
}

export function IncidentDetailPanel({ incident, onRefresh }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (incident?.id) {
      fetchLogs();
      setSuccess(false);
      setError(null);
    }
  }, [incident?.id]);

  async function fetchLogs() {
    if (!incident) return;
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/incidents/${incident.id}/logs`);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!incident) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/incidents/${incident.id}/rate`, { score, comment });
      setSuccess(true);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  if (!incident) {
    return (
      <aside className="flex-1 border-l border-border bg-surface p-6 text-sm text-gray-400 flex items-center justify-center font-mono">
        [ SELECT AN INCIDENT TO VIEW TACTICAL TIMELINE ]
      </aside>
    );
  }

  return (
    <aside className="flex-1 border-l border-border bg-surface p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-2">
          <UrgencyBadge urgency={incident.urgency} />
          <StatusBadge status={incident.status} />
        </div>
        <h2 className="text-xl font-bold text-white">{incident.title}</h2>
        <p className="mt-2 text-sm text-gray-300 bg-bg/50 p-3 border border-border/50 rounded">
          {incident.description}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 font-mono text-xs border-b border-border pb-4">
        <div>
          <span className="text-gray-400">REPORTED BY:</span>
          <div className="text-white mt-1">{incident.reporter_id?.slice(0, 8) || 'Anonymous'}</div>
        </div>
        <div>
          <span className="text-gray-400">ASSIGNED TO:</span>
          <div className="text-accent mt-1">
            {incident.assigned_to ? `Responder (${incident.assigned_to.slice(0, 8)})` : 'UNASSIGNED'}
          </div>
        </div>
        <div>
          <span className="text-gray-400">PEOPLE AFFECTED:</span>
          <div className="text-white mt-1">{incident.people_reported}</div>
        </div>
        <div>
          <span className="text-gray-400">PEOPLE SAVED:</span>
          <div className="text-green-400 mt-1">{incident.people_saved}</div>
        </div>
      </div>

      {/* Photo Evidence */}
      {incident.photo_url && (
        <div className="border-b border-border pb-4">
          <span className="text-xs font-semibold text-gray-400 font-mono">EVIDENCE:</span>
          <div className="mt-2 border border-border/50 overflow-hidden rounded max-w-xs">
            {incident.photo_url.endsWith('.mp4') ? (
              <video src={incident.photo_url} controls className="w-full" />
            ) : (
              <img src={incident.photo_url} alt="Evidence" className="w-full object-cover" />
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="border-b border-border pb-4">
        <h3 className="text-sm font-semibold text-gray-300 font-mono mb-3">TACTICAL TIMELINE</h3>
        {loadingLogs ? (
          <div className="text-xs text-accent animate-pulse font-mono">Retrieving logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-xs text-gray-500 font-mono">No logs available.</div>
        ) : (
          <div className="space-y-3 border-l-2 border-border/50 pl-4 ml-2">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-border border-2 border-surface" />
                <div className="text-xs font-semibold text-accent font-mono">{log.action}</div>
                {log.note && <div className="text-xs text-gray-300 mt-0.5">{log.note}</div>}
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Flow */}
      {incident.status === 'RESOLVED' && (
        <div className="bg-accent/5 border border-accent/30 p-4 rounded">
          <h3 className="text-sm font-bold text-accent flex items-center gap-2">
            <span>⭐</span> Rate Response
          </h3>
          
          {success ? (
            <div className="text-sm text-green-400 font-semibold mt-2">
              Thank you! Your feedback helps improve emergency response.
            </div>
          ) : (
            <form onSubmit={handleRate} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300">Rating Score (1-5)</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScore(num)}
                      className={`w-8 h-8 text-sm font-bold rounded ${
                        score >= num ? 'bg-accent text-bg' : 'bg-bg border border-border text-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Feedback / Comments (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full min-h-16 border border-border bg-bg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent mt-1"
                  placeholder="Help us understand how the response went..."
                />
              </div>

              {error && <div className="text-xs text-red-400">{error}</div>}

              <button
                disabled={submitting}
                className="w-full border border-accent bg-accent/10 px-3 py-2 text-xs text-accent font-bold hover:bg-accent hover:text-bg transition-all disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          )}
        </div>
      )}
    </aside>
  );
}
