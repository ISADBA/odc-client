// 事件状态
export enum EEventType {
  CREATED = 'CREATED',
  CONVERTING = 'CONVERTING',
  THROWN = 'THROWN',
  CONVERTED = 'CONVERTED',
}
// 消息发送状态
export enum EMessageStatus {
  // 待发送
  CREATED = 'CREATED',
  // 发送成功
  SENT_SUCCESSFULLY = 'SENT_SUCCESSFULLY',
  // 发送失败
  SENT_FAILED = 'SENT_FAILED',
  // 忽略
  THROWN = 'THROWN',
  // 发送中
  SENDING = 'SENDING',
}
// 限流时间单位
export enum ETimeUnit {
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}
// #region ------------------------- notification channel -------------------------
// 通道类型
export enum EChannelType {
  // 钉钉
  DING_TALK = 'DingTalk',
  // 飞书
  FEI_SHU = 'Feishu',
  // 微信
  WE_COM = 'WeCom',
  // 自定义webhook
  WEBHOOK = 'webhook',
}
// 限流策略
export enum EOverLimitStrategy {
  // 丢弃, UI中文本为忽略
  THROWN = 'THROWN',
  // 重发
  RESEND = 'RESEND',
}
export interface IRateLimitConfig {
  timeUnit: ETimeUnit;
  limit: number;
  overLimitStrategy: EOverLimitStrategy;
}
export enum ELanguage {
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  EN_US = 'en-US',
}
export interface IChannelConfig {
  /** @description 通道 webhook地址 */
  webhook: string;
  /** @description 通道 webhook指定用户手机号 */
  atMobiles?: string[];
  /** @description 通道 签名密钥 */
  sign?: string;
  /** @description 通道 标题模版 */
  titleTemplate?: string;
  /** @description 通道 内容模版 */
  contentTemplate: string;
  /** @description 通道 限流配置 */
  rateLimitConfig: IRateLimitConfig;
  /** @description 通道 模版语言 */
  language: ELanguage;
}
export interface IChannel {
  /** @description 通道 通道ID */
  id?: number;
  /** @description 通道名称 */
  name: string;
  /** @description 通道创建时间 */
  createTime?: number;
  /** @description 通道更新时间 */
  updateTime?: number;
  /** @description 通道创建者ID */
  creatorId: number;
  /** @description 通道创建者用户名 */
  creatorName: string;
  /** @description 通道创建者所属组织ID */
  organizationId: number;
  /** @description 通道所属项目ID */
  projectId: number;
  /** @description 通道 类型 */
  type: EChannelType;
  /** @description 通道 属性 */
  channelConfig: IChannelConfig;
  /** @description 通道 描述 */
  description?: string;
}

export interface ITestChannelResult {
  active: boolean;
  errorMessage: string;
}
// #endregion

// #region ------------------------- notification policy -------------------------
export interface IPolicy {
  id?: number;
  createTime?: number;
  updateTime?: number;
  creatorId: number;
  organizationId: number;
  projectId: number;
  policyMetadataId?: number;
  matchExpression: string;
  enabled: boolean;
  channels: IChannel[];
  eventName: string;
}
export type TBatchUpdatePolicy = {
  id?: number;
  policyMetadataId?: number;
  enabled: boolean;
  channels: Pick<IChannel, 'id'>[];
};
// #endregion

// #region ------------------------- notification message -------------------------
export interface IMessage {
  id?: number;
  createTime?: number;
  creatorId: number;
  organizationId: number;
  projectId: number;
  status: EMessageStatus;
  retryTimes: number;
  errorMessage: string;
  channel: IChannel;
  lastSentTime?: number;
  title: string;
  content: string;
}
// #endregion
