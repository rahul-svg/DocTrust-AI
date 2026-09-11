import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import type { Document } from '../types/document';
import type { Verification } from '../types/verification';
import Navbar from '../components/Navbar';
import { DOCUMENT_STATUS_COLORS, VERIFICATION_STATUS_COLORS } from '../utils/statusStyles';

function belongsToDocument(v: Verification, documentId: string): boolean {
  return typeof v.documentId === 'string' ? v.documentId === documentId : v.documentId._id === documentId;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [docRes, verRes] = await Promise.all([
        documentService.getOne(id),
        verificationService.getAll(),
      ]);
      setDocument(docRes.data.document);
      setVerifications(verRes.data.verifications.filter((v) => belongsToDocument(v, id)));
    } catch {
      setError('Failed to load document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAnalyse = async () => {
    if (!id) return;
    setAnalysing(true);
    setError('');
    try {
      const res = await verificationService.verify(id);
      setVerifications((prev) => [res.data.verification, ...prev]);
      setDocument((prev) =>
        prev
          ? { ...prev, status: res.data.verification.status === 'failed' ? 'failed' : 'verified' }
          : prev
      );
    } catch {
      setError('Verification failed. Please try again.');
      setDocument((prev) => (prev ? { ...prev, status: 'failed' } : prev));
    } finally {
      setAnalysing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this document?')) return;
    setDeleting(true);
    try {
      await documentService.delete(id);
      navigate('/documents');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8">
        <Link to="/documents" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Documents
        </Link>

        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-4">{error}</p>}

        {document && (
          <>
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-gray-800 truncate">
                    {document.originalName}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    {document.mimeType} · {(document.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded {new Date(document.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full capitalize shrink-0 ${
                    DOCUMENT_STATUS_COLORS[document.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {document.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleAnalyse}
                  disabled={analysing || document.status === 'processing'}
                  className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                >
                  {analysing ? 'Analysing…' : verifications.length > 0 ? 'Re-analyse' : 'Analyse'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Verification Runs
            </h2>
            {verifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500 text-sm">
                This document hasn't been analysed yet.
              </div>
            ) : (
              <div className="space-y-2">
                {verifications.map((v) => (
                  <Link
                    key={v._id}
                    to={`/verifications/${v._id}`}
                    className="flex items-center justify-between bg-white rounded-xl shadow px-4 py-3 hover:shadow-md transition"
                  >
                    <span className="text-sm text-gray-600">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-medium">{v.confidence}%</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                          VERIFICATION_STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
