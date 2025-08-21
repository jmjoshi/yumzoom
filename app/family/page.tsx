'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EnhancedFamilyMember } from '@/types/user';
import EnhancedFamilyMemberForm from '@/components/family/EnhancedFamilyMemberForm';
import { Plus, Edit, Trash2, Users, Heart, Calendar, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FamilyPage() {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<EnhancedFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<EnhancedFamilyMember | null>(null);

  const fetchFamilyMembers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
    }
  }, [user, fetchFamilyMembers]);

  const handleEdit = (member: EnhancedFamilyMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this family member? This will also remove all their ratings and preferences.')) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Family member deleted successfully!');
      fetchFamilyMembers();
    } catch (error) {
      console.error('Error deleting family member:', error);
      toast.error('Failed to delete family member');
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingMember(null);
    fetchFamilyMembers();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const getAgeRangeIcon = (ageRange?: string) => {
    switch (ageRange) {
      case 'child': return <Users className="h-4 w-4 text-blue-500" />;
      case 'teen': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'adult': return <Heart className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPrivacyIcon = (privacyLevel?: string) => {
    switch (privacyLevel) {
      case 'public': return <span className="text-green-600">🌍</span>;
      case 'family': return <span className="text-blue-600">👨‍👩‍👧‍👦</span>;
      case 'private': return <span className="text-gray-600">🔒</span>;
      default: return <span className="text-blue-600">👨‍👩‍👧‍👦</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedFamilyMemberForm
          member={editingMember || undefined}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Users className="inline h-8 w-8 mr-2" />
          Family Members
        </h1>
        <p className="text-lg text-gray-600">
          Manage your family members with detailed profiles, dietary restrictions, and preferences for a personalized dining experience.
        </p>
      </div>

      {/* Add Family Member Button */}
      <div className="mb-6">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Family Member
        </Button>
      </div>

      {/* Family Members List */}
      <div className="space-y-6">
        {familyMembers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No family members added yet
              </h3>
              <p className="text-gray-500 mb-4">
                Add family members to track individual food preferences, dietary restrictions, and create personalized dining experiences.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Family Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          familyMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.name}
                          </h3>
                          {getAgeRangeIcon(member.age_range)}
                          <span className="text-sm text-gray-500">
                            {member.age_range?.charAt(0).toUpperCase() + (member.age_range?.slice(1) || '')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{member.relationship}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>Privacy: {member.privacy_level || 'family'}</span>
                            {getPrivacyIcon(member.privacy_level)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Information Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {/* Dietary Restrictions */}
                      {member.dietary_restrictions && member.dietary_restrictions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h4>
                          <div className="flex flex-wrap gap-1">
                            {member.dietary_restrictions.slice(0, 3).map((restriction) => (
                              <span
                                key={restriction}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                              >
                                {restriction}
                              </span>
                            ))}
                            {member.dietary_restrictions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{member.dietary_restrictions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Allergies */}
                      {member.allergies && member.allergies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
                            Allergies
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {member.allergies.slice(0, 2).map((allergy) => (
                              <span
                                key={allergy}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                              >
                                ⚠️ {allergy}
                              </span>
                            ))}
                            {member.allergies.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{member.allergies.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Favorite Cuisines */}
                      {member.favorite_cuisines && member.favorite_cuisines.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Favorite Cuisines</h4>
                          <div className="flex flex-wrap gap-1">
                            {member.favorite_cuisines.slice(0, 3).map((cuisine) => (
                              <span
                                key={cuisine}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                              >
                                {cuisine}
                              </span>
                            ))}
                            {member.favorite_cuisines.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{member.favorite_cuisines.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date of Birth */}
                      {member.date_of_birth && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Age Info</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {new Date(member.date_of_birth).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {member.notes && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-sm text-gray-600">{member.notes}</p>
                      </div>
                    )}

                    {/* Child Safety Notice */}
                    {member.age_range === 'child' && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex">
                          <Shield className="h-4 w-4 text-blue-400 mt-0.5" />
                          <div className="ml-2">
                            <p className="text-sm text-blue-800">
                              Enhanced privacy protection is enabled for this child profile.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
