'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import PanelAdmin, { DatosRifa, InfoNumero } from './PanelAdmin';
import ModuloSorteo from './ModuloSorteo';
import CrearRifa from './CrearRifa';

export default function Home() {
  const [slugActual, setSlugActual] = useState<string | null>(null);
  const [rifa, setRifa] = useState<DatosRifa | null>(null);
  const [numeros, setNumeros] = useState<Record<string, InfoNumero>>({});
  const [cargando, setCargando] = useState(true);

  const [vista, setVista] = useState<'publica' | 'admin' | 'sorteo'>('publica');
  const [autorizado, setAutorizado] = useState(false);

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [copiado, setCopiado] = useState(false);

  const cargarRifa = async (slug: string) => {
    setCargando(true);
    const { data: rifaData } = await supabase
      .from('rifas')
      .select('*')
      .eq('slug', slug)
      .single();
    if (rifaData) {
      setRifa(rifaData);
      const { data: numsData } = await supabase
        .from('numeros_rifa')
        .select('*')
        .eq('rifa_id', rifaData.id);
      const mapa: Record<string, InfoNumero> = {};
      (numsData ?? []).forEach((n) => {
        mapa[n.numero] = {
          id: n.id,
          estado: n.estado,
          comprador: n.comprador,
          telefono: n.telefono,
        };
      });
      setNumeros(mapa);
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
    const clave = prompt('Ingresá la clave secreta del organizador:');
    if (clave && rifa && clave.trim() === rifa.clave_admin) {
      setAutorizado(true);
      setVista(destino);
    } else if (clave !== null) {
      alert('Clave incorrecta.');
    }
  };

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rifa?.id || !seleccionado || !comprador.trim() || !telefono.trim())
      return;

    const { error } = await supabase.from('numeros_rifa').insert({
      rifa_id: rifa.id,
      numero: seleccionado,
      estado: 'reservado',
      comprador: comprador.trim(),
      telefono: telefono.trim(),
    });

    if (error) {
      alert('¡Ups! Alguien acaba de reservar ese número recién. Elegí otro.');
      await cargarRifa(rifa.slug);
      setSeleccionado(null);
      return;
    }

    await cargarRifa(rifa.slug);
    const msg = `¡Hola! Soy *${comprador.trim()}* (Tel: ${telefono.trim()}). Reservé el número *${seleccionado}* de "${
      rifa.titulo
    }" ($${rifa.valor_numero}). Ya transfiero a ${rifa.alias_pago}.`;
    window.open(
      `https://wa.me{rifa.whatsapp_organizador}?text=${encodeURIComponent(
        msg
      )}`,
      '_blank'
    );
    setSeleccionado(null);
    setComprador('');
    setTelefono('');
  };

  const nombreCorto = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) return partes.at(0);
    return `${partes.at(0)} ${partes.at(1)?.at(0)}.`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">
        Cargando talonario...
      </div>
    );
  }

  if (!slugActual || !rifa) {
    return (
      <div className="min-h-screen bg-slate-100 pb-12 font-sans">
        <nav className="bg-slate-900 text-white p-3 shadow">
          <div className="max-w-3xl mx-auto font-extrabold text-emerald-400">
            🎟️ RifaFácil
          </div>
        </nav>
        <CrearRifa
          alCrear={(nuevoSlug) => {
            window.history.pushState({}, '', `?r=${nuevoSlug}`);
            setSlugActual(nuevoSlug);
            setAutorizado(true);
            cargarRifa(nuevoSlug);
            setVista('admin');
          }}
        />
      </div>
    );
  }

  const digitos = rifa.cantidad_numeros > 100 ? 3 : 2;
  const lista = Array.from({ length: rifa.cantidad_numeros }, (_, i) =>
    i.toString().padStart(digitos, '0')
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12 font-sans">
      <nav className="bg-slate-900 text-white p-3 sticky top-0 z-40 shadow">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <a href="/" className="font-extrabold text-emerald-400">
            🎟️ RifaFácil
          </a>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setVista('publica')}
              className={`px-3 py-1.5 rounded ${
                vista === 'publica' ? 'bg-blue-600' : ''
              }`}
            >
              Talonario
            </button>
            <button
              onClick={() => pedirAccesoAdmin('admin')}
              className={`px-3 py-1.5 rounded ${
                vista === 'admin' ? 'bg-blue-600' : ''
              }`}
            >
              🔒 Organizador
            </button>
            <button
              onClick={() => pedirAccesoAdmin('sorteo')}
              className={`px-3 py-1.5 rounded ${
                vista === 'sorteo' ? 'bg-emerald-600' : ''
              }`}
            >
              🔒 Sorteo
            </button>
          </div>
        </div>
      </nav>

      {vista === 'publica' && (
        <main className="max-w-2xl mx-auto px-4 mt-6 space-y-5">
          <header className="bg-blue-700 text-white p-6 rounded-2xl shadow">
            <h1 className="text-2xl font-bold">{rifa.titulo}</h1>
            <p className="text-blue-100 text-sm mt-1">{rifa.descripcion}</p>
          </header>

          <section className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
            <h2 className="font-bold">🏆 Premios en juego</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {rifa.premios.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border flex items-center gap-3"
                >
                  {p.foto && (
                    <img
                      src={p.foto}
                      alt={p.puesto}
                      className="w-16 h-16 object-cover rounded-lg border shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase">
                      {p.puesto}
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {p.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="pt-3 border-t text-sm flex justify-between font-bold">
              <span className="text-green-600">
                Valor: ${rifa.valor_numero}
              </span>
              <span>{rifa.fecha_sorteo}</span>
            </p>
          </section>

          <section className="bg-white p-5 rounded-xl border shadow-sm">
            <h2 className="font-bold mb-3">
              Elegí tu número (Verde: Libre | Amarillo: Reservado | Rojo: Pago)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {lista.map((num) => {
                const info = numeros[num];
                const est = info?.estado ?? 'libre';
                const color =
                  est === 'libre'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : est === 'reservado'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-rose-500 text-white opacity-90';
                return (
                  <button
                    key={num}
                    disabled={est !== 'libre'}
                    onClick={() => setSeleccionado(num)}
                    className={`py-2 px-1 rounded-lg font-bold text-sm flex flex-col items-center justify-center min-h-[52px] ${color}`}
                  >
                    <span>{num}</span>
                    {info && (
                      <span className="text-[10px] font-normal truncate max-w-full opacity-90">
                        {nombreCorto(info.comprador)}
                      </span>
                    )}
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
            await supabase
              .from('rifas')
              .update({
                titulo: actualizada.titulo,
                descripcion: actualizada.descripcion,
                premios: actualizada.premios,
                valor_numero: actualizada.valor_numero,
                cantidad_numeros: actualizada.cantidad_numeros,
                alias_pago: actualizada.alias_pago,
                whatsapp_organizador: actualizada.whatsapp_organizador,
                fecha_sorteo: actualizada.fecha_sorteo,
              })
              .eq('id', rifa.id);
            await cargarRifa(rifa.slug);
          }}
          numeros={numeros}
          confirmarPago={async (num) => {
            await supabase
              .from('numeros_rifa')
              .update({ estado: 'pagado' })
              .eq('rifa_id', rifa.id)
              .eq('numero', num);
            await cargarRifa(rifa.slug);
          }}
          liberarNumero={async (num) => {
            await supabase
              .from('numeros_rifa')
              .delete()
              .eq('rifa_id', rifa.id)
              .eq('numero', num);
            await cargarRifa(rifa.slug);
          }}
        />
      )}

      {vista === 'sorteo' && (
        <ModuloSorteo
          numeros={numeros}
          premios={rifa.premios}
          tituloRifa={rifa.titulo}
          digitos={digitos}
        />
      )}

      {seleccionado && (
        <aside className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={reservar}
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3"
          >
            <h3 className="text-lg font-bold">
              Reservar número #{seleccionado}
            </h3>
            <input
              type="text"
              required
              placeholder="Tu Nombre y Apellido"
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="tel"
              required
              placeholder="Tu WhatsApp (Ej: 3434123456)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="bg-slate-100 p-3 rounded-lg text-xs flex justify-between items-center">
              <span>
                Alias: <strong>{rifa.alias_pago}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rifa.alias_pago);
                  setCopiado(true);
                }}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold"
              >
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </p>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm"
            >
              Confirmar y avisar por WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="w-full text-xs text-slate-500"
            >
              Cancelar
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
