"use client";

import { useActionState, useId, useState } from "react";
import { reportError, type ReportState } from "@/app/actions";

export function ErrorReport({
  page,
  title = "Un chiffre vous semble faux ?",
  intro = "La fiabilité est notre priorité : chaque signalement est relu.",
  buttonLabel = "Signaler une erreur",
  defaultMessage = "",
}: {
  page: string;
  title?: string;
  intro?: string;
  buttonLabel?: string;
  defaultMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReportState, FormData>(reportError, { status: "idle", message: "" });
  const id = useId();

  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3 rounded-xl border border-zinc-300 p-4">
      <h2 id={`${id}-t`} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="text-sm text-zinc-800">{intro}</p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-lg border border-zinc-500 px-4 py-2 font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {buttonLabel}
        </button>
      ) : state.status === "ok" ? (
        <p role="status" className="text-emerald-800">{state.message}</p>
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="page" value={page} />
          <label htmlFor={`${id}-m`} className="font-medium">
            Qu’avez-vous repéré ? (sans donnée personnelle)
          </label>
          <textarea
            id={`${id}-m`}
            name="message"
            defaultValue={defaultMessage}
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            className="rounded-lg border border-zinc-400 p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
          />
          {state.status === "error" && (
            <p role="alert" className="text-red-800">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white hover:bg-emerald-900 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {pending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      )}
    </section>
  );
}
