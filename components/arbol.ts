// Árbol de decisiones y números de emergencia (Argentina)

export type TipoLlamada = "trusted" | "s911" | "s107" | "s100" | "s144";

export type NumeroEmergencia = {
  id: string;
  label: string;
  sub: string;
  tel: string;
};

export const NUMEROS: Record<string, NumeroEmergencia> = {
  s911: { id: "911", label: "Emergencias 911", sub: "Policía y asistencia general", tel: "911" },
  s107: { id: "107", label: "Ambulancia 107", sub: "SAME, emergencias médicas", tel: "107" },
  s100: { id: "100", label: "Bomberos 100", sub: "Incendios y rescates", tel: "100" },
  s144: { id: "144", label: "Línea 144", sub: "Violencia de género, 24 horas", tel: "144" },
};

export type Opcion = {
  t: string;
  sub?: string;
  next: string;
  tone?: "yes" | "no" | "alarm";
};

export type Nodo = {
  q?: string;
  hint?: string;
  opts?: Opcion[];
  r?: string;
  alarm?: boolean;
  steps?: string[];
  calls?: TipoLlamada[];
  loc?: boolean;
};

export const TREE: Record<string, Nodo> = {
  start: {
    q: "¿Qué te está pasando?",
    hint: "Tocá la opción que más se parezca.",
    opts: [
      { t: "Me perdí", next: "perdi", tone: "yes" },
      { t: "Necesito ayuda", next: "ayuda", tone: "yes" },
      { t: "Me siento mal", next: "mal", tone: "yes" },
      { t: "Veo una emergencia", sub: "Accidente, fuego, pelea", next: "emerg", tone: "yes" },
      { t: "Perdí o me robaron algo", sub: "Robo, celular, documentos", next: "objetos", tone: "no" },
    ],
  },
  perdi: {
    q: "¿Ves un cartel con el nombre de la calle?",
    opts: [
      { t: "Sí", next: "perdi_cartel", tone: "yes" },
      { t: "No", next: "perdi_seguro", tone: "no" },
    ],
  },
  perdi_cartel: {
    r: "Decile a alguien dónde estás",
    steps: [
      "Leé en voz alta el nombre de la calle y el número.",
      "Mandale tu ubicación a un contacto de confianza.",
      "Quedate donde hay luz y gente hasta que te encuentren.",
    ],
    calls: ["trusted"],
    loc: true,
  },
  perdi_seguro: {
    q: "¿Te sentís seguro donde estás?",
    opts: [
      { t: "Sí", next: "perdi_quieto", tone: "yes" },
      { t: "No", next: "peligro", tone: "alarm" },
    ],
  },
  perdi_quieto: {
    r: "Quedate quieto y avisá",
    steps: [
      "No sigas caminando. Es más fácil encontrarte si no te movés.",
      "Mandá tu ubicación a un contacto de confianza.",
      "Si nadie responde, pedí ayuda a un comercio abierto.",
    ],
    calls: ["trusted", "s911"],
    loc: true,
  },
  ayuda: {
    q: "¿Hay peligro en este momento?",
    hint: "Por ejemplo, alguien que te sigue o te amenaza.",
    opts: [
      { t: "Sí", next: "peligro", tone: "alarm" },
      { t: "No", next: "ayuda_tipo", tone: "no" },
    ],
  },
  ayuda_tipo: {
    q: "¿Necesitás ayuda por violencia?",
    opts: [
      { t: "Sí", next: "violencia", tone: "yes" },
      { t: "No, necesito otra cosa", next: "ayuda_otra", tone: "no" },
    ],
  },
  violencia: {
    r: "Pedí ayuda ahora",
    steps: [
      "Llamá a la línea 144. Te atienden las 24 horas.",
      "Si estás en peligro inmediato, llamá al 911.",
      "Mandá tu ubicación a alguien de confianza.",
    ],
    calls: ["s144", "s911", "trusted"],
    loc: true,
  },
  ayuda_otra: {
    r: "Avisá a alguien de confianza",
    steps: [
      "Llamá a un contacto con un solo toque.",
      "Contale qué necesitás y dónde estás.",
      "Si no lo lográs, probá con el siguiente de la lista.",
    ],
    calls: ["trusted"],
    loc: true,
  },
  peligro: {
    r: "Andá a un lugar con gente",
    alarm: true,
    steps: [
      "Entrá a un local abierto, una estación o una farmacia.",
      "Llamá al 911 y decí tu ubicación.",
      "Mandá tu ubicación a un contacto de confianza.",
    ],
    calls: ["s911", "trusted"],
    loc: true,
  },
  mal: {
    q: "¿Tenés dolor de pecho, te falta el aire o te desmayaste?",
    opts: [
      { t: "Sí", next: "grave", tone: "alarm" },
      { t: "No", next: "mal_camino", tone: "no" },
    ],
  },
  grave: {
    r: "Llamá a la ambulancia",
    alarm: true,
    steps: [
      "Llamá al 107 y decí tu ubicación.",
      "Sentate o acostate. No te quedes de pie.",
      "Pedile a alguien cercano que se quede con vos.",
    ],
    calls: ["s107", "s911"],
    loc: true,
  },
  mal_camino: {
    q: "¿Podés caminar sin ayuda?",
    opts: [
      { t: "Sí", next: "mal_leve", tone: "yes" },
      { t: "No", next: "grave", tone: "alarm" },
    ],
  },
  mal_leve: {
    r: "Buscá un lugar donde sentarte",
    steps: [
      "Sentate en un lugar seguro y tomá agua si tenés.",
      "Avisá a un contacto de confianza cómo te sentís.",
      "Si empeorás, llamá al 107.",
    ],
    calls: ["trusted", "s107"],
    loc: true,
  },
  emerg: {
    q: "¿Qué estás viendo?",
    opts: [
      { t: "Fuego o humo", next: "fuego", tone: "alarm" },
      { t: "Personas heridas", next: "heridos", tone: "alarm" },
      { t: "Pelea o delito", next: "delito", tone: "alarm" },
    ],
  },
  fuego: {
    r: "Alejate y llamá a Bomberos",
    alarm: true,
    steps: [
      "Alejate del fuego y de los demás que estén cerca.",
      "Llamá al 100 y decí la dirección.",
      "No entres a buscar a nadie. Esperá a los bomberos.",
    ],
    calls: ["s100", "s911"],
    loc: true,
  },
  heridos: {
    r: "Llamá a la ambulancia",
    alarm: true,
    steps: [
      "Llamá al 107 y decí la dirección.",
      "No muevas a la persona herida.",
      "Hablale y quedate con ella hasta que llegue la ayuda.",
    ],
    calls: ["s107", "s911"],
    loc: true,
  },
  delito: {
    r: "Alejate y llamá al 911",
    alarm: true,
    steps: [
      "Alejate sin enfrentar a nadie.",
      "Llamá al 911 desde un lugar seguro.",
      "Describí qué viste, sin acercarte.",
    ],
    calls: ["s911"],
    loc: true,
  },
  objetos: {
    q: "¿Qué pasó con tus cosas?",
    opts: [
      { t: "Me robaron", next: "robo", tone: "alarm" },
      { t: "Perdí documentos o el celular", next: "perdida", tone: "no" },
    ],
  },
  robo: {
    r: "Tu seguridad primero",
    alarm: true,
    steps: [
      "No te enfrentes. Alejate a un lugar con gente.",
      "Llamá al 911 para hacer la denuncia.",
      "Bloqueá tarjetas y cuentas desde otro teléfono.",
    ],
    calls: ["s911", "trusted"],
    loc: true,
  },
  perdida: {
    r: "Recuperá lo perdido",
    steps: [
      "Pedí a un contacto que llame a tu número.",
      "Bloqueá la línea y las tarjetas con tu banco y tu empresa.",
      "Hacé la denuncia de extravío en la comisaría o en línea.",
    ],
    calls: ["trusted"],
    loc: false,
  },
};

// Alias para retrocompatibilidad
export const ARBOL = TREE;
