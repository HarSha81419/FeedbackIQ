import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Cloud, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUploadCsv } from '@/hooks/useFeedback';
import { useToast } from '@/components/ui/Toast';

interface HistoryEntry {
  id: string;
  filename: string;
  time: string;
  rows: number;
  status: 'success' | 'error' | 'processing';
}

export function UploadDropzone() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem('upload_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const upload = useUploadCsv();
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem('upload_history', JSON.stringify(history));
  }, [history]);

  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    const f = ev.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onInput = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const validate = useCallback((f: File) => {
    // Basic CSV validation
    return f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv');
  }, []);

  const doUpload = useCallback(async () => {
    if (!file) return;
    if (!validate(file)) {
      toast.push({ kind: 'error', title: 'Invalid file', description: 'Please upload a CSV file.' });
      return;
    }

    const entryId = `${Date.now()}-${file.name}`;
    setHistory((s) => [{ id: entryId, filename: file.name, time: new Date().toISOString(), rows: 0, status: 'processing' }, ...s]);
    setProgress(0);
    try {
      const result = await upload.mutateAsync(file as File);
      // result should be { imported, ids }
      const rows = (result as any)?.imported ?? 0;
      setHistory((s) => s.map((h) => (h.id === entryId ? { ...h, rows, status: 'success' } : h)));
      toast.push({ kind: 'success', title: 'Upload complete', description: `${rows} rows imported` });
    } catch (err: any) {
      setHistory((s) => s.map((h) => (h.id === entryId ? { ...h, status: 'error' } : h)));
      toast.push({ kind: 'error', title: 'Upload failed', description: err?.message ?? 'Server error' });
    } finally {
      setProgress(100);
      setFile(null);
    }
  }, [file, validate, upload, toast]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${dragOver ? 'bg-white/3 border-accent-cyan/30' : 'bg-surface-elevated/40 border-border'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/5">
            <Cloud className="h-6 w-6 text-accent-cyan" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Upload CSV</p>
            <p className="text-xs text-slate-400">Drag & drop or choose a CSV file to import feedback</p>
            <p className="text-xs text-slate-500 mt-2">Required columns: <span className="font-medium">customer_id, feedback, source, timestamp</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onInput} />
          <Button variant="secondary" size="sm" onClick={onPick}>
            Choose file
          </Button>
          <Button variant="primary" size="sm" onClick={doUpload} isLoading={(upload as any).isLoading} disabled={!file}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      {file && (
        <div className="rounded-lg p-3 bg-surface-elevated/30 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-400">{Math.round(file.size / 1024)} KB</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFile(null)} className="p-2 rounded-md hover:bg-white/5">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4">
          <h4 className="text-sm font-medium text-slate-100">CSV Format</h4>
          <p className="text-xs text-slate-400 mt-2">Required columns: <span className="font-medium">customer_id, feedback, source, timestamp</span></p>
          <p className="text-xs text-slate-400 mt-1">Optional: <span className="font-medium">rating, category</span></p>
          <a
            href={"data:text/csv;charset=utf-8," + encodeURIComponent('customer_id,feedback,source,timestamp,category')}
            download="sample-feedback.csv"
            className="inline-flex items-center gap-2 mt-3 text-xs text-accent-cyan hover:underline"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7l4-4 4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Download sample CSV
          </a>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h4 className="text-sm font-medium text-slate-100">Upload history</h4>
          <div className="mt-3 space-y-2 max-h-40 overflow-auto">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No uploads yet.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-200">{h.filename}</p>
                    <p className="text-xs text-slate-500">{new Date(h.time).toLocaleString()} • {h.rows} rows</p>
                  </div>
                  <div className={`text-xs font-medium ${h.status === 'success' ? 'text-emerald-400' : h.status === 'error' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {h.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
