'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ticketSchema } from '@pizza/schema'
import { RouterOutput } from '@pizza/trpc'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { MySelect } from '@/components/my-select'
import { ReactSelect } from '@/components/Select'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

import { Ticket } from './columns'

const formName = ticketSchema.description

export type Member = RouterOutput['getMembers']['members'][0]

export function TicketForm({
  refetch,
  ticket,
  members,
}: {
  refetch: () => void
  ticket?: Ticket
  members: Member[]
}) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const values = {
    type: [
      { value: 'LOBINHO', label: 'Lobinho' },
      { value: 'ESCOTEIRO', label: 'Escoteiro' },
      { value: 'SENIOR', label: 'Senior' },
      { value: 'PIONEIRO', label: 'Pioneiro' },
      { value: 'OUTRO', label: 'Outro' },
    ],

    memberId: members.map((member) => ({
      value: member.id,
      label: member.name,
    })),
  }

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: ticket
      ? {
          ...(ticket as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      : undefined,
  })

  const createTicket = trpc.createTicket.useMutation({
    onSuccess: () => {
      form.reset()
      setIsOpen(false)
      refetch()

      toast({
        title: `${formName} cadastrado com sucesso`,
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.log(error) // eslint-disable-line no-console
      toast({
        title: `Erro ao cadastrar o ${formName}`,
        description: error.response?.data as string,

        variant: 'destructive',
      })
    },
  })

  const updateTicket = trpc.updateTicket.useMutation({
    onSuccess: () => {
      form.reset()
      setIsOpen(false)
      refetch()

      toast({
        title: `${formName} atualizado com sucesso`,
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.log(error) // eslint-disable-line no-console
      toast({
        title: `Erro ao atualizar o ${formName}`,
        description: error.response?.data as string,

        variant: 'destructive',
      })
    },
  })

  async function onSubmit(values: z.infer<typeof ticketSchema>) {
    try {
      if (ticket) {
        await updateTicket.mutateAsync({
          id: ticket.id,
          ...values,
        })
      } else {
        await createTicket.mutateAsync(values)
      }

      console.log('values', values)
    } catch (error) { } // eslint-disable-line
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">{ticket ? 'Editar' : 'Adicionar'}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {ticket ? 'Editar' : 'Cadastrar'} {formName}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* <pre>
              {JSON.stringify(
                Object.keys(ticketSchema.shape).map(
                  (fieldName) => ticketSchema.shape[fieldName],
                ),
                null,
                2,
              )}
            </pre> */}

            {Object.keys(ticketSchema.shape).map((fieldName) => {
              const fieldSchema = ticketSchema.shape[fieldName]
              const label = fieldSchema._def.description // Obtém a descrição do campo

              if (fieldSchema._def.typeName === 'ZodEnum') {
                const v: { value: string; label: string }[] = values[fieldName]

                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof typeof ticketSchema.shape}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <ReactSelect
                            defaultValue={v.filter(
                              (value) => value.value === field.value,
                            )}
                            value={v.filter(
                              (value) => value.value === field.value,
                            )}
                            onChange={(value: any) => { // eslint-disable-line
                              field.onChange(value.value)
                            }}
                            options={v}
                            isDisabled={field.disabled}
                            closeMenuOnSelect
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              }

              if (
                fieldSchema._def.typeName === 'ZodNumber' ||
                fieldSchema._def.typeName === 'ZodString'
              ) {
                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof typeof ticketSchema.shape}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={label}
                            {...field}
                            value={
                              typeof field.value === 'boolean'
                                ? `${field.value}`
                                : field.value
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              }

              if (fieldSchema._def.typeName === 'ZodOptional') {
                if (
                  fieldSchema._def.innerType._def.typeName === 'ZodNumber' ||
                  fieldSchema._def.innerType._def.typeName === 'ZodString'
                ) {
                  const ifUuid = fieldSchema._def.innerType._def.checks?.find(
                    (c) => c.kind === 'uuid',
                  )

                  if (ifUuid) {
                    const v: { value: string; label: string }[] =
                      values[fieldName]

                    return (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as keyof typeof ticketSchema.shape}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <ReactSelect
                                defaultValue={v.filter(
                                  (value) => value.value === field.value,
                                )}
                                value={v.filter(
                                  (value) => value.value === field.value,
                                )}
                              onChange={(value: any) => { // eslint-disable-line
                                  field.onChange(value.value)
                                }}
                                options={v}
                                isDisabled={field.disabled}
                                closeMenuOnSelect
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  }

                  return (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName as keyof typeof ticketSchema.shape}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={label}
                              {...field}
                              value={
                                typeof field.value === 'boolean'
                                  ? `${field.value}`
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                } else if (
                  fieldSchema._def.innerType._def.typeName === 'ZodBoolean'
                ) {
                  return (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName as keyof typeof ticketSchema.shape}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <MySelect
                              options={[
                                { value: 'true', label: 'Sim' },
                                { value: 'false', label: 'Não' },
                              ]}
                              value={field.value ? 'true' : 'false'}
                              onChange={(e) => {
                                field.onChange(e === 'true')
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                }
              }

              return null
            })}

            <Button type="submit" className="w-full">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : ticket ? (
                'Editar'
              ) : (
                'Cadastrar'
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
/**
 * 
 * {
    "_def": {
      "innerType": {
        "_def": {
          "typeName": "ZodBoolean",
          "coerce": false
        }
      },
      "typeName": "ZodOptional"
    }
  }
 */
