import type { ProviderAuthDescriptor } from '../../core/provider-port';

/** Non-secret auth blueprint. The actual key (if any) is the consumer's generic config. */
export const echoAuth: ProviderAuthDescriptor = {
  type: 'api_key',
  fields: [{ key: 'apiKey', label: 'API Key', placement: 'header' }],
};
