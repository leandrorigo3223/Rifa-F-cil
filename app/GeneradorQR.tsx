'use client';
import React, { useEffect, useState } from 'react';

export default function GeneradorQR({ texto }: { texto: string }) {
  const [svgQR, setSvgQR] = useState<string>('');

  useEffect(() => {
    // Generamos el QR usando la librería ligera cargada por script estándar
    const scriptId = 'qr-lib-script';
    const generar = () => {
      const QRCode = (
        window as unknown as {
          QRCode?: {
            toString: (
              t: string,
              o: object,
              cb: (e: unknown, s: string) => void
            ) => void;
          };
        }
      ).QRCode;
      if (QRCode) {
        QRCode.toString(
          texto,
          { type: 'svg', margin: 1, width: 130 },
          (_err, svg) => {
            if (svg) setSvgQR(svg);
          }
        );
      }
    };

    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://jsdelivr.net';
      s.onload = generar;
      document.body.appendChild(s);
    } else {
      generar();
    }
  }, [texto]);

  if (!svgQR) {
    return (
      <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-500 text-center p-2">
        Generando QR...
      </div>
    );
  }

  return (
    <div
      className="bg-white p-1 rounded-lg"
      dangerouslySetInnerHTML={{ __html: svgQR }}
    />
  );
}
