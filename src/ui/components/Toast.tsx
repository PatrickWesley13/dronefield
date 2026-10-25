import { useEffect, useState } from 'react';
import { useT } from '@/i18n/context';
import { translateMessage } from '@/i18n/messages';
import type { Message } from '@/shared/message';
import { useGame } from '../GameContext';

export function Toast() {
  const { toast } = useGame();
  const { locale } = useT();
  const [visible, setVisible] = useState<Message | null>(null);
  useEffect(() => {
    if (!toast) return;
    setVisible(toast.message);
    const t = setTimeout(() => setVisible(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  return visible ? (
    <div className="toast" role="status">
      {translateMessage(locale, visible)}
    </div>
  ) : null;
}
