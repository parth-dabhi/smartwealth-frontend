// Enums
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  DBT_LOCKED = 'DBT_LOCKED',
}

export enum TransactionCategory {
  TOP_UP = 'TOP_UP',
  WITHDRAWAL = 'WITHDRAWAL',
  INVESTMENT = 'INVESTMENT',
  REDEMPTION = 'REDEMPTION',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ALLOTTED = 'ALLOTTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum InvestmentMode {
  LUMPSUM = 'LUMPSUM',
  SIP = 'SIP',
}

export enum InvestmentType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum SipStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FamilyRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// User Types
export interface User {
  customerId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  mobileNumber?: string;
  dateOfBirth: string;
  gender: Gender;
  kycStatus: KycStatus;
  role: UserRole;
  riskProfileId?: number;
  riskProfile?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// Auth Types
export interface LoginRequest {
  customerId: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: Gender;
  password: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Wallet Types
export interface WalletBalance {
  balance: number;
  lockedBalance: number;
  availableBalance: number;
}

export interface Transaction {
  id: number;
  transactionId: string;
  customerId: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Mutual Fund Types
export interface MutualFundScheme {
  schemeId: number;
  schemeName: string;
  schemeCode: string;
  amcId: number;
  amcName: string;
  assetId: number;
  assetName: string;
  categoryId: number;
  categoryName: string;
  launchDate: string;
  minInvestment: number;
  minSipAmount: number;
  sipAllowed: boolean;
  plans: SchemePlan[];
}

export interface SchemePlan {
  planId: number;
  isin: string;
  planName: string;
  optionTypeId: number;
  optionTypeName: string;
  currentNav: number;
  lastNavDate: string;
  returns: Returns;
  aum: number;
  expenseRatio: number;
}

export interface Returns {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
}

// Investment Types
export interface InvestmentBuyRequest {
  planId: number;
  amount: number;
}

export interface InvestmentSellRequest {
  planId: number;
  amount?: number;
  units?: number;
}

export interface InvestmentOrder {
  orderId?: number;
  investmentOrderId?: number;
  customerId?: string;
  planId: number;
  schemeName?: string;
  planName: string;
  amount: number;
  units?: number;
  nav?: number;
  investmentType: InvestmentType;
  investmentMode: InvestmentMode;
  orderStatus: OrderStatus;
  paymentStatus?: string;
  orderDate?: string;
  orderTime?: string;
  navDate?: string | null;
  allotmentDate?: string;
}

// SIP Types
export interface CreateSipRequest {
  planId: number;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export interface SipMandate {
  sipMandateId: number;
  customerId?: string;
  planId: number;
  schemeName?: string;
  planName?: string;
  amount?: number;
  dayOfMonth?: number;
  sipAmount?: number;
  sipDay?: number;
  totalInstallments?: number;
  completedInstallments?: number;
  startDate: string;
  endDate?: string;
  status: SipStatus;
  nextExecutionDate?: string;
  nextRunAt?: string;
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  createdAt?: string;
}

// Portfolio Types
export interface PortfolioSummary {
  totalInvestedValue: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  holdings: HoldingSummary[];
  assetAllocation: AssetAllocation[];
}

export interface HoldingSummary {
  planId: number;
  schemeName: string;
  planName: string;
  totalUnits: number;
  averageCost: number;
  investedValue: number;
  currentNav: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface AssetAllocation {
  assetName: string;
  percentage: number;
  value: number;
}

export interface HoldingTransaction {
  id: number;
  transactionType: 'BUY' | 'SELL';
  units: number;
  nav: number;
  amount: number;
  date: string;
  investmentMode: InvestmentMode;
}

// Goal Types
export interface Goal {
  goalId: number;
  customerId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  monthlyInvestment: number;
  targetDate: string;
  riskProfileId: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  goalName: string;
  targetAmount: number;
  monthlyInvestment: number;
  targetDate: string;
  riskProfileId: number;
}

export interface GoalRecommendation {
  goalId: number;
  recommendedSchemes: RecommendedScheme[];
  projectedValue: number;
  shortfall: number;
}

export interface RecommendedScheme {
  planId: number;
  schemeName: string;
  planName: string;
  allocationPercentage: number;
  monthlyAmount: number;
  expectedReturn: number;
}

// Family Types
export interface FamilyMember {
  familyMemberId: number;
  memberName: string;
  memberCustomerId?: string;
  memberId?: number;
  customerId?: string;
  fullName?: string;
  email?: string;
  relationship?: string;
  isAccessGranted?: boolean;
}

export interface FamilyRequest {
  requestId: number;
  requesterId: number;
  requesterName: string;
  requestedAt: string;
}

export interface FamilyActionResponse {
  status: 'SUCCESS' | 'FAILED' | string;
  action: string;
  message: string;
  timestamp?: string;
}

export interface FamilyPortfolioAssetAllocation {
  assetName: string;
  marketValue: number;
  percentage: string;
}

export interface FamilyPortfolioHolding {
  planId: number;
  planName: string;
  amcName: string;
  assetName: string;
  categoryName: string;
  netInvestedAmount: number;
  marketValue: number;
  gain: number;
  gainPercentage: string;
}

export interface IndividualFamilyPortfolio {
  ownerName: string;
  isPersonal: boolean;
  totalNetInvestedAmount: number;
  totalMarketValue: number;
  totalNetGain: number;
  totalNetGainPercentage: string;
  assetAllocation: FamilyPortfolioAssetAllocation[];
  holdings: FamilyPortfolioHolding[];
}

export interface FamilyPortfolioSummary {
  totalNetInvestedAmount: number;
  totalMarketValue: number;
  totalNetGain: number;
  totalNetGainPercentage: string;
  assetAllocation: FamilyPortfolioAssetAllocation[];
  personalPortfolio: IndividualFamilyPortfolio | null;
  familyMemberPortfolios: IndividualFamilyPortfolio[];
}

// Admin Types
export interface AdminUserListItem {
  customerId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  kycStatus?: KycStatus;
  isActive?: boolean;
  createdAt?: string;
  _links?: {
    self?: string;
  };
}

export interface AdminUserDetail extends User {
  address: Address;
  wallet: WalletBalance;
}

// Pagination
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Filter Options
export interface FilterOption {
  id?: number;
  name?: string;
  label?: string;
  value?: number;
}

export interface FilterChoices {
  amcs: FilterOption[];
  assets: FilterOption[];
  categories: FilterOption[] | Record<string, FilterOption[]>;
  optionTypes: FilterOption[];
}

// Risk Profile
export interface RiskProfile {
  riskProfileId: number;
  profileName: string;
  description: string;
  equityPercentage: number;
  debtPercentage: number;
  expectedReturn: number;
}
