"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TREE, NUMEROS, type TipoLlamada } from "./arbol";

type Contacto = { nombre: string; tel: string };

const CONTACTOS_DEFAULT: Contacto[] = [
  { nombre: "Mamá", tel: "1155550101" },
  { nombre: "Pareja", tel: "1155550102" },
  { nombre: "Vecina Rosa", tel: "1155550103" },
];

const soloDigitos = (s: string) => s.replace(/\D/g, "");

// Pictogramas SVG idénticos a Acceso de Emergencia (3).html
const ICONS: Record<string, string> = {
  pin: '<path d="M24 44s-13-12-13-23a13 13 0 0126 0c0 11-13 23-13 23z"/><circle cx="24" cy="21" r="5"/>',
  hand: '<path d="M14 28V14a3 3 0 016 0v10M20 24V8a3 3 0 016 0v16M26 24V10a3 3 0 016 0v16M32 24v-6a3 3 0 016 0v14c0 8-6 12-13 12h-3c-6 0-9-3-12-8l-5-9a3 3 0 015-3l5 6"/>',
  heart: '<path d="M24 41S6 30 6 17a9.5 9.5 0 0118-4.5A9.5 9.5 0 0142 17c0 13-18 24-18 24z"/>',
  alert: '<path d="M24 6L4 41h40z"/><path d="M24 18v12"/><circle cx="24" cy="35" r="1" fill="currentColor"/>',
  fire: '<path d="M24 4c1 9 13 13 13 26a13 13 0 01-26 0c0-7 4-10 7-16 1 4 3 5 6-10z"/><path d="M24 40a5 5 0 01-5-5c0-4 5-6 5-11 3 3 5 7 5 11a5 5 0 01-5 5z"/>',
  cross: '<path d="M18 6h12v12h12v12H30v12H18V30H6V18h12z"/>',
  shield: '<path d="M24 4l16 6v12c0 12-8 18-16 22-8-4-16-10-16-22V10z"/>',
  check: '<path d="M8 25l11 11L40 12"/>',
  x: '<path d="M10 10l28 28M38 10L10 38"/>',
  phone: '<path d="M12 6h8l4 10-5 3a24 24 0 0010 10l3-5 10 4v8a4 4 0 01-4 4A32 32 0 018 10a4 4 0 014-4z"/>',
  people: '<circle cx="17" cy="15" r="6"/><circle cx="34" cy="18" r="5"/><path d="M5 41c0-8 5-12 12-12s12 4 12 12M31 30c7 0 12 3 12 11"/>',
  clock: '<circle cx="24" cy="24" r="18"/><path d="M24 13v11l7 5"/>',
  water: '<path d="M24 5C16 16 11 22 11 29a13 13 0 0026 0c0-7-5-13-13-24z"/>',
  arrow: '<path d="M8 24h30M26 12l12 12-12 12"/>',
  speaker: '<path d="M6 18h8l10-8v28l-10-8H6z"/><path d="M32 16a12 12 0 010 16M38 10a20 20 0 010 28"/>',
};

