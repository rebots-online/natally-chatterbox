import React, { useState } from 'react';
import { Download, Share2, X, Check, Copy, FileText, Image, FileImage, Sparkles, BookOpen } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { NatalChartResult } from '../services/ephemeris';
import { generateComprehensiveNatalReading } from '../services/comprehensiveReading';

interface ExportModalProps {
  chart: NatalChartResult;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ chart, onClose }) => {
  const [version, setVersion] = useState<'short' | 'thorough' | 'exhaustive'>('exhaustive');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const shareUrl = `https://natally.robin.mba/?chart=${encodeURIComponent(chart.input.name)}`;
  const shareText = `Explore ${chart.input.name}'s Natal Astrolabe 3D chart: ${chart.sunFormatted} · ${chart.ascFormatted} · ${chart.moonFormatted} | Cast on Swiss Ephemeris engine at https://natally.robin.mba/`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const reading = generateComprehensiveNatalReading(chart);
    const blob = new Blob([reading.fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chart.input.name.replace(/\s+/g, '_')}_comprehensive_natal_reading.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvasEl) {
        const link = document.createElement('a');
        link.download = `${chart.input.name.replace(/\s+/g, '_')}_natal_astrolabe.png`;
        link.href = canvasEl.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    setIsExporting(true);
    try {
      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvasEl) {
        const link = document.createElement('a');
        link.download = `${chart.input.name.replace(/\s+/g, '_')}_natal_astrolabe.jpg`;
        link.href = canvasEl.toDataURL('image/jpeg', 0.95);
        link.click();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const reading = generateComprehensiveNatalReading(chart);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const setupPageBackground = (pageNum: number, totalPages: number) => {
        doc.setFillColor(18, 12, 28);
        doc.rect(0, 0, 210, 297, 'F');

        // Header rule & micro branding
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(212, 175, 55);
        doc.text(`ASTROSPHERE 3D · COMPREHENSIVE NATAL TRANSMISSION · ${chart.input.name.toUpperCase()}`, 20, 12);

        // Footer rule & copyright
        doc.setFontSize(7.5);
        doc.setTextColor(169, 157, 174);
        doc.text(
          `Copyright (C)2026 Robin L. M. Cheung, MBA · Natally AI Companion · Page ${pageNum} of ${totalPages}`,
          20,
          288
        );
      };

      // PAGE 1: COVER & ASTROLABE WHEEL
      setupPageBackground(1, 5);

      doc.setTextColor(242, 202, 80);
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text('NATAL ASTROLABE 3D', 20, 26);

      doc.setFont('courier', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(212, 175, 55);
      doc.text('Swiss Ephemeris Geocentric Engine · Epoch 2000.0 · Placidus 12 Houses', 20, 33);

      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(241, 232, 216);
      doc.text(`Native: ${chart.input.name}`, 20, 44);

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(210, 200, 220);
      doc.text(
        `Born: ${chart.input.birthDate} at ${chart.input.birthTime} · Location: ${chart.input.placeName}`,
        20,
        51
      );
      doc.text(
        `Coordinates: ${Math.abs(chart.input.latitude).toFixed(2)}°N, ${Math.abs(chart.input.longitude).toFixed(2)}°E · UTC${chart.input.timezoneOffset >= 0 ? `+${chart.input.timezoneOffset}` : chart.input.timezoneOffset}h`,
        20,
        57
      );

      // Core Trinity Bar (Clean text, no garbled unicode)
      doc.setFillColor(36, 24, 56);
      doc.roundedRect(20, 64, 170, 20, 2.5, 2.5, 'F');
      doc.setTextColor(242, 202, 80);
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text(
        `ASC: ${chart.ascFormatted.replace('AC: ', '')}    |    MC: ${chart.mcFormatted.replace('MC: ', '')}`,
        25,
        72
      );
      doc.setTextColor(255, 255, 255);
      doc.setFont('times', 'normal');
      doc.text(
        `Sun: ${chart.sunFormatted.replace('Sun: ', '')}    |    Moon: ${chart.moonFormatted.replace('Moon: ', '')}`,
        25,
        80
      );

      // 3D Astrolabe Canvas snapshot
      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvasEl) {
        const imgData = canvasEl.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 32, 88, 146, 98);
      }

      // Executive Planetary Coordinates Box
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.text('Verified Planetary Coordinates:', 20, 194);

      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(230, 225, 235);
      const half = Math.ceil(chart.natalBodies.length / 2);
      chart.natalBodies.slice(0, half).forEach((b, i) => {
        doc.text(`${b.name.padEnd(9, ' ')}: ${b.fullDegText} (H${b.house})`, 20, 202 + i * 5.5);
      });
      chart.natalBodies.slice(half).forEach((b, i) => {
        doc.text(`${b.name.padEnd(9, ' ')}: ${b.fullDegText} (H${b.house})`, 110, 202 + i * 5.5);
      });

      // Quick aspect overview
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.text('Primary Dynamic Aspect Chords:', 20, 242);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(210, 205, 220);
      chart.aspectChords.slice(0, 5).forEach((a, i) => {
        doc.text(`• ${a.name} (Orb ${a.orb.toFixed(1)}°) — ${a.type}`, 20, 249 + i * 5);
      });

      // PAGE 2: CHAPTER I (THE SOUL'S ARCHITECTURE) & CHAPTER II (LIFE PATH)
      doc.addPage();
      setupPageBackground(2, 5);

      let curY = 24;
      const renderSectionHeading = (title: string, subtitle: string) => {
        doc.setTextColor(242, 202, 80);
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.text(title, 20, curY);
        curY += 6;
        doc.setTextColor(212, 175, 55);
        doc.setFont('times', 'italic');
        doc.setFontSize(9.5);
        doc.text(subtitle, 20, curY);
        curY += 8;
      };

      const renderParagraph = (text: string, fontSize = 9, fontColor = [235, 230, 240]) => {
        doc.setFont('times', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(fontColor[0], fontColor[1], fontColor[2]);
        const clean = text
          .replace(/[#*`_]/g, '')
          .replace(/•/g, '-')
          .trim();
        const lines = doc.splitTextToSize(clean, 170);
        doc.text(lines, 20, curY);
        curY += lines.length * (fontSize * 0.42) + 4;
      };

      renderSectionHeading(reading.sections[0].title, reading.sections[0].subtitle);
      renderParagraph(reading.sections[0].content, 9);

      curY += 4;
      renderSectionHeading(reading.sections[1].title, reading.sections[1].subtitle);
      renderParagraph(reading.sections[1].content, 9);

      // PAGE 3: CHAPTER III (THE PLANETARY ASSEMBLY - PLANET BY PLANET ANALYSIS)
      doc.addPage();
      setupPageBackground(3, 5);
      curY = 24;

      renderSectionHeading(reading.sections[2].title, reading.sections[2].subtitle);
      renderParagraph(reading.sections[2].content, 8.5);

      // PAGE 4: CHAPTER IV (DYNAMIC ASPECTS) & CHAPTER V (TIMINGS)
      doc.addPage();
      setupPageBackground(4, 5);
      curY = 24;

      renderSectionHeading(reading.sections[3].title, reading.sections[3].subtitle);
      renderParagraph(reading.sections[3].content, 8.5);

      curY += 4;
      renderSectionHeading(reading.sections[4].title, reading.sections[4].subtitle);
      renderParagraph(reading.sections[4].content, 8.5);

      // PAGE 5: CHAPTER VI (NATALLY'S PERSONAL TRANSMISSION & OVERHARE)
      doc.addPage();
      setupPageBackground(5, 5);
      curY = 24;

      renderSectionHeading(reading.sections[5].title, reading.sections[5].subtitle);
      renderParagraph(reading.sections[5].content, 9, [255, 245, 220]);

      doc.save(`${chart.input.name.replace(/\s+/g, '_')}_comprehensive_natal_reading_${version}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async (platform?: string) => {
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: `Natal Astrolabe 3D: ${chart.input.name}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }

    // Direct social web intents
    let target = '';
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'whatsapp':
        target = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'facebook':
        target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'email':
        target = `mailto:?subject=${encodeURIComponent(`Natal Chart: ${chart.input.name}`)}&body=${encodedText}`;
        break;
      case 'mms':
        target = `sms:?&body=${encodedText}`;
        break;
      default:
        handleCopyLink();
        return;
    }

    window.open(target, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="celestial-panel w-full max-w-lg rounded-2xl p-5 border border-[#d4af37]/40 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#322641] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-cinzel text-sm text-[#f2ca50] font-bold tracking-wider uppercase">
              Export Comprehensive Reading &amp; Chart
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#271c36] text-[#a99dae] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reading Scope Selector */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-[#a99dae]">Report Depth:</label>
          <div className="grid grid-cols-3 gap-2">
            {(['short', 'thorough', 'exhaustive'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersion(v)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  version === v
                    ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50] shadow-sm font-bold'
                    : 'bg-[#1a1224] border-[#322641] text-[#a99dae] hover:border-[#d4af37]/40 hover:text-white'
                }`}
              >
                {v === 'exhaustive' ? 'Exhaustive (5-Page)' : v}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-mono text-[#d4af37]/80">
            {version === 'exhaustive'
              ? '✨ Full 5-Page Deluxe Edition with all in-depth chapters, archetypal analysis, aspect synthesis, and Natally’s personal oracle transmission!'
              : version === 'thorough'
              ? 'Multi-page comprehensive reading with planetary breakdown and key aspects.'
              : 'Concise summary report with astrolabe chart and core planetary coordinates.'}
          </p>
        </div>

        {/* Download Actions */}
        <div className="space-y-2">
          <label className="block font-mono text-xs text-[#a99dae]">Export Documents &amp; Images:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#f2a38c] text-[#120c1c] font-cinzel font-bold text-xs tracking-wider uppercase transition-all hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Full Deluxe PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="py-2.5 px-3 rounded-xl bg-[#241738] hover:bg-[#342452] border border-[#d4af37]/50 text-[#f2ca50] font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Download entire in-depth psychic reading as Markdown document"
            >
              <BookOpen className="w-4 h-4" />
              <span>Download (.md)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportPNG}
              disabled={isExporting}
              className="py-2 px-3 rounded-xl bg-[#1c1428] hover:bg-[#271c36] border border-white/10 text-white/90 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Image className="w-3.5 h-3.5 text-[#9fb4ff]" />
              <span>3D Wheel (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handleExportJPG}
              disabled={isExporting}
              className="py-2 px-3 rounded-xl bg-[#1c1428] hover:bg-[#271c36] border border-white/10 text-white/90 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileImage className="w-3.5 h-3.5 text-[#f2a38c]" />
              <span>3D Wheel (JPG)</span>
            </button>
          </div>
        </div>

        {/* Share Section */}
        <div className="pt-2 border-t border-[#322641] space-y-2">
          <label className="block font-mono text-xs text-[#a99dae]">Direct Share &amp; Copy:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleNativeShare()}
              className="py-2 px-2.5 rounded-xl bg-[#231538] hover:bg-[#321e50] border border-[#d4af37]/30 text-white/90 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3 h-3 text-[#f2ca50]" />
              <span>Native</span>
            </button>

            <button
              type="button"
              onClick={() => handleNativeShare('whatsapp')}
              className="py-2 px-2.5 rounded-xl bg-[#231538] hover:bg-[#321e50] border border-[#d4af37]/30 text-white/90 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="text-emerald-400 font-bold">WA</span>
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-2.5 rounded-xl bg-[#231538] hover:bg-[#321e50] border border-[#d4af37]/30 text-white/90 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#f2ca50]" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-2.5 rounded-xl bg-[#231538] hover:bg-[#321e50] border border-[#d4af37]/30 text-white/90 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3 text-[#f2ca50]" />}
              <span>{copiedText ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

