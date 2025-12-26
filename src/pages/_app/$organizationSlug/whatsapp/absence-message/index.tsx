
import { useState } from 'react';
import { AbsenceMessageView } from './-components/absence-message-view';
import { AbsenceMessageForm } from './-components/absence-message-form';
import { useGetAbsenceMessage } from '@/http/generated';

export default function AbsenceMessagePage() {
  const [editing, setEditing] = useState(false);
  const { data: absence, isLoading } = useGetAbsenceMessage();

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!absence || editing) {
    return (
      <AbsenceMessageForm
        initialMessage={absence?.message || ''}
        setEditing={setEditing}
      />
    );
  }

  return (
    <AbsenceMessageView
      message={absence.message}
      active={absence.active}
      setEditing={setEditing}
    />
  );
}
