import { z } from 'zod';

import { ProviderErrorCode } from '../../core/errors';
import type { IProvider } from '../../core/provider-port';
import { type ToolResult, toolError, toolSuccess } from '../../core/types';
import { echoAuth } from './auth';
import { SLUG, echoManifest } from './manifest';
import { TOOL_AUTH_CHECK, TOOL_SAY, echoTools } from './tools';

const SaySchema = z.object({ message: z.string().min(1, 'message must not be empty') }).strict();

export const echoProvider: IProvider = {
  manifest: echoManifest,
  auth: echoAuth,
  listTools: () => echoTools,
  callTool: async (toolName, args, ctx): Promise<ToolResult> => {
    switch (toolName) {
      case TOOL_SAY: {
        const parsed = SaySchema.safeParse(args);
        if (!parsed.success) {
          return toolError({
            code: ProviderErrorCode.INVALID_INPUT,
            toolName,
            providerSlug: SLUG,
            message: parsed.error.issues.map((i) => i.message).join('; '),
          });
        }
        return toolSuccess({ toolName, providerSlug: SLUG, data: { echoed: parsed.data.message } });
      }

      case TOOL_AUTH_CHECK: {
        // A real adapter would call the provider API with ctx.token.reveal() here (egress only).
        if (ctx.token.isEmpty()) {
          return toolError({
            code: ProviderErrorCode.AUTH_EXPIRED,
            toolName,
            providerSlug: SLUG,
            message: 'No credential forwarded; reconnect required.',
          });
        }
        return toolSuccess({ toolName, providerSlug: SLUG, data: { authenticated: true } });
      }

      default:
        return toolError({
          code: ProviderErrorCode.UNKNOWN_TOOL,
          toolName,
          providerSlug: SLUG,
          message: `Unknown tool: ${toolName}`,
        });
    }
  },
};
