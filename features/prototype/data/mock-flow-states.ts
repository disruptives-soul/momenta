export const prototypeSteps = [
  { id: "personalize", label: "Personalizar" },
  { id: "review", label: "Revisar" },
  { id: "preview", label: "Preview" },
  { id: "download", label: "Descargar" },
];

export const simulatedStates = {
  loading: "Simulando carga de datos del prototipo.",
  empty: "No hay datos mock para esta pantalla.",
  error: "Estado de error simulado para validar mensajes.",
  ready: "Pantalla lista con datos mock.",
} as const;
