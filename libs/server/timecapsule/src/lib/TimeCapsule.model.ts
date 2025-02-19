export interface TimeCapsule {
  id: string;
  message: string;
  recipientEmail: string;
  scheduledDate: Date;
  createdAt: Date;
  status: 'pending' | 'sent' | 'failed';
}
