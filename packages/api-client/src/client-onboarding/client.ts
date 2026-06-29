import type {
  CompleteClientOnboardingInput,
  CompleteClientOnboardingResponse,
} from '@servicienta/types';

interface ClientOnboardingApiClientDependencies {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

export interface ClientOnboardingApiClient {
  clientOnboarding: {
    complete: (
      input: CompleteClientOnboardingInput,
    ) => Promise<CompleteClientOnboardingResponse>;
  };
}

export function createClientOnboardingApiClient({
  apiFetch,
}: ClientOnboardingApiClientDependencies): ClientOnboardingApiClient {
  return {
    clientOnboarding: {
      complete: (input) =>
        apiFetch<CompleteClientOnboardingResponse>('/api/client-onboarding', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
    },
  };
}
