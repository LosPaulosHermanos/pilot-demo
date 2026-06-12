import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic()

// ---------------------------------------------------------------------------
// POST handler — accepts FormData with an image file
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return Response.json(
      { error: 'Champ "image" requis dans le FormData.' },
      { status: 400 }
    )
  }

  // Read the file into a base64 string
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // Determine media type — fall back to png
  const mediaType = (
    file.type && file.type.startsWith('image/')
      ? file.type
      : 'image/png'
  ) as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Analyse cette image de slide / canvas de reporting.

Identifie la structure visuelle et propose une liste de sections pour recréer ce canvas sous forme de rapport. Pour chaque section, donne :
- un "id" court (slug, ex: "synthese-executive")
- un "title" (titre affiché)
- un "type" parmi : "text", "kpi-grid", "chart-bar", "chart-pie", "table", "heatmap", "list"
- une "description" courte de ce que la section doit contenir

Réponds en JSON valide avec la structure suivante :
{
  "canvasName": "Nom suggéré du canvas",
  "sections": [
    { "id": "...", "title": "...", "type": "...", "description": "..." }
  ]
}

Réponds uniquement avec le JSON, sans texte avant ou après.`,
          },
        ],
      },
    ],
  })

  // Extract the text content from Claude's response
  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return Response.json(
      { error: 'Réponse inattendue du modèle.' },
      { status: 500 }
    )
  }

  // Parse the JSON from the response
  try {
    const parsed = JSON.parse(textBlock.text)
    return Response.json(parsed)
  } catch {
    // If parsing fails, return raw text so the client can handle it
    return Response.json({ raw: textBlock.text })
  }
}
