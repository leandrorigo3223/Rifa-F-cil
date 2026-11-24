'use client';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MiQR({ url }: { url: string }) {
  return <QRCodeSVG value={url} size={115} />;
}
