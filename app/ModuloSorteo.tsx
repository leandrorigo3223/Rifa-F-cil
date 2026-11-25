import React, { useState } from 'react';
import { InfoNumero, Premio } from './PanelAdmin';

interface Ganador {
  puesto: string;
  premio: string;
  numero: string;
  comprador: string;
  telefono: string;
}

interface Props {
  numeros: Record<string, InfoNumero>;
  premios: Premio[];
  tituloRifa: string;
  digitos: number;
}

export default function ModuloSorteo({ numeros, premios, tituloRifa, digitos }: Props) {
  const [sorteando, setSorteando] = useState(false);
  const [ruleta, setRuleta] = useState<string | null>(null);
  const [ganadores, setGanadores] = useState<Ganador[]>([]);
  const [quiniela, setQuiniela] = useState("");

  const pagados = Object.keys(numeros).filter((num) => numeros[num]?.estado === 'pagado');
  const numerosYaGanadores = ganadores.map(g => g.numero);
  const disponibles = pagados.filter((num) => !numerosYaGanadores.includes(num));
  const siguientePremio = premios.at(ganadores.length);

  const sortearSiguientePremio = () => {
    if (!siguientePremio) return;
    if (disponibles.length === 0) return alert("No quedan más números pagados disponibles para sortear.");

    setSorteando(true);
    let pasos = 0;

    const timer = setInterval(() => {
      const numElegido = disponibles.at(Math.floor(Math.random() * disponibles.length)) ?? "--";
      setRuleta(numElegido);
      pasos++;

      if (pasos > 20) {
        clearInterval(timer);
        const infoElegido = numeros[numElegido];
        if (infoElegido) {
          setGanadores([
            ...ganadores,
            {
              puesto: siguientePremio.puesto,
              premio: siguientePremio.descripcion,
              numero: numElegido,
              comprador: infoElegido.comprador,
              telefono: infoElegido.telefono
            }
          ]);
        }
        setSorteando(false);
      }
    }, 85);
  };

  const agregarPorQuiniela = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siguientePremio) return;
    const num = quiniela.trim().padStart(digitos, '0').slice(-digitos);
    const info = numeros[num];

    setGanadores([
      ...ganadores,
      {
        puesto: siguientePremio.puesto,
        premio: siguientePremio.descripcion,
        numero: num,
        comprador: info ? `${info.comprador} (${info.estado === 'pagado' ? 'Pagado' : '⚠️ Sin pagar'})` : "NÚMERO VACANTE",
        telefono: info?.telefono ?? ""
      }
    ]);
    setQuiniela("");
  };

  const linkAvisoWhatsApp = (g: Ganador) => {
    const telLimpio = g.telefono.replace(/\D/g, '');
    const msg = `🎉 ¡Felicitaciones *${g.comprador}*! Ganaste el *${g.puesto}* (${g.premio}) con el número *#${g.numero}* en "${tituloRifa}". ¡Comunicate con nosotros para coordinar la entrega!`;
    return `https://wa.me{telLimpio}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <main className="max-w-2xl mx-auto px-4 mt-6">
      <section className="bg-white p-6 rounded-xl border shadow-sm text-center space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">🎲 Sorteo de {premios.length} Premio(s)</h2>
          {ganadores.length > 0 && (
            <button onClick={() => { setGanadores([]); setRuleta(null); }} className="text-xs text-rose-600 underline">
              Reiniciar sorteo
            </button>
          )}
        </div>

        <p className="text-sm text-slate-600">
          Números pagados participantes: <strong>{pagados.length}</strong> (Restantes sin ganar: <strong>{disponibles.length}</strong>)
        </p>

        {siguientePremio ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <span className="text-xs uppercase font-bold text-blue-700">Sorteando ahora:</span>
              <p className="font-extrabold text-lg text-slate-900">{siguientePremio.puesto}: {siguientePremio.descripcion}</p>
            </div>

            <article className="p-5 bg-slate-50 rounded-xl border">
              <p className="my-2 h-20 w-24 mx-auto rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center text-3xl font-mono font-bold">
                {ruleta ?? "--"}
              </p>
              <button onClick={sortearSiguientePremio} disabled={sorteando} className="mt-2 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl">
                {sorteando ? "Girando..." : `Sortear ${siguientePremio.puesto}`}
              </button>
            </article>

            <form onSubmit={agregarPorQuiniela} className="p-4 bg-slate-50 rounded-xl border flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="font-medium">O cargar por Quiniela:</span>
              <input type="text" required placeholder="Ej: 4822" value={quiniela} onChange={e => setQuiniela(e.target.value)} className="border rounded-lg px-3 py-1.5 text-center font-mono font-bold w-24 bg-white" />
              <button type="submit" className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg">Asignar</button>
            </form>
          </div>
        ) : (
          <p className="p-4 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200">
            ✅ ¡Todos los premios han sido sorteados!
          </p>
        )}

        {ganadores.length > 0 && (
          <div className="space-y-3 text-left">
            <h3 className="font-bold text-slate-800">🏆 Tabla de Ganadores</h3>
            {ganadores.map((g, idx) => (
              <div key={idx} className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-800">{g.puesto} • {g.premio}</span>
                  <p className="text-lg font-black text-slate-900">#{g.numero} — {g.comprador}</p>
                </div>
                {g.telefono && (
                  <a href={linkAvisoWhatsApp(g)} target="_blank" rel="noreferrer" className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow">
                    📲 Avisar por WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
