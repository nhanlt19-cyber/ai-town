import { ConvexReactClient, useConvex } from 'convex/react';
import { InputArgs, InputReturnValue, Inputs } from '../../convex/aiTown/inputs';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export async function waitForInput(
  convex: ConvexReactClient,
  inputId: Id<'inputs'>,
  timeoutMs: number = 60000, // 60 seconds default timeout
) {
  const watch = convex.watchQuery(api.aiTown.main.inputStatus, { inputId });
  let result = watch.localQueryResult();
  // The result's undefined if the query's loading and null if the input hasn't
  // been processed yet.
  if (result === undefined || result === null) {
    let dispose: undefined | (() => void);
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        // Set up timeout
        timeoutId = setTimeout(() => {
          if (dispose) {
            dispose();
          }
          reject(new Error(`Input ${inputId} timed out after ${timeoutMs}ms. The engine may be overloaded.`));
        }, timeoutMs);

        dispose = watch.onUpdate(() => {
          try {
            result = watch.localQueryResult();
          } catch (e: any) {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            reject(e);
            return;
          }
          if (result !== undefined && result !== null) {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            resolve();
          }
        });
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (dispose) {
        dispose();
      }
    }
  }
  if (!result) {
    throw new Error(`Input ${inputId} was never processed.`);
  }
  if (result.kind === 'error') {
    throw new Error(result.message);
  }
  return result.value;
}

export function useSendInput<Name extends keyof Inputs>(
  engineId: Id<'engines'>,
  name: Name,
): (args: InputArgs<Name>) => Promise<InputReturnValue<Name>> {
  const convex = useConvex();
  return async (args) => {
    const inputId = await convex.mutation(api.world.sendWorldInput, { engineId, name, args });
    return await waitForInput(convex, inputId);
  };
}
