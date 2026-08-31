import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { fetchHeritage } from "@/lib/api";
import HeritageCard from "@/components/HeritageCard";

export default function HeritageAtRisk() {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    fetchHeritage({ preservation: "AT_RISK", limit: 100 }).then(d => setRecords(d.records || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="at-risk-page">
      <div className="mb-8">
        <div className="caption text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Heritage at Risk</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">The vanishing archive.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Every entry here is a living tradition, language or craft that is quietly disappearing. Their preservation begins with being remembered.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.map(r => <HeritageCard key={r.id} record={r} testIdPrefix="at-risk-card" />)}
      </div>
      {records.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">Loading endangered heritage…</div>
      )}
    </div>
  );
}
