"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type ReportState = { status: "idle" | "ok" | "error"; message: string };

// Length rule of public.error_reports (check constraint), repeated to answer before the insert.
const MIN_LENGTH = 5;
const MAX_LENGTH = 2000;

/** "Signaler une erreur": anonymous insert into error_reports (GRANT insert + RLS policy). */
export async function reportError(_prev: ReportState, form: FormData): Promise<ReportState> {
  const page = String(form.get("page") ?? "").slice(0, 300);
  const message = String(form.get("message") ?? "").trim();
  if (!page.startsWith("/")) return { status: "error", message: "Page inconnue." };
  if (message.length < MIN_LENGTH || message.length > MAX_LENGTH) {
    return { status: "error", message: `Le message doit faire entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères.` };
  }
  const db = createPublicClient();
  const { error } = await db.from("error_reports").insert({ page, message });
  if (error) return { status: "error", message: "L’envoi a échoué. Réessayez plus tard." };
  return { status: "ok", message: "Merci ! Votre signalement a bien été envoyé, nous allons le vérifier." };
}
