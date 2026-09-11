import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { verificationService } from '../services/verificationService';
import type { Verification } from '../types/verification';
import Navbar from '../components/Navbar';
import { VERIFICATION_STATUS_COLORS, confidenceBarColor } from '../utils/statusStyles';

function documentName(v: Verification): string {
  return typeof v.documentId === 'string' ? v.documentId : v.documentId.originalName;
}

export default function VerificationHistoryPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verificationService
      .getAll()
      .then((res) => setVerifications(res.data.verifications))
      .catch(() => setError('Failed to load verification history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Verification History</h2>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : verifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            <p>No verifications yet.</p>
            <Link to="/documents" className="mt-4 text-blue-600 hover:underline text-sm inline-block">
              Go analyse a document →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <Link
                key={v._id}
                to={`/verifications/${v._id}`}
                className="block bg-white rounded-xl shadow px-5 py-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{documentName(v)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(v.createdAt).toLocaleString()} ·{' '}
                      <span className="capitalize">{v.documentType?.replace(/_/g, ' ') || 'unknown'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${confidenceBarColor(v.confidence)}`}
                        style={{ width: `${Math.min(100, Math.max(0, v.confidence))}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">{v.confidence}%</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                        VERIFICATION_STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
