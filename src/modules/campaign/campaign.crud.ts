import { CampaignModel, ICampaign } from './campaign.model';
import { CampaignDto } from './campaign.interface';

export const createCampaign = async (data: CampaignDto): Promise<ICampaign> =>
  CampaignModel.create(data);

export const findCampaignBySlug = async (slug: string): Promise<ICampaign | null> =>
  CampaignModel.findOne({ slug });

export const listCampaigns = async (): Promise<ICampaign[]> =>
  CampaignModel.find().sort({ createdAt: -1 });