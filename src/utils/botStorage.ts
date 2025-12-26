// Utility for storing and retrieving bot configurations in localStorage

interface BotConfig {
  bot_id: string;
  task_id: string;
  name?: string;
  mode: 'auto' | 'manual';
  type: 'spot' | 'futures';
  exchange: string;
  symbol: string;
  grid_size: number;
  upper_price?: number;
  lower_price?: number;
  investment_amount: number;
  run_hours: number;
  leverage?: number;
  strategy_type?: string;
  created_at: string;
  api_response?: any; // Store complete API response for additional details
}

const STORAGE_KEY = 'bot_configurations';

// Save bot configuration to localStorage
export function saveBotConfig(config: BotConfig): void {
  try {
    const existing = getBotConfigs();
    const updated = existing.filter(c => c.bot_id !== config.bot_id);
    updated.push(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

// Get all bot configurations
export function getBotConfigs(): BotConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}

// Get configuration for a specific bot
export function getBotConfig(botId: string): BotConfig | null {
  try {
    const configs = getBotConfigs();
    return configs.find(c => c.bot_id === botId || c.task_id === botId) || null;
  } catch (error) {
    return null;
  }
}

// Delete bot configuration
export function deleteBotConfig(botId: string): void {
  try {
    const existing = getBotConfigs();
    const updated = existing.filter(c => c.bot_id !== botId && c.task_id !== botId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail
  }
}

// Clean up old configurations (older than 30 days)
export function cleanupOldConfigs(): void {
  try {
    const configs = getBotConfigs();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = configs.filter(c => {
      const createdAt = new Date(c.created_at).getTime();
      return createdAt > thirtyDaysAgo;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    // Silently fail
  }
}
