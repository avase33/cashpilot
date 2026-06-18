import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Users, Mail, X, Crown, Shield, BookOpen, Eye } from 'lucide-react';
import type { OrgMember } from '../types';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown size={12} className="text-yellow-400" />,
  admin: <Shield size={12} className="text-blue-400" />,
  accountant: <BookOpen size={12} className="text-green-400" />,
  viewer: <Eye size={12} className="text-gray-400" />,
};

const ROLE_BADGE: Record<string, string> = {
  owner: 'badge-yellow',
  admin: 'badge-blue',
  accountant: 'badge-green',
  viewer: 'badge-gray',
};

function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const mutation = useMutation({
    mutationFn: () => teamApi.invite({ email, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
            <input className="input" type="email" placeholder="team@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="admin">Admin — full access, cannot delete org</option>
              <option value="accountant">Accountant — manage finances, no team</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-300">Admin:</strong> Manage accounts, transactions, invoices, bills, reports, and team</p>
            <p><strong className="text-gray-300">Accountant:</strong> Manage all financial data, view reports</p>
            <p><strong className="text-gray-300">Viewer:</strong> View dashboards and reports only</p>
          </div>
        </div>
        {mutation.isError && (
          <p className="text-red-400 text-xs mt-3">Failed to send invite. Check if the email is registered.</p>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!email || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamApi.list(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => teamApi.updateRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamApi.remove(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const members: OrgMember[] = data?.members || [];
  const org = data?.org;

  const currentUserRole = members.find(m => (m.user as any)?._id === user?._id)?.role;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className="p-8">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          {org && <p className="text-gray-400 text-sm mt-1">{org.name} · {org.plan} plan</p>}
        </div>
        {canManage && (
          <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2">
            <Mail size={14} /> Invite member
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {members.length === 0 ? (
            <div className="text-center py-16">
              <Users size={36} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No team members yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Member', 'Role', 'Joined', ''].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const u = member.user as any;
                  const isCurrentUser = u?._id === user?._id;
                  const isOwner = member.role === 'owner';
                  return (
                    <tr key={member._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                            {u?.initials || u?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm text-gray-200">{u?.name || 'Unknown'}{isCurrentUser ? <span className="text-gray-500 text-xs ml-1">(you)</span> : ''}</p>
                            <p className="text-xs text-gray-500">{u?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {canManage && !isOwner && !isCurrentUser ? (
                          <select
                            value={member.role}
                            onChange={e => updateRoleMutation.mutate({ userId: u._id, role: e.target.value })}
                            className="bg-gray-800 text-xs text-gray-300 rounded-lg px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500">
                            {['admin', 'accountant', 'viewer'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {ROLE_ICONS[member.role]}
                            <span className={ROLE_BADGE[member.role]}>{member.role}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {canManage && !isOwner && !isCurrentUser && (
                          <button onClick={() => removeMutation.mutate(u._id)}
                            className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
