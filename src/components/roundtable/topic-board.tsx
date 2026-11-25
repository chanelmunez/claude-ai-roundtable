'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Clock, MessageCircle, RefreshCw, Trash2 } from 'lucide-react';
import type { SessionSummary, SessionStatus } from '@/lib/types';

interface TopicBoardProps {
  sessions: SessionSummary[];
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  onArchiveSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRefresh?: () => void;
  activeSessionId?: string | null;
}

const STATUS_STYLES: Record<SessionStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-slate-200 text-slate-700'
};

const formatTimestamp = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export function TopicBoard({
  sessions,
  isLoading,
  onSelectSession,
  onArchiveSession,
  onDeleteSession,
  onRefresh,
  activeSessionId
}: TopicBoardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Saved Discussions</CardTitle>
          <p className="text-sm text-muted-foreground">Open or organize past roundtables</p>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh topics"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`topic-skeleton-${index}`}
              className="animate-pulse rounded-lg border border-dashed border-border/60 p-4"
            >
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="mt-3 flex space-x-4 text-xs text-muted-foreground">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No saved discussions yet. Start a new topic to see it here.
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-lg border p-4 transition-colors ${
                session.id === activeSessionId ? 'border-accent shadow-sm' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium leading-tight">
                      {session.topic.length > 70
                        ? `${session.topic.slice(0, 70)}...`
                        : session.topic}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`${STATUS_STYLES[session.status]} border-transparent text-xs`}
                    >
                      {session.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {session.messageCount} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Updated {formatTimestamp(session.lastActivity)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSelectSession(session.id)}
                    variant={session.id === activeSessionId ? 'default' : 'secondary'}
                  >
                    Open
                  </Button>
                  {session.status !== 'archived' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Archive session"
                      onClick={() => onArchiveSession(session.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete session"
                    onClick={() => onDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
