import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auth } from '@/lib/auth';
import { getNameInitials } from '@/utils/get-name-initials';

export const Route = createFileRoute('/_app/$organizationSlug/organization')({
  component: OrganizationPage,
});

function OrganizationPage() {
  const { data: activeOrg, isPending } = auth.useActiveOrganization();
  // const {
  //   data: members,
  //   isPending: isLoadingMembers,
  //   refetch: refetchMembers,
  // } = auth.useListMembers({
  //   organizationId: activeOrg?.id || '',
  // });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (!activeOrg) {
    return <div className="p-8">Selecione uma organização para gerenciar.</div>;
  }

  async function handleInvite() {
    if (!inviteEmail) {
      return;
    }
    setIsInviting(true);
    try {
      await auth.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole as 'admin' | 'member' | 'owner',
        organizationId: activeOrg?.id,
      });
      toast.success('Convite enviado com sucesso!');
      setInviteDialogOpen(false);
      setInviteEmail('');
    } catch {
      toast.error('Erro ao enviar convite');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await auth.organization.cancelInvitation({
        invitationId,
      });
      toast.success('Convite cancelado com sucesso!');
      // refetchInvitations();
    } catch {
      toast.error('Erro ao cancelar convite');
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Tem certeza que deseja remover este membro?')) {
      return;
    }
    try {
      await auth.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg?.id,
      });
      toast.success('Membro removido com sucesso!');
      // refetchMembers();
    } catch {
      toast.error('Erro ao remover membro');
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      await auth.organization.updateMemberRole({
        memberId,
        role: newRole as 'admin' | 'member' | 'owner',
        organizationId: activeOrg?.id,
      });
      toast.success('Papel atualizado com sucesso!');
      // refetchMembers();
    } catch {
      toast.error('Erro ao atualizar papel');
    }
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div>
        <h2 className="font-bold text-3xl tracking-tight">
          Configurações da Organização
        </h2>
        <p className="text-muted-foreground">
          Gerencie sua organização e membros.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Organização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input disabled value={activeOrg.name} />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input disabled value={activeOrg.slug} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Membros</CardTitle>
            <CardDescription>
              Gerencie os membros da sua organização.
            </CardDescription>
          </div>
          <Dialog onOpenChange={setInviteDialogOpen} open={inviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>Convidar Membro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro</DialogTitle>
                <DialogDescription>
                  Envie um convite por e-mail para adicionar um novo membro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select onValueChange={setInviteRole} value={inviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="owner">Dono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={isInviting} onClick={handleInvite}>
                  {isInviting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={4}>
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                activeOrg.members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || ''} />
                        <AvatarFallback>
                          {getNameInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {member.user.name}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={member.role}
                        disabled={member.role === 'owner'}
                        onValueChange={(val) =>
                          handleUpdateRole(member.id, val)
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="owner">Dono</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={member.role === 'owner'}
                        onClick={() => handleRemoveMember(member.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites Pendentes</CardTitle>
          <CardDescription>Gerencie os convites enviados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={4}>
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : activeOrg.invitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center text-muted-foreground"
                    colSpan={4}
                  >
                    Nenhum convite pendente.
                  </TableCell>
                </TableRow>
              ) : (
                activeOrg.invitations?.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell className="capitalize">
                      {invitation.role}
                    </TableCell>
                    <TableCell className="capitalize">
                      {invitation.status}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        size="icon"
                        title="Cancelar convite"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
