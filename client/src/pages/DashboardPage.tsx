import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { documentService } from '../services/documentService';
import { verificationService } from '../services/verificationService';
import type { Document } from '../types/document';
import type { Verification } from '../types/verification';
import { VERIFICATION_STATUS_COLORS, confidenceBarColor } from '../utils/statusStyles';

function documentName(v: Verification): string {
  return typeof v.documentId === 'string' ? v.documentId : v.documentId.originalName;
}

function StatCard({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  hint?: string;
}) {
  const toneColor =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'warn'
      ? 'text-yellow-600'
      : tone === 'bad'
      ? 'text-red-600'
      : 'text-gray-800';

  return (
    <div className="bg-white rounded-2xl shadow px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneColor}`}>{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

/** Proportional bar showing how verifications split across outcomes. */
function OutcomeBreakdown({ verifications }: { verifications: Verification[] }) {
  const total = verifications.length;
  const segments = [
    {
      label: 'Verified',
      count: verifications.filter((v) => v.status === 'verified').length,
      color: 'bg-green-500',
    },
    {
      label: 'Uncertain',
      count: verifications.filter((v) => v.status === 'uncertain').length,
      color: 'bg-yellow-500',
    },
    {
      label: 'Failed',
      count: verifications.filter((v) => v.status === 'failed').length,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Verification Outcomes
      </p>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-gray-600">{s.label}</span>
            <span className="text-gray-400">
              {s.count} ({Math.round((s.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** How many verifications land in each confidence band. */
function ConfidenceDistribution({ verifications }: { verifications: Verification[] }) {
  const bands = [
    { label: 'High (70-100%)', min: 70, max: 101, color: 'bg-green-500' },
    { label: 'Medium (40-69%)', min: 40, max: 70, color: 'bg-yellow-500' },
    { label: 'Low (0-39%)', min: 0, max: 40, color: 'bg-red-500' },
  ];

  const counts = bands.map(
    (b) =>
      verifications.filter((v) => (v.confidence ?? 0) >= b.min && (v.confidence ?? 0) < b.max)
        .length
  );
  const max = Math.max(...counts, 1);

  return (
    <div className="bg-white rounded-2xl shadow px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Confidence Distribution
      </p>
      <div className="space-y-2.5">
        {bands.map((band, i) => (
          <div key={band.label} className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 w-36 shrink-0">{band.label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${band.color}`}
                style={{ width: `${(counts[i] / max) * 100}%` }}
              />
            </div>
            <span className="text-gray-400 w-8 text-right">{counts[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([documentService.getAll(), verificationService.getAll()])
      .then(([docRes, verRes]) => {
        setDocuments(docRes.data.documents);
        setVerifications(verRes.data.verifications);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const averageConfidence = verifications.length
    ? Math.round(
        verifications.reduce((sum, v) => sum + (v.confidence ?? 0), 0) / verifications.length
      )
    : 0;
  const tamperingFlagged = verifications.filter((v) => v.aiAnalysis?.tamperingDetected).length;
  const openFindings = verifications.reduce(
    (sum, v) => sum + (v.verificationReport?.findings?.length ?? 0),
    0
  );
  const recent = verifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Upload Document
          </Link>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Documents" value={documents.length} />
              <StatCard label="Verifications" value={verifications.length} />
              <StatCard
                label="Avg Confidence"
                value={`${averageConfidence}%`}
                tone={
                  averageConfidence >= 70 ? 'good' : averageConfidence >= 40 ? 'warn' : 'bad'
                }
              />
              <StatCard
                label="Tampering Flags"
                value={tamperingFlagged}
                tone={tamperingFlagged > 0 ? 'bad' : 'good'}
                hint={`${openFindings} rule finding${openFindings === 1 ? '' : 's'}`}
              />
            </div>

            {verifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
                <p>No documents have been analysed yet.</p>
                <Link
                  to="/documents"
                  className="mt-4 text-blue-600 hover:underline text-sm inline-block"
                >
                  Go analyse a document →
                </Link>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <OutcomeBreakdown verifications={verifications} />
                  <ConfidenceDistribution verifications={verifications} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Recent Activity</h3>
                    <Link to="/verifications" className="text-sm text-blue-600 hover:underline">
                      View all →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recent.map((v) => (
                      <Link
                        key={v._id}
                        to={`/verifications/${v._id}`}
                        className="block bg-white rounded-xl shadow px-5 py-4 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {documentName(v)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(v.createdAt).toLocaleString()} ·{' '}
                              <span className="capitalize">
                                {v.documentType?.replace(/_/g, ' ') || 'unknown'}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${confidenceBarColor(v.confidence)}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, v.confidence))}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-10 text-right">
                              {v.confidence}%
                            </span>
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
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
