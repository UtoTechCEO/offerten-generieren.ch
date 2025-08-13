import { offerTemplate, Branch } from './templates';

export function buildOfferPrompt(input: {
  branch: Branch;
  firma: string;
  kontakt: { name?: string; email?: string; telefon?: string; adresse?: string };
  beschreibung: string;
  preisModus: 'Pauschal' | 'Stundenansatz';
  preis?: number;
  stundenansatz?: number;
  mengen?: Array<{ position: string; menge: number; einheit: string; einzelpreis?: number }>;
  datum?: string;
  ton: 'formell' | 'informell';
}) {
  const { context } = offerTemplate({ branch: input.branch });

  return `
Du bist ein Schweizer Offerten-Profi. Erstelle eine **strukturierte Offerte** in **Schweizer Hochdeutsch** mit **CHF** Preisen, Ton: ${input.ton}.
Branche: ${input.branch}. Kontext: ${context}.
Firma: ${input.firma}. Kontakt: ${JSON.stringify(input.kontakt)}.
Leistungsbeschreibung (Freitext): """${input.beschreibung}""".
Preismodell: ${input.preisModus}${
    input.preisModus === 'Pauschal' && input.preis != null ? `, Pauschalpreis: ${input.preis} CHF` : ''
  }${
    input.preisModus === 'Stundenansatz' && input.stundenansatz != null
      ? `, Stundenansatz: ${input.stundenansatz} CHF/h`
      : ''
  }.
Mengen/Einheiten: ${JSON.stringify(input.mengen ?? [])}.
Liefer-/Ausführungsdatum: ${input.datum ?? 'n.n.'}.

Gib als JSON mit folgendem Schema zurück:
{
  "titel": string,
  "positions": [{"titel": string, "beschreibung": string, "menge": number|null, "einheit": string|null, "einzelpreis": number|null, "gesamt": number}],
  "zwischensumme": number,
  "mwstSatz": 0|2.5|8.1,
  "mwstBetrag": number,
  "gesamt": number,
  "zahlungsbedingungen": string,
  "hinweise": string
}
Nutze sinnvolle, runde CHF-Beträge und füge keine HTML-Tags ein.
`;
}
