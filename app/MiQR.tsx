"use client";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MiQR({ url, size = 120 }: { url: string; size?: number }) {
  return <QRCodeSVG value={url} size={size} />;
}
