import { useState, useEffect, type FormEvent } from 'react';
import { createIncident } from '../../api/incidents';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { api } from '../../api/client';
import 'leaflet/dist/leaflet.css';

export function SOSForm() {
  const geo = useGeolocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [people, setPeople] = useState(1);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geo.coords && lat === null && lng === null) {
      setLat(geo.coords.lat);
      setLng(geo.coords.lng);
    }
  }, [geo.coords, lat, lng]);

  function LocationPicker() {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      },
    });
    return null;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/incidents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(data.url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lat || !lng) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await createIncident({
        title,
        description,
        people_reported: people,
        lat,
        lng,
        category: 'OTHER',
        photo_url: photoUrl || undefined,
      });
      setAiResult(data);
      setTitle('');
      setDescription('');
      setPhotoUrl(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create incident');
    } finally {
      setBusy(false);
    }
  }

  const mapCenter = lat && lng ? [lat, lng] : [20.5937, 78.9629]; // Default to India center

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-accent">File SOS Report</h2>
        
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="Emergency title"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="min-h-28 border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="Describe the situation (AI will triage this)"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-gray-300">People Trapped/Affected</label>
          <input
            value={people}
            onChange={(e) => setPeople(Number(e.target.value))}
            min={1}
            type="number"
            className="w-32 border border-border bg-bg px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-gray-300">Photo / Video Evidence (Optional)</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:border file:border-border file:bg-bg file:text-gray-300 file:hover:bg-surface"
          />
          {uploading && <span className="text-xs text-accent animate-pulse">Uploading...</span>}
          {photoUrl && <span className="text-xs text-green-400">Upload successful!</span>}
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-gray-300">Confirm Location on Mini-Map</label>
          <div className="h-48 border border-border">
            <MapContainer center={mapCenter as [number, number]} zoom={geo.coords ? 13 : 5} className="h-full w-full">
              <TileLayer
                attribution="&copy; CartoDB"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <LocationPicker />
              {lat && lng && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={10}
                  pathOptions={{ color: '#00E5FF', fillColor: '#00E5FF', fillOpacity: 0.8 }}
                />
              )}
            </MapContainer>
          </div>
          <div className="text-xs font-mono text-gray-400">
            Selected Coords: {lat ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Locating...'}
          </div>
        </div>

        {error && <div className="border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-400">{error}</div>}

        <button
          disabled={busy || uploading || !lat || !lng}
          className="border border-accent bg-accent/10 px-3 py-2 text-accent font-semibold hover:bg-accent hover:text-bg transition-all disabled:opacity-40"
        >
          {busy ? 'Processing AI Triage...' : 'Submit SOS Report'}
        </button>
      </form>

      {aiResult && (
        <div className="border border-accent/40 bg-surface p-4 space-y-3">
          <h3 className="text-md font-bold text-accent">AI Triage Assessment</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Urgency:</span>{' '}
              <span className={`font-bold ${aiResult.urgency === 'CRITICAL' ? 'text-red-500' : aiResult.urgency === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'}`}>
                {aiResult.urgency}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Category:</span>{' '}
              <span className="text-white font-semibold">{aiResult.category}</span>
            </div>
          </div>
          
          {aiResult.ai_summary && (
            <div className="text-sm">
              <span className="text-gray-400">AI Summary:</span>
              <p className="text-gray-200 mt-1 italic">{aiResult.ai_summary}</p>
            </div>
          )}

          {aiResult.ai_resources_needed && aiResult.ai_resources_needed.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-400">Suggested Resources:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {aiResult.ai_resources_needed.map((r: string) => (
                  <span key={r} className="text-xs bg-bg px-2 py-1 border border-border text-gray-300 font-mono">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {typeof aiResult.ai_spam_score === 'number' && aiResult.ai_spam_score >= 0.6 && (
            <div className="border border-high/50 bg-high/10 p-2 text-xs text-high font-mono">
              FLAGGED: possible false report (spam score {Number(aiResult.ai_spam_score).toFixed(2)}). Operators may request verification.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
