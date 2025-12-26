import { useState } from "react";
import { AbsenceMessageView } from "./-components/absence-message-view";
import { AbsenceMessageForm } from "./-components/absence-message-form";
import { useGetAbsenceMessage } from "@/http/generated";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/$organizationSlug/whatsapp/absence-message/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [editing, setEditing] = useState(false);
  const { data: absence, isLoading } = useGetAbsenceMessage();

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!absence || editing) {
    return (
      <div className="container mx-auto space-y-8 py-10">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">
            Mensagem de Ausência
          </h2>
          <p className="text-muted-foreground">
            Configure uma mensagem automática para informar seus clientes quando
            você estiver ausente.
          </p>
        </div>
        <AbsenceMessageForm
          initialMessage={absence?.message || ""}
          setEditing={setEditing}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div>
        <h2 className="font-bold text-3xl tracking-tight">
          Mensagem de Ausência
        </h2>
        <p className="text-muted-foreground">
          Configure uma mensagem automática para informar seus clientes quando
          você estiver ausente.
        </p>
      </div>
      <AbsenceMessageView
        message={absence.message}
        active={absence.active}
        setEditing={setEditing}
      />
    </div>
  );
}
