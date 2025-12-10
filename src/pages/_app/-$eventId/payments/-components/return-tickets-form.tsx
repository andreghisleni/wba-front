'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { MySelect } from '@/components/my-select'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/lib/trpc/react'

const formSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
})

export function ReturnTicketForm({
  refetch,
  memberId,
  ticketsReturn,
  total,
}: {
  refetch: () => void
  memberId: string
  ticketsReturn: {
    id: string
    number: number
  }[]
  total: number
}) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const returnTickets = trpc.returnTickets.useMutation({
    onSuccess: () => {
      form.reset()
      setIsOpen(false)
      refetch()

      toast({
        title: `Ingressos devolvidos com sucesso`,
      })
    },
    onError: (error) => {
      console.log(error) // eslint-disable-line no-console
      toast({
        title: `Erro ao devolver ingressos`,
        description: error.message,

        variant: 'destructive',
      })
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('values', values)

    console.log({
      'values.ticketIds.length': values.ticketIds.length,
      'values.ticketIds.length * 50': values.ticketIds.length * 50,
      total,
      'total * -1': total * -1,
      'values.ticketIds.length * 50 > total * -1':
        values.ticketIds.length * 50 > total * -1,
      '(total * -1) / 50': (total * -1) / 50,
    })

    try {
      if (values.ticketIds.length * 50 > total * -1) {
        toast({
          title: `Você não pode devolver mais ingressos do que o total não pago`,
          description: `Você só pode devolver ${(total * -1) / 50} ingressos`,
          variant: 'destructive',
        })
        return
      }

      await returnTickets.mutateAsync({
        ...values,
        memberId,
      })

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
        <Button variant="outline" size="sm" className="w-full" color="yellow">
          Devolver
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Cadastrar devolução</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* <pre>
              {JSON.stringify(Object.keys(ticketPaymentSchema.shape), null, 2)}
            </pre> */}

            <FormField
              control={form.control}
              name="ticketIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingressos</FormLabel>
                  <FormControl>
                    <MySelect
                      placeholder="Selecione os ingressos"
                      {...field}
                      options={ticketsReturn.map((ticket) => ({
                        label: ticket.number.toString(),
                        value: ticket.id,
                      }))}
                      isMulti
                      closeMenuOnSelect={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
