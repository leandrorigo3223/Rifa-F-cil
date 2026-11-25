"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import PanelAdmin, { DatosRifa, GanadorGuardado, InfoNumero } from './PanelAdmin';
import CrearRifa from './CrearRifa';

export default function Home() {
  const [slugActual, setSlugActual] = useState<string | null>(null);
  const [rifa, setRifa] = useState<DatosRifa | null>(null);
  const [numeros, setNumeros] = useState<Record<string, InfoNumero>>({});
  const [cargando, setCargando] = useState(true);

  const [vista, setVista] = useState<'publica' | 'admin' | 'sorteo'>('publica');
  const [autorizado, setAutorizado] = useState(false);
  const [verLegales, setVerLegales] = useState(false);

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [comprador, setComprador] = useState("");
  const [telefono, setTelefono] = useState("");
  const [copiado, setCopiado] = useState(false);

  const ejecutarSorteoAutomatico = async (rifaObj: DatosRifa, mapaNums: Record<string, InfoNumero>) => {
    if (!rifaObj.id) return [];
    const pagados = Object.keys(mapaNums).filter(n => mapaNums[n]?.estado === 'pagado');
    if (pagados.length === 0) return [];

    const mezclados = [...pagados].sort(() => Math.random() - 0.5);
    const ganadoresGenerados: GanadorGuardado[] = [];

    rifaObj.premios.forEach((p, idx) => {
      const numGanador = mezclados.at(idx);
      if (numGanador && mapaNums[numGanador]) {
        ganadoresGenerados.push({
          puesto: p.puesto,
          premio: p.descripcion,
          numero: numGanador,
          comprador: mapaNums[numGanador].comprador,
          telefono: mapaNums[numGanador].telefono
        });
      }
    });

    if (ganadoresGenerados.length > 0) {
      await supabase.from('rifas').update({ ganadores: ganadoresGenerados }).eq('id', rifaObj.id);
    }
    return ganadoresGenerados;
  };

  const cargarRifa = async (slug: string) => {
    setCargando(true);
    const { data: rifaData } = await supabase.from('rifas').select('*').eq('slug', slug).single();
    if (rifaData) {
      const { data: numsData } = await supabase.from('numeros_rifa').select('*').eq('rifa_id', rifaData.id);
      const mapa: Record<string, InfoNumero> = {};
      (numsData ?? []).forEach(n => {
        mapa[n.numero] = { id: n.id, estado: n.estado, comprador: n.comprador, telefono: n.telefono };
      });
      setNumeros(mapa);

      const yaVencioFecha = rifaData.fecha_sorteo && new Date() >= new Date(rifaData.fecha_sorteo);
      const sinGanadoresAun = !rifaData.ganadores || rifaData.ganadores.length === 0;

      if (yaVencioFecha && sinGanadoresAun) {
        const nuevosGanadores = await ejecutarSorteoAutomatico(rifaData, mapa);
        setRifa({ ...rifaData, ganadores: nuevosGanadores });
      } else {
        setRifa(rifaData);
      }
    }
    setCargando(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('r');
    if (r) {
      setSlugActual(r);
      cargarRifa(r);
    } else {
      setCargando(false);
    }
  }, []);

  const pedirAccesoAdmin = (destino: 'admin' | 'sorteo') => {
    if (autorizado) return setVista(destino);
    const clave = prompt("Ingresá la clave secreta del organizador:");
    if (clave && rifa && clave.trim() === rifa.clave_admin) {
      setAutorizado(true);
      setVista(destino);
    } else if (clave !== null) {
      alert("Clave incorrecta.");
    }
  };

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rifa?.id || !seleccionado || !comprador.trim() || !telefono.trim()) return;

    const { error } = await supabase.from('numeros_rifa').insert({
      rifa_id: rifa.id,
      numero: seleccionado,
      estado: 'reservado',
      comprador: comprador.trim(),
      telefono: telefono.trim()
    });

    if (error) {
      alert("¡Ups! Alguien acaba de reservar ese número recién. Elegí otro.");
      await cargarRifa(rifa.slug);
      setSeleccionado(null);
      return;
    }

    await cargarRifa(rifa.slug);
    const msg = `🔔 *NUEVA RESERVA EN TU RIFA*\n\n• *Rifa:* ${rifa.titulo}\n• *Número:* #${seleccionado}\n• *Comprador:* ${comprador.trim()}\n• *WhatsApp:* ${telefono.trim()}\n• *Monto a confirmar:* $${rifa.valor_numero}\n\n¡Hola! Ya te transfiero al alias ${rifa.alias_pago} y te mando el comprobante por acá.`;
    window.open(`https://wa.me{rifa.whatsapp_organizador}?text=${encodeURIComponent(msg)}`, '_blank');
    setSeleccionado(null);
    setComprador("");
    setTelefono("");
  };

  const nombreCorto = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) return partes.at(0);
    return `${partes.at(0)} ${partes.at(1)?.at(0)}.`;
  };
    const formatearFecha = (iso: string) => {
    if (!iso) return "A confirmar";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " hs";
  };

  const PieLegal = () => (
    <footer className="max-w-2xl mx-auto px-4 mt-10 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 space-y-1">
      <p>RifaFácil es una herramienta tecnológica gratuita de gestión de talonarios digitales.</p>
      <button type="button" onClick={() => setVerLegales(true)} className="underline font-semibold text-slate-700 hover:text-slate-900">
        Ver Términos Legales y Deslinde de Responsabilidad
      </button>

      {verLegales && (
        <aside className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">⚖️ Términos Legales y Responsabilidad</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta plataforma actúa exclusivamente como soporte técnico digital para organizar talonarios. No intermedia en pagos, no retiene fondos, no verifica la identidad de los organizadores ni garantiza la entrega de premios.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cada organizador es el único y exclusivo responsable civil, comercial y legal por la veracidad de la rifa, las autorizaciones municipales/provinciales correspondientes, la recaudación y la entrega efectiva de los premios anunciados. El uso de la aplicación implica la aceptación total de estas condiciones.
            </p>
            <button type="button" onClick={() => setVerLegales(false)} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">
              Entendido y Cerrar
            </button>
          </div>
        </aside>
      )}
    </footer>
  );

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Cargando talonario...</div>;
  }

  if (!slugActual || !rifa) {
    return (
      <div className="min-h-screen bg-slate-100 pb-12 font-sans">
        <nav className="bg-slate-900 text-white p-3 shadow">
          <div className="max-w-3xl mx-auto font-extrabold text-emerald-400">🎟️ RifaFácil</div>
        </nav>
        <CrearRifa alCrear={(nuevoSlug) => {
          window.history.pushState({}, '', `?r=${nuevoSlug}`);
          setSlugActual(nuevoSlug);
          setAutorizado(true);
          cargarRifa(nuevoSlug);
          setVista('admin');
        }} />
        <PieLegal />
      </div>
    );
  }

  const digitos = rifa.cantidad_numeros > 100 ? 3 : 2;
  const lista = Array.from({ length: rifa.cantidad_numeros }, (_, i) => i.toString().padStart(digitos, '0'));
  const ganadoresLista = rifa.ganadores ?? [];
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12 font-sans">
      <nav className="bg-slate-900 text-white p-3 sticky top-0 z-40 shadow">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <a href="/" className="font-extrabold text-emerald-400">🎟️ RifaFácil</a>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg text-xs">
            <button onClick={() => setVista('publica')} className={`px-3 py-1.5 rounded ${vista === 'publica' ? 'bg-blue-600' : ''}`}>Talonario</button>
            <button onClick={() => pedirAccesoAdmin('admin')} className={`px-3 py-1.5 rounded ${vista === 'admin' ? 'bg-blue-600' : ''}`}>🔒 Organizador</button>
            <button onClick={() => pedirAccesoAdmin('sorteo')} className={`px-3 py-1.5 rounded ${vista === 'sorteo' ? 'bg-emerald-600' : ''}`}>🔒 Sorteo</button>
          </div>
        </div>
      </nav>

      {vista === 'publica' && (
        <main className="max-w-2xl mx-auto px-4 mt-6 space-y-5">
          <header className="bg-blue-700 text-white p-6 rounded-2xl shadow">
            <h1 className="text-2xl font-bold">{rifa.titulo}</h1>
            <p className="text-blue-100 text-sm mt-1">{rifa.descripcion}</p>
          </header>

          {ganadoresLista.length > 0 && (
            <section className="bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl space-y-3 shadow-sm">
              <h2 className="font-black text-lg text-amber-900">🏆 ¡Sorteo Realizado! Ganadores Oficiales</h2>
              {ganadoresLista.map((g, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-amber-700">{g.puesto} ({g.premio})</span>
                    <p className="font-extrabold text-slate-900">#{g.numero} — {nombreCorto(g.comprador)}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
            <h2 className="font-bold">🏆 Premios en juego</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {rifa.premios.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border flex items-center gap-3">
                  {p.foto && <img src={p.foto} alt={p.puesto} className="w-16 h-16 object-cover rounded-lg border shrink-0" />}
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase">{p.puesto}</span>
                    <p className="text-sm font-medium text-slate-800">{p.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="pt-3 border-t text-sm flex flex-wrap justify-between gap-2 font-bold">
              <span className="text-green-600">Valor: ${rifa.valor_numero}</span>
              <span>📅 Sorteo Automático: {formatearFecha(rifa.fecha_sorteo)}</span>
            </p>
          </section>

          <section className="bg-white p-5 rounded-xl border shadow-sm">
            <h2 className="font-bold mb-3">Elegí tu número (Verde: Libre | Amarillo: Reservado | Rojo: Pago)</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {lista.map(num => {
                const info = numeros[num];
                const est = info?.estado ?? 'libre';
                const color = est === 'libre' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : est === 'reservado' ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white opacity-90';
                return (
                  <button key={num} disabled={est !== 'libre' || ganadoresLista.length > 0} onClick={() => setSeleccionado(num)} className={`py-2 px-1 rounded-lg font-bold text-sm flex flex-col items-center justify-center min-h-[52px] ${color}`}>
                    <span>{num}</span>
                    {info && <span className="text-[10px] font-normal truncate max-w-full opacity-90">{nombreCorto(info.comprador)}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}
      {vista === 'admin' && (
        <PanelAdmin
          rifa={rifa}
          guardarCambiosRifa={async (actualizada) => {
            await supabase.from('rifas').update({
              titulo: actualizada.titulo,
              descripcion: actualizada.descripcion,
              premios: actualizada.premios,
              valor_numero: actualizada.valor_numero,
              cantidad_numeros: actualizada.cantidad_numeros,
              alias_pago: actualizada.alias_pago,
              whatsapp_organizador: actualizada.whatsapp_organizador,
              fecha_sorteo: actualizada.fecha_sorteo
            }).eq('id', rifa.id);
            await cargarRifa(rifa.slug);
          }}
          numeros={numeros}
          confirmarPago={async (num) => {
            await supabase.from('numeros_rifa').update({ estado: 'pagado' }).eq('rifa_id', rifa.id).eq('numero', num);
            await cargarRifa(rifa.slug);
          }}
          liberarNumero={async (num) => {
            await supabase.from('numeros_rifa').delete().eq('rifa_id', rifa.id).eq('numero', num);
            await cargarRifa(rifa.slug);
          }}
        />
      )}

      {vista === 'sorteo' && (
        <main className="max-w-2xl mx-auto px-4 mt-6">
          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-5 text-center">
            <h2 className="text-xl font-bold">🎲 Sorteo Automático Certificado</h2>
            <p className="text-sm text-slate-600">Programado para el: <strong>{formatearFecha(rifa.fecha_sorteo)}</strong></p>

            {ganadoresLista.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-xl border space-y-3">
                <p className="text-xs text-slate-600">El sorteo se ejecutará automáticamente al cumplirse la fecha y hora programada, o podés adelantarlo manualmente ahora entre los números pagados:</p>
                <button
                  onClick={async () => {
                    const res = await ejecutarSorteoAutomatico(rifa, numeros);
                    if (res.length === 0) return alert("No hay números pagados todavía.");
                    await cargarRifa(rifa.slug);
                  }}
                  className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow"
                >
                  ⚡ Ejecutar Sorteo Automático Ahora
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">🏆 Ganadores Oficiales</h3>
                  <a
                    href={`https://wa.me{rifa.whatsapp_organizador}?text=${encodeURIComponent(`📋 *ACTA DE SORTEO - ${rifa.titulo}*\n\n` + ganadoresLista.map(g => `• ${g.puesto}: #${g.numero} - ${g.comprador} (Tel: ${g.telefono})`).join('\n'))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    📤 Enviar Acta al Organizador
                  </a>
                </div>
                {ganadoresLista.map((g, idx) => (
                  <div key={idx} className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase text-amber-800">{g.puesto} • {g.premio}</span>
                      <p className="text-lg font-black text-slate-900">#{g.numero} — {g.comprador}</p>
                    </div>
                    <a
                      href={`https://wa.me{g.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`🎉 ¡Felicitaciones *${g.comprador}*! Ganaste el *${g.puesto}* (${g.premio}) con el número *#${g.numero}* en "${rifa.titulo}".`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow"
                    >
                      📲 Avisar al Ganador
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {seleccionado && (
        <aside className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={reservar} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3">
            <h3 className="text-lg font-bold">Reservar número #{seleccionado}</h3>
            <input type="text" required placeholder="Tu Nombre y Apellido" value={comprador} onChange={e => setComprador(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="tel" required placeholder="Tu WhatsApp (Ej: 3434123456)" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <p className="bg-slate-100 p-3 rounded-lg text-xs flex justify-between items-center">
              <span>Alias: <strong>{rifa.alias_pago}</strong></span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(rifa.alias_pago); setCopiado(true); }} className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </p>
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm">Confirmar y avisar al Organizador</button>
            <button type="button" onClick={() => setSeleccionado(null)} className="w-full text-xs text-slate-500">Cancelar</button>
          </form>
        </aside>
      )}

      <PieLegal />
    </div>
  );
}

  
