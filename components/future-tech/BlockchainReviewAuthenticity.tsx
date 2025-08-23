'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Hash, 
  Clock, 
  User, 
  Star,
  Lock,
  Unlock,
  QrCode,
  FileText,
  Download,
  Upload,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface BlockchainReview {
  id: string;
  restaurantId: string;
  userId: string;
  rating: number;
  text: string;
  photos: string[];
  timestamp: Date;
  blockchain: {
    hash: string;
    previousHash: string;
    merkleRoot: string;
    blockNumber: number;
    transactionId: string;
    gasUsed: number;
    confirmations: number;
    verified: boolean;
    immutable: boolean;
  };
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    score: number;
    factors: {
      location: boolean;
      timestamp: boolean;
      identity: boolean;
      content: boolean;
      photos: boolean;
    };
    proofs: string[];
  };
  authenticity: {
    score: number;
    indicators: {
      uniqueness: number;
      consistency: number;
      timeliness: number;
      engagement: number;
    };
    flags: string[];
  };
}

interface BlockchainStats {
  totalReviews: number;
  verifiedReviews: number;
  averageVerificationTime: number;
  integrityScore: number;
  networkHealth: number;
  consensusParticipation: number;
}

interface TrustMetrics {
  reviewerTrustScore: number;
  restaurantTrustScore: number;
  platformTrustScore: number;
  communityConsensus: number;
}

interface BlockchainAuthenticityProps {
  className?: string;
  onReviewVerify?: (reviewId: string, verified: boolean) => void;
}

