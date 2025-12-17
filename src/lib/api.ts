/* eslint-disable @typescript-eslint/no-explicit-any */
// API Service for MMBot
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth headers
function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gcbex_token') : null);
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

// ============================================
// Auth API
// ============================================

export interface QRCodeResponse {
  code: string;
  msg: string;
  data: {
    qrcodeId: string;
    qrcodeUrl: string;
  } | null;
}

export interface QRStatusResponse {
  code: string;
  msg: string;
  data: {
    status: string;
    token?: string;
    uid?: string;
  } | null;
}

export const authAPI = {
  async getQRCode(): Promise<QRCodeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/qrcode`);
    return response.json();
  },

  async checkQRStatus(qrcodeId: string): Promise<QRStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/qrcode/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrcodeId }),
    });
    return response.json();
  },
};

// ============================================
// Market Data API
// ============================================

export interface MarketRate {
  [coin: string]: string | number; // API returns strings, but can be converted to numbers
}

export interface RatesResponse {
  code: string;
  msg: string;
  data: {
    rate: {
      [fiat: string]: MarketRate;
    };
    lang_coin: string;
    coin_precision: string;
  } | null;
}

export interface Contract {
  id: number;
  contractName: string;
  symbol: string;
  contractType: string;
  multiplier: number;
  marginCoin: string;
  base: string;
  quote: string;
  maxLever: number;
  minLever: number;
}

export interface PublicInfoResponse {
  code: string;
  msg: string;
  data: {
    marginCoinList: string[];
    contractList: Contract[];
    currentTimeMillis: number;
    wsUrl: string;
  } | null;
}

export interface TickerData {
  lastPrice: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  change24h: string;
  changePercent24h: string;
}

export interface TickerResponse {
  code: string;
  msg: string;
  data: {
    [symbol: string]: TickerData;
  } | null;
}

export const marketAPI = {
  async getRates(fiat: string = 'USD'): Promise<RatesResponse> {
    const response = await fetch(`${API_BASE_URL}/api/market/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fiat }),
    });
    return response.json();
  },

  async getPublicInfo(): Promise<PublicInfoResponse> {
    const response = await fetch(`${API_BASE_URL}/api/market/public-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return response.json();
  },

  async getTicker(symbols: string[]): Promise<TickerResponse> {
    const response = await fetch(`${API_BASE_URL}/api/market/ticker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    });
    return response.json();
  },

  async getOTCPublicInfo(): Promise<Record<string, unknown>> {
    const response = await fetch(`${API_BASE_URL}/api/market/otc-public-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return response.json();
  },
};

// ============================================
// User API
// ============================================

export interface UserInfo {
  uid: string;
  token: string;
  last_login: string;
  created_at: string;
}

export interface UserResponse {
  code: string;
  msg: string;
  data: UserInfo | null;
}

export interface DetailedUserInfo {
  id: number;
  nickName: string;
  email: string;
  mobileNumber: string;
  realName: string;
  feeCoin: string;
  feeCoinRate: string;
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

export interface DetailedUserResponse {
  code: string;
  msg: string;
  data: DetailedUserInfo | null;
}

export interface CoinBalance {
  coinName: string;
  showName: string;
  icon: string;
  total_balance: string;
  normal_balance: string;
  lock_balance: string;
  btcValuatin: string;
  allBalance: string;
  exchange_symbol: string;
  sort: number;
}

export interface Balance {
  totalBalance: string;
  totalBalanceSymbol: string;
  yesterdayProfit: string;
  yesterdayProfitRate: string;
  allCoinMap: {
    [coinName: string]: CoinBalance;
  };
}

export interface BalanceResponse {
  code: string;
  msg: string;
  data: Balance | null;
  rateLimited?: boolean;
  waitTime?: number;
}

// ============================================
// Bot Conditions API
// ============================================

export type ConditionField = 'GCB_QUANTITY' | 'USDT_QUANTITY' | 'GCB_PRICE' | 'USDT_PRICE' | 'BTC_PRICE' | 'ETH_PRICE';
export type ConditionOperator = 'ABOVE' | 'BELOW' | 'EQUAL' | 'NOT_EQUAL';
export type ActionType = 'BUY_MARKET' | 'SELL_MARKET' | 'BUY_LIMIT' | 'SELL_LIMIT';
export type ActionField = 'GCB_QUANTITY' | 'USDT_VALUE';

export interface BotCondition {
  _id?: string;
  userId: string;
  name: string;
  isActive: boolean;
  
  // Condition
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: number;
  
  // Action
  actionType: ActionType;
  actionField: ActionField;
  actionValue: number;
  
  // Optional: Limit price for limit orders
  limitPrice?: number;
  
  // Metadata
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotConditionResponse {
  code: string;
  msg: string;
  data: BotCondition | null;
}

export interface BotConditionsListResponse {
  code: string;
  msg: string;
  data: BotCondition[] | null;
}

export interface BotStatus {
  isRunning: boolean;
  marketData: Record<string, any>;
  activeConditionsCount: number;
  config?: any;
  uptime?: string;
}

export interface BotStatusResponse {
  code: string;
  msg: string;
  data: BotStatus | null;
}

export interface BotLog {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

export interface BotLogsResponse {
  code: string;
  msg: string;
  data: BotLog[] | null;
}

export interface BotTrade {
  _id?: string;
  conditionId: string;
  conditionName: string;
  userId: string;
  orderId?: number;
  symbol: string;
  side: string;
  type: string;
  volume: number;
  price?: number | null;
  status: 'success' | 'failed' | 'error';
  error?: string;
  executedAt: Date;
  apiResponse?: any;
}

export interface BotTradesResponse {
  code: string;
  msg: string;
  data: BotTrade[] | null;
}

export interface MarketData {
  symbol: string;
  price: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  timestamp: Date;
}

export interface MarketDataResponse {
  code: string;
  msg: string;
  data: Record<string, MarketData> | null;
}

export const botAPI = {
  async createCondition(condition: Omit<BotCondition, '_id' | 'createdAt' | 'updatedAt' | 'triggerCount'>, token?: string): Promise<BotConditionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/conditions`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(condition),
    });
    return response.json();
  },

  async getConditions(token?: string): Promise<BotConditionsListResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/conditions`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async updateCondition(id: string, updates: Partial<BotCondition>, token?: string): Promise<BotConditionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/conditions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deleteCondition(id: string, token?: string): Promise<{ code: string; msg: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/conditions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async toggleCondition(id: string, isActive: boolean, token?: string): Promise<BotConditionResponse> {
    return this.updateCondition(id, { isActive }, token);
  },

  async start(token?: string): Promise<BotStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/start`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async stop(token?: string): Promise<BotStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stop`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getStatus(token?: string): Promise<BotStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/status`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getLogs(limit: number = 100, token?: string): Promise<BotLogsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/logs?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getMarketData(token?: string): Promise<MarketDataResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-data`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getTrades(limit: number = 50, token?: string): Promise<BotTradesResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/trades?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async enableUserBot(token?: string): Promise<{ code: string; msg: string; data: { botEnabled: boolean } | null }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/user/enable`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async disableUserBot(token?: string): Promise<{ code: string; msg: string; data: { botEnabled: boolean } | null }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/user/disable`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getUserBotStatus(token?: string): Promise<{ code: string; msg: string; data: { botEnabled: boolean; botEnabledAt: string | null; botDisabledAt: string | null } | null }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/user/status`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getAdminLogs(limit: number = 100, token?: string): Promise<{ code: string; msg: string; data: any[] | null }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/admin-logs?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

