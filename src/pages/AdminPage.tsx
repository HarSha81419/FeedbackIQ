import { useState } from 'react';
import { Key, Plug, Users, Database, Upload, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { mockUsers, mockIntegrations, mockApiKeys } from '@/services/mockData';
import type { UserRole } from '@/types';
import { formatDate } from '@/utils/format';
import { deleteAllFeedback, getDatasetStats, replaceDataset } from '@/services/feedback.service';
import { useToast } from '@/components/ui/Toast';

interface DatasetStats {
  total_feedback: number;
  sentiment_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}

export function AdminPage() {
  const [users, setUsers] = useState(mockUsers);
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDeletingDataset, setIsDeletingDataset] = useState(false);
  const [isReplacingDataset, setIsReplacingDataset] = useState(false);
  const { push } = useToast();

  const updateRole = (userId: string, role: UserRole) => {
    setUsers((u) => u.map((user) => (user.id === userId ? { ...user, role } : user)));
  };

  const loadDatasetStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getDatasetStats();
      setDatasetStats(stats);
      push({ kind: 'success', title: 'Stats loaded successfully' });
    } catch (err) {
      push({ kind: 'error', title: 'Failed to load dataset statistics' });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!window.confirm('Are you sure you want to delete all feedback? This cannot be undone.')) {
      return;
    }
    setIsDeletingDataset(true);
    try {
      await deleteAllFeedback();
      push({ kind: 'success', title: 'All feedback has been deleted' });
      setDatasetStats(null);
    } catch (err) {
      push({ kind: 'error', title: 'Failed to delete dataset' });
    } finally {
      setIsDeletingDataset(false);
    }
  };

  const handleReplaceDataset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('This will replace all existing feedback with the new dataset. Continue?')) {
      return;
    }

    setIsReplacingDataset(true);
    try {
      const result = await replaceDataset(file);
      push({ kind: 'success', title: `Dataset replaced. Imported ${result.imported} entries.` });
      await loadDatasetStats();
    } catch (err) {
      push({ kind: 'error', title: 'Failed to replace dataset' });
    } finally {
      setIsReplacingDataset(false);
    }
  };

  return (
    <>
      <PageHeader title="Admin Panel" subtitle="Manage users, integrations, and API access" />

      <div className="space-y-6">
        <Card padding="lg">
          <CardHeader
            title="Dataset Management"
            subtitle="Manage customer feedback dataset"
            action={<Database className="h-5 w-5 text-slate-500" />}
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={loadDatasetStats}
                disabled={isLoadingStats}
                className="w-full"
                variant="secondary"
              >
                {isLoadingStats ? 'Loading...' : 'Load Statistics'}
              </Button>
              <div className="w-full">
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleReplaceDataset}
                  disabled={isReplacingDataset}
                  className="hidden"
                />
                <label htmlFor="csv-upload" className="block w-full">
                  <Button
                    type="button"
                    className="w-full cursor-pointer"
                    disabled={isReplacingDataset}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isReplacingDataset ? 'Uploading...' : 'Replace Dataset'}
                  </Button>
                </label>
              </div>
              <Button
                onClick={handleDeleteDataset}
                disabled={isDeletingDataset}
                variant="danger"
                className="w-full sm:col-span-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeletingDataset ? 'Deleting...' : 'Clear All Feedback'}
              </Button>
            </div>

            {datasetStats && (
              <div className="rounded-lg bg-slate-900/50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Feedback:</span>
                  <span className="font-semibold text-slate-100">{datasetStats.total_feedback}</span>
                </div>
                {Object.keys(datasetStats.sentiment_distribution).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Sentiment Distribution:</p>
                    <div className="flex gap-2">
                      {Object.entries(datasetStats.sentiment_distribution).map(([sentiment, count]) => (
                        <Badge key={sentiment} variant="neutral" className="capitalize">
                          {sentiment}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(datasetStats.category_distribution).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Top Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(datasetStats.category_distribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category, count]) => (
                          <Badge key={category} variant="neutral">
                            {category}: {count}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            title="User management"
            subtitle="Assign roles and permissions"
            action={<Users className="h-5 w-5 text-slate-500" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-slate-500 uppercase">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50">
                    <td className="py-4 font-medium text-slate-200">{user.name}</td>
                    <td className="py-4 text-slate-400">{user.email}</td>
                    <td className="py-4">
                      <Select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'analyst', label: 'Analyst' },
                          { value: 'viewer', label: 'Viewer' },
                        ]}
                        className="max-w-[140px]"
                      />
                    </td>
                    <td className="py-4 text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            title="Integrations"
            subtitle="Connected data sources"
            action={<Plug className="h-5 w-5 text-slate-500" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockIntegrations.map((int) => (
              <div
                key={int.id}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-medium text-slate-200">{int.name}</p>
                  <p className="text-xs text-slate-500">{int.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={int.status === 'connected' ? 'positive' : 'neutral'}
                    className="capitalize"
                  >
                    {int.status}
                  </Badge>
                  {int.status !== 'connected' ? (
                    <Button size="sm" variant="secondary">
                      Connect
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            title="API keys"
            subtitle="Manage programmatic access"
            action={
              <Button size="sm">
                <Key className="h-4 w-4 mr-1" /> Generate key
              </Button>
            }
          />
          <div className="space-y-3">
            {mockApiKeys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-medium text-slate-200">{key.name}</p>
                  <p className="text-sm font-mono text-slate-500">{key.prefix}</p>
                </div>
                <p className="text-xs text-slate-500">
                  Created {formatDate(key.createdAt)}
                  {key.lastUsed ? ` · Last used ${formatDate(key.lastUsed)}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
