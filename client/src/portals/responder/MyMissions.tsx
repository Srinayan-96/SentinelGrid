import { useIncidents } from '../../hooks/useIncidents';
import { useAuthStore } from '../../store/authStore';
import { IncidentCard } from '../../components/incidents/IncidentCard';

export function MyMissions() {
  const user = useAuthStore((s) => s.user);
  const { data = [] } = useIncidents();
  const missions = data.filter((item) => item.assigned_to === user?.id);
  return (
    <div className="space-y-2">
      {missions.map((mission) => (
        <IncidentCard key={mission.id} incident={mission} />
      ))}
    </div>
  );
}
