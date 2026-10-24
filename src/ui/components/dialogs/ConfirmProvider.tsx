import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '@/i18n/context';

export interface ConfirmRequest {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
}
type Confirm = (request: ConfirmRequest) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const c = useContext(ConfirmContext);
  if (!c) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return c;
}

/** Promise-based confirmation for destructive actions, rendered with a native modal dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const { t } = useT();

  const confirm = useCallback<Confirm>((req) => {
    setRequest(req);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);

  useEffect(() => {
    if (request && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      cancel.current?.focus();
    }
  }, [request]);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    dialog.current?.close();
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        aria-labelledby="confirm-title"
      >
        {request && (
          <>
            <h2 id="confirm-title">{request.title}</h2>
            <p>{request.body}</p>
            <div className="dialog__actions">
              <button className="btn" ref={cancel} onClick={() => settle(false)}>
                {t('app.cancel')}
              </button>
              <button className="btn btn--primary" onClick={() => settle(true)}>
                {request.confirmLabel}
              </button>
            </div>
          </>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
