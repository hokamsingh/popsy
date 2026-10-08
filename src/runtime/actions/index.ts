import type { Action } from "@/schema/actions";
import { isSafeLinkUrl } from "@/schema/validation";

/**
 * Handles an app action. Return (or resolve) `false` when the person backed out, e.g. closed a checkout;
 * throw (or reject) when it failed. Anything else counts as success.
 */
export type EventHandler = (payload: Record<string, unknown> | undefined) => unknown;

export type ActionStatus = "done" | "cancelled" | "failed";

export interface ActionRuntimeOptions {
  onDismiss?: () => void;
  navigate?: (to: string) => void;
  openUrl?: (url: string, newTab: boolean) => void;
  handlers?: Record<string, EventHandler>;
  onEvent?: (name: string, payload: Record<string, unknown> | undefined) => void;
  onError?: (message: string, action: Action) => void;
}

export interface ActionRuntime {
  run(action: Action | undefined): Promise<ActionStatus>;
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
      if (!action) return "done";
      const fail = (message: string): ActionStatus => {
        opts.onError?.(message, action);
        return "failed";
      };
      try {
        switch (action.type) {
          case "dismiss":
            opts.onDismiss?.();
            return "done";
          case "navigate":
            if (!isSafeLinkUrl(action.to)) return fail(`blocked unsafe navigate target: ${action.to}`);
            (opts.navigate ?? defaultNavigate)(action.to);
            return "done";
          case "external_url":
            if (!isSafeLinkUrl(action.url)) return fail(`blocked unsafe URL: ${action.url}`);
            (opts.openUrl ?? defaultOpenUrl)(action.url, action.newTab ?? true);
            return "done";
          case "event": {
            if (action.closeFirst) opts.onDismiss?.();
            const handler = handlers.get(action.name);
            if (handler) return (await handler(action.payload)) === false ? "cancelled" : "done";
            if (opts.onEvent) {
              opts.onEvent(action.name, action.payload);
              return "done";
            }
            return fail(`no handler registered for event "${action.name}"`);
          }
        }
      } catch (err) {
        return fail(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
