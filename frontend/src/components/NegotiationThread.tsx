import React, { useState } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from './ui/Button';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_id: string;
  created_at: string;
  replies: Comment[];
}

interface NegotiationThreadProps {
  threadId: string;
  title: string;
  description: string;
  status: string;
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  onResolve: (resolution: string) => void;
}

export const NegotiationThread: React.FC<NegotiationThreadProps> = ({
  threadId,
  title,
  description,
  status,
  comments,
  onAddComment,
  onResolve
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [showResolve, setShowResolve] = useState(false);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment, replyTo || undefined);
      setNewComment('');
      setReplyTo(null);
    }
  };

  const handleResolve = () => {
    if (resolution.trim()) {
      onResolve(resolution);
      setShowResolve(false);
      setResolution('');
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-4'}`}>
      <div className="bg-white rounded-lg border border-acorn-gray-200 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-acorn-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-acorn-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-acorn-gray-900">{comment.author_name}</span>
              <span className="text-xs text-acorn-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-acorn-gray-700 whitespace-pre-wrap">{comment.content}</p>
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-sm text-acorn-blue-600 hover:text-acorn-blue-700 mt-2"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  return (
    <div className="bg-acorn-gray-50 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-acorn-gray-900">{title}</h3>
          <p className="text-acorn-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'open' && (
            <span className="px-3 py-1 bg-acorn-orange-100 text-acorn-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Open
            </span>
          )}
          {status === 'resolved' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Resolved
            </span>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        {comments.map(comment => renderComment(comment))}
      </div>

      {/* Add Comment */}
      {status === 'open' && (
        <div className="mt-6">
          {replyTo && (
            <div className="mb-2 text-sm text-acorn-gray-600">
              Replying to comment...{' '}
              <button onClick={() => setReplyTo(null)} className="text-acorn-orange-600">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment... (use @username to mention)"
              className="flex-1 p-3 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
              rows={3}
            />
            <Button
              onClick={handleSubmitComment}
              className="bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Resolve Thread */}
      {status === 'open' && (
        <div className="mt-4">
          {!showResolve ? (
            <Button
              onClick={() => setShowResolve(true)}
              variant="outline"
              className="border-acorn-blue-500 text-acorn-blue-600 hover:bg-acorn-blue-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve Thread
            </Button>
          ) : (
            <div className="bg-white rounded-lg border border-acorn-gray-200 p-4">
              <label className="block text-sm font-medium text-acorn-gray-700 mb-2">
                Resolution Summary
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this was resolved..."
                className="w-full p-3 border border-acorn-gray-300 rounded-lg focus:ring-2 focus:ring-acorn-blue-500"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleResolve}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirm Resolution
                </Button>
                <Button
                  onClick={() => setShowResolve(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
