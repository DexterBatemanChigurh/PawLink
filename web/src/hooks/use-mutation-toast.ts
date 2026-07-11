import { useMutation, useQueryClient, type UseMutationOptions, type MutationFunction } from '@tanstack/react-query'
import { useToastStore } from '../store/toast.store'

type ErrorWithResponse = { response?: { data?: { message?: string | string[] } }; message?: string }

export function useMutationWithToast<TData, TVariables, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: {
    successMessage?: string
    invalidateQueries?: string[][]
  } & Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'>,
) {
  const toast = useToastStore()
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      if (options?.successMessage) {
        toast.add(options.successMessage, 'success')
      }
      options?.invalidateQueries?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error: Error, variables, context) => {
      const err = error as unknown as ErrorWithResponse
      const msg = options?.onError
        ? undefined
        : err?.response?.data?.message || err?.message || 'Erro ao executar operação.'
      if (msg) {
        toast.add(Array.isArray(msg) ? msg[0] : msg, 'error')
      }
      options?.onError?.(error, variables, context)
    },
  })
}
