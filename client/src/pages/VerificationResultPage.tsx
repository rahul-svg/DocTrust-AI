import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VerificationDetails from '../components/VerificationDetails';
import { verificationService } from '../services/verificationService';
import type { Verification } from '../types/verification';

export default function VerificationResultPage() {
  const { id } = useParams<{ id: string }>();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    verificationService
      .getOne(id)
      .then((res) => setVerification(res.data.verification))
      .catch(() => setError('Failed to load this verification result.'))
      .finally(() => setLoading(false));
  }, [id]);

  const document =
    verification && typeof verification.documentId === 'object' ? verification.documentId : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-8">
        <Link to="/verifications" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to History
        </Link>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
        ) : !verification ? (
          <p className="text-gray-500">Verification not found.</p>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Verification Result</h2>
              {document && (
                <Link
                  to={`/documents/${document._id}`}
                  className="text-sm text-gray-500 hover:text-blue-600 mt-1 inline-block"
                >
                  {document.originalName}
                </Link>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow px-6 py-5">
              <VerificationDetails verification={verification} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
