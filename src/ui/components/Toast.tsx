import { useEffect, useState } from 'react';
import { useGame } from '../GameContext';

export function Toast() {
  const { toast } = useGame();
  const [visible, setVisible] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    setVisible(toast.text);
    const t = setTimeout(() => setVisible(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  return visible ? (
    <div className="toast" role="status">
      {visible}
    </div>
  ) : null;
}
