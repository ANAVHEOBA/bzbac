import { AnalyticsModel, IAnalytics } from './analytics.model';

const getToday = (): string => new Date().toISOString().split('T')[0];

export const trackEvent = async (
  campaignSlug: string,
  eventType: 'views' | 'plays' | 'completes' | 'clicks',
  source: string = 'direct'
): Promise<IAnalytics | null> => {
  const date = getToday();
  const normalizedSource = source.toLowerCase().trim() || 'direct';

  const totalField = `total${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;

  return AnalyticsModel.findOneAndUpdate(
    { campaignSlug, date },
    {
      $inc: {
        [`bySource.${normalizedSource}.${eventType}`]: 1,
        [totalField]: 1,
      },
    },
    { upsert: true, new: true }
  );
};

export const findAnalyticsByCampaign = async (
  campaignSlug: string,
  startDate?: string,
  endDate?: string
): Promise<IAnalytics[]> => {
  const query: any = { campaignSlug };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return AnalyticsModel.find(query).sort({ date: -1 });
};

export const findAllAnalytics = async (): Promise<IAnalytics[]> =>
  AnalyticsModel.find().sort({ campaignSlug: 1, date: -1 });
