import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart,
  Cpu,
  Library,
  MoreHorizontal,
  PlaySquare,
  Search,
  Server,
  Settings,
  Shield,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* --- Sidebar --- */}
      <aside className="flex w-64 flex-col border-r bg-muted/20 p-4">
        <div className="flex items-center gap-2 border-b pb-6">
          <div className="h-8 w-8 rounded-lg bg-green-500" />
          <span className="font-semibold text-white">Untitled UI</span>
        </div>
        <nav className="mt-6 flex-1">
          {/* Usando Button com variant="ghost" para os links da sidebar */}
          <Button className="w-full justify-start gap-3" variant="secondary">
            <BarChart className="h-5 w-5" />
            Overview
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <Library className="h-5 w-5" />
            Library
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <BarChart className="h-5 w-5" />
            Analytics
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <PlaySquare className="h-5 w-5" />
            Player
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <Cpu className="h-5 w-5" />
            Encoding
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <Server className="h-5 w-5" />
            Delivery
          </Button>
          <Button className="mt-1 w-full justify-start gap-3" variant="ghost">
            <Shield className="h-5 w-5" />
            Security
          </Button>
        </nav>
        <div>
          <Button className="w-full justify-start gap-3" variant="ghost">
            <Settings className="h-5 w-5" />
            Settings
          </Button>
          <div className="mt-2 flex items-center gap-3 border-t p-2">
            <div className="flex-1">
              <p className="font-semibold text-sm">Diego Fernandes</p>
              <p className="text-muted-foreground text-xs">
                diego@rocketseat.com.br
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex flex-1 flex-col">
        {/* --- Header --- */}
        <header className="flex items-center justify-between border-b bg-muted/20 p-4">
          <div className="flex items-center gap-4">
            <Select defaultValue="general">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="team-b">Team B</SelectItem>
                <SelectItem value="team-c">Team C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search..." type="search" />
            </div>
            <Button variant="outline">Changelog</Button>
            <Button className="bg-green-500 text-black hover:bg-green-600">
              <Upload className="mr-2 h-4 w-4" />
              New upload
            </Button>
          </div>
        </header>

        {/* --- Dashboard --- */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">General</h1>
              <p className="text-muted-foreground">Statistics Last 24 hours</p>
            </div>
            <Select defaultValue="24h">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">Views</CardTitle>
                <span className="flex items-center text-red-400 text-xs">
                  - 37.84% <ArrowDownRight className="ml-1 h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">192K</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  DRM Licenses
                </CardTitle>
                <span className="flex items-center text-red-400 text-xs">
                  - 12.34% <ArrowDownRight className="ml-1 h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">86K</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Bandwidth Used
                </CardTitle>
                <span className="flex items-center text-green-400 text-xs">
                  + 57.84% <ArrowUpRight className="ml-1 h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">233 GB</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Storage Increase
                </CardTitle>
                <span className="flex items-center text-green-400 text-xs">
                  + 32.84% <ArrowUpRight className="ml-1 h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-3xl">23 GB</div>
              </CardContent>
            </Card>
          </div>

          {/* --- Chart Section --- */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Amount of views per day in last 28 days</CardTitle>
            </CardHeader>
            <CardContent>
              {/* SUBSTITUIR POR UM COMPONENTE DE GRÁFICO REAL (ex: Recharts) */}
              <div className="flex h-80 items-center justify-center rounded-md bg-muted/50">
                <p className="text-muted-foreground">Chart Placeholder</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
