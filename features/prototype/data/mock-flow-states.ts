export const prototypeSteps = [
  { id: "personalize", label: "Personalizar" },
  { id: "review", label: "Revisar" },
  { id: "preview", label: "Vista previa" },
  { id: "download", label: "Descargar" },
];

export const simulatedStates = {
  loading: "Cargando contenido.",
  empty: "No hay contenido para mostrar.",
  error: "No pudimos cargar esta pantalla.",
  ready: "Pantalla lista.",
} as const;
