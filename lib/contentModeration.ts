/**
 * Content Moderation Service
 * AI-powered content analysis and quality scoring for YumZoom platform
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types for content moderation
export interface ModerationResult {
  classification: string;
  confidence: number;
  shouldFlag: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export interface ContentReport {
  id: string;
  reporter_user_id: string;
  content_type: 'review' | 'photo' | 'response' | 'profile';
  content_id: string;
  report_category: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other';
  report_reason?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface QualityScore {
  overall_score: number;
  helpfulness_score?: number;
  authenticity_score?: number;
  readability_score?: number;
  engagement_score?: number;
}

export interface TrustScore {
  user_id: string;
  trust_score: number;
  reputation_points: number;
  account_status: 'good_standing' | 'warning' | 'restricted' | 'suspended';
}

/**
 * Content Moderation Service Class
 */
export class ContentModerationService {
  
  /**
   * Analyze text content for various moderation factors
   */
  async analyzeTextContent(
    content: string,
    contentType: string,
    contentId: string
  ): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];
    
    try {
      // Profanity detection
      const profanityResult = await this.detectProfanity(content);
      results.push(profanityResult);
      
      // Spam detection
      const spamResult = await this.detectSpam(content, contentType);
      results.push(spamResult);
      
      // Toxicity detection
      const toxicityResult = await this.detectToxicity(content);
      results.push(toxicityResult);
      
      // Authenticity check
      const authenticityResult = await this.checkAuthenticity(content, contentType);
      results.push(authenticityResult);
      
      // Store AI results in database
      for (const result of results) {
        await this.storeAIResult(contentType, contentId, result);
      }
      
      return results;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return [{
        classification: 'error',
        confidence: 0,
        shouldFlag: false,
        reason: 'Analysis failed'
      }];
    }
  }
  
  /**
   * Detect profanity in text content
   */
  private async detectProfanity(content: string): Promise<ModerationResult> {
    // Basic profanity filter - in production, use a service like Perspective API
    const profanityWords = [
      'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'crap',
      // Add more as needed - this is a basic list
    ];
    
    const lowerContent = content.toLowerCase();
    const foundProfanity = profanityWords.filter(word => 
      lowerContent.includes(word)
    );
    
    const confidence = foundProfanity.length > 0 ? 0.9 : 0.1;
    
    return {
      classification: foundProfanity.length > 0 ? 'contains_profanity' : 'clean',
      confidence,
      shouldFlag: foundProfanity.length > 0,
      reason: foundProfanity.length > 0 ? `Contains: ${foundProfanity.join(', ')}` : undefined,
      details: { words_found: foundProfanity }
    };
  }
  
  /**
   * Detect spam content patterns
   */
  private async detectSpam(content: string, contentType: string): Promise<ModerationResult> {
    let spamScore = 0;
    const indicators = [];
    
    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) {
      spamScore += 0.3;
      indicators.push('excessive_caps');
    }
    
    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      spamScore += 0.2;
      indicators.push('excessive_punctuation');
    }
    
    // Check for repetitive content
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = [...new Set(words)];
    const repetitionRatio = 1 - (uniqueWords.length / words.length);
    if (repetitionRatio > 0.6) {
      spamScore += 0.4;
      indicators.push('repetitive_content');
    }
    
    // Check for promotional content
    const promotionalKeywords = ['buy now', 'click here', 'free', 'discount', 'deal', 'offer'];
    const foundPromotional = promotionalKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
    if (foundPromotional.length > 2) {
      spamScore += 0.3;
      indicators.push('promotional_content');
    }
    
    // Very short reviews are often spam
    if (contentType === 'review' && content.trim().length < 10) {
      spamScore += 0.5;
      indicators.push('too_short');
    }
    
    const confidence = Math.min(spamScore, 1.0);
    
    return {
      classification: spamScore > 0.6 ? 'spam' : 'not_spam',
      confidence,
      shouldFlag: spamScore > 0.6,
      reason: indicators.length > 0 ? `Spam indicators: ${indicators.join(', ')}` : undefined,
      details: { spam_score: spamScore, indicators }
    };
  }
  
  /**
   * Detect toxic or harmful content
   */
  private async detectToxicity(content: string): Promise<ModerationResult> {
    // Basic toxicity detection - in production, use Google's Perspective API
    const toxicityIndicators = [
      'hate', 'kill', 'die', 'stupid', 'idiot', 'moron', 'loser',
      'ugly', 'disgusting', 'awful', 'terrible', 'worst', 'horrible'
    ];
    
    const harassmentWords = [
      'harass', 'bully', 'threat', 'intimidate', 'stalk'
    ];
    
    const lowerContent = content.toLowerCase();
    
    const foundToxic = toxicityIndicators.filter(word => 
      lowerContent.includes(word)
    );
    
    const foundHarassment = harassmentWords.filter(word => 
      lowerContent.includes(word)
    );
    
    const toxicityScore = (foundToxic.length * 0.3) + (foundHarassment.length * 0.5);
    const confidence = Math.min(toxicityScore, 1.0);
    
    return {
      classification: confidence > 0.7 ? 'toxic' : 'non_toxic',
      confidence,
      shouldFlag: confidence > 0.7,
      reason: foundToxic.length > 0 || foundHarassment.length > 0 ? 
        `Toxic language detected` : undefined,
      details: { 
        toxic_words: foundToxic,
        harassment_words: foundHarassment,
        toxicity_score: toxicityScore
      }
    };
  }
  
  /**
   * Check content authenticity
   */
  private async checkAuthenticity(content: string, contentType: string): Promise<ModerationResult> {
    let authenticityScore = 1.0;
    const indicators = [];
    
    // Check for generic/template-like content
    const genericPhrases = [
      'great place', 'good food', 'nice service', 'would recommend',
      'amazing experience', 'loved it', 'will come back'
    ];
    
    const foundGeneric = genericPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    if (foundGeneric.length > 2) {
      authenticityScore -= 0.3;
      indicators.push('generic_language');
    }
    
    // Check for overly positive reviews (potential fake)
    if (contentType === 'review') {
      const positiveWords = ['amazing', 'perfect', 'best', 'incredible', 'outstanding'];
      const foundPositive = positiveWords.filter(word => 
        content.toLowerCase().includes(word)
      );
      
      if (foundPositive.length > 3 && content.length < 100) {
        authenticityScore -= 0.4;
        indicators.push('suspiciously_positive');
      }
    }
    
    // Check for detailed, specific content (more authentic)
    if (content.length > 150 && content.includes('we') || content.includes('my family')) {
      authenticityScore += 0.2;
      indicators.push('detailed_personal');
    }
    
    authenticityScore = Math.max(0, Math.min(1, authenticityScore));
    const confidence = 1 - authenticityScore; // Lower authenticity = higher confidence it's fake
    
    return {
      classification: authenticityScore < 0.6 ? 'potentially_fake' : 'authentic',
      confidence,
      shouldFlag: authenticityScore < 0.6,
      reason: indicators.length > 0 ? `Authenticity concerns: ${indicators.join(', ')}` : undefined,
      details: { authenticity_score: authenticityScore, indicators }
    };
  }
  
  /**
   * Store AI moderation results in database
   */
  private async storeAIResult(
    contentType: string,
    contentId: string,
    result: ModerationResult
  ): Promise<void> {
    try {
      await supabase
        .from('ai_moderation_results')
        .insert({
          content_type: contentType,
          content_id: contentId,
          analysis_type: this.getAnalysisTypeFromClassification(result.classification),
          confidence_score: result.confidence,
          classification: result.classification,
          details: result.details || {},
          model_version: '1.0.0'
        });
    } catch (error) {
      console.error('Error storing AI result:', error);
    }
  }
  
  private getAnalysisTypeFromClassification(classification: string): string {
    if (classification.includes('profanity')) return 'profanity_filter';
    if (classification.includes('spam')) return 'spam_detection';
    if (classification.includes('toxic')) return 'toxicity_detection';
    if (classification.includes('fake') || classification.includes('authentic')) return 'authenticity_check';
    return 'general_analysis';
  }
  
  /**
   * Calculate comprehensive quality score for content
   */
  async calculateQualityScore(
    contentType: string,
    contentId: string,
    content?: string
  ): Promise<QualityScore> {
    try {
      // Use database function for base calculation
      const { data: baseScore } = await supabase
        .rpc('calculate_content_quality_score', {
          p_content_type: contentType,
          p_content_id: contentId,
          p_text_content: content
        });
      
      let qualityScore: QualityScore = {
        overall_score: baseScore || 0.5
      };
      
      // Add specific scoring based on content type
      if (contentType === 'review' && content) {
        qualityScore.readability_score = this.calculateReadabilityScore(content);
        qualityScore.authenticity_score = await this.getAuthenticityScore(contentId);
      }
      
      // Store quality score
      await supabase
        .from('content_quality_scores')
        .upsert({
          content_type: contentType,
          content_id: contentId,
          quality_score: qualityScore.overall_score,
          readability_score: qualityScore.readability_score,
          authenticity_score: qualityScore.authenticity_score
        });
      
      return qualityScore;
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return { overall_score: 0.5 };
    }
  }
  
  /**
   * Calculate readability score for text
   */
  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Ideal range is 15-20 words per sentence
    let readabilityScore = 1.0;
    
    if (avgWordsPerSentence < 5) readabilityScore -= 0.3; // Too choppy
    if (avgWordsPerSentence > 25) readabilityScore -= 0.4; // Too complex
    if (words < 10) readabilityScore -= 0.2; // Too short
    if (words > 200) readabilityScore -= 0.1; // Too long
    
    return Math.max(0, Math.min(1, readabilityScore));
  }
  
  /**
   * Get authenticity score from AI results
   */
  private async getAuthenticityScore(contentId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('ai_moderation_results')
        .select('confidence_score, classification')
        .eq('content_id', contentId)
        .eq('analysis_type', 'authenticity_check')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && data.classification === 'authentic') {
        return 1 - data.confidence_score; // Higher confidence in authentic = higher score
      } else if (data && data.classification === 'potentially_fake') {
        return data.confidence_score; // Higher confidence in fake = lower score
      }
      
      return 0.5; // Default neutral score
    } catch (error) {
      return 0.5;
    }
  }
  
  /**
   * Report content for manual review
   */
  async reportContent(
    reporterUserId: string,
    contentType: string,
    contentId: string,
    category: string,
    reason?: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .insert({
          reporter_user_id: reporterUserId,
          content_type: contentType,
          content_id: contentId,
          report_category: category,
          report_reason: reason
        })
        .select('id')
        .single();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Auto-add to moderation queue for high-priority reports
      if (category === 'harassment' || category === 'inappropriate') {
        await this.addToModerationQueue(contentType, contentId, 'user_reported', 1);
      }
      
      return { success: true, reportId: data.id };
    } catch (error) {
      return { success: false, error: 'Failed to submit report' };
    }
  }
  
  /**
   * Add content to moderation queue
   */
  async addToModerationQueue(
    contentType: string,
    contentId: string,
    reason: string,
    priority: number = 3
  ): Promise<void> {
    try {
      // Get content data for snapshot
      let contentData = {};
      
      if (contentType === 'review') {
        const { data } = await supabase
          .from('ratings')
          .select('*')
          .eq('id', contentId)
          .single();
        contentData = data || {};
      }
      // Add other content types as needed
      
      await supabase
        .from('content_moderation_queue')
        .insert({
          content_type: contentType,
          content_id: contentId,
          content_data: contentData,
          moderation_reason: reason,
          priority_level: priority
        });
    } catch (error) {
      console.error('Error adding to moderation queue:', error);
    }
  }
  
  /**
   * Get user trust score
   */
  async getUserTrustScore(userId: string): Promise<TrustScore | null> {
    try {
      const { data } = await supabase
        .from('user_trust_scores')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return data;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Update user trust score
   */
  async updateUserTrustScore(userId: string): Promise<void> {
    try {
      await supabase.rpc('update_user_trust_score', {
        p_user_id: userId
      });
    } catch (error) {
      console.error('Error updating trust score:', error);
    }
  }
  
  /**
   * Auto-moderate content based on AI analysis
   */
  async autoModerateContent(
    contentType: string,
    contentId: string,
    analysisResults: ModerationResult[]
  ): Promise<string> {
    try {
      let action = 'approved';
      
      for (const result of analysisResults) {
        if (result.shouldFlag) {
          const autoAction = await supabase.rpc('auto_moderate_content', {
            p_content_type: contentType,
            p_content_id: contentId,
            p_analysis_type: this.getAnalysisTypeFromClassification(result.classification),
            p_confidence_score: result.confidence,
            p_classification: result.classification
          });
          
          if (autoAction.data !== 'approved') {
            action = autoAction.data;
            break;
          }
        }
      }
      
      return action;
    } catch (error) {
      console.error('Error in auto-moderation:', error);
      return 'approved';
    }
  }
  
  /**
   * Get moderation queue items for admin review
   */
  async getModerationQueue(
    limit: number = 20,
    priority?: number,
    assignedTo?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('content_moderation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority_level', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (priority) {
        query = query.eq('priority_level', priority);
      }
      
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }
      
      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      return [];
    }
  }
  
  /**
   * Get content reports for admin review
   */
  async getContentReports(
    status?: string,
    contentType?: string,
    limit: number = 20
  ): Promise<ContentReport[]> {
    try {
      let query = supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error fetching content reports:', error);
      return [];
    }
  }
  
  /**
   * Process moderation decision
   */
  async processModerationDecision(
    queueId: string,
    decision: 'approved' | 'rejected' | 'edited',
    moderatorId: string,
    notes?: string,
    actionTaken?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_moderation_queue')
        .update({
          status: decision === 'approved' ? 'approved' : 'rejected',
          assigned_to: moderatorId,
          moderator_notes: notes,
          action_taken: actionTaken || decision,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process decision' };
    }
  }
}

// Export singleton instance
export const moderationService = new ContentModerationService();