export function BlockchainReviewAuthenticity({ className = '', onReviewVerify }: BlockchainAuthenticityProps) {
  const [reviews, setReviews] = useState<BlockchainReview[]>([]);
  const [stats, setStats] = useState<BlockchainStats>({
    totalReviews: 0,
    verifiedReviews: 0,
    averageVerificationTime: 0,
    integrityScore: 0,
    networkHealth: 0,
    consensusParticipation: 0,
  });
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics>({
    reviewerTrustScore: 0,
    restaurantTrustScore: 0,
    platformTrustScore: 0,
    communityConsensus: 0,
  });
  const [selectedReview, setSelectedReview] = useState<BlockchainReview | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');
  const [showVerificationDetails, setShowVerificationDetails] = useState<string | null>(null);

  const router = useRouter();

  // Mock blockchain review data
  const mockReviews: BlockchainReview[] = [
    {
      id: 'review-1',
      restaurantId: 'rest-1',
      userId: 'user-1',
      rating: 5,
      text: 'Amazing Italian restaurant with authentic pasta and friendly service. The tiramisu was incredible!',
      photos: ['photo1.jpg', 'photo2.jpg'],
      timestamp: new Date('2024-01-15T19:30:00'),
      blockchain: {
        hash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        previousHash: '0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
        merkleRoot: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        blockNumber: 1024,
        transactionId: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
        gasUsed: 21000,
        confirmations: 12,
        verified: true,
        immutable: true,
      },
      verification: {
        status: 'verified',
        score: 95,
        factors: {
          location: true,
          timestamp: true,
          identity: true,
          content: true,
          photos: true,
        },
        proofs: ['gps_location', 'timestamp_validation', 'identity_verification', 'photo_metadata'],
      },
      authenticity: {
        score: 92,
        indicators: {
          uniqueness: 95,
          consistency: 88,
          timeliness: 90,
          engagement: 96,
        },
        flags: [],
      },
    },
    {
      id: 'review-2',
      restaurantId: 'rest-2',
      userId: 'user-2',
      rating: 3,
      text: 'Average sushi place. Fish quality could be better.',
      photos: ['photo3.jpg'],
      timestamp: new Date('2024-01-14T20:15:00'),
      blockchain: {
        hash: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1',
        previousHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 1023,
        transactionId: '0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef2345',
        gasUsed: 19500,
        confirmations: 25,
        verified: true,
        immutable: true,
      },
      verification: {
        status: 'verified',
        score: 87,
        factors: {
          location: true,
          timestamp: true,
          identity: true,
          content: true,
          photos: false,
        },
        proofs: ['gps_location', 'timestamp_validation', 'identity_verification'],
      },
      authenticity: {
        score: 85,
        indicators: {
          uniqueness: 90,
          consistency: 82,
          timeliness: 85,
          engagement: 83,
        },
        flags: ['low_engagement'],
      },
    },
    {
      id: 'review-3',
      restaurantId: 'rest-3',
      userId: 'user-3',
      rating: 4,
      text: 'Great Mexican food with authentic flavors. Highly recommend the tacos!',
      photos: [],
      timestamp: new Date('2024-01-13T18:45:00'),
      blockchain: {
        hash: '0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1b2',
        previousHash: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1',
        merkleRoot: '0x567890abcdef567890abcdef567890abcdef567890abcdef567890abcdef5678',
        blockNumber: 1022,
        transactionId: '0x34567890abcdef34567890abcdef34567890abcdef34567890abcdef345678',
        gasUsed: 18000,
        confirmations: 38,
        verified: false,
        immutable: false,
      },
      verification: {
        status: 'pending',
        score: 72,
        factors: {
          location: true,
          timestamp: true,
          identity: false,
          content: true,
          photos: false,
        },
        proofs: ['gps_location', 'timestamp_validation'],
      },
      authenticity: {
        score: 68,
        indicators: {
          uniqueness: 75,
          consistency: 70,
          timeliness: 65,
          engagement: 62,
        },
        flags: ['identity_unverified', 'suspicious_timing'],
      },
    },
  ];

  useEffect(() => {
    setReviews(mockReviews);
    calculateStats(mockReviews);
    calculateTrustMetrics(mockReviews);
  }, []);

  // Calculate blockchain statistics
  const calculateStats = (reviews: BlockchainReview[]) => {
    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(r => r.verification.status === 'verified').length;
    const verificationTimes = reviews
      .filter(r => r.verification.status === 'verified')
      .map(r => Math.random() * 300 + 30); // Mock verification times in seconds
    
    const averageVerificationTime = verificationTimes.length > 0 
      ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length 
      : 0;

    const integrityScore = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.authenticity.score, 0) / reviews.length 
      : 0;

    setStats({
      totalReviews,
      verifiedReviews,
      averageVerificationTime,
      integrityScore,
      networkHealth: 98.5, // Mock network health
      consensusParticipation: 89.2, // Mock consensus participation
    });
  };

  // Calculate trust metrics
  const calculateTrustMetrics = (reviews: BlockchainReview[]) => {
    if (reviews.length === 0) return;

    const reviewerTrustScore = reviews.reduce((sum, r) => sum + r.verification.score, 0) / reviews.length;
    const restaurantTrustScore = 87.5; // Mock restaurant trust score
    const platformTrustScore = 94.2; // Mock platform trust score
    const communityConsensus = reviews.filter(r => r.verification.status === 'verified').length / reviews.length * 100;

    setTrustMetrics({
      reviewerTrustScore,
      restaurantTrustScore,
      platformTrustScore,
      communityConsensus,
    });
  };

  // Verify review on blockchain
  const verifyReview = async (reviewId: string) => {
    setIsVerifying(true);
    
    try {
      // Mock blockchain verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            blockchain: {
              ...review.blockchain,
              verified: true,
              immutable: true,
              confirmations: review.blockchain.confirmations + 1,
            },
            verification: {
              ...review.verification,
              status: 'verified' as const,
              score: Math.min(100, review.verification.score + 10),
            },
          };
        }
        return review;
      }));

      if (onReviewVerify) {
        onReviewVerify(reviewId, true);
      }

      toast.success('Review verified and added to blockchain');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify review on blockchain');
    } finally {
      setIsVerifying(false);
    }
  };

  // Generate proof of authenticity
  const generateProof = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Mock proof generation
      const proof = {
        reviewId,
        hash: review.blockchain.hash,
        timestamp: review.timestamp,
        verificationScore: review.verification.score,
        authenticityScore: review.authenticity.score,
      };

      const proofText = JSON.stringify(proof, null, 2);
      const blob = new Blob([proofText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `proof-${reviewId}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Proof of authenticity downloaded');
    } catch (error) {
      console.error('Proof generation error:', error);
      toast.error('Failed to generate proof');
    }
  };

  // Get verification status color
  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get authenticity score color
  const getAuthenticityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Render review card
  const renderReviewCard = (review: BlockchainReview) => {
    return (
      <Card key={review.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Badge
                variant={review.verification.status === 'verified' ? "default" : 
                        review.verification.status === 'pending' ? "secondary" : "destructive"}
                className="text-xs"
              >
                {review.blockchain.verified ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                {review.verification.status}
              </Badge>
            </div>
            
            <div className="text-right text-sm text-gray-500">
              <p>{review.timestamp.toLocaleDateString()}</p>
              <p>Block #{review.blockchain.blockNumber}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-3 line-clamp-3">{review.text}</p>

          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Verification Score:</span>
                <span className={getVerificationColor(review.verification.status)}>
                  {review.verification.score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Authenticity Score:</span>
                <span className={getAuthenticityColor(review.authenticity.score)}>
                  {review.authenticity.score}%
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Confirmations:</span>
                <span>{review.blockchain.confirmations}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas Used:</span>
                <span>{review.blockchain.gasUsed}</span>
              </div>
            </div>
          </div>

          {review.authenticity.flags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {review.authenticity.flags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs text-red-600 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {flag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReview(review)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
            
            {review.verification.status !== 'verified' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyReview(review.id)}
                disabled={isVerifying}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify
              </Button>
            )}
            
            {review.blockchain.verified && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateProof(review.id)}
              >
                <Download className="h-3 w-3 mr-1" />
                Proof
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Blockchain Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Blockchain Review Authenticity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verifiedReviews}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.integrityScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Integrity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageVerificationTime)}s</div>
              <div className="text-sm text-gray-600">Avg Verification</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trust">Trust Metrics</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(renderReviewCard)}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['location', 'timestamp', 'identity', 'content', 'photos'].map((factor) => {
                    const percentage = reviews.reduce((sum, r) => 
                      sum + (r.verification.factors[factor as keyof typeof r.verification.factors] ? 1 : 0), 0
                    ) / reviews.length * 100;
                    
                    return (
                      <div key={factor}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{factor}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authenticity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'High (90-100)', range: [90, 100], color: 'bg-green-500' },
                    { label: 'Good (75-89)', range: [75, 89], color: 'bg-yellow-500' },
                    { label: 'Fair (60-74)', range: [60, 74], color: 'bg-orange-500' },
                    { label: 'Poor (0-59)', range: [0, 59], color: 'bg-red-500' },
                  ].map((category) => {
                    const count = reviews.filter(r => 
                      r.authenticity.score >= category.range[0] && r.authenticity.score <= category.range[1]
                    ).length;
                    const percentage = (count / reviews.length) * 100;
                    
                    return (
                      <div key={category.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.label}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trust" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Reviewer Trust</span>
                    <span>{trustMetrics.reviewerTrustScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={trustMetrics.reviewerTrustScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Restaurant Trust</span>
                    <span>{trustMetrics.restaurantTrustScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={trustMetrics.restaurantTrustScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Platform Trust</span>
                    <span>{trustMetrics.platformTrustScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={trustMetrics.platformTrustScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Community Consensus</span>
                    <span>{trustMetrics.communityConsensus.toFixed(1)}%</span>
                  </div>
                  <Progress value={trustMetrics.communityConsensus} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trust Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-gold-500" />
                      <span className="text-sm">Verified Reviewers</span>
                    </div>
                    <Badge variant="default">{stats.verifiedReviews}/{stats.totalReviews}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Blockchain Secured</span>
                    </div>
                    <Badge variant="default">100%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Real-time Verification</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">Trust Trending</span>
                    </div>
                    <Badge variant="default">+5.2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Network Uptime</span>
                    <span>{stats.networkHealth.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.networkHealth} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Consensus Participation</span>
                    <span>{stats.consensusParticipation.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.consensusParticipation} className="h-2" />
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Active Nodes: 247</p>
                    <p>Block Time: 15.2s avg</p>
                    <p>Transaction Fee: 0.002 ETH</p>
                    <p>Last Block: #{Math.max(...reviews.map(r => r.blockchain.blockNumber))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blockchain Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Hash className="h-4 w-4 mr-2" />
                    View Transaction History
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Verification
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Audit Trail
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync with Network
                  </Button>
                </div>
                
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Network Status</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Latest Block:</span>
                      <span>0x{Math.random().toString(16).substring(2, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Price:</span>
                      <span>23 Gwei</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Fee:</span>
                      <span>$0.45</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Review Blockchain Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReview(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Review Content</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedReview.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{selectedReview.text}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Blockchain Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Hash:</span>
                    <span className="font-mono text-xs">{selectedReview.blockchain.hash.substring(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Block Number:</span>
                    <span>#{selectedReview.blockchain.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">{selectedReview.blockchain.transactionId.substring(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Used:</span>
                    <span>{selectedReview.blockchain.gasUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmations:</span>
                    <span>{selectedReview.blockchain.confirmations}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Verification Status</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Verification Score</p>
                      <p className={`text-lg font-bold ${getVerificationColor(selectedReview.verification.status)}`}>
                        {selectedReview.verification.score}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Authenticity Score</p>
                      <p className={`text-lg font-bold ${getAuthenticityColor(selectedReview.authenticity.score)}`}>
                        {selectedReview.authenticity.score}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-medium mb-2">Verification Factors</p>
                    <div className="space-y-1">
                      {Object.entries(selectedReview.verification.factors).map(([factor, verified]) => (
                        <div key={factor} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{factor.replace('_', ' ')}</span>
                          {verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => generateProof(selectedReview.id)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Proof
                </Button>
                
                {selectedReview.verification.status !== 'verified' && (
                  <Button
                    onClick={() => verifyReview(selectedReview.id)}
                    disabled={isVerifying}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to check blockchain availability
export function useBlockchainAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check for Web3 capabilities
    const hasWeb3 = typeof window !== 'undefined' && 
      ((window as any).ethereum || (window as any).web3 || 'crypto' in window);
    setIsAvailable(hasWeb3);
  }, []);

  return isAvailable;
}

// Blockchain Authentication Button Component
interface BlockchainAuthenticityButtonProps {
  onOpen?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BlockchainAuthenticityButton({ onOpen, disabled = false, className = '' }: BlockchainAuthenticityButtonProps) {
  const [showBlockchain, setShowBlockchain] = useState(false);
  const isAvailable = useBlockchainAvailable();

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else {
      setShowBlockchain(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled || !isAvailable}
        className={className}
        variant="outline"
      >
        <Shield className="h-4 w-4 mr-2" />
        Blockchain Verify
      </Button>

      {showBlockchain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Blockchain Review Authenticity</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockchain(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <BlockchainReviewAuthenticity />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
