"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface QRCodeModalProps {
  url: string;
  username: string;
  onClose: () => void;
}

export function QRCodeModal({ url, username, onClose }: QRCodeModalProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `honest-feedback-${username}-qr.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center gap-4">
        <div className="flex w-full justify-between items-center">
          <h3 className="font-semibold text-foreground">Your QR Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <QRCodeSVG
            ref={svgRef}
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="M"
            includeMargin={false}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center break-all">{url}</p>

        <Button onClick={handleDownload} className="w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download SVG
        </Button>
      </div>
    </div>
  );
}
