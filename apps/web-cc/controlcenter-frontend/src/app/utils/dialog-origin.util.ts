import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';

export const ORIGIN_CLOSE_DURATION_MS = 140;

export function resolveTriggerElement(source?: Event | HTMLElement | null): HTMLElement | null {
  if (typeof HTMLElement === 'undefined') {
    return null;
  }

  if (source instanceof HTMLElement) {
    return source;
  }

  if (typeof Event !== 'undefined' && source instanceof Event) {
    if (source.currentTarget instanceof HTMLElement) {
      return source.currentTarget;
    }

    if (source.target instanceof HTMLElement) {
      return (
        source.target.closest('button, [role="button"], .clickable-row, .clickable, mat-card') ??
        source.target
      );
    }
  }

  return null;
}

export function computeOriginVars(triggerEl?: HTMLElement | null): Record<string, string> {
  if (!triggerEl || !triggerEl.isConnected || typeof window === 'undefined') {
    return { '--origin-dx': '0px', '--origin-dy': '0px' };
  }

  const rect = triggerEl.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return { '--origin-dx': '0px', '--origin-dy': '0px' };
  }

  const bx = rect.left + rect.width / 2;
  const by = rect.top + rect.height / 2;
  const dx = Math.round(bx - window.innerWidth / 2);
  const dy = Math.round(by - window.innerHeight / 2);

  return {
    '--origin-dx': `${dx}px`,
    '--origin-dy': `${dy}px`,
  };
}

function applyVarsToDialogElements(
  containerEl: HTMLElement | null | undefined,
  vars: Record<string, string>,
): void {
  if (!containerEl) return;

  const paneEl = containerEl.closest('.cdk-overlay-pane') as HTMLElement | null;
  for (const [key, value] of Object.entries(vars)) {
    containerEl.style.setProperty(key, value);
    paneEl?.style.setProperty(key, value);
  }
}

export function openDialogFromTrigger<T, D = any, R = any>(
  dialog: MatDialog,
  component: ComponentType<T>,
  config: MatDialogConfig<D> = {},
  trigger?: Event | HTMLElement | null,
): MatDialogRef<T, R> {
  const triggerEl = resolveTriggerElement(trigger);
  const vars = computeOriginVars(triggerEl);

  const existingPanelClasses = Array.isArray(config.panelClass)
    ? config.panelClass
    : config.panelClass
      ? [config.panelClass]
      : [];

  const panelClass = Array.from(new Set([...existingPanelClasses, 'rg-origin-dialog']));

  const dialogRef = dialog.open<T, D, R>(component, {
    ...config,
    panelClass,
    enterAnimationDuration: config.enterAnimationDuration ?? '180ms',
    exitAnimationDuration: config.exitAnimationDuration ?? `${ORIGIN_CLOSE_DURATION_MS}ms`,
  });

  const containerEl =
    (typeof document !== 'undefined' ? document.getElementById(dialogRef.id) : null) ??
    ((dialogRef as unknown as { _containerInstance?: { _hostElement?: HTMLElement } })
      ._containerInstance?._hostElement ??
      null);

  if (containerEl) {
    applyVarsToDialogElements(containerEl, vars);
    // Commit initial translated & scaled state before Angular Material adds .mdc-dialog--open in rAF
    void containerEl.offsetWidth;
  }

  dialogRef
    .beforeClosed()
    .pipe(take(1))
    .subscribe(() => {
      if (triggerEl?.isConnected) {
        const refreshedVars = computeOriginVars(triggerEl);
        const currentContainer =
          (typeof document !== 'undefined' ? document.getElementById(dialogRef.id) : null) ??
          containerEl;
        applyVarsToDialogElements(currentContainer, refreshedVars);
      }
    });

  return dialogRef;
}
