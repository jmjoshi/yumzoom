'use client';

import { FamilyCollaborationSession } from '@/types/social';
import { formatDistanceToNow } from 'date-fns';
import { 
  Vote, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface CollaborationsListProps {
  collaborations: FamilyCollaborationSession[];
}

export function CollaborationsList({ collaborations }: CollaborationsListProps) {
  if (collaborations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Vote className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active collaborations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a collaboration to decide on restaurants with your family or friends.
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
              <Vote className="-ml-1 mr-2 h-5 w-5" />
              Start Collaboration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {collaborations.map((collaboration) => (
        <CollaborationItem key={collaboration.id} collaboration={collaboration} />
      ))}
    </div>
  );
}

function CollaborationItem({ collaboration }: { collaboration: FamilyCollaborationSession }) {
  const getSessionTypeIcon = () => {
    switch (collaboration.session_type) {
      case 'restaurant_voting':
        return <Vote className="h-4 w-4 text-blue-500" />;
      case 'menu_planning':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'occasion_planning':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'group_discovery':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Vote className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSessionTypeLabel = () => {
    switch (collaboration.session_type) {
      case 'restaurant_voting':
        return 'Restaurant Voting';
      case 'menu_planning':
        return 'Menu Planning';
      case 'occasion_planning':
        return 'Occasion Planning';
      case 'group_discovery':
        return 'Group Discovery';
      default:
        return 'Collaboration';
    }
  };

  const getStatusIcon = () => {
    switch (collaboration.status) {
      case 'active':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const isDeadlineSoon = () => {
    if (!collaboration.deadline) return false;
    const deadline = new Date(collaboration.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  };

  const isOverdue = () => {
    if (!collaboration.deadline) return false;
    return new Date(collaboration.deadline) < new Date();
  };

  return (
    <div className="p-6 hover:bg-gray-50 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {collaboration.creator_profile?.avatar_url ? (
                <img
                  src={collaboration.creator_profile.avatar_url}
                  alt={`${collaboration.creator_profile.first_name} ${collaboration.creator_profile.last_name}`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {collaboration.creator_profile?.first_name?.[0]}
                  {collaboration.creator_profile?.last_name?.[0]}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getSessionTypeIcon()}
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {collaboration.title}
              </h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {getSessionTypeLabel()}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>By {collaboration.creator_profile?.first_name} {collaboration.creator_profile?.last_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(collaboration.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {collaboration.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {collaboration.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {collaboration.participants_count !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{collaboration.participants_count} participants</span>
                  </div>
                )}
                
                {collaboration.options_count !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Vote className="h-3 w-3" />
                    <span>{collaboration.options_count} options</span>
                  </div>
                )}
                
                {collaboration.votes_count !== undefined && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{collaboration.votes_count} votes</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {collaboration.deadline && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    isOverdue() ? 'text-red-600' : isDeadlineSoon() ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    <span>
                      {isOverdue() ? 'Overdue' : `Due ${formatDistanceToNow(new Date(collaboration.deadline), { addSuffix: true })}`}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span className={`text-xs capitalize ${
                    collaboration.status === 'active' ? 'text-green-600' :
                    collaboration.status === 'completed' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {collaboration.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
        </div>
      </div>
      
      {/* Voting Rules Summary */}
      {collaboration.voting_rules && Object.keys(collaboration.voting_rules).length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            {collaboration.voting_rules.multiple_votes && (
              <span>Multiple votes allowed</span>
            )}
            {collaboration.voting_rules.require_unanimous && (
              <span>Requires unanimous decision</span>
            )}
            {collaboration.voting_rules.max_options && (
              <span>Max {collaboration.voting_rules.max_options} options</span>
            )}
          </div>
        </div>
      )}
      
      {/* Status Alerts */}
      {isOverdue() && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>This collaboration is overdue</span>
          </div>
        </div>
      )}
      
      {isDeadlineSoon() && !isOverdue() && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Deadline approaching - vote soon!</span>
          </div>
        </div>
      )}
    </div>
  );
}
