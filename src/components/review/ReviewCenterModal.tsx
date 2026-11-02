"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  FileText,
  Quote,
} from "lucide-react";
import { MemoryCandidateRecord } from "@/lib/memory-engine/types";

interface ReviewCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewCenterModal({ isOpen, onClose }: ReviewCenterModalProps) {
  const [candidates, setCandidates] = useState<MemoryCandidateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/memories/candidates?status=pending");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (e) {
      console.warn("Failed to fetch candidates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen]);

  const handleApprove = async (candidateId: string) => {
    setActingId(candidateId);
    try {
      const res = await fetch(`/api/v1/reviews/${candidateId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changed_by: "user_review" }),
      });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
        setMessage("Candidate memory approved and active!");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error("Approve failed:", e);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (candidateId: string) => {
    setActingId(candidateId);
    try {
      const res = await fetch(`/api/v1/reviews/${candidateId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected in user review center" }),
      });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
        setMessage("Candidate memory rejected.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error("Reject failed:", e);
    } finally {
      setActingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[var(--canvas-paper)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-paper)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-insight)]/10 text-[var(--color-insight)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--ink-primary)]">
                Memory Governance & Review Center
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Evidence-backed memory candidates awaiting human-in-the-loop approval
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCandidates}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-[var(--border-subtle)] text-[var(--ink-secondary)] transition-colors"
              title="Refresh candidates"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[var(--border-subtle)] text-[var(--ink-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {message && (
          <div className="px-6 py-2 bg-emerald-500/10 text-emerald-600 text-xs font-mono flex items-center gap-2 border-b border-emerald-500/20">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && candidates.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--ink-secondary)]">
              Loading candidates...
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
              <Sparkles className="w-8 h-8 text-amber-500/60" />
              <p className="text-sm font-medium text-[var(--ink-primary)]">
                All candidates reviewed!
              </p>
              <p className="text-xs text-[var(--ink-secondary)] max-w-sm text-center">
                Your memory vault is up to date. Newly captured events from Web, Feishu, or Agents will appear here if arbitration is required.
              </p>
            </div>
          ) : (
            candidates.map((cand) => (
              <div
                key={cand.candidate_id}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-paper)] hover:border-[var(--color-insight)]/40 transition-all space-y-3"
              >
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[var(--color-insight)] text-white font-semibold">
                      {cand.memory_type}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                      Op: {cand.operation}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--ink-secondary)]">
                      Conf: {(cand.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-secondary)] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(cand.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Candidate Content */}
                <p className="text-sm font-medium text-[var(--ink-primary)] leading-relaxed">
                  {cand.content}
                </p>

                {/* Evidence Quote */}
                {cand.evidence && cand.evidence.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[var(--canvas-paper)] border border-[var(--border-subtle)] text-xs text-[var(--ink-secondary)] flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-[var(--color-insight)] shrink-0 mt-0.5" />
                    <div className="italic">
                      &ldquo;{cand.evidence[0].quote}&rdquo;
                      <span className="not-italic block mt-1 text-[10px] text-[var(--ink-secondary)] opacity-75 font-mono">
                        Source Event: {cand.evidence[0].event_id}
                      </span>
                    </div>
                  </div>
                )}

                {/* Review Reason */}
                {cand.review_reason && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{cand.review_reason}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]/60">
                  <button
                    onClick={() => handleReject(cand.candidate_id)}
                    disabled={actingId === cand.candidate_id}
                    className="px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-500/10 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(cand.candidate_id)}
                    disabled={actingId === cand.candidate_id}
                    className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve & Commit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
