import { createFileRoute } from '@tanstack/react-router';
import { Activity, AlertCircle, DollarSign, MessageSquare } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell, // Importante: Importar Cell para colorir barras individuais
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetDashboardData } from '@/http/generated';
import { auth } from '@/lib/auth';
import { formatToBRL } from '@/utils/formatToBRL';

export const Route = createFileRoute('/_app/$organizationSlug/dashboard')({
  component: DashboardPage,
});

// Cores para as categorias do WhatsApp
const CATEGORY_COLORS: Record<string, string> = {
  MARKETING: '#8b5cf6', // Violeta
  UTILITY: '#3b82f6', // Azul
  AUTHENTICATION: '#f97316', // Laranja
  SERVICE: '#10b981', // Esmeralda
  UNKNOWN: '#94a3b8', // Cinza
};

export default function DashboardPage() {
  const { data: memberData } = auth.useActiveMember();
  const { data, isLoading, isError, error } = useGetDashboardData();

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-destructive">
        <AlertCircle className="mr-2 h-4 w-4" />
        <span>Erro ao carregar dados: {error?.message}</span>
      </div>
    );
  }

  if (!memberData?.role) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">
          Você não tem permissão para acessar este dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral da sua operação no WhatsApp.
          </p>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i.toString()}>
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            {/* CARD CUSTO (Verde) */}
            {['owner', 'admin'].includes(memberData?.role) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-medium text-sm">
                    Custo Estimado
                  </CardTitle>
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/50">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">
                    {formatToBRL(data?.overview.estimatedCost || 0)}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Ciclo atual de cobrança
                  </p>
                </CardContent>
              </Card>
            )}

            {/* CARD CONVERSAS (Azul) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total de Conversas
                </CardTitle>
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {data?.overview.totalConversations}
                </div>
                <p className="text-muted-foreground text-xs">
                  Conversas ativas no período
                </p>
              </CardContent>
            </Card>

            {/* CARD MENSAGENS (Roxo) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Mensagens Trafegadas
                </CardTitle>
                <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
                  <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {data?.overview.totalMessages}
                </div>
                <p className="text-muted-foreground text-xs">
                  Enviadas e Recebidas
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* --- GRÁFICO --- */}
        {['owner', 'admin'].includes(memberData?.role) ? (<Card className="col-span-4">
          <CardHeader>
            <CardTitle>Custo por Categoria</CardTitle>
            <CardDescription>
              Distribuição dos gastos com a Meta API.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={data?.usageByType}>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="category"
                      fontSize={12}
                      stroke="#888888"
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      fontSize={12}
                      stroke="#888888"
                      tickFormatter={(value) => `R$${value}`}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        borderRadius: '8px',
                      }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      formatter={(value: number) => [
                        formatToBRL(value),
                        'Custo',
                      ]}
                    />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {/* Mapeia os dados e define a cor baseada na categoria */}
                      {data?.usageByType.map((entry, index) => (
                        <Cell
                          fill={
                            CATEGORY_COLORS[entry.category] ||
                            CATEGORY_COLORS.UNKNOWN
                          }
                          key={`cell-${index.toString()}`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>) : null}

        {/* --- TABELA DE ERROS --- */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Falhas Recentes</CardTitle>
            <CardDescription>
              Últimas mensagens que não foram entregues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destino</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead className="text-right">Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentErrors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="h-24 text-center text-muted-foreground"
                        colSpan={3}
                      >
                        Nenhum erro recente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.recentErrors.map((err) => (
                      <TableRow key={err.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{err.to}</span>
                            <span className="hidden text-muted-foreground text-xs">
                              Nome Contato
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            // Adicionei um tom vermelho suave em vez do destructive padrão sólido
                            className="border-none bg-red-100 font-mono text-red-700 text-xs hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                          >
                            {err.errorCode || 'UNK'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {new Date(err.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
