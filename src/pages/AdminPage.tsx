import { useState } from 'react';
import { Key, Plug, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { mockUsers, mockIntegrations, mockApiKeys } from '@/services/mockData';
import type { UserRole } from '@/types';
import { formatDate } from '@/utils/format';

export function AdminPage() {
  const [users, setUsers] = useState(mockUsers);

  const updateRole = (userId: string, role: UserRole) => {
    setUsers((u) => u.map((user) => (user.id === userId ? { ...user, role } : user)));
  };

  return (
    <>
      <PageHeader title="Admin Panel" subtitle="Manage users, integrations, and API access" />

      <div className="space-y-6">
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
