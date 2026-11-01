"use client";

import { useActionState, useId, useState } from "react";
import { reportError, type ReportState } from "@/app/actions";

export function ErrorReport({
  page,
  title = "Un chiffre te semble faux ?",
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
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3 rounded-panel bg-surface p-5 md:p-6">
      <h2 id={`${id}-t`} className="m-0 text-[17px] font-extrabold">
        {title}
      </h2>
      <p className="m-0 text-[14px] leading-normal text-ink-2">{intro}</p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-11 cursor-pointer self-start rounded-btn border border-action bg-surface px-[18px] text-[15px] font-bold text-action hover:bg-win-plant"
        >
          {buttonLabel}
        </button>
      ) : state.status === "ok" ? (
        <p role="status" className="m-0 text-action">{state.message}</p>
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="page" value={page} />
          <label htmlFor={`${id}-m`} className="text-[14px] font-semibold">
            Qu’as-tu repéré ? (sans donnée personnelle)
          </label>
          <textarea
            id={`${id}-m`}
            name="message"
            defaultValue={defaultMessage}
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            className="rounded-btn border border-ink-3 bg-surface p-3 text-[16px] text-ink"
          />
          {state.status === "error" && (
            <p role="alert" className="m-0 text-animal-note">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="h-11 cursor-pointer self-start rounded-btn border-0 bg-action px-[18px] text-[15px] font-bold text-white hover:bg-action-hover disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      )}
    </section>
  );
}
