// Analyzes a waste/cleanup photo using Lovable AI (Gemini Vision).
// Returns estimated kilos, area, volume, waste types, AI-generated detection.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface AnalysisResult {
  is_ai_generated: boolean;
  ai_confidence: number; // 0..1
  estimated_kilos: number;
  area_m2: number;
  volume_m3: number;
  waste_types: string[];
  description: string;
  is_waste_scene: boolean;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: 'LOVABLE_API_KEY not configured' }, 500);
    }
    const body = await req.json();
    const imageUrl: string | undefined = body.image_url ?? body.imageUrl;
    const imageBase64: string | undefined = body.image_base64 ?? body.imageBase64;

    if (!imageUrl && !imageBase64) {
      return json({ error: 'image_url o image_base64 requerido' }, 400);
    }

    const imagePart = imageUrl
      ? { type: 'image_url', image_url: { url: imageUrl } }
      : { type: 'image_url', image_url: { url: imageBase64 } };

    const systemPrompt = `Eres un experto en residuos sólidos y análisis forense de imágenes para una app ambiental en Santa Marta, Colombia.
Tu tarea: analizar una foto de evidencia de limpieza y estimar la cantidad de residuos, además de detectar si la imagen fue generada/editada por IA.

Devuelve SOLO un JSON con este formato exacto (sin texto extra, sin markdown):
{
  "is_ai_generated": boolean,        // true si la imagen parece generada por IA (DALL-E, Midjourney, Stable Diffusion, Gemini, etc.) o fuertemente editada
  "ai_confidence": number,           // 0..1, qué tan seguro estás de que es IA o real (1 = totalmente seguro de tu veredicto)
  "is_waste_scene": boolean,         // true si realmente se ven residuos/basura en un entorno real
  "estimated_kilos": number,         // peso total estimado de residuos visibles en kilogramos
  "area_m2": number,                 // área aproximada cubierta por residuos en metros cuadrados
  "volume_m3": number,               // volumen aproximado de residuos en metros cúbicos
  "waste_types": string[],           // tipos visibles: "plástico", "vidrio", "metal", "orgánico", "papel", "textil", "neumáticos", "redes de pesca", etc.
  "description": string,             // 1-2 frases describiendo lo que se ve
  "reason": string                   // breve justificación de los pesos y de la detección de IA
}

Reglas:
- Estima conservadoramente. 1 bolsa de basura llena ≈ 5-8 kg, 1 m³ de residuos mezclados ≈ 150-300 kg.
- Si NO se ven residuos (paisaje limpio, selfie, comida, etc.), pon is_waste_scene=false y kilos/área/volumen en 0.
- Señales de IA: iluminación demasiado perfecta, detalles imposibles, manos/dedos extraños, texturas plásticas en piel, falta de imperfecciones, ruido EXIF ausente visual, simetrías sospechosas, fondos que se repiten.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analiza esta foto de evidencia y devuelve SOLO el JSON descrito.' },
              imagePart,
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) return json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' }, 429);
      if (aiRes.status === 402) return json({ error: 'Créditos de IA agotados. Agrega créditos en Lovable.' }, 402);
      return json({ error: `AI gateway error: ${txt}` }, 500);
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: 'Respuesta IA no parseable', raw }, 500);

    const parsed = JSON.parse(match[0]) as AnalysisResult;

    return json(parsed, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
