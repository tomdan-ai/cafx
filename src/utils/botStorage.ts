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
  meta?: any[];
}

const STORAGE_KEY = 'bot_configurations';

// Save bot configuration to localStorage
export function saveBotConfig(config: BotConfig): void {
  try {
    console.log('💾 saveBotConfig called with:', config);
    const existing = getBotConfigs();
    console.log('📚 Existing configs count:', existing.length);
    const updated = existing.filter(c => c.bot_id !== config.bot_id);
    updated.push(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('✅ Config saved! Total configs:', updated.length);
  } catch (error) {
    console.error('❌ saveBotConfig error:', error);
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
export function getBotConfig(botId: string | number): BotConfig | null {
  try {
    const configs = getBotConfigs();
    const idStr = String(botId);
    console.log('🔎 getBotConfig searching for:', idStr);
    console.log('📚 All stored configs:', configs.map(c => ({ bot_id: c.bot_id, task_id: c.task_id })));

    const found = configs.find(c =>
      String(c.bot_id) === idStr ||
      String(c.task_id) === idStr
    );
    console.log('🎯 Found config:', found ? 'YES' : 'NO');
    return found || null;
  } catch (error) {
    console.error('❌ getBotConfig error:', error);
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

// Hidden/deleted bots storage (bots stopped by user that shouldn't show again)
const HIDDEN_BOTS_KEY = 'hidden_bots';

interface HiddenBot {
  id: string;
  task_id?: string;
  hidden_at: string;
}

// Add a bot to the hidden list
export function hideBot(botId: string, taskId?: string): void {
  try {
    const hidden = getHiddenBots();
    // Avoid duplicates
    if (!hidden.some(h => h.id === botId)) {
      hidden.push({
        id: botId,
        task_id: taskId,
        hidden_at: new Date().toISOString()
      });
      localStorage.setItem(HIDDEN_BOTS_KEY, JSON.stringify(hidden));
      console.log('🙈 Bot hidden:', botId);
    }
  } catch (error) {
    console.error('❌ hideBot error:', error);
  }
}

// Get all hidden bot IDs
export function getHiddenBots(): HiddenBot[] {
  try {
    const stored = localStorage.getItem(HIDDEN_BOTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}

// Check if a bot is hidden
export function isBotHidden(botId: string, taskId?: string): boolean {
  const hidden = getHiddenBots();
  return hidden.some(h =>
    h.id === botId ||
    (taskId && h.task_id === taskId) ||
    (h.task_id && h.task_id === botId)
  );
}

// Remove a bot from hidden list (if user wants to see it again)
export function unhideBot(botId: string): void {
  try {
    const hidden = getHiddenBots();
    const filtered = hidden.filter(h => h.id !== botId && h.task_id !== botId);
    localStorage.setItem(HIDDEN_BOTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    // Silently fail
  }
}

// Clean up old hidden bots (older than 30 days)
export function cleanupHiddenBots(): void {
  try {
    const hidden = getHiddenBots();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = hidden.filter(h => {
      const hiddenAt = new Date(h.hidden_at).getTime();
      return hiddenAt > thirtyDaysAgo;
    });
    localStorage.setItem(HIDDEN_BOTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    // Silently fail
  }
}
