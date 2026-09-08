// Session templates (ADPList-style formats): structured starting points so a
// request lands with a clear shape instead of a blank page. Stored on the
// request and shown on the match card; matching itself stays semantic.

export type TemplateId = "resume-review" | "mock-interview" | "portfolio-walkthrough" | "pronunciation-gym" | "custom";

export const TEMPLATES: Array<{
  id: TemplateId;
  label: string;
  labelEs: string;
  category: "tech" | "languages" | "either";
  blurb: string;
  blurbEs: string;
}> = [
  {
    id: "resume-review",
    label: "Resume review",
    labelEs: "Revisión de CV",
    category: "tech",
    blurb: "Line-by-line read of your resume.",
    blurbEs: "Lectura línea por línea de tu CV.",
  },
  {
    id: "mock-interview",
    label: "Mock interview",
    labelEs: "Entrevista simulada",
    category: "either",
    blurb: "Rehearse answers out loud, get feedback.",
    blurbEs: "Ensaya respuestas en voz alta, recibe feedback.",
  },
  {
    id: "portfolio-walkthrough",
    label: "Portfolio walkthrough",
    labelEs: "Recorrido de portafolio",
    category: "tech",
    blurb: "Walk your work, screen shared.",
    blurbEs: "Muestra tu trabajo con pantalla compartida.",
  },
  {
    id: "pronunciation-gym",
    label: "Pronunciation gym",
    labelEs: "Gimnasio de pronunciación",
    category: "languages",
    blurb: "Targeted pronunciation drills and corrections.",
    blurbEs: "Ejercicios de pronunciación y correcciones.",
  },
  {
    id: "custom",
    label: "Something else",
    labelEs: "Otra cosa",
    category: "either",
    blurb: "Describe it in your own words.",
    blurbEs: "Descríbelo con tus palabras.",
  },
];

export function templateById(id: string | undefined) {
  return TEMPLATES.find((t) => t.id === id);
}
