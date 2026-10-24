import { useMemo, useState } from 'react';
import { fileName } from '@/app/levels';
import { useT } from '@/i18n/context';
import { CodeEditor } from '../../editor/CodeEditor';
import { useController, useGame } from '../../GameContext';
import { useConfirm } from '../dialogs/ConfirmProvider';
import { ConsolePanel } from './ConsolePanel';
import { Toolbar } from './Toolbar';

export function CodePanel({ insertRequest }: { insertRequest: { text: string; nonce: number } | null }) {
  const game = useGame();
  const controller = useController();
  const confirm = useConfirm();
  const { t } = useT();
  const [reveal, setReveal] = useState<{ line: number; nonce: number } | null>(null);
  const scope = useMemo(
    () => ({ unlockedFunctions: new Set(game.save.unlockedFunctions), unlockedCrops: game.save.unlockedCrops }),
    [game.save.unlockedFunctions, game.save.unlockedCrops],
  );

  const restoreStarter = async () => {
    const ok = await confirm({
      title: t('code.replaceTitle'),
      body: t('code.replaceBody'),
      confirmLabel: t('code.replaceConfirm'),
    });
    if (ok) controller.restoreStarterCode();
  };

  return (
    <section className="code" aria-label={t('code.label')}>
      <Toolbar />
      <div className="editor-head">
        <span className="editor-head__file">{fileName(game.level)}</span>
        <span className="editor-head__state">{t('code.saved')}</span>
        <button className="btn btn--ghost" onClick={() => void restoreStarter()} disabled={!!game.playback}>
          {t('code.starter')}
        </button>
      </div>
      <CodeEditor
        documentId={game.level.id}
        value={game.code}
        readOnly={!!game.playback}
        executingLine={game.executingLine}
        errorLine={game.errorLine}
        completionScope={scope}
        onChange={(code) => controller.setCode(code)}
        revealRequest={reveal}
        insertRequest={insertRequest}
      />
      <ConsolePanel onGotoLine={(line) => setReveal({ line, nonce: Date.now() })} />
    </section>
  );
}
