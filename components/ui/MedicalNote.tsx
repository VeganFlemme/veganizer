import { MEDICAL_DISCLAIMER } from "@/lib/compare/config";

/** Rule 6: visible note, general information only. */
export function MedicalNote({ className = "" }: { className?: string }) {
  return (
    <p role="note" className={`m-0 rounded-select bg-track p-[14px] text-[13px] leading-normal text-ink-2 ${className}`}>
      {MEDICAL_DISCLAIMER}
    </p>
  );
}
