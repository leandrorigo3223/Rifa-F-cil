import React, { useState } from 'react';
import { supabase } from './supabase';

export default function CrearRifa({ alCrear }: { alCrear: (slug: string) => void }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [premio1, setPremio1] = useState("");
  const [valor, setValor] = useState(2000);
  const [cantidad, setCantidad] = useState(100);
  const [alias, setAlias] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fecha, setFecha] = useState("");
  const [clave, setClave] = useState("");
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceptoTerminos) return setErrorMsg("Debés aceptar los términos y condiciones.");
    setCreando(true);
    setErrorMsg(null);

    const baseSlug = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 25);
    const slug = `${baseSlug || 'rifa'}-${Math.floor(100 + Math.random() * 900)}`;

    const { error } = await supabase.from('rifas').insert({
      slug,
      clave_admin: clave.trim(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      premios: [{ puesto: "1° Premio", descripcion: premio1.trim() }],
      valor_numero: valor,
      cantidad_numeros: cantidad,
      alias_pago: alias.trim(),
      whatsapp_organizador: whatsapp.replace(/\D/g, ''),
      fecha_sorteo: fecha
    });

    setCreando(false);
    if (error) {
      setErrorMsg(`${error.message}`);
      return;
    }
    alCrear(slug);
  };

  return (
    <main className="max-w-lg mx-auto px-4 mt-8">
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="text-center">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">100% Gratis</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">🎟️ Creá tu Rifa Online</h1>
          <p className="text-xs text-slate-500 mt-1">Armá tu talonario digital y programá el sorteo automático.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={crear} className="space-y-3 text-sm">
          <input type="text" required placeholder="Título (Ej: Rifa Club Atlético Paraná)" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <textarea rows={2} placeholder="¿Para qué recaudan fondos?" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <input type="text" required placeholder="1° Premio (luego podés sumar más y subir fotos)" value={premio1} onChange={e => setPremio1(e.target.value)} className="w-full border rounded-lg px-3 py-2" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Valor del número ($)</label>
              <input type="number" required value={valor} onChange={e => setValor(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Cantidad de números</label>
              <select value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 bg-white">
                <option value={100}>100 (00 al 99)</option>
                <option value={500}>500 (000 al 499)</option>
                <option value={1000}>1000 (000 al 999)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">📅 Fecha y Hora del Sorteo Automático</label>
            <input type="datetime-local" required value={fecha} onChange={e => setFecha(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>

          <input type="text" required placeholder="Alias o CBU para recibir transferencias" value={alias} onChange={e => setAlias(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <input type="tel" required placeholder="Tu WhatsApp (Ej: 5493434123456)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full border rounded-lg px-3 py-2" />

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <label className="text-xs font-bold text-amber-900 block mb-1">🔑 Clave secreta de organizador</label>
            <input type="text" required placeholder="Inventá una clave para administrar" value={clave} onChange={e => setClave(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input type="checkbox" required checked={aceptoTerminos} onChange={e => setAceptoTerminos(e.target.checked)} className="mt-0.5" />
            <span>Declaro ser responsable exclusivo de la organización, cobro y entrega de premios, desligando a la plataforma de toda responsabilidad legal o económica.</span>
          </label>

          <button type="submit" disabled={creando} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow">
            {creando ? "Creando talonario..." : "🚀 Publicar Rifa Ahora"}
          </button>
        </form>
      </div>
    </main>
  );
}
