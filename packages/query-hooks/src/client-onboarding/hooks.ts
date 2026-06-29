import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CompleteClientOnboardingInput } from '@servicienta/api-client';
import { useApiClient } from '../core/api-client-context.js';
import { clientProfileKeys } from '../client-profiles/keys.js';
import { userKeys } from '../users/keys.js';

export function useCompleteClientOnboarding() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteClientOnboardingInput) =>
      apiClient.clientOnboarding.complete(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.current() });
      void queryClient.invalidateQueries({
        queryKey: clientProfileKeys.lists(),
      });
    },
  });
}
