import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import type {
  RuntimeInvitationTemplate,
  TemplatePrintProfile,
} from "../templates/template-types";
import { mmToPt } from "./template-coordinate-conversion";

type InstructionCopy = {
  title: string;
  bullets: string[];
  footer: string;
};

const instructionCopyByKey: Record<string, InstructionCopy> = {
  "a3-standard": {
    title: "Instrucciones de impresion A3",
    bullets: [
      "Imprimir al 100%. No usar ajustar a pagina ni escala automatica.",
      "El PDF tiene tamano fisico final A3 vertical.",
      "Revisar que los textos coincidan con la vista previa antes de producir.",
      "Si se imprime una prueba, medir ancho y alto final luego del corte.",
    ],
    footer: "Uso recomendado: invitaciones y papeleria A3.",
  },
  "stickers-a3": {
    title: "Instrucciones para stickers A3",
    bullets: [
      "Imprimir al 100% sobre hoja A3.",
      "Mantener el arte sin reescalar para preservar el tamano de cada sticker.",
      "Verificar registro de corte/troquel antes de producir cantidad.",
      "Hacer una prueba de una hoja y medir diametros antes de produccion.",
    ],
    footer: "Uso recomendado: planchas A3 de stickers coordinados.",
  },
  "large-format-banner": {
    title: "Instrucciones para banner",
    bullets: [
      "Enviar a impresion en escala 100%. No adaptar al material.",
      "El archivo ya esta armado con el tamano fisico del banner.",
      "Validar sangrado y terminacion con el proveedor antes de imprimir.",
      "Hacer control visual de legibilidad a distancia real.",
    ],
    footer: "Uso recomendado: banner de gran formato.",
  },
  "large-format-backing": {
    title: "Instrucciones para backing",
    bullets: [
      "Imprimir a escala 100% segun las medidas finales del perfil.",
      "No comprimir ni rasterizar nuevamente el archivo final.",
      "Confirmar material, montaje y distancia de lectura con el proveedor.",
      "Revisar una prueba parcial si el proveedor lo permite.",
    ],
    footer: "Uso recomendado: fondos/backings de evento.",
  },
};

const fallbackInstructionCopy: InstructionCopy = {
  title: "Instrucciones de impresion",
  bullets: [
    "Imprimir al 100%. No usar ajustar a pagina.",
    "Validar medidas finales contra el perfil de impresion.",
    "Revisar texto, escala y legibilidad antes de producir.",
  ],
  footer: "Uso recomendado: archivo personalizado MOMENTA.",
};

function getInstructionCopy(printProfile: TemplatePrintProfile) {
  return (
    instructionCopyByKey[printProfile.instructionsKey] ?? fallbackInstructionCopy
  );
}

function drawWrappedText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  options: {
    x: number;
    y: number;
    width: number;
    font: PDFFont;
    fontSize: number;
    lineHeight: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (
      options.font.widthOfTextAtSize(nextLine, options.fontSize) <=
      options.width
    ) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * options.fontSize * options.lineHeight,
      size: options.fontSize,
      font: options.font,
      color: options.color ?? rgb(0.16, 0.18, 0.2),
    });
  });

  return lines.length * options.fontSize * options.lineHeight;
}

export async function addInstructionPageTemplate(
  pdf: PDFDocument,
  template: RuntimeInvitationTemplate,
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
  },
) {
  const pageWidth = mmToPt(210);
  const pageHeight = mmToPt(297);
  const page = pdf.addPage([pageWidth, pageHeight]);
  const margin = 46;
  const profile = template.printProfile;
  const copy = getInstructionCopy(profile);
  const accent = rgb(0.05, 0.49, 0.43);
  const muted = rgb(0.43, 0.47, 0.52);
  const ink = rgb(0.08, 0.09, 0.11);
  let cursorY = pageHeight - margin;

  page.drawText("MOMENTA", {
    x: margin,
    y: cursorY,
    size: 13,
    font: fonts.bold,
    color: accent,
  });

  cursorY -= 36;
  page.drawText(copy.title, {
    x: margin,
    y: cursorY,
    size: 24,
    font: fonts.bold,
    color: ink,
  });

  cursorY -= 30;
  drawWrappedText(page, copy.footer, {
    x: margin,
    y: cursorY,
    width: pageWidth - margin * 2,
    font: fonts.regular,
    fontSize: 10.5,
    lineHeight: 1.35,
    color: muted,
  });

  cursorY -= 58;
  page.drawText("Perfil de impresion", {
    x: margin,
    y: cursorY,
    size: 13,
    font: fonts.bold,
    color: ink,
  });

  const profileRows = [
    ["Perfil", profile.label],
    ["Tamano final", `${profile.widthMm} x ${profile.heightMm} mm`],
    ["PPI esperado", `${profile.expectedPpi} PPI`],
    [
      "PPI efectivo",
      `${template.printDiagnostics.effectivePpiX} x ${template.printDiagnostics.effectivePpiY} PPI`,
    ],
    ["Master", `${template.widthPx} x ${template.heightPx} px`],
  ];

  cursorY -= 25;
  profileRows.forEach(([label, value]) => {
    page.drawText(label, {
      x: margin,
      y: cursorY,
      size: 9.5,
      font: fonts.bold,
      color: muted,
    });
    page.drawText(value, {
      x: margin + 125,
      y: cursorY,
      size: 9.5,
      font: fonts.regular,
      color: ink,
    });
    cursorY -= 20;
  });

  cursorY -= 16;
  page.drawText("Checklist de produccion", {
    x: margin,
    y: cursorY,
    size: 13,
    font: fonts.bold,
    color: ink,
  });

  cursorY -= 26;
  copy.bullets.forEach((bullet) => {
    page.drawCircle({
      x: margin + 4,
      y: cursorY + 4,
      size: 2.5,
      color: accent,
    });

    const consumedHeight = drawWrappedText(page, bullet, {
      x: margin + 18,
      y: cursorY,
      width: pageWidth - margin * 2 - 18,
      font: fonts.regular,
      fontSize: 10,
      lineHeight: 1.35,
      color: ink,
    });

    cursorY -= Math.max(22, consumedHeight + 6);
  });

  page.drawText(
    "Esta pagina es informativa. No forma parte del arte imprimible.",
    {
      x: margin,
      y: margin,
      size: 8.5,
      font: fonts.regular,
      color: muted,
    },
  );
}
