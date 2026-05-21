import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-sm text-gray-300">{format(now, 'dd MMM yyyy HH:mm:ss')}</span>;
}
