import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProspectLead extends Document {
  kind: 'fit' | 'walkthrough';
  name: string;
  email: string;
  storeUrl?: string | null;
  stage?: 'operating' | 'prelaunch' | 'not_shopify' | null;
  goal?: 'branded_app' | 'other' | null;
  outcome?: 'operating_fit' | 'prelaunch_fit' | 'website_first' | null;
  outcomeTitle?: string | null;
  note?: string | null;
  preferredWindow?: string | null;
  ipAddress?: string;
  createdAt: Date;
}

const ProspectLeadSchema = new Schema<IProspectLead>(
  {
    kind: { type: String, required: true, enum: ['fit', 'walkthrough'] },
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 100 },
    storeUrl: { type: String, maxlength: 300 },
    stage: { type: String, enum: ['operating', 'prelaunch', 'not_shopify'] },
    goal: { type: String, enum: ['branded_app', 'other'] },
    outcome: { type: String, enum: ['operating_fit', 'prelaunch_fit', 'website_first'] },
    outcomeTitle: { type: String, maxlength: 200 },
    note: { type: String, maxlength: 2000 },
    preferredWindow: { type: String, maxlength: 200 },
    ipAddress: { type: String, maxlength: 50 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProspectLeadSchema.index({ createdAt: -1 });
ProspectLeadSchema.index({ kind: 1, createdAt: -1 });
ProspectLeadSchema.index({ email: 1 });

export const ProspectLead: Model<IProspectLead> =
  mongoose.models.ProspectLead || mongoose.model<IProspectLead>('ProspectLead', ProspectLeadSchema);