export const userAPI = {
  async getMe(token?: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getInfo(token?: string): Promise<DetailedUserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/info`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({}),
    });
    return response.json();
  },

  async getBalance(accountType: number = 1, token?: string): Promise<BalanceResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/balance`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ accountType }),
    });
    return response.json();
  },
};

// ============================================
// Trade API
// ============================================

export interface TradeOrderRequest {
  side: 'BUY' | 'SELL';
  type: 1 | 2; // 1 = LIMIT, 2 = MARKET
  symbol: string;
  volume: string;
  price?: string | null;
  triggerPrice?: string | null;
}

export interface TradeResponse {
  // Wrapped response format (old API)
  code?: string;
  msg?: string;
  data?: any;
  
  // Direct GCBEX API response format (Open API)
  orderId?: number;
  orderIdString?: string;
  symbol?: string;
  side?: string;
  type?: string;
  price?: string | null;
  origQty?: number;
  executedQty?: number;
  status?: number;
  transactTime?: number;
  clientOrderId?: string | null;
}

export interface OpenOrder {
  orderId: number;
  orderIdString: string;
  symbol: string;
  side: string;
  type: string;
  price: string;
  origQty: string;
  executedQty: string;
  avgPrice: string;
  status: string;
  time: string;
  stopPrice?: number;
  isWorking?: boolean;
}

export interface OpenOrdersResponse {
  code: string;
  msg: string;
  data: OpenOrder[] | null;
}

