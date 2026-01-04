import { Request, Response } from 'express';
import { trackEvent, findAnalyticsByCampaign, findAllAnalytics } from './analytics.crud';
import { CampaignAnalyticsSummary, SourceMetrics } from './analytics.interface';

/* ========== PUBLIC TRACKING HANDLERS ========== */

export const trackView = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const source = (req.query.source as string) || 'direct';
    await trackEvent(slug, 'views', source);
    res.status(200).json({ success: true, event: 'view', slug, source });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const trackPlay = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const source = (req.query.source as string) || 'direct';
    await trackEvent(slug, 'plays', source);
    res.status(200).json({ success: true, event: 'play', slug, source });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const trackComplete = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const source = (req.query.source as string) || 'direct';
    await trackEvent(slug, 'completes', source);
    res.status(200).json({ success: true, event: 'complete', slug, source });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const trackClick = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const source = (req.query.source as string) || 'direct';
    await trackEvent(slug, 'clicks', source);
    res.status(200).json({ success: true, event: 'click', slug, source });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ========== PROTECTED ANALYTICS HANDLERS (Admin) ========== */

export const getAnalyticsByCampaign = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { startDate, endDate } = req.query;

    const records = await findAnalyticsByCampaign(
      slug,
      startDate as string,
      endDate as string
    );

    // Aggregate data
    let totalViews = 0, totalPlays = 0, totalCompletes = 0, totalClicks = 0;
    const bySource: Record<string, SourceMetrics> = {};
    const byDate: { date: string; views: number; plays: number; completes: number; clicks: number }[] = [];

    for (const record of records) {
      totalViews += record.totalViews;
      totalPlays += record.totalPlays;
      totalCompletes += record.totalCompletes;
      totalClicks += record.totalClicks;

      byDate.push({
        date: record.date,
        views: record.totalViews,
        plays: record.totalPlays,
        completes: record.totalCompletes,
        clicks: record.totalClicks,
      });

      if (record.bySource) {
        record.bySource.forEach((metrics, source) => {
          if (!bySource[source]) {
            bySource[source] = { views: 0, plays: 0, completes: 0, clicks: 0 };
          }
          bySource[source].views += metrics.views;
          bySource[source].plays += metrics.plays;
          bySource[source].completes += metrics.completes;
          bySource[source].clicks += metrics.clicks;
        });
      }
    }

    const conversionRate = totalPlays > 0 ? (totalClicks / totalPlays) * 100 : 0;

    const summary: CampaignAnalyticsSummary = {
      campaignSlug: slug,
      totalViews,
      totalPlays,
      totalCompletes,
      totalClicks,
      conversionRate: Math.round(conversionRate * 100) / 100,
      bySource,
      byDate,
    };

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllAnalytics = async (_req: Request, res: Response) => {
  try {
    const records = await findAllAnalytics();

    // Group by campaign
    const byCampaign: Record<string, { views: number; plays: number; completes: number; clicks: number }> = {};

    for (const record of records) {
      if (!byCampaign[record.campaignSlug]) {
        byCampaign[record.campaignSlug] = { views: 0, plays: 0, completes: 0, clicks: 0 };
      }
      byCampaign[record.campaignSlug].views += record.totalViews;
      byCampaign[record.campaignSlug].plays += record.totalPlays;
      byCampaign[record.campaignSlug].completes += record.totalCompletes;
      byCampaign[record.campaignSlug].clicks += record.totalClicks;
    }

    const summary = Object.entries(byCampaign).map(([campaignSlug, data]) => ({
      campaignSlug,
      ...data,
      conversionRate: data.plays > 0 ? Math.round((data.clicks / data.plays) * 10000) / 100 : 0,
    }));

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
