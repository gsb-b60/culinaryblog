import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { loginFormSchema, type LoginFormValues } from '../validation/login'

export function useLoginForm(onSubmit: (values: LoginFormValues) => Promise<void> | void) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  })

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return { ...form, submit }
}
