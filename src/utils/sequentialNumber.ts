import type { POPI, Secretaria } from "../types";

export function generateSequentialNumberAndReportNumber(
  secretarias: Secretaria[],
  popis: POPI[],
  secId: string,
  year: number
): { seq: number; reportNo: string } {
  const matchedSec = secretarias.find((s) => s.id === secId);
  const acronym = matchedSec ? matchedSec.name : "Geral";

  const matchedPopis = popis.filter(
    (p) => p.secretaria_id === secId && p.year === year
  );
  const maxSeq = matchedPopis.reduce(
    (max, curr) => (curr.sequential_number > max ? curr.sequential_number : max),
    0
  );
  const nextSeq = maxSeq + 1;

  const formattedNum = String(nextSeq).padStart(3, "0");
  const reportNo = `Secretaria ${acronym} - Nº ${formattedNum} - ${year}`;

  return { seq: nextSeq, reportNo };
}
