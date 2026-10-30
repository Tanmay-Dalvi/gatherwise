import React, { useState } from 'react';
import { X, Printer, Download, FileText, Check, Copy, Share2 } from 'lucide-react';
import { EventPlan } from '../types';
import { api } from '../api/client';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    window.open(api.getMarkdownExportUrl(plan.event.id), '_blank');
  };

  const handleDownloadJSON = () => {
    window.open(api.getJSONExportUrl(plan.event.id), '_blank');
  };

  const handleCopyMarkdown = async () => {
    try {
      const res = await fetch(api.getMarkdownExportUrl(plan.event.id));
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="export-title" className="font-editorial text-xl font-bold text-stone-900">
                Export & Print Celebration Plan
              </h2>
              <p className="text-xs text-stone-500">
                Share with vendors, partners, family, or keep an offline archive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-3">
          {/* Print / Save to PDF */}
          <div
            onClick={handlePrint}
            className="flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Print or Save as PDF</h4>
                <p className="text-xs text-stone-500">
                  Formatted, clean, print-optimized document view.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-200 group-hover:text-amber-900 transition">
              Print
            </span>
          </div>

          {/* Download Markdown */}
          <div
            onClick={handleDownloadMarkdown}
            className="flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Download Markdown (.md)</h4>
                <p className="text-xs text-stone-500">
                  Formatted tables, itemized budget, timeline, and checklist.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-200 group-hover:text-amber-900 transition">
              Download
            </span>
          </div>

          {/* Copy Markdown to clipboard */}
          <div
            onClick={handleCopyMarkdown}
            className="flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  {copied ? 'Copied to Clipboard!' : 'Copy Markdown Text'}
                </h4>
                <p className="text-xs text-stone-500">
                  Paste directly into Notion, Google Docs, or email.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-200 group-hover:text-amber-900 transition">
              {copied ? 'Copied' : 'Copy'}
            </span>
          </div>

          {/* Download JSON Backup */}
          <div
            onClick={handleDownloadJSON}
            className="flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-800 transition">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Download Raw JSON Backup</h4>
                <p className="text-xs text-stone-500">
                  Full data structure for database backup or programmatic use.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-200 group-hover:text-amber-900 transition">
              JSON
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
