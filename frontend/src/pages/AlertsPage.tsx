import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../lib/api';
import { Bell, CheckCircle, AlertTriangle, Info, Zap, Check } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Alert, AlertSeverity } from '../types';

const SEVERITY_STYLES: Record<AlertSeverity, { border: string; icon: React.ReactNode; badge: string }> = {
  info: { border: 'border-l-blue-500', icon: <Info size={16} className="text-blue-400" />, badge: 'badge-blue' },
  warning: { border: 'border-l-yellow-500', icon: <AlertTriangle size={16} className="text-yellow-400" />, badge: 'badge-yellow' },
  critical: { border: 'border-l-red-500', icon: <Zap size={16} className="text-red-400" />, badge: 'badge-red' },
};

export default function AlertsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const runChecksMutation = useMutation({
    mutationFn: () => alertsApi.runChecks(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts: Alert[] = data?.alerts || [];
  const unreadCount: number = data?.unreadCount || 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => runChecksMutation.mutate()} disabled={runChecksMutation.isPending}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Bell size={14} />
            {runChecksMutation.isPending ? 'Checking...' : 'Run Checks'}
          </button>
          {unreadCount > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}
              className="btn-secondary flex items-center gap-2 text-sm">
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-20">
          <Bell size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No alerts</p>
          <p className="text-gray-600 text-sm mt-1">Click "Run Checks" to scan your accounts for issues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div key={alert._id}
                className={`card border-l-4 ${style.border} ${!alert.isRead ? 'bg-gray-800/60' : 'opacity-60'} ${alert.isResolved ? 'opacity-40' : ''} transition-opacity`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="shrink-0 mt-0.5">{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`text-sm font-medium ${!alert.isRead ? 'text-white' : 'text-gray-300'}`}>{alert.title}</p>
                        <span className={style.badge}>{alert.severity}</span>
                        {alert.isResolved && <span className="badge-green">resolved</span>}
                        {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-400">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1.5">
                        {formatDistanceToNow(parseISO(alert.createdAt), { addSuffix: true })}
                        {alert.type && <span className="ml-2 capitalize text-gray-700">{alert.type.replace(/_/g, ' ')}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.isRead && (
                      <button onClick={() => markReadMutation.mutate(alert._id)}
                        className="text-xs text-gray-500 hover:text-blue-400 transition-colors whitespace-nowrap">
                        Mark read
                      </button>
                    )}
                    {!alert.isResolved && (
                      <button onClick={() => resolveMutation.mutate(alert._id)}
                        className="text-gray-500 hover:text-green-400 transition-colors" title="Resolve">
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
