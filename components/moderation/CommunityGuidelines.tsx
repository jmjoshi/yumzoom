'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Shield, 
  Heart, 
  Users, 
  MessageSquare, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Star
} from 'lucide-react';

export function CommunityGuidelines() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="h-12 w-12 text-blue-600" />
          <Heart className="h-8 w-8 text-red-500" />
          <Users className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">YumZoom Community Guidelines</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Building a safe, respectful, and helpful community for families to discover great dining experiences together.
        </p>
      </div>

      {/* Core Values */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Heart className="h-5 w-5" />
            Our Core Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800">Family-Focused</h3>
              <p className="text-sm text-blue-700">Supporting families in making dining decisions together</p>
            </div>
            <div className="text-center p-4">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Safe & Respectful</h3>
              <p className="text-sm text-green-700">Creating a welcoming environment for all users</p>
            </div>
            <div className="text-center p-4">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800">Helpful & Honest</h3>
              <p className="text-sm text-yellow-700">Sharing authentic experiences to help others</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Review Guidelines
          </CardTitle>
          <CardDescription>
            Help other families by writing helpful, honest, and respectful reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Do This: Write Helpful Reviews
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Share specific details about your family's experience</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Mention what your family members enjoyed or didn't like</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Include helpful details like service speed, noise level, kid-friendliness</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Be honest and constructive in your feedback</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Upload relevant photos of food and atmosphere</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Update reviews if your experience changes over time</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Respect cultural differences and dietary preferences</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">Focus on the dining experience, not personal attacks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-red-700 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Don't Do This: Avoid These Behaviors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Write fake reviews or reviews for places you haven't visited</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Post spam, promotional content, or irrelevant information</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Use offensive language, hate speech, or discriminatory comments</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Make personal attacks against staff or other reviewers</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Share private information about others without consent</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Post the same review multiple times or copy others' reviews</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Threaten, harass, or intimidate other users</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <span className="text-sm">Post content unrelated to dining experiences</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Guidelines
          </CardTitle>
          <CardDescription>
            Share great photos that help other families visualize their dining experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Encouraged Photos
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Food dishes and menu items</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Restaurant atmosphere and seating areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Family-friendly features (high chairs, kids' menus)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Clear, well-lit, and relevant images</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Prohibited Photos
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-600 mt-1" />
                  <span>Photos of people without their consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-600 mt-1" />
                  <span>Inappropriate, offensive, or graphic content</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-600 mt-1" />
                  <span>Copyrighted images or stolen content</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-600 mt-1" />
                  <span>Blurry, dark, or irrelevant images</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Interaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Interaction
          </CardTitle>
          <CardDescription>
            How to engage positively with other families in the YumZoom community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Helpful Interactions</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Vote on helpful reviews to highlight quality content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Connect with families who share similar preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Share recommendations thoughtfully</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-1" />
                  <span>Engage in respectful discussions about dining experiences</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Respect Boundaries</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-blue-600 mt-1" />
                  <span>Respect other families' privacy settings and preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-blue-600 mt-1" />
                  <span>Don't pressure others to change their ratings or reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-blue-600 mt-1" />
                  <span>Understand that taste preferences vary among families</span>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-3 w-3 text-blue-600 mt-1" />
                  <span>Report inappropriate content rather than engaging in conflicts</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enforcement and Consequences */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Enforcement and Consequences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700">
            We take community guidelines seriously to maintain a safe and helpful environment for all families.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">First Violation</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Warning notification</li>
                <li>• Content removal if needed</li>
                <li>• Educational guidance</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">Repeated Violations</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Temporary restrictions</li>
                <li>• Limited posting ability</li>
                <li>• Review of account standing</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">Severe Violations</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Account suspension</li>
                <li>• Permanent ban for serious offenses</li>
                <li>• Legal action if required</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporting System */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            Report Inappropriate Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-700">
              Help us maintain community standards by reporting content that violates our guidelines.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">How to Report</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click the "Report" button on any content</li>
                  <li>• Select the appropriate violation category</li>
                  <li>• Provide specific details about the issue</li>
                  <li>• Submit your report for review</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">What Happens Next</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Our moderation team reviews all reports</li>
                  <li>• Reports are handled confidentially</li>
                  <li>• Appropriate action is taken within 24-48 hours</li>
                  <li>• You may receive an update on the outcome</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Questions or Concerns?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Community Support</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For questions about these guidelines or community features.
              </p>
              <p className="text-sm">
                Email: <a href="mailto:community@yumzoom.com" className="text-blue-600 hover:underline">community@yumzoom.com</a>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Safety and Moderation</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For urgent safety concerns or serious violations.
              </p>
              <p className="text-sm">
                Email: <a href="mailto:safety@yumzoom.com" className="text-blue-600 hover:underline">safety@yumzoom.com</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These guidelines may be updated periodically to reflect community needs and platform improvements. 
          Users will be notified of significant changes. Last updated: {new Date().toLocaleDateString()}
        </AlertDescription>
      </Alert>
    </div>
  );
}
