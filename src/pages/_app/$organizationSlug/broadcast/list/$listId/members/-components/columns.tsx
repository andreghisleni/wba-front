import type { ColumnDef } from '@tanstack/react-table';
import { ActionsDiv } from '@/components/table/actions-div';
import { tdb } from '@/components/table/TableDataButton';
import type { GetBroadcastListMembers200 } from '@/http/generated';
import { DeleteMemberButton } from './delete-member-button';
import { MemberForm } from './member-form';

export type Member = GetBroadcastListMembers200['data'][0];

export const columns = ({
  organizationSlug: _,
  additionalParams,
}: {
  organizationSlug: string;
  additionalParams?: string[];
}): ColumnDef<Member>[] => [
    tdb('contact.name', 'Nome'),
    tdb('contact.phone', 'Telefone', 'phone'),
    ...(additionalParams
      ? additionalParams.map((param) =>
        tdb(`additionalParams.${param}` as string, `Parâmetro: ${param}`)
      )
      : []),
    // tdb('additionalParams', 'Parâmetros Adicionais', 'object'),
    tdb('createdAt', 'Criado em', 'date-time'),

    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        return (
          <ActionsDiv>
            <MemberForm
              additionalParams={additionalParams}
              member={row.original}
            />
            <DeleteMemberButton memberId={row.original.id} />
          </ActionsDiv>
        );
      },
    },
  ];
