import type { APIRoute } from 'astro';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { buildOfferPrompt } from '../../lib/prompt';
import OpenAI from 'openai';

const bodySchema = z.object({
  firma: z.string().min(2),
  kontakt: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    telefon: z.string().optional(),
    adresse: z.string().optional()
  }),
  branch: z.enum(['Reinigung', 'Malerei', 'Allgemein']),
  beschreibung: z.string().min(10),
  preisModus: z.enum(['Pauschal', 'Stundenansatz']),
  preis: z.number().optional(),
  stundenansatz: z.number().optional(),
  mengen: z.array(z.object({
    position: z.string(),
    menge: z.number().optional(),
    einheit: z.string().optional(),
    einzelpreis: z.number().optional()
  })).optional(),
  datum: z.string().optional(),
  ton: z.enum(['formell', 'informell']),
  logoUrl: z.string().url().optional()
});

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '10 m') }); // 5/10min

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'ip:unknown';
  const { success } = await ratelimit.limit(`gen:${ip}`);
  if (!success) return new Response(JSON.stringify({ error: 'Rate-Limit erreicht. Bitte später erneut versuchen.' }), { status: 429 });

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Ungültige Eingaben' }), { status: 400 });
  }

  const clean = {
    ...data,
    beschreibung: sanitizeHtml(data.beschreibung, { allowedTags: [], allowedAttributes: {} })
  };

  const prompt = buildOfferPrompt({
    branch: clean.branch,
    firma: clean.firma,
    kontakt: clean.kontakt,
    beschreibung: clean.beschreibung,
    preisModus: clean.preisModus,
    preis: clean.preis,
    stundenansatz: clean.stundenansatz,
    mengen: clean.mengen,
    datum: clean.datum,
    ton: clean.ton
  });

  // GPT-Wrapper
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'Du gibst ausschliesslich JSON zurück.' }, { role: 'user', content: prompt }],
    temperature: 0.2
  });

  const text = completion.choices[0]?.message?.content ?? '{}';
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: 'KI-Rückgabe unlesbar' }), { status: 500 });
  }

  // Minimal persist (optional): could write log to Postgres here
  return new Response(JSON.stringify({
    firma: clean.firma,
    branch: clean.branch,
    ton: clean.ton,
    logoUrl: clean.logoUrl,
    kontakt: clean.kontakt,
    disclaimer: 'Ohne Gewähr, Nutzer prüft Inhalt',
    offer: json
  }), { headers: { 'content-type': 'application/json' } });
};