export const tradeAPI = {
  // Place a trade order (Market or Limit) - Uses stored API credentials
  async placeOrder(orderData: TradeOrderRequest, token?: string): Promise<TradeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/trade/place-order`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  // Quick helper: Market Buy
  async marketBuy(symbol: string, volume: string, token?: string): Promise<TradeResponse> {
    return this.placeOrder({
      side: 'BUY',
      type: 2,
      symbol,
      volume,
      price: null,
    }, token);
  },

  // Quick helper: Market Sell
  async marketSell(symbol: string, volume: string, token?: string): Promise<TradeResponse> {
    return this.placeOrder({
      side: 'SELL',
      type: 2,
      symbol,
      volume,
      price: null,
    }, token);
  },

  // Quick helper: Limit Buy
  async limitBuy(symbol: string, volume: string, price: string, token?: string): Promise<TradeResponse> {
    return this.placeOrder({
      side: 'BUY',
      type: 1,
      symbol,
      volume,
      price,
    }, token);
  },

  // Quick helper: Limit Sell
  async limitSell(symbol: string, volume: string, price: string, token?: string): Promise<TradeResponse> {
    return this.placeOrder({
      side: 'SELL',
      type: 1,
      symbol,
      volume,
      price,
    }, token);
  },

  // Cancel an order (using Open API with stored credentials)
  async cancelOrder(orderId: string, symbol: string, token?: string): Promise<TradeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/trade/cancel-order`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ orderId, symbol }),
    });
    return response.json();
  },

  // Get open orders (using Open API with stored credentials)
  async getOpenOrders(symbol: string = 'GCBUSDT', token?: string): Promise<OpenOrdersResponse> {
    const response = await fetch(`${API_BASE_URL}/api/trade/open-orders?symbol=${symbol}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ============================================
// API Credentials Management
// ============================================

export interface ApiCredentialsData {
  hasCredentials: boolean;
  apiKey: string | null;
  valid: boolean;
  updatedAt: string | null;
}

export interface ApiCredentialsResponse {
  code: string;
  msg: string;
  data: ApiCredentialsData | null;
}

export interface SaveCredentialsRequest {
  apiKey: string;
  apiSecret: string;
}

export const credentialsAPI = {
  // Get API credentials status
  async getStatus(token?: string): Promise<ApiCredentialsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/api-credentials`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  // Save API credentials
  async save(credentials: SaveCredentialsRequest, token?: string): Promise<ApiCredentialsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/api-credentials`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Remove API credentials
  async remove(token?: string): Promise<ApiCredentialsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/api-credentials`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ============================================
// Scheduled Bot API (Market Making)
// ============================================

export interface ScheduledBot {
  _id?: string;
  userId: string;
  name: string;
  totalUsdtBudget: number;
  durationHours: number;
  bidOffsetPercent: number;
  usdtPerHour: number;
  intervalMs: number;
  symbol: string;
  isActive: boolean;
  isRunning: boolean;
  spentUsdt: number;
  accumulatedGcb: number;
  executedBuys: number;
  totalBuys: number;
  nextBuyAt: Date | null;
  startedAt: Date | null;
  lastBuyAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'created' | 'running' | 'stopped' | 'completed';
}

export interface ScheduledBotTrade {
  _id?: string;
  scheduledBotId: string;
  userId: string;
  symbol: string;
  marketBuyOrderId?: number;
  limitBuyOrderId?: number | null;
  marketBuyPrice: number;
  limitBuyPrice: number;
  marketBuyVolume: number;
  limitBuyVolume: number;
  marketBuyStatus: 'success' | 'failed';
  limitBuyStatus: 'placed' | 'failed';
  executedAt: Date;
  marketBuyResponse?: any;
  limitBuyResponse?: any;
}

export interface ScheduledBotResponse {
  code: string;
  msg: string;
  data: ScheduledBot | null;
}

export interface ScheduledBotsListResponse {
  code: string;
  msg: string;
  data: ScheduledBot[] | null;
}

export interface ScheduledBotTradesResponse {
  code: string;
  msg: string;
  data: ScheduledBotTrade[] | null;
}

export interface OrderBookDepth {
  bids: [string, string][]; // [price, volume]
  asks: [string, string][]; // [price, volume]
}

export interface OrderBookResponse {
  code: string;
  msg: string;
  data: OrderBookDepth | null;
}

// ============================================
// Stabilizer Bot Types
// ============================================

export interface StabilizerBot {
  _id?: string;
  userId: string;
  name: string;
  symbol: string;
  targetPrice: number;
  isActive: boolean;
  isRunning: boolean;
  executionCount: number;
  totalUsdtSpent: number;
  successfulOrders: number;
  failedOrders: number;
  lastExecutedAt: Date | null;
  lastCheckedAt: Date | null;
  lastMarketPrice: number | null;
  lastFinalPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'created' | 'running' | 'stopped';
}

export interface StabilizerBotResponse {
  code: string;
  msg: string;
  data: StabilizerBot | null;
}

export interface StabilizerBotsListResponse {
  code: string;
  msg: string;
  data: StabilizerBot[] | null;
}

export interface StabilizerBotLog {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  botId?: string;
}

export interface StabilizerBotLogsResponse {
  code: string;
  msg: string;
  data: StabilizerBotLog[];
}

// ============================================
// Market Maker Bot Types
// ============================================

export interface MarketMakerBot {
  _id: string;
  userId: string;
  name: string;
  symbol: string;
  targetPrice: number;
  spreadPercent: number;
  orderSize: number;
  priceFloor: number | null;
  priceCeil: number | null;
  incrementStep: number;
  currentOrderSize: number;
  executionCount: number;
  isActive: boolean;
  isRunning: boolean;
  targetReached: boolean;
  telegramEnabled: boolean;
  telegramUserId?: string;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'created' | 'running' | 'stopped' | 'target_reached';
}

export interface MarketMakerBotResponse {
  code: string;
  msg: string;
  data: MarketMakerBot | null;
}

export interface MarketMakerBotsListResponse {
  code: string;
  msg: string;
  data: MarketMakerBot[] | null;
}

export const scheduledBotAPI = {
  async create(bot: { name?: string; totalUsdtBudget: number; durationHours: number; bidOffsetPercent: number }, token?: string): Promise<ScheduledBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/create`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(bot),
    });
    return response.json();
  },

  async getList(token?: string): Promise<ScheduledBotsListResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/list`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async start(botId: string, token?: string): Promise<ScheduledBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/${botId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async stop(botId: string, token?: string): Promise<ScheduledBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/${botId}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async delete(botId: string, token?: string): Promise<{ code: string; msg: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/${botId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getTrades(botId: string, token?: string): Promise<ScheduledBotTradesResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/scheduled/${botId}/trades`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

export const orderBookAPI = {
  async getDepth(symbol: string = 'GCBUSDT', limit: number = 20): Promise<OrderBookResponse> {
    const response = await fetch(`${API_BASE_URL}/api/market/depth?symbol=${symbol}&limit=${limit}`);
    return response.json();
  },
};

// ============================================
// Stabilizer Bot API
// ============================================

export const stabilizerBotAPI = {
  async create(bot: { name?: string; targetPrice: number }, token?: string): Promise<StabilizerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/create`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(bot),
    });
    return response.json();
  },

  async getList(token?: string): Promise<StabilizerBotsListResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/list`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async start(botId: string, token?: string): Promise<StabilizerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/${botId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async stop(botId: string, token?: string): Promise<StabilizerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/${botId}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async delete(botId: string, token?: string): Promise<{ code: string; msg: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/${botId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getLogs(botId: string, limit: number = 100, token?: string): Promise<StabilizerBotLogsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/${botId}/logs?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getAllLogs(limit: number = 100, token?: string): Promise<StabilizerBotLogsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/logs?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getStatus(token?: string): Promise<{ code: string; msg: string; data: { isRunning: boolean; config: any; uptime: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/stabilizer/status`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ============================================
// Market Maker Bot API
// ============================================

export const marketMakerBotAPI = {
  async create(bot: {
    name: string;
    symbol: string;
    targetPrice: number;
    spreadPercent: number;
    orderSize: number;
    priceFloor: number | null;
    priceCeil: number | null;
    incrementStep: number;
    telegramEnabled: boolean;
    telegramUserId?: string;
  }, token?: string): Promise<MarketMakerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/create`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(bot),
    });
    return response.json();
  },

  async getList(token?: string): Promise<MarketMakerBotsListResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/list`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async start(botId: string, token?: string): Promise<MarketMakerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/${botId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async stop(botId: string, token?: string): Promise<MarketMakerBotResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/${botId}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async delete(botId: string, token?: string): Promise<{ code: string; msg: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/${botId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getLogs(limit: number = 100, token?: string): Promise<{ code: string; msg: string; data: Array<{ timestamp: string; level: string; message: string; data?: any }> }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/logs?limit=${limit}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  async getStatus(token?: string): Promise<{ code: string; msg: string; data: { isRunning: boolean; config: any; uptime: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/bot/market-maker/status`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ============================================
// Health Check API
// ============================================

export interface HealthResponse {
  status: string;
  database: string;
}

export const healthAPI = {
  async check(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },
};

// Export all APIs
export const API = {
  auth: authAPI,
  market: marketAPI,
  user: userAPI,
  bot: botAPI,
  trade: tradeAPI,
  credentials: credentialsAPI,
  scheduledBot: scheduledBotAPI,
  stabilizerBot: stabilizerBotAPI,
  marketMakerBot: marketMakerBotAPI,
  orderBook: orderBookAPI,
  health: healthAPI,
};

export default API;
