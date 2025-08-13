export type Branch =
  | 'Reinigung'
  | 'Malerei'
  | 'Allgemein';

export const BRANCHES: Branch[] = ['Reinigung', 'Malerei', 'Allgemein'];

export const baseDisclaimer =
  'Diese Offerte wurde automatisiert erstellt. Alle Angaben ohne Gewähr. Bitte prüfen Sie den Inhalt vor Verwendung.';

export function offerTemplate({ branch }: { branch: Branch }) {
  // Minimaler Prompt-Baustein je Branche (erweiterbar)
  const context =
    branch === 'Reinigung'
      ? 'Schwerpunkt Endreinigung / Unterhaltsreinigung, klare Leistungspositionen, Reinigungsmittel inkl./exkl.'
      : branch === 'Malerei'
      ? 'Schwerpunkt Malerarbeiten innen/außen, m2-Ansätze, Untergrund vorbereiten, Material getrennt ausweisen'
      : 'Generische Dienstleistungs-Offerte, klare Positionen, Mengen & Einheiten, Reise- & Nebenkosten';

  return { context };
}
