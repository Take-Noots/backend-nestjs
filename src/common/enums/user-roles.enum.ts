export enum UserRole {
  NORMAL = 'normal',
  MODERATOR = 'moderator',
  BUSINESS = 'business',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum PostStatus {
  ACTIVE = 'active',
  FLAGGED = 'flagged',
  DELETED = 'deleted',
  PENDING = 'pending'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT_VIOLATION = 'copyright_violation',
  FAKE_INFORMATION = 'fake_information',
  OTHER = 'other'
}