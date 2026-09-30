import type { Action } from "@/schema/actions";
import { isSafeLinkUrl } from "@/schema/validation";

export type EventHandler = (payload: Record<string, unknown> | undefined) => void | Promise<void>;

export interface ActionRuntimeOptions {
  onDismiss?: () => void;
  navigate?: (to: string) => void;
  openUrl?: (url: string, newTab: boolean) => void;
  handlers?: Record<string, EventHandler>;
  onEvent?: (name: string, payload: Record<string, unknown> | undefined) => void;
  onError?: (message: string, action: Action) => void;
}

export interface ActionRuntime {
  run(action: Action | undefined): Promise<void>;
  register(name: string, handler: EventHandler): () => void;
}

const defaultNavigate = (to: string) => window.location.assign(to);
const defaultOpenUrl = (url: string, newTab: boolean) => {
  if (newTab) window.open(url, "_blank", "noopener,noreferrer");
  else window.location.assign(url);
};

export function createActionRuntime(opts: ActionRuntimeOptions = {}): ActionRuntime {
  const handlers = new Map<string, EventHandler>(Object.entries(opts.handlers ?? {}));

  return {
    register(name, handler) {
      handlers.set(name, handler);
      return () => {
        if (handlers.get(name) === handler) handlers.delete(name);
      };
    },
    async run(action) {
      if (!action) return;
      const fail = (message: string) => opts.onError?.(message, action);
      try {
        switch (action.type) {
          case "dismiss":
            opts.onDismiss?.();
            return;
          case "navigate":
            if (!isSafeLinkUrl(action.to)) return fail(`blocked unsafe navigate target: ${action.to}`);
            (opts.navigate ?? defaultNavigate)(action.to);
            return;
          case "external_url":
            if (!isSafeLinkUrl(action.url)) return fail(`blocked unsafe URL: ${action.url}`);
            (opts.openUrl ?? defaultOpenUrl)(action.url, action.newTab ?? true);
            return;
          case "event": {
            const handler = handlers.get(action.name);
            if (handler) await handler(action.payload);
            else if (opts.onEvent) opts.onEvent(action.name, action.payload);
            else fail(`no handler registered for event "${action.name}"`);
            return;
          }
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
