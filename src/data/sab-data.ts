import rawData from './sab-dataset.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Risk {
  risk_id: string
  direction: string
  processus: string
  sous_processus: string
  process_owner: string
  risk_owner: string
  control_owner: string
  famille_de_risque: string
  theme_reglementaire: string
  description_du_risque: string
  scenario_de_risque: string
  cause_racine: string
  consequences_potentielles: string
  kri_nom: string
  unite_kri: string
  seuil_vert: number
  seuil_orange: number
  seuil_rouge: number
  valeur_actuelle_kri: number
  probabilite_brute: number
  impact_brut: number
  score_brut: number
  niveau_brut: string
  controle_cle: string
  type_de_controle: string
  frequence_controle: string
  efficacite_controle: string
  probabilite_residuelle: number
  impact_residuel: number
  score_residuel: number
  niveau_residuel: string
  appetit_au_risque: string
  statut_vs_appetit: string
  strategie_de_traitement: string
  plan_d_action: string
  action_owner: string
  echeance_action: number
  statut_action: string
  derniere_revue: number
  frequence_revue: string
  incidents_12m: number
  pertes_12m_eur: number
  population_affectee_potentielle: number
  reference_reglementaire: string
  justification_sectorielle: string
  commentaire_dataset: string
}

export interface DirectionStats {
  name: string
  total: number
  critique: number
  eleve: number
  modere: number
  faible: number
  avgScore: number
}

export interface SABCompany {
  shortName: string
  fullName: string
  sector: string
  employees: number
  directions: string[]
}

// ---------------------------------------------------------------------------
// Typed data
// ---------------------------------------------------------------------------

export const risks: Risk[] = rawData as Risk[]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countBy(key: keyof Risk): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of risks) {
    const val = String(r[key])
    map[val] = (map[val] ?? 0) + 1
  }
  return map
}

// ---------------------------------------------------------------------------
// Pre-computed aggregations
// ---------------------------------------------------------------------------

export const byDirection = countBy('direction')
export const byFamille = countBy('famille_de_risque')
export const byNiveauBrut = countBy('niveau_brut')
export const byNiveauResiduel = countBy('niveau_residuel')
export const byEfficacite = countBy('efficacite_controle')

// Critical risks (niveau_residuel === "Critique")
export const criticalRisks: Risk[] = risks.filter(
  (r) => r.niveau_residuel === 'Critique'
)

// Per-direction stats
export const directionStats: DirectionStats[] = (() => {
  const grouped: Record<string, Risk[]> = {}
  for (const r of risks) {
    if (!grouped[r.direction]) grouped[r.direction] = []
    grouped[r.direction].push(r)
  }

  return Object.entries(grouped).map(([name, items]) => {
    const total = items.length
    const critique = items.filter((r) => r.niveau_residuel === 'Critique').length
    const eleve = items.filter((r) => r.niveau_residuel === 'Élevé').length
    const modere = items.filter((r) => r.niveau_residuel === 'Modéré').length
    const faible = items.filter((r) => r.niveau_residuel === 'Faible').length
    const avgScore =
      total > 0
        ? Math.round(
            (items.reduce((sum, r) => sum + r.score_residuel, 0) / total) * 10
          ) / 10
        : 0

    return { name, total, critique, eleve, modere, faible, avgScore }
  })
})()

// Top 10 by incidents (descending)
export const topIncidents: Risk[] = [...risks]
  .sort((a, b) => b.incidents_12m - a.incidents_12m)
  .slice(0, 10)

// Top 10 by losses (descending)
export const topPertes: Risk[] = [...risks]
  .sort((a, b) => b.pertes_12m_eur - a.pertes_12m_eur)
  .slice(0, 10)

// ---------------------------------------------------------------------------
// Company metadata
// ---------------------------------------------------------------------------

export const SAB_COMPANY: SABCompany = {
  shortName: 'SAB Santé',
  fullName: "Société d'Assurances et de Bienfaisance — Santé",
  sector: 'Assurance santé complémentaire (OCAM)',
  employees: 1200,
  directions: [
    'Souscription & Pilotage Produit',
    'Prestations & Relation Adhérents',
    'Finance, Risques & Conformité',
    'SI, Data & Sécurité',
    'Réseau de soins & Partenaires',
  ],
}