function renderSvg(name: string, size = 44) {
  const content = ICONS[name] || ICONS.arrow;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function optIcon(label: string): string {
  if (/^s[ií]$/i.test(label)) return "check";
  if (/^no(,|$)/i.test(label)) return "x";
  if (/perd/i.test(label)) return "pin";
  if (/ayuda/i.test(label)) return "hand";
  if (/mal/i.test(label)) return "heart";
  if (/emergencia/i.test(label)) return "alert";
  if (/fuego/i.test(label)) return "fire";
  if (/herid/i.test(label)) return "cross";
  if (/pelea|delito|roba|robo/i.test(label)) return "shield";
  return "arrow";
}

function stepIcon(text: string): string {
  if (/llam|número/i.test(text)) return "phone";
  if (/ubicaci|coordenad/i.test(text)) return "pin";
  if (/fuego|bombero/i.test(text)) return "fire";
  if (/herid/i.test(text)) return "cross";
  if (/agua/i.test(text)) return "water";
  if (/voz|hablale|decile|contale/i.test(text)) return "speaker";
  if (/gente|local|farmacia|estaci|alguien|demás|vecin|contacto|persona/i.test(text)) return "people";
  if (/sent|acost|quedate|quedes|esper|movés|camin/i.test(text)) return "clock";
  if (/ayuda/i.test(text)) return "hand";
  return "arrow";
}

export default function Bolsillo() {
  const [view, setView] = useState<"tree" | "sos" | "contacts" | "location">("tree");
  const [history, setHistory] = useState<string[]>(["start"]);
  const [contactos, setContactos] = useState<Contacto[]>(CONTACTOS_DEFAULT);
  const [editandoContactos, setEditandoContactos] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cargandoGps, setCargandoGps] = useState(false);
  const [gpsData, setGpsData] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    time: string;
  } | null>(null);

  const statusTimer = useRef<NodeJS.Timeout | null>(null);
  const screenRef = useRef<HTMLElement | null>(null);

  // Inicialización (localStorage, Service Worker)
  useEffect(() => {
    try {
      const rawContactos = localStorage.getItem("contactos");
      if (rawContactos) {
        const parsed = JSON.parse(rawContactos);
        if (Array.isArray(parsed) && parsed.length > 0) setContactos(parsed);
      }
      const rawAutoRead = localStorage.getItem("autoRead");
      if (rawAutoRead === "1") setAutoRead(true);
    } catch {}

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const say = useCallback((msg: string) => {
    setStatusMsg(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => {
      setStatusMsg(null);
    }, 2600);
  }, []);

  const copyText = useCallback((text: string, okMsg: string) => {
    if (!navigator.clipboard) {
      say("No se pudo copiar. Mantené apretado el texto.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => say(okMsg))
      .catch(() => say("No se pudo copiar. Mantené apretado el texto."));
  }, [say]);

  // Mensaje de ubicación formateado
  const getLocMessage = useCallback(() => {
    if (gpsData) {
      return (
        `NECESITO AYUDA. Mi ubicación actual:\n` +
        `https://maps.google.com/?q=${gpsData.lat.toFixed(6)},${gpsData.lng.toFixed(6)}\n` +
        `(${gpsData.lat.toFixed(5)}, ${gpsData.lng.toFixed(5)}; precisión aprox. ${Math.round(
          gpsData.accuracy
        )} m). Hora: ${gpsData.time}`
      );
    }
    return (
      `Necesito ayuda. Estoy cerca de mi ubicación habitual.\n` +
      `https://maps.google.com/?q=-34.6037,-58.3816\n` +
      `(-34.6037, -58.3816; ubicación de referencia).`
    );
  }, [gpsData]);

  // Obtener geolocalización real
  const obtenerUbicacion = useCallback(() => {
    setCargandoGps(true);
    if (!navigator.geolocation) {
      setCargandoGps(false);
      say("Este teléfono no permite obtener la ubicación GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const hora = new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setGpsData({ lat: latitude, lng: longitude, accuracy, time: hora });
        setCargandoGps(false);
        say("Ubicación actualizada con éxito");
      },
      (err) => {
        setCargandoGps(false);
        say(
          err.code === 1
            ? "Permiso denegado. Activá el GPS en los ajustes del teléfono."
            : "No se pudo obtener el GPS. Probá en un lugar abierto."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [say]);

  // Lectura en voz alta (Text-to-Speech)
  const stopSpeak = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  const speakNow = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !screenRef.current) return;
    try {
      window.speechSynthesis.cancel();
      const el = screenRef.current;
      const parts: string[] = [];

      const h1 = el.querySelector("h1");
      if (h1) parts.push(h1.textContent + ".");

      const hint = el.querySelector(".hint");
      if (hint) parts.push(hint.textContent || "");

      const opts = el.querySelectorAll(".opt .otxt");
      if (opts.length) {
        parts.push("Opciones.");
        opts.forEach((o) => parts.push((o.textContent || "") + "."));
      }

      el.querySelectorAll(".steps .stxt").forEach((s, idx) => {
        parts.push(`Paso ${idx + 1}. ${s.textContent || ""}.`);
      });

      el.querySelectorAll("a.call > span:first-child").forEach((c) => {
        parts.push((c.textContent || "") + ".");
      });

      const utterance = new SpeechSynthesisUtterance(parts.join(" "));
      utterance.lang = "es-AR";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, []);

  // Navegación
  const currentNodeId = history[history.length - 1];
  const currentNode = TREE[currentNodeId] || TREE.start;

  const irANodo = (nextId: string) => {
    stopSpeak();
    setHistory((prev) => [...prev, nextId]);
    window.scrollTo(0, 0);
  };

  const irAtras = () => {
    stopSpeak();
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
    window.scrollTo(0, 0);
  };

  const irInicio = () => {
    stopSpeak();
    setView("tree");
    setHistory(["start"]);
    window.scrollTo(0, 0);
  };

  const cambiarVista = (v: "tree" | "sos" | "contacts" | "location") => {
    stopSpeak();
    setView((curr) => (curr === v ? "tree" : v));
    window.scrollTo(0, 0);
  };

  // Efecto auto-lectura al cambiar pantalla
  useEffect(() => {
    if (autoRead) {
      const timer = setTimeout(() => {
        speakNow();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [view, history, autoRead, speakNow]);

  const toggleAutoRead = () => {
    const nextVal = !autoRead;
    setAutoRead(nextVal);
    try {
      localStorage.setItem("autoRead", nextVal ? "1" : "0");
    } catch {}
    if (nextVal) {
      speakNow();
    } else {
      stopSpeak();
    }
  };

  const guardarContactos = (nuevos: Contacto[]) => {
    setContactos(nuevos);
    try {
      localStorage.setItem("contactos", JSON.stringify(nuevos));
    } catch {}
  };

  const guardadosValidos = contactos.filter((c) => soloDigitos(c.tel).length >= 6);
  const primerTelefono = guardadosValidos[0] ? soloDigitos(guardadosValidos[0].tel) : "";
  const mensajeLoc = getLocMessage();
  const urlWa = `https://wa.me/${primerTelefono}?text=${encodeURIComponent(mensajeLoc)}`;
  const isIos = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const sepSms = isIos ? "&" : "?";
  const urlSms = `sms:${primerTelefono}${sepSms}body=${encodeURIComponent(mensajeLoc)}`;

  const compartirNativo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: mensajeLoc });
      } catch {}
    } else {
      copyText(mensajeLoc, "Ubicación copiada. Pegala en cualquier app.");
    }
  };

  // Renderizadores de bloques comunes
  const renderCallRow = (title: string, sub: string, tel: string, calm = false, key?: string | number) => {
    const rawTel = soloDigitos(tel);
    return (
      <div className="callrow" key={key}>
        <a className={`call${calm ? " calm" : ""}`} href={`tel:${rawTel}`}>
          <span>Llamar a {title}</span>
          <small>{sub}</small>
        </a>
        <button
          className="copy"
          type="button"
          onClick={() => copyText(rawTel, "Número copiado")}
          aria-label={`Copiar número ${tel}`}
        >
          Copiar número
        </button>
      </div>
    );
  };

  const renderCallBlock = (callType: TipoLlamada, key?: string | number) => {
    if (callType === "trusted") {
      return (
        <div className="group" key={key}>
          <h2>
            Contactos de confianza <span className="tag">Un toque</span>
          </h2>
          {guardadosValidos.length > 0 ? (
            guardadosValidos.map((c, i) =>
              renderCallRow(c.nombre || "Contacto", c.tel, c.tel, true, i)
            )
          ) : (
            <button
              className="big secondary"
              type="button"
              onClick={() => {
                setView("contacts");
                setEditandoContactos(true);
              }}
            >
              Cargar contactos de confianza
            </button>
          )}
        </div>
      );
    }
    const num = NUMEROS[callType];
    if (!num) return null;
    return renderCallRow(num.label, num.sub, num.tel, false, key);
  };

  const renderLocationBlock = () => (
    <div className="loc">
      <h2 style={{ margin: 0, fontSize: "20px" }}>Tu ubicación en texto simple</h2>
      <pre>{mensajeLoc}</pre>
      {gpsData ? (
        <button
          className="big"
          type="button"
          onClick={() => copyText(mensajeLoc, "Ubicación copiada. Pegala en un mensaje.")}
        >
          Copiar mensaje de ubicación
        </button>
      ) : (
        <button className="big" type="button" onClick={obtenerUbicacion}>
          {cargandoGps ? "Obteniendo GPS…" : "Obtener mi ubicación actual"}
        </button>
      )}
      <a
        href={urlWa}
        target="_blank"
        rel="noopener noreferrer"
        className="big whatsapp"
        onClick={() => {
          if (!gpsData) obtenerUbicacion();
        }}
      >
        {guardadosValidos[0]
          ? `Enviar por WhatsApp a ${guardadosValidos[0].nombre || "contacto"}`
          : "Enviar por WhatsApp"}
      </a>
      <a
        href={urlSms}
        className="big secondary"
        onClick={() => {
          if (!gpsData) obtenerUbicacion();
        }}
      >
        Enviar por SMS
      </a>
      <button className="big secondary" type="button" onClick={compartirNativo}>
        Compartir en otra app
      </button>
      <p className="sample">
        {gpsData
          ? "Ubicación obtenida por el GPS del teléfono. Podés enviarla con un solo toque."
          : "Tocá 'Obtener mi ubicación' para usar el GPS en tiempo real."}
      </p>
    </div>
  );

  const atTreeStart = view === "tree" && history.length === 1;

  return (
    <div className="app">
      {/* Cabecera */}
      <header className="top">
        <span className="brand">Acceso de emergencia</span>
        <div className="top-actions">
          {view === "tree" && history.length > 1 && (
            <button className="back" type="button" onClick={irAtras}>
              ← Atrás
            </button>
          )}
          {(!atTreeStart || view !== "tree") && (
            <button className="home" type="button" onClick={irInicio}>
              Inicio
            </button>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main id="screen" ref={screenRef} aria-live="polite">
        {/* Barra de accesibilidad: lectura por voz */}
        <div className="tools">
          <button className="listen" type="button" onClick={speakNow}>
            {renderSvg("speaker", 28)}
            <span>Escuchar</span>
          </button>
          <button
            className="listen"
            type="button"
            onClick={toggleAutoRead}
            aria-pressed={autoRead ? "true" : "false"}
          >
            <span>Leer solo: {autoRead ? "sí" : "no"}</span>
          </button>
        </div>

        {/* Vista: ÁRBOL DE DECISIÓN */}
        {view === "tree" && (
          <div>
            {currentNode.q ? (
              <>
                <h1 tabIndex={-1}>{currentNode.q}</h1>
                {currentNode.hint && <p className="hint">{currentNode.hint}</p>}
                <div className="opts" style={{ marginTop: "16px" }}>
                  {currentNode.opts?.map((opt) => (
                    <button
                      key={opt.next}
                      className={`opt ${opt.tone || ""}`}
                      type="button"
                      onClick={() => irANodo(opt.next)}
                    >
                      <span className="lead">
                        <span className="ico">{renderSvg(optIcon(opt.t))}</span>
                        <span className="otxt">
                          {opt.t}
                          {opt.sub && <small>{opt.sub}</small>}
                        </span>
                      </span>
                      <span className="chev" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h1 tabIndex={-1}>{currentNode.r}</h1>
                {currentNode.steps && (
                  <ol className="steps" style={{ marginTop: "16px" }}>
                    {currentNode.steps.map((st, i) => (
                      <li key={i}>
                        <span className="ico">{renderSvg(stepIcon(st))}</span>
                        <span className="stxt">{st}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {currentNode.calls && (
                  <div className="group" style={{ marginTop: "16px" }}>
                    {currentNode.calls.map((callId, idx) => renderCallBlock(callId, idx))}
                  </div>
                )}
                {currentNode.loc && (
                  <div style={{ marginTop: "16px" }}>{renderLocationBlock()}</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Vista: SOS (Números de emergencia 911, 107, 100, 144) */}
        {view === "sos" && (
          <div>
            <h1 tabIndex={-1}>Números de emergencia</h1>
            <p className="hint">Todos son gratuitos desde cualquier teléfono en Argentina.</p>
            <div className="group" style={{ marginTop: "16px" }}>
              {(["s911", "s107", "s100", "s144"] as TipoLlamada[]).map((c) =>
                renderCallBlock(c, c)
              )}
            </div>
          </div>
        )}

        {/* Vista: CONTACTOS */}
        {view === "contacts" && (
          <div>
            <h1 tabIndex={-1}>Contactos de confianza</h1>
            <p className="hint">Un toque y se inicia la llamada.</p>

            <div className="group" style={{ marginTop: "16px" }}>
              {renderCallBlock("trusted", "contactos_list")}
            </div>

            <div style={{ marginTop: "16px" }}>
              <button
                className="big secondary"
                type="button"
                onClick={() => setEditandoContactos(!editandoContactos)}
              >
                {editandoContactos ? "Ocultar edición" : "Modificar mis contactos"}
              </button>
            </div>

            {editandoContactos && (
              <div
                className="loc"
                style={{ marginTop: "16px", borderColor: "var(--signal)" }}
              >
                <h2 style={{ margin: 0, fontSize: "18px" }}>Configurar contactos de confianza</h2>
                {contactos.map((c, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input
                      aria-label={`Nombre de contacto ${i + 1}`}
                      placeholder={`Nombre del contacto ${i + 1}`}
                      value={c.nombre}
                      onChange={(e) =>
                        guardarContactos(
                          contactos.map((item, idx) =>
                            idx === i ? { ...item, nombre: e.target.value } : item
                          )
                        )
                      }
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "2px solid var(--fg)",
                        background: "var(--surface)",
                        color: "var(--fg)",
                        fontSize: "18px",
                      }}
                    />
                    <input
                      aria-label={`Teléfono de contacto ${i + 1}`}
                      placeholder="Teléfono (ej: 5491112345678)"
                      inputMode="tel"
                      value={c.tel}
                      onChange={(e) =>
                        guardarContactos(
                          contactos.map((item, idx) =>
                            idx === i ? { ...item, tel: e.target.value } : item
                          )
                        )
                      }
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "2px solid var(--fg)",
                        background: "var(--surface)",
                        color: "var(--fg)",
                        fontSize: "18px",
                      }}
                    />
                  </div>
                ))}
                <p className="sample">
                  Se guardan únicamente en la memoria de este teléfono. Para WhatsApp utilizá el
                  código de país y área (ej. 549...).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Vista: UBICACIÓN */}
        {view === "location" && (
          <div>
            <h1 tabIndex={-1}>Mandar mi ubicación</h1>
            <p className="hint">Un mensaje corto que cualquiera puede leer y entender.</p>
            <div style={{ marginTop: "16px" }}>{renderLocationBlock()}</div>
          </div>
        )}
      </main>

      {/* Dock fijo inferior */}
      <nav className="dock" aria-label="Accesos rápidos">
        <div className="dock-in">
          <button
            className="sos"
            type="button"
            data-view="sos"
            aria-current={view === "sos" ? "true" : undefined}
            onClick={() => cambiarVista("sos")}
          >
            <span className="n">911</span>
            <span>Emergencias</span>
          </button>
          <button
            type="button"
            data-view="contacts"
            aria-current={view === "contacts" ? "true" : undefined}
            onClick={() => cambiarVista("contacts")}
          >
            <span className="n">☎</span>
            <span>Contactos</span>
          </button>
          <button
            type="button"
            data-view="location"
            aria-current={view === "location" ? "true" : undefined}
            onClick={() => cambiarVista("location")}
          >
            <span className="n">⌖</span>
            <span>Ubicación</span>
          </button>
        </div>
      </nav>

      {/* Notificación flotante de estado */}
      <div id="status" role="status" hidden={!statusMsg}>
        {statusMsg}
      </div>
    </div>
  );
}
