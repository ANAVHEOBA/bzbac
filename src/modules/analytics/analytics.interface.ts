export interface SourceMetrics {
  views: number;
  plays: number;
  completes: number;
  clicks: number;
}

export interface AnalyticsDto {
  campaignSlug: string;
  date: string;
  bySource: Record<string, SourceMetrics>;
  totalViews: number;
  totalPlays: number;
  totalCompletes: number;
  totalClicks: number;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

export interface CampaignAnalyticsSummary {
  campaignSlug: string;
  totalViews: number;
  totalPlays: number;
  totalCompletes: number;
  totalClicks: number;
  conversionRate: number;
  bySource: Record<string, SourceMetrics>;
  byDate: { date: string; views: number; plays: number; completes: number; clicks: number }[];
}
