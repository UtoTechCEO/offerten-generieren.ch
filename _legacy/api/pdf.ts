import type { APIRoute } from 'astro';
import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Use built-ins (Helvetica/Arial fallback within renderer)
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, marginTop: 8, marginBottom: 12 },
  line: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { fontSize: 9, color: '#6b7280' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 6, marginTop: 8 },
  th: { flex: 1, fontSize: 10, fontWeight: 700 },
  tr: { flexDirection: 'row', padding: 6, borderBottomColor: '#e5e7eb', borderBottomWidth: 1 },
  td: { flex: 1, fontSize: 10 }
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text>{body.firma}</Text>
            {body.kontakt?.adresse && <Text style={styles.small}>{body.kontakt.adresse}</Text>}
            {body.kontakt?.email && <Text style={styles.small}>{body.kontakt.email}</Text>}
            {body.kontakt?.telefon && <Text style={styles.small}>{body.kontakt.telefon}</Text>}
          </View>
          {body.logoUrl ? (
            <Image src={body.logoUrl} style={{ width: 90, height: 40, objectFit: 'contain' }} />
          ) : null}
        </View>

        <Text style={styles.title}>Offerte – {body.offer?.titel ?? 'Dienstleistung'}</Text>
        <View style={styles.line} />

        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, flex: 2 }}>Position</Text>
          <Text style={styles.th}>Menge</Text>
          <Text style={styles.th}>Einheit</Text>
          <Text style={styles.th}>Einzel (CHF)</Text>
          <Text style={styles.th}>Total (CHF)</Text>
        </View>

        {(body.offer?.positions ?? []).map((p: any, i: number) => (
          <View style={styles.tr} key={i}>
            <Text style={{ ...styles.td, flex: 2 }}>{p.titel}{p.beschreibung ? ` – ${p.beschreibung}` : ''}</Text>
            <Text style={styles.td}>{p.menge ?? '-'}</Text>
            <Text style={styles.td}>{p.einheit ?? '-'}</Text>
            <Text style={styles.td}>{p.einzelpreis != null ? p.einzelpreis.toFixed(2) : '-'}</Text>
            <Text style={styles.td}>{p.gesamt != null ? p.gesamt.toFixed(2) : '-'}</Text>
          </View>
        ))}

        <View style={{ marginTop: 12, marginLeft: 'auto', width: 260 }}>
          <View style={styles.row}><Text>Zwischensumme</Text><Text>{Number(body.offer?.zwischensumme ?? 0).toFixed(2)}</Text></View>
          <View style={styles.row}><Text>MWST ({body.offer?.mwstSatz ?? 0}%)</Text><Text>{Number(body.offer?.mwstBetrag ?? 0).toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={{ fontWeight: 700 }}>Gesamt</Text><Text style={{ fontWeight: 700 }}>{Number(body.offer?.gesamt ?? 0).toFixed(2)}</Text></View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>Zahlungsbedingungen</Text>
          <Text style={styles.small}>{body.offer?.zahlungsbedingungen ?? '30 Tage netto, ohne Skonto.'}</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>Hinweise</Text>
          <Text style={styles.small}>{body.offer?.hinweise ?? 'Preise in CHF. Änderungen vorbehalten.'}</Text>
          <Text style={[styles.small, { marginTop: 6 }]}>Disclaimer: {body.disclaimer ?? 'Alle Angaben ohne Gewähr. Bitte prüfen Sie den Inhalt.'}</Text>
        </View>
      </Page>
    </Document>
  );

  // Render to Buffer
  const { pdf } = await import('@react-pdf/renderer');
  const stream = await pdf(doc).toBuffer();
  return new Response(stream, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="Offerte-${Date.now()}.pdf"`
    }
  });
};
