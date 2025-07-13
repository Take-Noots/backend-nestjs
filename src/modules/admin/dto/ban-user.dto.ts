export class BanUserDto {
  reason: string;
  duration?: number; // Duration in hours, if not provided = permanent ban
  bannedBy: string; // Admin user ID
}