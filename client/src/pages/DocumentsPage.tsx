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
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                VERIFY_COLORS[verification.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {verification.status}
            </span>
            <span className="text-sm text-gray-500">
              Confidence: <span className="font-medium text-gray-700">{verification.confidence}%</span>
            </span>
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

          {/* Issues */}
          {verification.issues && verification.issues.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Issues
              </p>
              <ul className="space-y-1">
                {verification.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                    <span className="shrink-0">⚠</span>
                    {issue}
                  </li>
                ))}
              </ul>
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
