/**
 * PATTERN TESTING DASHBOARD
 * 
 * Component for testing and validating inbox-safe URL patterns
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, TestTube, BarChart3, Shield } from 'lucide-react';
import { PatternTester, TestSummary } from '@/utils/patterns/patternTester';
import { InboxSafePatternManager } from '@/utils/patterns/inboxSafePatternManager';

export default function PatternTestingDashboard() {
  const [testResults, setTestResults] = useState<TestSummary | null>(null);
  const [diversityResults, setDiversityResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const patternTester = new PatternTester();
  const patternManager = InboxSafePatternManager.getInstance();

  const handleTestAllPatterns = async () => {
    setIsLoading(true);
    try {
      const results = await patternTester.testAllPatterns();
      setTestResults(results);
    } catch (error) {
      console.error('Pattern testing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCategory = async (category: string) => {
    setIsLoading(true);
    try {
      const results = await patternTester.testPatternsByCategory(category);
      setTestResults(results);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Category testing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDiversity = async () => {
    setIsLoading(true);
    try {
      const results = await patternTester.testPatternDiversity(100);
      setDiversityResults(results);
    } catch (error) {
      console.error('Diversity testing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTestUrl = () => {
    const testResult = patternManager.testPatternGeneration();
    if (testResult) {
      console.log('Test URL Generated:', testResult);
      alert(`Test URL: ${testResult.finalUrl}\nTrust Score: ${testResult.trustScore}\nInbox Rate: ${testResult.expectedInboxRate}%`);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pattern Testing Dashboard</h2>
          <p className="text-muted-foreground">
            Test and validate inbox-safe URL patterns for optimal email delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateTestUrl} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Generate Test URL
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Tests</TabsTrigger>
          <TabsTrigger value="diversity">Diversity Tests</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patternManager.getPatternStats().totalPatterns}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inbox-safe patterns available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {patternManager.getPatternStats().averageTrustScore.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of 100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Inbox Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {patternManager.getPatternStats().averageInboxRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Expected delivery rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Status</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {testResults ? (
                    <span className={getScoreColor(testResults.successRate)}>
                      {testResults.successRate.toFixed(1)}%
                    </span>
                  ) : (
                    'Not Tested'
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pattern success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Run comprehensive tests on the pattern system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleTestAllPatterns} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Testing...' : 'Test All Patterns'}
                </Button>
                <Button 
                  onClick={handleTestDiversity} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Test Pattern Diversity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Categories</CardTitle>
                <CardDescription>
                  Test patterns by specific categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {['microsoft', 'corporate', 'government', 'education', 'business'].map(category => (
                  <Button
                    key={category}
                    onClick={() => handleTestCategory(category)}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="mr-2 mb-2"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {testResults && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Summary</CardTitle>
                  <CardDescription>
                    Results for {selectedCategory === 'all' ? 'all patterns' : `${selectedCategory} category`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.successfulPatterns}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {testResults.failedPatterns}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(testResults.successRate)}`}>
                        {testResults.successRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {testResults.commonIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Common Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {testResults.commonIssues.map((issue, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Pattern Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testResults.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.success)}
                          <span className="font-medium">{result.patternName}</span>
                          <Badge variant="outline">Trust: {result.trustScore}</Badge>
                          <Badge variant="outline">Inbox: {result.inboxRate}%</Badge>
                        </div>
                        {!result.success && (
                          <div className="text-sm text-red-600">
                            {result.issues.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="diversity" className="space-y-4">
          {diversityResults && (
            <Card>
              <CardHeader>
                <CardTitle>Pattern Diversity Results</CardTitle>
                <CardDescription>
                  Analysis of URL pattern uniqueness and rotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {diversityResults.uniqueUrls}
                    </div>
                    <div className="text-sm text-muted-foreground">Unique URLs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {diversityResults.totalGenerated}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Generated</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(diversityResults.diversityScore)}`}>
                      {diversityResults.diversityScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Diversity Score</div>
                  </div>
                </div>
                
                {diversityResults.duplicates.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">Duplicate URLs Found:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {diversityResults.duplicates.map((url: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground font-mono">
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(patternManager.getPatternStats().patternsByCategory).map(([category, count]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category}</CardTitle>
                  <CardDescription>{count} patterns available</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTestCategory(category)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Test {category} Patterns
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
