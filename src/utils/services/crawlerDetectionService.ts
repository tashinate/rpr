import { BotDetectionService } from '../bot/botDetectionService';

export const botDetection = new BotDetectionService();

// Export types for external use
export type { BotDetectionResult } from '../bot/types';