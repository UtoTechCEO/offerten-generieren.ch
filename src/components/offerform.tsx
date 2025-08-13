import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BRANCHES } from '../lib/templates';
import { nanoid } from 'nanoid';

const MengenSchema = z.object({
  position: z.string().min(1),
  menge: z.coerce.number().positive().optional(),
  einheit: z.string().optional(),
  einzelpreis: z.coerce.number().nonnegative().optional()
});

const Schema = z.object({
  firma: z.string().min(2),
  kontaktName: z.string().optional(),
  email: z.string().email().optional(),
  telefon: z.string().optional(),
  adresse: z.string().optional(),
  branch: z.enum(['Reinigung', 'Malerei', 'Allgemein']),
  beschreibung: z.string().min(10),
  preisModus: z.enum(['Pauschal', 'Stundenansatz']),
  preis: z.coerce.number().nonnegative().optional(),
  stundenansatz: z.coerce.number().nonnegative().optional(),
  mengen: z.array(MengenSchema).max(20).optional(),
  datum: z.string().optional(),
  ton: z.enum(['formell', 'informell']),
  logoFile: z.any().optional()
}).refine((d) => (d.preisModus === 'Pauschal' ? d.preis != null : d.stundenansatz != null), {
  message: 'Bitte Preis angeben',
  path: ['preis']
});

type FormData = z.infer<typeof Schema>;

export default function OfferForm() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      branch: 'Allgemein',
      preisModus: 'Pauschal',
      ton: 'formell',
      mengen: []
    }
  });

  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const preisModus = watch('preisModus');

  async function uploadLogo(file: File) {
    setUploading(true);
    const id = nanoid();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: `logos/${id}-${file.name}`, contentType: file.type })
    });
    if (!res.ok) throw new Error('Upload-Init fehlgeschlagen');
    const { url, fields } = await res.json();
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
    formData.append('file', file);
    const up = await fetch(url, { method: 'POST', body: formData });
    if (!up.ok) throw new Error('Upload fehlgeschlagen');
    setUploading(false);
    const finalUrl = `${url}/${fields.key}`;
    setLogoUrl(finalUrl);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    setPdfUrl(null);
    try {
      // 1) Generate structured offer JSON via GPT-wrapper
      const gen = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...data,
          logoUrl,
          kontakt: { name: data.kontaktName, email: data.email, telefon: data.telefon, adresse: data.adresse }
        })
      });
      if (!gen.ok) throw new Error('Generierung fehlgeschlagen');
      const payload = await gen.json();

      // 2) Produce PDF
      const pdf = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, firma: data.firma, logoUrl })
      });
      if (!pdf.ok) throw new Error('PDF-Erstellung fehlgeschlagen');

      const blob = await pdf.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Firmenname *</label>
          <input className="input" {...register('firma')} />
          {errors.firma && <p className="text-red-600 text-sm">{errors.firma.message}</p>}
        </div>
        <div>
          <label className="label">Branche *</label>
          <select className="input" {...register('branch')}>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="label">E-Mail</label>
          <input className="input" type="email" {...register('email')} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" {...register('telefon')} />
        </div>

        <div className="md:col-span-2">
          <label className="label">Adresse</label>
          <input className="input" {...register('adresse')} placeholder="Strasse Nr., PLZ Ort" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Leistungsbeschreibung *</label>
          <textarea className="input" rows={4} {...register('beschreibung')} placeholder="Was soll angeboten werden?" />
          {errors.beschreibung && <p className="text-red-600 text-sm">{errors.beschreibung.message}</p>}
        </div>

        <div>
          <label className="label">Preismodell *</label>
          <select className="input" {...register('preisModus')}>
            <option value="Pauschal">Pauschal</option>
            <option value="Stundenansatz">Stundenansatz</option>
          </select>
        </div>

        {preisModus === 'Pauschal' ? (
          <div>
            <label className="label">Pauschalpreis (CHF) *</label>
            <input className="input" type="number" step="0.05" {...register('preis', { valueAsNumber: true })} />
          </div>
        ) : (
          <div>
            <label className="label">Stundenansatz (CHF/h) *</label>
            <input className="input" type="number" step="0.05" {...register('stundenansatz', { valueAsNumber: true })} />
          </div>
        )}

        <div>
          <label className="label">Tonalität *</label>
          <select className="input" {...register('ton')}>
            <option value="formell">Formell</option>
            <option value="informell">Informell</option>
          </select>
        </div>

        <div>
          <label className="label">Liefer-/Ausführungsdatum</label>
          <input className="input" type="date" {...register('datum')} />
        </div>

        <div className="md:col-span-2">
          <label className="label">Logo (PNG/JPG)</label>
          <input
            className="input"
            type="file"
            accept="image/png,image/jpeg"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await uploadLogo(f);
            }}
          />
          {uploading && <p className="text-sm text-gray-600 mt-1">Upload läuft…</p>}
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 mt-2" />}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Generiere…' : 'Offerte generieren'}</button>
        <span className="text-xs text-gray-500">Alle Angaben ohne Gewähr – bitte prüfen.</span>
      </div>

      {pdfUrl && (
        <div className="mt-4">
          <a className="btn" href={pdfUrl} download={`Offerte-${Date.now()}.pdf`}>PDF herunterladen</a>
        </div>
      )}
    </form>
  );
}
