import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import type { Document } from '../types/document';
import type { Verification } from '../types/verification';
import Navbar from '../components/Navbar';
import VerificationDetails from '../components/VerificationDetails';
import { DOCUMENT_STATUS_COLORS } from '../utils/statusStyles';

function AnalysisModal({
  verification,
  onClose,
}: {
  verification: Verification;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">AI Verification Result</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-5">
          <VerificationDetails verification={verification} />
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Verification | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await documentService.getAll();
      setDocuments(res.data.documents);
    } catch {
      setError('Failed to load documents.');
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
    <div className="min-h-screen bg-gray-50">
      {analysisResult && (
        <AnalysisModal
          verification={analysisResult}
          onClose={() => setAnalysisResult(null)}
        />
      )}
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Documents</h2>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Upload Document
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-4">{error}</p>}

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
                <Link to={`/documents/${doc._id}`} className="min-w-0 group">
                  <p className="font-medium text-gray-800 truncate group-hover:text-blue-600">
                    {doc.originalName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      DOCUMENT_STATUS_COLORS[doc.status] ?? 'bg-gray-100 text-gray-600'
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
