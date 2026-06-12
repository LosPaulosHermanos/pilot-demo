"use client";

import { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Section {
  id: number;
  label: string;
  description: string;
  render: "chart" | "text" | "both";
  fullWidth?: boolean;
  iconType: string;
  generatedContent?: string;
}

interface Filter {
  id: string;
  label: string;
  placeholder: string;
}

type View = "create" | "canvas" | "report";
type CreateMode = "upload" | "manual" | "assistant";
type AssistantMode = "form" | "free";

/* ═══════════════════════════════════════════════════════
   DEMO DATA — SAB Santé risk dashboard preset
   ═══════════════════════════════════════════════════════ */
const RISK_DASHBOARD_SECTIONS: Section[] = [
  { id: 0, label: "Synthèse exécutive", description: "Vue consolidée de la couverture des risques SAB Santé : nombre total de risques, répartition par niveau de criticité résiduelle (Critique, Élevé, Modéré, Faible), et évolution par rapport au trimestre précédent.", render: "text", fullWidth: true, iconType: "title" },
  { id: 1, label: "Couverture par entité", description: "Histogramme du nombre de risques par direction (Souscription, Prestations, Finance, SI, Réseau), coloré par niveau résiduel. Met en évidence les entités les plus exposées.", render: "chart", iconType: "chart" },
  { id: 2, label: "Couverture par type de risque", description: "Répartition des risques par famille (Opérationnel, Conformité, Données/SI/Cyber, Fraude/Financier) avec taux de maîtrise moyen par famille.", render: "chart", iconType: "chart" },
  { id: 3, label: "Risques critiques", description: "Tableau des risques dont le niveau résiduel est Critique : identifiant, description, direction, score résiduel, plan d'action et échéance. Classés par score décroissant.", render: "text", fullWidth: true, iconType: "list" },
  { id: 4, label: "Situations nouvelles", description: "Risques identifiés ou réévalués ce mois-ci qui n'existaient pas ou étaient à un niveau inférieur au trimestre précédent. Focus sur les risques émergents.", render: "text", iconType: "kpi" },
  { id: 5, label: "Situations en détérioration", description: "Risques dont le niveau résiduel s'est dégradé depuis la dernière revue : passage de Modéré à Élevé ou d'Élevé à Critique. Causes identifiées et actions correctives.", render: "text", iconType: "kpi" },
  { id: 6, label: "Situations en amélioration", description: "Risques dont le niveau résiduel s'est amélioré grâce au renforcement des contrôles ou à la mise en œuvre des plans d'action. Bonnes pratiques à capitaliser.", render: "text", iconType: "kpi" },
  { id: 7, label: "Efficacité des contrôles", description: "Graphique barres de la répartition de l'efficacité des contrôles (Forte, Moyenne, Faible) par direction. Met en évidence les zones où le dispositif de maîtrise est insuffisant.", render: "chart", iconType: "chart" },
  { id: 8, label: "Top 10 incidents", description: "Tableau des 10 risques ayant généré le plus d'incidents sur les 12 derniers mois, avec nombre d'incidents, pertes associées en euros, et statut du plan d'action.", render: "text", fullWidth: true, iconType: "table" },
];

const RISK_DASHBOARD_FILTERS: Filter[] = [
  { id: "period", label: "Période", placeholder: "Ex : Juin 2025, T2 2025" },
  { id: "scope", label: "Périmètre", placeholder: "Ex : Groupe, Direction Finance" },
  { id: "level", label: "Niveau de risque", placeholder: "Ex : Critique, Élevé" },
];

const UPLOAD_SLIDE_SECTIONS: Section[] = [
  { id: 0, label: "Évaluation à dire d'expert", description: "Les trois niveaux d'évaluation du risque Gouvernance : risque brut (Critique, score 18.2), moyens de maîtrise (Moyenne, 55/120 contrôles) et risque résiduel (Élevé, score 12.8). Comparaison avec N-1 et tendances.", render: "text", fullWidth: false, iconType: "kpi" },
  { id: 1, label: "Risques N2 associés", description: "Liste des 6 risques de niveau 2 rattachés au risque Gouvernance avec leur niveau de criticité : R1.1 Structure organisationnelle (Critique), R1.2 Solvabilité II (Critique), R1.3 Alignement stratégique (Élevé), R1.4 Politiques internes (Élevé), R1.5 Partenariats (Élevé), R1.6 ESG/RSE (Modéré).", render: "text", iconType: "list" },
  { id: 2, label: "Évolution du risque brut — par direction", description: "Histogramme horizontal du nombre de risques par direction (Souscription 24, Prestations 20, Finance 32, SI 24, Réseau 20), avec comparaison N vs N-1. Met en évidence les directions les plus exposées.", render: "chart", iconType: "chart" },
  { id: 3, label: "Niveau résiduel — répartition", description: "Barre horizontale empilée de la répartition des 120 risques par niveau résiduel : Critique (30), Élevé (45), Modéré (36), Faible (9). Visualisation de la concentration du risque.", render: "chart", iconType: "chart" },
  { id: 4, label: "Efficacité des contrôles", description: "Donut chart des 120 contrôles répartis par efficacité : Forte 27 (22%), Moyenne 55 (46%), Faible 38 (32%). Met en lumière les zones où le dispositif de maîtrise est insuffisant.", render: "chart", iconType: "chart" },
  { id: 5, label: "Plans d'action prioritaires", description: "Tableau des actions prioritaires avec responsable et échéance : refonte comités de pilotage (Dir. Risques, sept. 2025), mise en conformité Solvabilité II (DAF, déc. 2025), audit partenariats (Dir. Partenariats, oct. 2025), cartographie ESG (Secrétariat Gén., mars 2026).", render: "text", iconType: "table" },
  { id: 6, label: "Matrice par direction — synthèse", description: "Tableau croisé des 5 directions avec : nombre de risques, répartition par niveau (Critique/Élevé/Modéré/Faible), score résiduel moyen et nombre d'incidents sur 12 mois. Finance, Risques & Conformité concentre le plus de risques critiques (10) et le score le plus élevé (16.8).", render: "text", fullWidth: true, iconType: "table" },
];

const SECTEURS = ["Assurance", "Banque", "Mutuelle", "Prévoyance", "Institution publique", "Énergie", "Télécom", "Transport", "Santé", "Industrie"];
const AXES = ["Pilotage COMEX", "Analyses financières", "Analyse des risques", "Gestion de projet", "Optimisation des ressources", "Suivi RH"];

/* ═══════════════════════════════════════════════════════
   ICONS (inline SVG)
   ═══════════════════════════════════════════════════════ */
const cn = (c: string) => ({ className: c });

function IconChart(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function IconText(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>;
}
function IconBoth(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="12" y1="3" x2="12" y2="12" /></svg>;
}
function IconFilter(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
}
function IconPlus(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconBolt(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function IconUpload(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
}
function IconGrid(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><line x1="17.5" y1="14" x2="17.5" y2="21" /><line x1="14" y1="17.5" x2="21" y2="17.5" /></svg>;
}
function IconChat(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
}
function IconClose(p: { className?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  title: IconText, kpi: IconChart, chart: IconChart, text: IconText, list: IconText, table: IconGrid,
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  /* State */
  const [view, setView] = useState<View>("create");
  const [createMode, setCreateMode] = useState<CreateMode | null>(null);
  const [asstMode, setAsstMode] = useState<AssistantMode>("form");
  const [sections, setSections] = useState<Section[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [canvasName, setCanvasName] = useState("");
  const [canvasOrigin, setCanvasOrigin] = useState("");
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  /* Filter modal */
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  /* Report state */
  const [reportName, setReportName] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /* Upload state */
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  /* Assistant form state */
  const [projectName, setProjectName] = useState("");
  const [secteur, setSecteur] = useState("");
  const [objectif, setObjectif] = useState("");
  const [perimetre, setPerimetre] = useState("");
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [isAssistantGenerating, setIsAssistantGenerating] = useState(false);

  /* Manual state */
  const [manualName, setManualName] = useState("");
  const [newFilterLabel, setNewFilterLabel] = useState("");

  /* Section generation state */
  const [generatingSectionId, setGeneratingSectionId] = useState<number | null>(null);

  /* ─── Navigation ─── */
  const navToView = useCallback((v: View) => {
    setView(v);
    setSelectedSection(null);
  }, []);

  /* ─── Create: Upload mode (simulated) ─── */
  const simulateUpload = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setCanvasName("Risque Gouvernance — SAB Santé");
      setCanvasOrigin("CRÉÉ DEPUIS UN MODÈLE");
      setSections(UPLOAD_SLIDE_SECTIONS);
      setFilters([
        { id: "risk", label: "Risque N1", placeholder: "Ex : Gouvernance, Opérationnel" },
        { id: "period", label: "Exercice", placeholder: "Ex : 2025" },
        { id: "scope", label: "Périmètre", placeholder: "Ex : Groupe, Direction" },
      ]);
      setIsAnalyzing(false);
      navToView("canvas");
    }, 3000);
  }, [navToView]);

  /* ─── Create: Manual ─── */
  const createManualCanvas = useCallback(() => {
    const name = manualName.trim() || "Canvas sans titre";
    setCanvasName(name);
    setCanvasOrigin("CRÉÉ MANUELLEMENT");
    setSections([{ id: 0, label: "Section 1", description: "Décrivez le contenu attendu dans cette section.", render: "both", fullWidth: true, iconType: "text" }]);
    setFilters([
      { id: "period", label: "Période", placeholder: "Ex : 2025, T2 2025" },
      { id: "scope", label: "Périmètre", placeholder: "Ex : Global, France" },
    ]);
    navToView("canvas");
  }, [manualName, navToView]);

  /* ─── Create: Assistant pre-built dashboard ─── */
  const loadRiskDashboard = useCallback(() => {
    setIsAssistantGenerating(true);
    setTimeout(() => {
      setCanvasName("Dashboard Pilotage des Risques — SAB Santé");
      setCanvasOrigin("CRÉÉ VIA ASSISTANT");
      setSections(RISK_DASHBOARD_SECTIONS);
      setFilters(RISK_DASHBOARD_FILTERS);
      setIsAssistantGenerating(false);
      navToView("canvas");
    }, 2200);
  }, [navToView]);

  const generateCanvasFromForm = useCallback(() => {
    const name = projectName.trim() || "Canvas assistant";
    setIsAssistantGenerating(true);
    setTimeout(() => {
      const secs: Section[] = [];
      let id = 0;
      secs.push({ id: id++, label: "Synthèse", description: `Vue d'ensemble du projet ${name}. Contexte : ${secteur || "non précisé"}. ${objectif ? "Objectif : " + objectif.slice(0, 120) : ""}`, render: "text", fullWidth: true, iconType: "title" });

      if (selectedAxes.includes("Pilotage COMEX")) {
        secs.push({ id: id++, label: "KPIs COMEX", description: "Les indicateurs stratégiques du comité exécutif : performance globale, risques majeurs, avancement des projets stratégiques.", render: "both", iconType: "kpi" });
        secs.push({ id: id++, label: "Décisions COMEX", description: "Synthèse des décisions et arbitrages attendus, avec les données d'appui nécessaires.", render: "text", iconType: "list" });
      }
      if (selectedAxes.includes("Analyses financières")) {
        secs.push({ id: id++, label: "Performance financière", description: "Analyse du CA, marges, ratios de rentabilité. Graphique comparant budget vs réalisé.", render: "both", iconType: "chart" });
      }
      if (selectedAxes.includes("Analyse des risques")) {
        secs.push({ id: id++, label: "Évaluation des risques", description: "Niveaux d'évaluation des risques — brut, moyens de maîtrise, résiduel — avec indicateurs de couleur.", render: "text", iconType: "kpi" });
        secs.push({ id: id++, label: "Cartographie", description: "Graphique de répartition des risques par catégorie et niveau de criticité.", render: "chart", iconType: "chart" });
        secs.push({ id: id++, label: "Plans d'action", description: "Liste des actions correctives avec responsables, échéances et statut d'avancement.", render: "text", iconType: "list" });
      }
      if (selectedAxes.includes("Gestion de projet")) {
        secs.push({ id: id++, label: "Avancement projets", description: "Tableau de bord de l'avancement des projets : jalons, % d'avancement, alertes.", render: "both", iconType: "chart" });
      }
      if (selectedAxes.includes("Suivi RH")) {
        secs.push({ id: id++, label: "Indicateurs RH", description: "Effectifs, turnover, absentéisme, satisfaction. Métriques avec tendances.", render: "both", iconType: "kpi" });
      }
      secs.push({ id: id++, label: "Tableau détaillé", description: "Tableau de données croisées avec les dimensions et métriques clés.", render: "text", fullWidth: true, iconType: "table" });

      setCanvasName(name);
      setCanvasOrigin("CRÉÉ VIA ASSISTANT");
      setSections(secs);
      setFilters([
        { id: "scope", label: "Périmètre", placeholder: perimetre ? perimetre.slice(0, 50) : "Ex : Groupe, France" },
        { id: "period", label: "Période", placeholder: "Ex : 2025, T2 2025" },
        ...(secteur ? [{ id: "sector", label: "Secteur", placeholder: "Ex : " + secteur }] : []),
      ]);
      setIsAssistantGenerating(false);
      navToView("canvas");
    }, 2200);
  }, [projectName, secteur, objectif, perimetre, selectedAxes, navToView]);

  /* ─── Canvas: Filter management ─── */
  const addFilter = useCallback(() => {
    if (!newFilterLabel.trim()) return;
    setFilters(prev => [...prev, { id: "f-" + Date.now(), label: newFilterLabel.trim(), placeholder: "Valeur à renseigner" }]);
    setNewFilterLabel("");
  }, [newFilterLabel]);

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  /* ─── Canvas: Section management ─── */
  const addSection = useCallback(() => {
    const nextId = Math.max(0, ...sections.map(s => s.id)) + 1;
    setSections(prev => [...prev, { id: nextId, label: "Nouvelle section", description: "Décrivez le contenu attendu.", render: "both", iconType: "text" }]);
  }, [sections]);

  const updateSection = useCallback((id: number, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSection = useCallback((id: number) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setSelectedSection(null);
  }, []);

  /* ─── Generate single section (manual mode) ─── */
  const generateSectionContent = useCallback(async (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    setGeneratingSectionId(sectionId);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "section",
          sections: [{ title: section.label, description: section.description, render: section.render }],
          filters: [],
          canvasName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        updateSection(sectionId, { generatedContent: data.content || `<p style='color:var(--danger)'>${data.error || 'Erreur inconnue'}</p>` });
        setGeneratingSectionId(null);
        return;
      }
      updateSection(sectionId, { generatedContent: data.content });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      updateSection(sectionId, { generatedContent: `<p style='color:var(--danger)'>Erreur : ${msg}</p>` });
    }
    setGeneratingSectionId(null);
  }, [sections, canvasName, updateSection]);

  /* ─── Generate report ─── */
  const handleGenerateReport = useCallback(() => {
    setFilterValues({});
    setShowFilterModal(true);
  }, []);

  const computeReportName = useCallback(() => {
    const vals = Object.values(filterValues).filter(Boolean);
    if (vals.length === 0) return canvasName;
    return canvasName + " — " + vals.join(" · ");
  }, [canvasName, filterValues]);

  const confirmGenerate = useCallback(async () => {
    const filledFilters = filters
      .map(f => ({ label: f.label, value: filterValues[f.id] || "" }))
      .filter(f => f.value);
    if (filledFilters.length === 0) return;

    const name = canvasName + " — " + filledFilters.map(f => f.value).join(" · ");
    setReportName(name);
    setShowFilterModal(false);
    setIsGenerating(true);
    setReportContent("");
    setView("report");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "report",
          sections: sections.map(s => ({ title: s.label, description: s.description, render: s.render })),
          filters: filledFilters,
          canvasName,
        }),
      });
      const data = await res.json();
      setReportContent(data.content || data.error || "Contenu vide.");
    } catch {
      setReportContent("<p style='color:var(--danger)'>Erreur de génération. Vérifiez que ANTHROPIC_API_KEY est configurée.</p>");
    }
    setIsGenerating(false);
  }, [filters, filterValues, canvasName, sections]);

  /* ─── Edit panel state ─── */
  const editSection = selectedSection !== null ? sections.find(s => s.id === selectedSection) : null;

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen">
      {/* ─── SIDEBAR ─── */}
      <aside className="fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-y-auto"
        style={{ width: 220, background: "var(--bg-elevated)", borderRight: "1px solid var(--border)", padding: "20px 14px" }}>
        <div className="mb-7 px-2" style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase" }}>
          Lite<span style={{ color: "var(--accent)" }}>●</span>Ops
        </div>

        <div className="mono-label" style={{ padding: "14px 8px 6px" }}>Pilot · AG001</div>
        <NavItem active={view === "create"} onClick={() => navToView("create")} icon={<IconPlus {...cn("w-[15px] h-[15px]")} />}>Nouveau canvas</NavItem>
        <NavItem active={view === "canvas" || view === "report"} onClick={() => sections.length > 0 && navToView("canvas")} icon={<IconGrid {...cn("w-[15px] h-[15px]")} />}>Canvas actif</NavItem>

        <div className="mono-label" style={{ padding: "18px 8px 6px" }}>Mes canvas</div>
        <NavItem onClick={() => { setCanvasName("Dashboard Risques — SAB Santé"); setCanvasOrigin("CRÉÉ VIA ASSISTANT"); setSections(RISK_DASHBOARD_SECTIONS); setFilters(RISK_DASHBOARD_FILTERS); navToView("canvas"); }}>
          Dashboard Risques SAB
        </NavItem>
        <NavItem onClick={() => { setCanvasName("Fiche Gouvernance — SAB Santé"); setCanvasOrigin("CRÉÉ DEPUIS UN MODÈLE"); setSections(UPLOAD_SLIDE_SECTIONS); setFilters([{ id: "risk", label: "Risque N1", placeholder: "" }, { id: "period", label: "Exercice", placeholder: "" }]); navToView("canvas"); }}>
          Fiche Gouvernance SAB
        </NavItem>

        <div className="mt-auto pt-5" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="mono-label px-2 mb-1">Pilot — Prototype v0.6</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", padding: "0 8px", lineHeight: 1.5 }}>
            Générateur de rapports IA
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="flex-1 min-h-screen" style={{ marginLeft: 220, padding: "32px 48px 120px", maxWidth: 1120 }}>

        {/* ═══ VIEW: CREATE ═══ */}
        {view === "create" && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <h1 style={{ fontSize: 26, fontWeight: 500, marginBottom: 10 }}>Créer un canvas</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
                Un canvas est un modèle réutilisable de rapport. Il contient des sections positionnées et des filtres de contexte. Choisissez comment le créer.
              </p>
            </div>

            {/* Mode cards */}
            <div className="grid mb-8" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 900, gap: 16 }}>
              {([
                { key: "upload" as CreateMode, icon: <IconUpload className="w-9 h-9" />, title: "Depuis un modèle", desc: "Uploadez un PDF, slide ou image existant. Pilot analyse la structure visuelle et crée le canvas automatiquement." },
                { key: "manual" as CreateMode, icon: <IconGrid className="w-9 h-9" />, title: "Manuel", desc: "Construisez votre canvas section par section en mode éditeur. Chaque section peut être générée individuellement par l'IA." },
                { key: "assistant" as CreateMode, icon: <IconChat className="w-9 h-9" />, title: "Via assistant", desc: "Décrivez votre besoin en langage naturel ou remplissez un questionnaire. Pilot génère la structure du canvas pour vous." },
              ]).map(m => (
                <button key={m.key} onClick={() => setCreateMode(m.key)}
                  className="text-center transition-all duration-200 cursor-pointer"
                  style={{
                    background: "var(--bg-elevated)", border: `1px solid ${createMode === m.key ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius)", padding: "28px 24px",
                    boxShadow: createMode === m.key ? "0 0 0 1px var(--accent), var(--shadow-md)" : "var(--shadow-sm)",
                  }}>
                  <div className="mx-auto mb-3" style={{ width: 48, height: 48, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", background: createMode === m.key ? "var(--accent-bg)" : "rgba(28,28,26,0.04)", color: createMode === m.key ? "var(--accent-text)" : "var(--text-tertiary)" }}>{m.icon}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{m.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{m.desc}</p>
                </button>
              ))}
            </div>

            {/* ─── MODE: Upload ─── */}
            {createMode === "upload" && !isAnalyzing && (
              <div className="animate-fade-up" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "36px 40px", boxShadow: "var(--shadow-sm)", maxWidth: 900, marginTop: 8 }}>
                <div className="mono-label mb-3" style={{ color: "var(--accent-text)" }}>Modèle disponible</div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, maxWidth: 600 }}>
                  Cliquez sur la slide ci-dessous pour l&apos;importer. Pilot analysera sa structure visuelle et créera automatiquement un canvas avec les sections détectées.
                </p>
                {/* Fake slide preview */}
                <div
                  onClick={simulateUpload}
                  style={{ cursor: "pointer", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", transition: "box-shadow 0.2s, transform 0.2s", maxWidth: 700, marginInline: "auto" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/template-sab-gouvernance.svg" alt="Slide SAB Santé — Risque Gouvernance" style={{ width: "100%", display: "block" }} />
                </div>
                <div className="text-center mt-4">
                  <button onClick={simulateUpload} className="inline-flex items-center gap-2"
                    style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "10px 24px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    <IconUpload className="w-4 h-4" /> Importer cette slide
                  </button>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
                    SAB Santé — Risque N1 Gouvernance — Direction des Risques — Juin 2025
                  </p>
                </div>
              </div>
            )}
            {createMode === "upload" && isAnalyzing && (
              <div className="animate-fade-up" style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", marginTop: 8 }}>
                {/* Show faded slide behind spinner */}
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/template-sab-gouvernance.svg" alt="" style={{ width: "100%", display: "block", opacity: 0.15, maxWidth: 700, marginInline: "auto" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="spinner mb-5" />
                    <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>Pilot analyse votre document</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Détection de la structure, des sections et des KPIs…</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── MODE: Manual ─── */}
            {createMode === "manual" && (
              <div className="animate-fade-up" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "44px 48px", boxShadow: "var(--shadow-sm)", maxWidth: 680, marginInline: "auto", marginTop: 8 }}>
                <div className="text-center">
                  <IconGrid className="w-9 h-9 mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
                  <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 8 }}>Éditeur de canvas</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28, maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>
                    Donnez un titre à votre canvas, puis ajoutez des sections une par une.
                    Chaque section peut être générée par l&apos;IA à partir de sa description.
                  </p>
                </div>
                <div className="mx-auto mb-8" style={{ maxWidth: 400 }}>
                  <label className="mono-label block mb-2">Nom du canvas</label>
                  <input value={manualName} onChange={e => setManualName(e.target.value)}
                    placeholder="Ex : Dashboard KPI mensuel"
                    className="w-full text-center"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 16px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-primary)", outline: "none" }} />
                </div>

                {/* Examples */}
                <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius)", padding: "20px 24px", maxWidth: 560, marginInline: "auto", marginBottom: 28 }}>
                  <div className="mono-label mb-3">Exemples de canvas</div>
                  {[
                    { name: "Rapport COMEX mensuel", secs: ["Synthèse exécutive", "KPIs stratégiques", "Alertes et décisions", "Budget vs réalisé"], color: "var(--color-amber)" },
                    { name: "Fiche risque opérationnel", secs: ["Évaluation du risque", "Cartographie par entité", "Plans d'action", "Historique incidents"], color: "var(--success)" },
                    { name: "Dashboard projet", secs: ["Avancement global", "Budget et consommation", "Risques projet", "Planning jalons"], color: "var(--accent)" },
                  ].map(ex => (
                    <button key={ex.name} onClick={() => {
                      setManualName(ex.name);
                      setCanvasName(ex.name);
                      setCanvasOrigin("CRÉÉ MANUELLEMENT");
                      setSections(ex.secs.map((label, i) => ({
                        id: i, label, description: `Décrivez ici le contenu attendu pour « ${label} ».`, render: "both" as const, fullWidth: i === 0, iconType: ["kpi", "chart", "list", "table"][i % 4],
                      })));
                      setFilters([{ id: "period", label: "Période", placeholder: "Ex : 2025" }, { id: "scope", label: "Périmètre", placeholder: "Ex : Global" }]);
                      navToView("canvas");
                    }}
                      className="w-full flex items-start gap-3 text-left transition-all"
                      style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg-elevated)", cursor: "pointer", padding: "14px 18px", marginBottom: 10 }}>
                      <div className="w-7 h-7 flex items-center justify-center shrink-0" style={{ borderRadius: "var(--radius)", background: `color-mix(in srgb, ${ex.color} 8%, transparent)` }}>
                        <IconChart className="w-3.5 h-3.5" style={{ color: ex.color }} />
                      </div>
                      <div className="min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{ex.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>{ex.secs.length} sections : {ex.secs.join(" · ")}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button onClick={createManualCanvas} className="inline-flex items-center gap-2"
                    style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "9px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    <IconPlus className="w-3.5 h-3.5" /> Créer le canvas vide
                  </button>
                </div>
              </div>
            )}

            {/* ─── MODE: Assistant ─── */}
            {createMode === "assistant" && !isAssistantGenerating && (
              <div className="animate-fade-up" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", overflow: "hidden", marginTop: 8 }}>
                {/* Toggle */}
                <div className="flex items-center" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", gap: 12 }}>
                  <div className="inline-flex gap-1" style={{ background: "var(--bg-surface)", borderRadius: "var(--radius)", padding: 3 }}>
                    {(["form", "free"] as AssistantMode[]).map(m => (
                      <button key={m} onClick={() => setAsstMode(m)}
                        className="flex items-center gap-1.5 transition-all"
                        style={{
                          fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "var(--font-sans)",
                          borderRadius: "var(--radius)", padding: "8px 16px",
                          background: asstMode === m ? "var(--bg-elevated)" : "transparent",
                          color: asstMode === m ? "var(--text-primary)" : "var(--text-tertiary)",
                          boxShadow: asstMode === m ? "var(--shadow-sm)" : "none",
                        }}>
                        {m === "form" ? "Questionnaire guidé" : "Texte libre"}
                      </button>
                    ))}
                  </div>

                  {/* Pre-built dashboard shortcut */}
                  <button onClick={loadRiskDashboard}
                    className="ml-auto flex items-center gap-1.5 transition-all"
                    style={{ fontSize: 11, border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", background: "var(--accent-bg)", color: "var(--accent-text)", cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500, padding: "8px 14px" }}>
                    <IconBolt className="w-3 h-3" /> Dashboard risques SAB
                  </button>
                </div>

                {/* Form mode */}
                {asstMode === "form" && (
                  <div className="flex flex-col" style={{ padding: "24px 28px", gap: 20 }}>
                    <FormField label="Nom du projet / canvas">
                      <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex : Analyse prévoyance 2024 — Groupe Alpha" />
                    </FormField>
                    <FormField label="Objectif principal">
                      <textarea value={objectif} onChange={e => setObjectif(e.target.value)} rows={3} placeholder="Décrivez l'objectif principal de cette analyse…" />
                    </FormField>
                    <FormField label="Description du périmètre">
                      <textarea value={perimetre} onChange={e => setPerimetre(e.target.value)} rows={3} placeholder="Population concernée, entités, géographie, produits, période…" />
                    </FormField>
                    <div>
                      <label className="mono-label block mb-2">Axes d&apos;analyse attendus</label>
                      <div className="flex flex-wrap" style={{ gap: 8 }}>
                        {AXES.map(axe => (
                          <button key={axe} onClick={() => setSelectedAxes(prev => prev.includes(axe) ? prev.filter(a => a !== axe) : [...prev, axe])}
                            className="rounded-full transition-all cursor-pointer"
                            style={{
                              padding: "7px 16px", fontSize: 13,
                              border: `1px solid ${selectedAxes.includes(axe) ? "var(--accent)" : "var(--border)"}`,
                              background: selectedAxes.includes(axe) ? "var(--accent-bg)" : "var(--bg-elevated)",
                              color: selectedAxes.includes(axe) ? "var(--accent-text)" : "var(--text-secondary)",
                              fontFamily: "var(--font-sans)",
                            }}>{axe}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end" style={{ paddingTop: 8 }}>
                      <button onClick={generateCanvasFromForm} className="inline-flex items-center gap-2"
                        style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "10px 24px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <IconBolt className="w-3.5 h-3.5" /> Générer le canvas
                      </button>
                    </div>
                  </div>
                )}

                {/* Free text mode */}
                {asstMode === "free" && (
                  <div style={{ padding: "24px 28px" }}>
                    <FormField label="Description du projet">
                      <textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={10} style={{ minHeight: 200 }}
                        placeholder="Décrivez votre projet et vos besoins d'analyse en langage libre. Mentionnez le secteur, les objectifs, le périmètre, les axes d'analyse importants…" />
                    </FormField>
                    <div className="flex justify-end" style={{ paddingTop: 16 }}>
                      <button onClick={loadRiskDashboard} className="inline-flex items-center gap-2"
                        style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "10px 24px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <IconBolt className="w-3.5 h-3.5" /> Générer le canvas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assistant generating */}
            {createMode === "assistant" && isAssistantGenerating && (
              <div className="animate-fade-up text-center py-12" style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)", marginTop: 8 }}>
                <div className="spinner mx-auto mb-5" />
                <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>Pilot construit votre canvas</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Analyse du besoin et création des sections…</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ VIEW: CANVAS ═══ */}
        {view === "canvas" && (
          <div className="animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 500 }}>{canvasName}</h2>
                <div className="mono-label mt-0.5">CANVAS · {sections.length} SECTIONS · {canvasOrigin}</div>
              </div>
              <button onClick={() => navToView("create")} className="inline-flex items-center gap-1.5"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                + Nouveau
              </button>
            </div>

            {/* Pilot bar */}
            <div className="flex items-start mb-3.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", borderRadius: "var(--radius)", padding: "14px 20px", boxShadow: "var(--shadow-sm)", gap: 12 }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent-text)", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500 }}>P</div>
              <div>
                <div className="mono-label mb-0.5" style={{ color: "var(--accent-text)" }}>Pilot</div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  Canvas prêt. Définissez les filtres de contexte et ajustez les sections. Cliquez sur une section pour la modifier ou générer son contenu avec l&apos;IA. Cliquez{" "}
                  <strong style={{ color: "var(--accent-text)" }}>Générer le rapport</strong> pour renseigner les filtres et lancer la génération complète.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 14, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 500 }}>
                  <IconFilter className="w-[15px] h-[15px]" style={{ color: "var(--text-tertiary)" }} />
                  Filtres de contexte
                </h3>
                <span className="mono-label">{filters.length} filtre{filters.length > 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div className="flex flex-wrap mb-3" style={{ gap: 8 }}>
                  {filters.map(f => (
                    <div key={f.id} className="inline-flex items-center gap-2 rounded-full"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", padding: "6px 14px", fontSize: 13 }}>
                      <IconFilter className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />
                      {f.label}
                      <button onClick={() => removeFilter(f.id)} className="w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(28,28,26,0.08)", color: "var(--text-tertiary)", border: "none", fontSize: 11 }}>×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2" style={{ marginTop: 12 }}>
                  <input value={newFilterLabel} onChange={e => setNewFilterLabel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addFilter()}
                    placeholder="Ajouter un filtre… Ex : Période, Périmètre, Secteur"
                    style={{ flex: 1, background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-primary)", outline: "none" }} />
                  <button onClick={addFilter} className="flex items-center justify-center w-9 h-9 cursor-pointer"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-secondary)" }}>
                    <IconPlus className="w-[15px] h-[15px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas grid */}
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {sections.map(s => {
                const Icon = ICON_MAP[s.iconType] || IconText;
                return (
                  <div key={s.id} onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      background: "var(--bg-elevated)", border: `1px solid ${selectedSection === s.id ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "var(--radius)", overflow: "hidden",
                      boxShadow: selectedSection === s.id ? "0 0 0 1px var(--accent), var(--shadow-md)" : "var(--shadow-sm)",
                      gridColumn: s.fullWidth ? "1 / -1" : undefined,
                    }}>
                    <div className="flex items-center gap-2" style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: "var(--radius)", background: "rgba(28,28,26,0.06)" }}>
                          <Icon className="w-[11px] h-[11px]" />
                        </div>
                        <span className="mono-label">{s.label} · S{sections.indexOf(s) + 1}</span>
                      </div>
                      <div className="ml-auto flex gap-0.5 rounded-full p-0.5" style={{ background: "var(--bg-surface)" }} onClick={e => e.stopPropagation()}>
                        {(["chart", "text", "both"] as const).map(r => (
                          <button key={r} onClick={() => updateSection(s.id, { render: r })}
                            className="flex items-center justify-center w-6 h-5 rounded-full text-[10px] transition-all cursor-pointer"
                            style={{
                              border: "none", fontFamily: "var(--font-mono)",
                              background: s.render === r ? "var(--bg-elevated)" : "transparent",
                              color: s.render === r ? "var(--text-primary)" : "var(--text-tertiary)",
                              boxShadow: s.render === r ? "var(--shadow-sm)" : "none",
                            }}>
                            {r === "chart" ? <IconChart className="w-[11px] h-[11px]" /> : r === "text" ? <IconText className="w-[11px] h-[11px]" /> : <IconBoth className="w-[11px] h-[11px]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.description}</p>
                      {s.generatedContent && (
                        <div className="gen-content mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}
                          dangerouslySetInnerHTML={{ __html: s.generatedContent }} />
                      )}
                      {generatingSectionId === s.id && (
                        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          <span style={{ fontSize: 12, color: "var(--accent-text)" }}>Pilot génère le contenu…</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add section */}
            <div className="text-center" style={{ marginTop: 16 }}>
              <button onClick={addSection} className="inline-flex items-center gap-1.5 text-xs"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 24px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                <IconPlus className="w-[13px] h-[13px]" /> Ajouter une section
              </button>
            </div>
          </div>
        )}

        {/* ═══ VIEW: REPORT ═══ */}
        {view === "report" && (
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navToView("canvas")} className="inline-flex items-center gap-1.5 text-xs"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                ← Canvas
              </button>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 500 }}>{reportName}</h2>
                <div className="mono-label">Rapport généré par Pilot</div>
              </div>
            </div>

            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              {isGenerating ? (
                <div className="p-10 text-center">
                  <div className="spinner mx-auto mb-5" />
                  <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>Pilot génère votre rapport</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>Analyse des données SAB Santé et rédaction des sections…</p>
                  <div className="space-y-2 max-w-lg mx-auto">
                    {[100, 80, 60, 100, 80, 60, 100].map((w, i) => (
                      <div key={i} className="skeleton" style={{ height: i % 3 === 0 ? 60 : 16, width: `${w}%`, marginInline: "auto" }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="gen-content" style={{ padding: "32px 40px" }}
                  dangerouslySetInnerHTML={{ __html: reportContent }} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── EDIT PANEL (slide-in) ─── */}
      {editSection && view === "canvas" && (
        <div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col animate-fade-up"
          style={{ width: 400, background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <div className="flex items-center justify-between" style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 500 }}>Modifier la section</h3>
            <button onClick={() => setSelectedSection(null)} className="flex items-center justify-center w-8 h-8 cursor-pointer"
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-secondary)" }}>
              <IconClose className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
            <FormField label="Titre de la section">
              <input value={editSection.label} onChange={e => updateSection(editSection.id, { label: e.target.value })} />
            </FormField>
            <div style={{ marginTop: 16 }}>
              <FormField label="Contenu attendu (langage naturel)">
                <textarea value={editSection.description} onChange={e => updateSection(editSection.id, { description: e.target.value })} rows={5} />
              </FormField>
            </div>

            {/* Render type selector */}
            <div style={{ marginTop: 16 }}>
              <label className="mono-label block mb-2">Type de rendu</label>
              <div className="flex gap-1.5">
                {([
                  { key: "chart" as const, icon: <IconChart className="w-3.5 h-3.5" />, label: "Graphique" },
                  { key: "text" as const, icon: <IconText className="w-3.5 h-3.5" />, label: "Texte" },
                  { key: "both" as const, icon: <IconBoth className="w-3.5 h-3.5" />, label: "Mixte" },
                ]).map(opt => (
                  <button key={opt.key} onClick={() => updateSection(editSection.id, { render: opt.key })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-all cursor-pointer"
                    style={{
                      fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)",
                      border: `1px solid ${editSection.render === opt.key ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "var(--radius)",
                      background: editSection.render === opt.key ? "var(--accent-bg)" : "var(--bg-base)",
                      color: editSection.render === opt.key ? "var(--accent-text)" : "var(--text-secondary)",
                      boxShadow: editSection.render === opt.key ? "0 0 0 1px var(--accent)" : "none",
                    }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <button onClick={() => generateSectionContent(editSection.id)}
                disabled={generatingSectionId === editSection.id}
                className="w-full inline-flex items-center justify-center gap-2"
                style={{ background: "var(--accent-bg)", color: "var(--accent-text)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: "9px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: generatingSectionId === editSection.id ? 0.6 : 1 }}>
                <IconBolt className="w-3.5 h-3.5" />
                {generatingSectionId === editSection.id ? "Génération en cours…" : "Générer le contenu IA"}
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6, textAlign: "center" }}>
                Pilot générera le contenu à partir de la description et du dataset SAB.
              </p>
            </div>

            {editSection.generatedContent && (
              <div className="mt-4 gen-content" style={{ padding: 12, background: "var(--bg-base)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
                dangerouslySetInnerHTML={{ __html: editSection.generatedContent }} />
            )}

            <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => deleteSection(editSection.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs"
                style={{ background: "transparent", color: "var(--danger)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "var(--radius)", padding: "9px 20px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}>
                Supprimer cette section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GENERATE BAR (fixed bottom) ─── */}
      {view === "canvas" && sections.length > 0 && (
        <div className="fixed bottom-0 right-0 z-40 flex items-center gap-3.5"
          style={{ left: 220, background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "16px 48px", boxShadow: "0 -4px 16px rgba(28,28,26,0.06)", maxWidth: 1120 }}>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--accent-bg)", border: "1px solid var(--border-accent)", color: "var(--accent-text)" }}>
              <IconGrid className="w-[11px] h-[11px]" /> {canvasName}
            </span>
            {filters.map(f => (
              <span key={f.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ fontFamily: "var(--font-mono)", fontSize: 10, background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.2)", color: "var(--warning)" }}>
                <IconFilter className="w-[10px] h-[10px]" /> {f.label}
              </span>
            ))}
          </div>
          <button onClick={handleGenerateReport} className="inline-flex items-center gap-2 whitespace-nowrap"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "10px 22px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <IconBolt className="w-3.5 h-3.5" /> Générer le rapport
          </button>
        </div>
      )}

      {/* ─── FILTER VALUES MODAL ─── */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: "rgba(28,28,26,0.35)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowFilterModal(false); }}>
          <div className="animate-fade-up" style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", width: 520, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-start justify-between" style={{ padding: "24px 28px 0" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 500 }}>Renseignez les filtres de contexte</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Ces valeurs contextualiseront le contenu généré dans chaque section du rapport.</p>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="flex items-center justify-center w-8 h-8 cursor-pointer shrink-0 ml-3"
                style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-secondary)" }}>
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col" style={{ padding: "16px 28px 20px", gap: 16 }}>
              {filters.map(f => (
                <FormField key={f.id} label={f.label}>
                  <input value={filterValues[f.id] || ""} onChange={e => setFilterValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder={f.placeholder} />
                </FormField>
              ))}
            </div>
            <div style={{ padding: "0 28px 14px" }}>
              <div className="mono-label mb-1.5">Nom du rapport généré</div>
              <div className="px-3 py-2" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, color: Object.values(filterValues).some(Boolean) ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                {computeReportName()}
              </div>
            </div>
            <div className="flex justify-end gap-2" style={{ padding: "14px 28px 24px" }}>
              <button onClick={() => setShowFilterModal(false)}
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Annuler
              </button>
              <button onClick={confirmGenerate}
                disabled={!Object.values(filterValues).some(Boolean)}
                className="inline-flex items-center gap-2"
                style={{ background: "var(--color-ink)", color: "var(--color-paper)", border: "none", borderRadius: "var(--radius)", padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", opacity: Object.values(filterValues).some(Boolean) ? 1 : 0.5 }}>
                <IconBolt className="w-3.5 h-3.5" /> Générer le rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */
function NavItem({ children, active, onClick, icon }: { children: React.ReactNode; active?: boolean; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 w-full text-left transition-all cursor-pointer"
      style={{
        padding: "7px 10px", fontSize: 13, border: "none", fontFamily: "var(--font-sans)", borderRadius: "var(--radius)",
        background: active ? "var(--accent-bg)" : "transparent",
        color: active ? "var(--accent-text)" : "var(--text-secondary)",
      }}>
      {icon && <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>}
      {children}
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="mono-label">{label}</label>
      <div className="[&>input]:w-full [&>input]:bg-[var(--bg-base)] [&>input]:border [&>input]:border-[var(--border)] [&>input]:rounded-[var(--radius)] [&>input]:px-4 [&>input]:py-3 [&>input]:font-[family-name:var(--font-sans)] [&>input]:text-[13px] [&>input]:text-[var(--text-primary)] [&>input]:outline-none
        [&>textarea]:w-full [&>textarea]:bg-[var(--bg-base)] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:rounded-[var(--radius)] [&>textarea]:px-4 [&>textarea]:py-3 [&>textarea]:font-[family-name:var(--font-sans)] [&>textarea]:text-[13px] [&>textarea]:text-[var(--text-primary)] [&>textarea]:outline-none [&>textarea]:resize-none [&>textarea]:leading-relaxed
        [&>select]:w-full [&>select]:bg-[var(--bg-base)] [&>select]:border [&>select]:border-[var(--border)] [&>select]:rounded-[var(--radius)] [&>select]:px-4 [&>select]:py-3 [&>select]:font-[family-name:var(--font-sans)] [&>select]:text-[13px] [&>select]:text-[var(--text-primary)] [&>select]:outline-none [&>select]:cursor-pointer">
        {children}
      </div>
    </div>
  );
}
