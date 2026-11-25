import React, { useState } from 'react';
import MiQR from './MiQR';

export interface InfoNumero {
  id?: string;
  estado: 'libre' | 'reservado' | 'pagado';
  comprador: string;
  telefono: string;
}

export interface Premio {
  puesto: string;
  descripcion: string;
  foto?: string;
}

export interface GanadorGuardado {
  puesto: string;
  premio: string;
  numero: string;
  comprador: string;
  telefono: string;
}

export interface DatosRifa {
  id?: string;
  slug: string;
  clave_admin: string;
  titulo: string;
  descripcion: string;
  premios: Premio[];
  ganadores?: GanadorGuardado[];
  valor_numero: number;
  cantidad_numeros: number;
  alias_pago: string;
  whatsapp_organizador: string;
  fecha_sorteo: string;
}

interface Props {
  rifa: DatosRifa;
  guardarCambiosRifa: (r: DatosRifa) => Promise<void>;
  numeros: Record<string, InfoNumero>;
  confirmarPago: (num: string) => Promise<void>;
  liberarNumero: (num: string) => Promise<void>;
}

export default function PanelAdmin({ rifa, guardarCambiosRifa, numeros, confirmarPago, liberarNumero }: Props) {
  const [form, setForm] = useState<DatosRifa>(rifa);
  const [guardando, setGuardando] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const vendidos = Object.values(numeros).filter(n => n.estado === 'pagado').length;
  const reservados = Object.values(numeros).filter(n => n.estado === 'reservado').length;
  const recaudado = vendidos * form.valor_numero;

  const urlPublica = typeof window !== 'undefined'
    ? `${window.location.origin}/?r=${rifa.slug}`
    : `https://rifafacil.app{rifa.slug}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(urlPublica);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2500);
  };

  const agregarPremio = () => {
    setForm({ ...form, premios: [...form.premios, { puesto: `${form.premios.length + 1}° Premio`, descripcion: "" }] });
  };

  const quitarPremio = (idx: number) => {
    if (form.premios.length <= 1) return;
    setForm({ ...form, premios: form.premios.filter((_, i) => i !== idx) });
  };

  const editarPremio = (idx: number, campo: keyof Premio, valor: string) => {
    const copia = [...form.premios];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setForm({ ...form, premios: copia });
  };

  const subirFoto = (idx: number, archivo?: File) => {
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => editarPremio(idx, 'foto', lector.result as string);
    lector.readAsDataURL(archivo);
  };


  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await guardarCambiosRifa(form);
    setGuardando(false);
    alert("¡Cambios guardados!");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
      <div id="cartel-qr-imprimible" className="hidden">
        <h1 className="text-4xl font-black text-slate-900 mb-6 max-w-xl">{form.titulo}</h1>
        <div className="p-6 border-4 border-slate-900 rounded-3xl bg-white">
          <MiQR url={urlPublica} size={320} />
        </div>
        <p className="mt-6 text-lg font-bold text-slate-700">Escaneá el código con tu celular para elegir tu número</p>
        <p className="mt-2 text-base font-mono text-slate-600 break-all">{urlPublica}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-xs text-slate-500 block">Recaudado</span>
          <span className="text-xl font-extrabold text-emerald-600">${recaudado}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-xs text-slate-500 block">Vendidos</span>
          <span className="text-xl font-extrabold">{vendidos} / {form.cantidad_numeros}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <span className="text-xs text-slate-500 block">Reservados</span>
          <span className="text-xl font-extrabold text-amber-500">{reservados}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="font-bold text-lg text-slate-900">📲 Compartir e Imprimir Cartel QR</h2>
          <p className="text-xs text-slate-600">Imprimí el cartel limpio con el título, QR grande y enlace para kioscos o clubes.</p>
          <p className="text-[11px] font-mono bg-slate-100 px-2.5 py-1 rounded break-all">{urlPublica}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            <button type="button" onClick={() => window.print()} className="bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg">🖨️ Imprimir Cartel QR</button>
            <button type="button" onClick={copiarLink} className="bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-lg">{linkCopiado ? "✓ Copiado" : "🔗 Copiar Link"}</button>
          </div>
        </div>
        <div className="p-2 bg-white border-2 border-slate-300 rounded-xl shrink-0">
          <MiQR url={urlPublica} size={115} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border shadow-sm">
        <h2 className="font-bold text-lg mb-3">📋 Control de Números</h2>
        {Object.keys(numeros).length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay números reservados ni vendidos.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {Object.entries(numeros).sort().map(([num, info]) => (
              <li key={num} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border mr-2">#{num}</span>
                  <span className="font-semibold text-sm">{info.comprador}</span>
                  <span className="text-xs text-slate-500 ml-2">📞 {info.telefono}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${info.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {info.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {info.estado === 'reservado' && (
                    <button onClick={() => confirmarPago(num)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">✓ Confirmar</button>
                  )}
                  <button onClick={() => liberarNumero(num)} className="bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg">Liberar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleGuardar} className="bg-white p-5 rounded-xl border shadow-sm space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">🏆 Premios ({form.premios.length})</h2>
          <button type="button" onClick={agregarPremio} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Agregar</button>
        </div>

        <div className="space-y-3">
          {form.premios.map((p, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border space-y-2">
              <div className="flex gap-2">
                <input type="text" value={p.puesto} onChange={e => editarPremio(idx, 'puesto', e.target.value)} className="font-bold border rounded-lg px-2.5 py-1.5 w-28 bg-white" />
                <input type="text" placeholder="Descripción" value={p.descripcion} onChange={e => editarPremio(idx, 'descripcion', e.target.value)} className="flex-1 border rounded-lg px-2.5 py-1.5 bg-white" />
                {form.premios.length > 1 && <button type="button" onClick={() => quitarPremio(idx)} className="text-rose-600 font-bold px-2">✕</button>}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs bg-white border px-3 py-1.5 rounded-lg cursor-pointer font-medium">
                  📷 {p.foto ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" onChange={e => subirFoto(idx, e.target.files?.item(0) ?? undefined)} className="hidden" />
                </label>
                {p.foto && <img src={p.foto} alt={p.puesto} className="h-12 w-12 object-cover rounded-lg border" />}
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-bold text-lg pt-2">⚙️ Datos Generales</h2>
        <input type="text" required placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        <textarea rows={2} placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">Valor ($)</label>
            <input type="number" required value={form.valor_numero} onChange={e => setForm({ ...form, valor_numero: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Cantidad de números</label>
            <select value={form.cantidad_numeros} onChange={e => setForm({ ...form, cantidad_numeros: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 bg-white">
              <option value={100}>100 números</option>
              <option value={500}>500 números</option>
              <option value={1000}>1000 números</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Alias / CBU</label>
            <input type="text" required value={form.alias_pago} onChange={e => setForm({ ...form, alias_pago: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-slate-500">WhatsApp (549...)</label>
            <input type="text" required value={form.whatsapp_organizador} onChange={e => setForm({ ...form, whatsapp_organizador: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500">📅 Fecha y Hora del Sorteo Automático</label>
            <input type="datetime-local" required value={form.fecha_sorteo} onChange={e => setForm({ ...form, fecha_sorteo: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <button type="submit" disabled={guardando} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow">
          {guardando ? "Guardando..." : "💾 Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
