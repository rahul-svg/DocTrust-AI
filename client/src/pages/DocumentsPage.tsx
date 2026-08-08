import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import type { Document } from '../types/document';
import { useAuth } from '../hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await documentService.getAll();
      setDocuments(res.data.documents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
