import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import type { Document } from '../types/document';
import type { Verification } from '../types/verification';
import { useAuth } from '../hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const VERIFY_COLORS: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  uncertain: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

const QUALITY_COLORS: Record<string, string> = {
  Good: 'text-green-600',
  Fair: 'text-yellow-600',
  Poor: 'text-red-600',
};

function confidenceBarColor(confidence: number): string {
  if (confidence >= 70) return 'bg-green-500';
  if (confidence >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function severityLabel(severity: number): string {
  if (severity >= 0.7) return 'HIGH';
  if (severity >= 0.4) return 'MED';
  return 'LOW';
}

function severityBadge(severity: number): string {
  if (severity >= 0.7) return 'bg-red-100 text-red-700';
  if (severity >= 0.4) return 'bg-orange-100 text-orange-700';
  return 'bg-yellow-100 text-yellow-700';
}

const RULE_SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-yellow-100 text-yellow-700',
};

const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  passed: 'bg-green-100 text-green-700',
  flagged: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  required_field: 'Required field',
  field_format: 'Format',
  consistency: 'Consistency',
  duplicate: 'Duplicate',
};

function AnalysisModal({
  verification,
  onClose,
}: {
  verification: Verification;
  onClose: () => void;
}) {
  const [showOcr, setShowOcr] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">AI Verification Result</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {/* Status + confidence */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                  VERIFY_COLORS[verification.status] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {verification.status}
              </span>
              <span className="text-sm text-gray-500">
                Confidence:{' '}
                <span className="font-medium text-gray-700">{verification.confidence}%</span>
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${confidenceBarColor(
                  verification.confidence
                )}`}
                style={{ width: `${Math.min(100, Math.max(0, verification.confidence))}%` }}
              />
            </div>
          </div>

          {/* Document type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Document Type
            </p>
            <p className="text-sm text-gray-700 capitalize font-medium">
              {verification.documentType?.replace(/_/g, ' ') || 'Unknown'}
            </p>
          </div>

          {/* AI Analysis */}
          {verification.aiAnalysis && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                AI Analysis
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Quality</p>
                  <p
                    className={`text-sm font-semibold ${
                      QUALITY_COLORS[verification.aiAnalysis.documentQuality] ?? 'text-gray-600'
                    }`}
                  >
                    {verification.aiAnalysis.documentQuality}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Tampering</p>
                  <p
                    className={`text-sm font-semibold ${
                      verification.aiAnalysis.tamperingDetected
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {verification.aiAnalysis.tamperingDetected ? 'Detected' : 'None'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    risk {Math.round((verification.aiAnalysis.riskScore ?? 0) * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Consistency</p>
                  <p
                    className={`text-sm font-semibold ${
                      verification.aiAnalysis.dataConsistency ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {verification.aiAnalysis.dataConsistency ? 'OK' : 'Issues'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extracted fields */}
          {verification.extractedData &&
            Object.keys(verification.extractedData).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Extracted Fields
                </p>
                <div className="space-y-1.5">
                  {Object.entries(verification.extractedData).map(([key, value]) => (
                    <div key={key} className="flex gap-3 text-sm">
                      <span className="text-gray-400 w-36 shrink-0 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-gray-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Anomalies */}
          {verification.aiAnalysis?.anomalies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Anomalies Detected
              </p>
              <ul className="space-y-1.5">
                {verification.aiAnalysis.anomalies.map((anomaly) => (
                  <li
                    key={anomaly.code + anomaly.message}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${severityBadge(
                        anomaly.severity
                      )}`}
                    >
                      {severityLabel(anomaly.severity)}
                    </span>
                    <span className="text-gray-700">{anomaly.message}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Anomalies are indicators for review, not proof of forgery.
              </p>
            </div>
          )}

          {/* Verification Report */}
          {verification.verificationReport && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Verification Report
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      VERIFICATION_STATUS_COLORS[verification.verificationReport.verificationStatus] ??
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {verification.verificationReport.verificationStatus}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {verification.verificationReport.passedChecks}/
                    {verification.verificationReport.totalChecks} checks passed
                  </span>
                </div>
              </div>
              {verification.verificationReport.findings.length === 0 ? (
                <p className="text-sm text-green-600">All verification rules passed.</p>
              ) : (
                <ul className="space-y-1.5">
                  {verification.verificationReport.findings.map((finding, i) => (
                    <li key={finding.code + i} className="flex items-start gap-2 text-sm">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                          RULE_SEVERITY_BADGE[finding.severity] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-gray-700">
                        <span className="text-gray-400">
                          [{CATEGORY_LABELS[finding.category] ?? finding.category}]{' '}
                        </span>
                        {finding.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Raw OCR text (collapsible) */}
          <div>
            <button
              onClick={() => setShowOcr((p) => !p)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showOcr ? 'Hide' : 'Show'} raw OCR text ({verification.charCount.toLocaleString()} chars)
            </button>
            {showOcr && (
              <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 max-h-44 overflow-auto">
                {verification.ocrText || 'No text extracted.'}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Verification | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await documentService.getAll();
      setDocuments(res.data.documents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    setDeletingId(id);
    try {
      await documentService.delete(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyse = async (id: string) => {
    setProcessingId(id);
    setDocuments((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: 'processing' } : d))
    );
    try {
      const res = await verificationService.verify(id);
      setAnalysisResult(res.data.verification);
      setDocuments((prev) =>
        prev.map((d) =>
          d._id === id
            ? {
                ...d,
                status:
                  res.data.verification.status === 'failed' ? 'failed' : 'verified',
              }
            : d
        )
      );
    } catch {
      setDocuments((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: 'failed' } : d))
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {analysisResult && (
        <AnalysisModal
          verification={analysisResult}
          onClose={() => setAnalysisResult(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">DocTrust AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Documents</h2>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Upload Document
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            <p>No documents yet.</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Upload your first document →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      STATUS_COLORS[doc.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <button
                    onClick={() => handleAnalyse(doc._id)}
                    disabled={
                      processingId === doc._id || doc.status === 'processing'
                    }
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-lg transition disabled:opacity-40"
                  >
                    {processingId === doc._id ? 'Analysing…' : 'Analyse'}
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    disabled={deletingId === doc._id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
