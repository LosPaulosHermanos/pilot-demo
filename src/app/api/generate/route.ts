import Anthropic from '@anthropic-ai/sdk'
import {
  risks,
  byDirection,
  byFamille,
  byNiveauBrut,
  byNiveauResiduel,
  byEfficacite,
  criticalRisks,
  directionStats,
  topIncidents,
  topPertes,
  SAB_COMPANY,
} from '@/data/sab-data'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionInput {
  title: string
  description: string
  render: 'chart' | 'text' | 'both'
}

interface FilterInput {
  label: string
  value: string
}

interface GenerateBody {
  sections: SectionInput[]
  filters: FilterInput[]
  canvasName: string
  mode: 'report' | 'section'
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Tu es Pilot, un assistant d'analyse et de reporting pour SAB Santé (Société d'Assurances et de Bienfaisance — Santé), un organisme complémentaire d'assurance maladie (OCAM) français employant 1 200 collaborateurs.

Tu disposes de la cartographie complète des risques de l'entreprise (120 risques répartis sur 5 directions). Tu produis des rapports structurés, des analyses par direction, par famille de risque, par niveau de criticité et par efficacité des contrôles.

Règles :
- Réponds toujours en français.
- Réponds UNIQUEMENT en HTML (pas de Markdown). Utilise <h4>, <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>.
- Utilise un ton professionnel, précis et factuel.
- Inclus des données chiffrées et des pourcentages quand c'est pertinent.
- Cite les identifiants de risque (RSK-XXX) quand tu fais référence à un risque spécifique.
- Ne jamais inventer de données : utilise exclusivement le contexte fourni.
- Structure bien le rapport avec des titres <h4> pour chaque section.
- Pour les graphiques demandés, crée des barres horizontales HTML simples avec des <div> imbriqués et des styles inline (background-color, width en %, height 22px, border-radius 3px). Utilise ces couleurs : critique=#C0392B, élevé=#C4872E, modéré=#B8860B, faible=#7A9E00.
- Pour les tableaux, utilise <table> avec <thead> et <tbody>.`

// ---------------------------------------------------------------------------
// Build data context
// ---------------------------------------------------------------------------

function buildDataContext(): string {
  return `
## Données SAB Santé

**Entreprise :** ${SAB_COMPANY.fullName}
**Secteur :** ${SAB_COMPANY.sector}
**Effectif :** ${SAB_COMPANY.employees} collaborateurs
**Directions :** ${SAB_COMPANY.directions.join(', ')}

### Statistiques globales
- Nombre total de risques : ${risks.length}
- Risques critiques (résiduel) : ${criticalRisks.length}

### Répartition par direction
${Object.entries(byDirection)
  .map(([d, n]) => `- ${d} : ${n}`)
  .join('\n')}

### Répartition par famille de risque
${Object.entries(byFamille)
  .map(([f, n]) => `- ${f} : ${n}`)
  .join('\n')}

### Répartition par niveau brut
${Object.entries(byNiveauBrut)
  .map(([n, c]) => `- ${n} : ${c}`)
  .join('\n')}

### Répartition par niveau résiduel
${Object.entries(byNiveauResiduel)
  .map(([n, c]) => `- ${n} : ${c}`)
  .join('\n')}

### Répartition par efficacité des contrôles
${Object.entries(byEfficacite)
  .map(([e, c]) => `- ${e} : ${c}`)
  .join('\n')}

### Statistiques par direction
${directionStats
  .map(
    (d) =>
      `- **${d.name}** : ${d.total} risques | Critique: ${d.critique}, Élevé: ${d.eleve}, Modéré: ${d.modere}, Faible: ${d.faible} | Score résiduel moyen: ${d.avgScore}`
  )
  .join('\n')}

### Top 10 — Incidents (12 mois)
${topIncidents
  .map(
    (r) =>
      `- ${r.risk_id} (${r.direction}) : ${r.incidents_12m} incidents — ${r.description_du_risque}`
  )
  .join('\n')}

### Top 10 — Pertes (12 mois, EUR)
${topPertes
  .map(
    (r) =>
      `- ${r.risk_id} (${r.direction}) : ${r.pertes_12m_eur.toLocaleString('fr-FR')} € — ${r.description_du_risque}`
  )
  .join('\n')}

### Détail des 30 risques critiques (résiduel)
${criticalRisks
  .map(
    (r) =>
      `[${r.risk_id}] ${r.direction} / ${r.famille_de_risque} — ${r.description_du_risque} | Brut: ${r.niveau_brut} (${r.score_brut}) → Résiduel: ${r.niveau_residuel} (${r.score_residuel}) | Contrôle: ${r.efficacite_controle} | Incidents 12m: ${r.incidents_12m} | Pertes: ${r.pertes_12m_eur} €`
  )
  .join('\n')}
`
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody
    const { sections, filters, canvasName, mode } = body

    const dataContext = buildDataContext()

    let userMessage: string

    if (mode === 'section') {
      const sec = sections[0]
      userMessage = `En te basant sur les données suivantes, rédige la section "${sec.title}" pour le canvas "${canvasName}".

Description de la section : ${sec.description}
Type de rendu souhaité : ${sec.render === 'chart' ? 'Graphique / visualisation' : sec.render === 'text' ? 'Texte / tableau' : 'Mixte (texte + graphique)'}

${dataContext}`
    } else {
      const filterContext = filters.length > 0
        ? `\n\nFiltres de contexte appliqués :\n${filters.map(f => `- ${f.label} : ${f.value}`).join('\n')}`
        : ''

      userMessage = `En te basant sur les données suivantes, rédige un rapport complet pour "${canvasName}".${filterContext}

Le rapport contient les sections suivantes. Pour chaque section, rédige le contenu correspondant avec un titre <h4> :
${sections.map((s, i) => `${i + 1}. "${s.title}" — ${s.description} [rendu: ${s.render}]`).join('\n')}

${dataContext}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const content = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    return Response.json({ content })
  } catch (error) {
    console.error('Generate API error:', error)
    return Response.json(
      { error: 'Erreur lors de la génération. Vérifiez la clé API.', content: '<p style="color:#C0392B">Erreur de génération. Vérifiez que ANTHROPIC_API_KEY est configurée.</p>' },
      { status: 500 }
    )
  }
}
