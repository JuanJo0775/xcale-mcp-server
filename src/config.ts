export interface Config {
  readonly port: number;
  readonly nodeEnv: string;
  readonly logLevel: string;
  /** Hop-B shared secret. Loaded from Doppler in real envs; never committed. */
  readonly serverSecret: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 8080),
    nodeEnv: env.NODE_ENV ?? 'development',
    logLevel: env.LOG_LEVEL ?? 'info',
    serverSecret: env.MCP_SERVER_SECRET ?? '',
  };
}
