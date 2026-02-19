'use client';

import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { AvgTransactionsChart } from '@/components/engagement/AvgTransactionsChart';
import { ChurnRateChart } from '@/components/engagement/ChurnRateChart';
import { CohortHeatmap } from '@/components/engagement/CohortHeatmap';
import { FeatureUsageChart } from '@/components/engagement/FeatureUsageChart';
import { InactivityFunnel } from '@/components/engagement/InactivityFunnel';
import { PredictiveRiskChart } from '@/components/engagement/PredictiveRiskChart';
import { RetentionCurveChart } from '@/components/engagement/RetentionCurveChart';
import { RFMMatrix } from '@/components/engagement/RFMMatrix';
import { TransactionFrequencyChart } from '@/components/engagement/TransactionFrequencyChart';
import { UserActivityChart } from '@/components/engagement/UserActivityChart';
import { VelocityDropChart } from '@/components/engagement/VelocityDropChart';
import { Tabs, TabsContent } from '@/components/Tabs';
import { useEffect, useState } from 'react';

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState('engagement');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEngagement() {
       try {
         const res = await fetch('/api/engagement');
         const json = await res.json();
         setData(json);
       } catch(e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    }
    fetchEngagement();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
       <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">User Engagement & Churn</h1>
          <p className="text-muted-foreground">Deep dive into user behavior, retention curves, and predictive churn insights.</p>
       </div>

       <div className="sticky top-0 z-30 bg-background -mx-4 px-4 md:-mx-8 md:px-8 py-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <Tabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            tabs={[
              { id: 'engagement', label: 'Engagement Trends' },
              { id: 'retention', label: 'Retention & Churn' },
              { id: 'insights', label: 'Predictive Insights' },
            ]} 
          />
       </div>

       <TabsContent value="engagement" activeTab={activeTab}>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <UserActivityChart data={data?.engagement} />
              <TransactionFrequencyChart data={data?.engagement?.frequency} />
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AvgTransactionsChart data={data?.engagement?.avg_transactions} />
              <FeatureUsageChart data={data?.engagement?.feature_usage} />
           </div>
       </TabsContent>

       <TabsContent value="retention" activeTab={activeTab}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               <RetentionCurveChart data={data?.retention?.curve} />
               <InactivityFunnel data={data?.retention?.inactivity_funnel} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
               <ChurnRateChart data={data?.retention?.churn_rate} />
               <CohortHeatmap data={data?.retention?.cohorts} />
            </div>
       </TabsContent>

       <TabsContent value="insights" activeTab={activeTab}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <RFMMatrix data={data?.insights?.rfm} />
                <PredictiveRiskChart data={data?.insights?.churn_risk} />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <VelocityDropChart data={data?.insights?.velocity_drop} />
            </div>
       </TabsContent>
    </div>
  );
}
