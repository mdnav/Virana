import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Camera, Upload, Sparkles, Clock, MapPin, ArrowRight, RotateCcw } from "lucide-react";
import { analyzeImage } from "@/lib/api";

const SAMPLES = [
  { name: "Taj Mahal", url: "https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200" },
  { name: "Konark Temple", url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200" },
  { name: "Kathakali", url: "https://images.unsplash.com/photo-1715181751269-2c8325468b73?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200" },
];

async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ b64: r.result.split(",")[1], mime: blob.type });
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function HeritageLens() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null); setResult(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    const b64 = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(",")[1]);
      r.readAsDataURL(file);
    });
    runAnalysis(b64, file.type);
  };

  const runSample = async (s) => {
    setError(null); setResult(null);
    setPreview(s.url);
    setLoading(true);
    try {
      const { b64, mime } = await urlToBase64(s.url);
      runAnalysis(b64, mime);
    } catch (e) {
      setLoading(false); setError("Could not load sample image.");
    }
  };

  const runAnalysis = async (b64, mime) => {
    setLoading(true);
    try {
      const r = await analyzeImage(b64, mime);
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.detail || "Vision analysis failed. Please try another image.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPreview(null); setResult(null); setError(null); };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="lens-page">
      <div className="mb-6">
        <div className="caption flex items-center gap-1"><Camera className="w-3 h-3" /> HeritageLens</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">See a place. Discover its story.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Upload a photo of an Indian monument, temple, dance form or artifact. Virana's visual AI will identify it and open its full cultural profile.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* UPLOAD */}
        <div className="rounded-2xl border border-border bg-card p-6" data-testid="lens-upload">
          {!preview ? (
            <label
              className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:border-gold hover:bg-secondary/40 transition-colors"
              data-testid="lens-dropzone"
            >
              <Upload className="w-8 h-8 text-gold mb-3" />
              <div className="font-display text-xl">Drop an image or click to upload</div>
              <div className="text-xs text-muted-foreground font-mono mt-2">JPEG · PNG · WEBP · max 4MB</div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => handleFile(e.target.files[0])}
                className="hidden"
                data-testid="lens-file-input"
              />
            </label>
          ) : (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full aspect-[4/3] object-cover rounded-xl" data-testid="lens-preview" />
              <button
                onClick={reset}
                className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1 hover:bg-black/80"
                data-testid="lens-reset"
              >
                <RotateCcw className="w-3 h-3" /> New image
              </button>
            </div>
          )}

          <div className="mt-5">
            <div className="caption mb-2">Try a sample</div>
            <div className="flex gap-2">
              {SAMPLES.map(s => (
                <button
                  key={s.name}
                  onClick={() => runSample(s)}
                  data-testid={`sample-${s.name.toLowerCase().replace(/\s/g, "-")}`}
                  className="group relative w-24 h-16 rounded-lg overflow-hidden border border-border hover:border-gold"
                >
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-end p-1.5 text-[10px] text-white font-semibold">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div className="rounded-2xl border border-border bg-card p-6 min-h-96" data-testid="lens-result">
          {!preview && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
              <Sparkles className="w-8 h-8 text-gold mb-3" />
              <div className="font-display text-lg">Awaiting an image</div>
              <div className="text-xs mt-1">The result will appear here</div>
            </div>
          )}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16" data-testid="lens-loading">
              <div className="w-12 h-12 rounded-full gradient-royal flex items-center justify-center animate-pulse mb-4">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="font-display text-lg">Analyzing heritage…</div>
              <div className="text-xs text-muted-foreground mt-1">Consulting Virana's visual archive</div>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500 py-8" data-testid="lens-error">{error}</div>
          )}
          {result && !loading && (
            <div>
              <div className="caption mb-2">Possible Match</div>
              <h2 className="font-display text-3xl font-semibold" data-testid="lens-identified">{result.identified_name}</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gold transition-all" style={{ width: `${result.confidence}%` }} />
                </div>
                <div className="text-sm font-mono text-gold" data-testid="lens-confidence">{result.confidence}%</div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                {result.era && <div className="flex items-start gap-2"><Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" /> <span><strong>Era:</strong> {result.era}</span></div>}
                {result.location && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" /> <span><strong>Location:</strong> {result.location}</span></div>}
                <p className="text-foreground/85 leading-relaxed pt-2">{result.description}</p>
                {result.cultural_significance && (
                  <p className="text-muted-foreground italic border-l-2 border-gold pl-3">{result.cultural_significance}</p>
                )}
              </div>

              {result.possible_matches?.length > 0 && (
                <div className="mt-5">
                  <div className="caption mb-1.5">Other possibilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.possible_matches.map(m => (
                      <span key={m} className="text-xs font-mono bg-secondary/60 border border-border px-2.5 py-1 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.matched_record_id && (
                <Link
                  to={`/heritage/${result.matched_record_id}`}
                  data-testid="lens-open-full"
                  className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Open full heritage story <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
