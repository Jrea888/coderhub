/** 与数据库表/接口对应的类型定义 */

export type UserRole = 'admin' | 'user';

/** users 表 */
export interface UserRow extends Record<string, unknown> {
  id: number;
  name: string;
  password: string;
  avatar_url: string | null;
  createAt: Date;
  updateAt: Date;
}

/** 对外返回的用户信息 */
export interface PublicUser {
  id: number;
  name: string;
}

/** JWT 载荷 */
export interface TokenPayload {
  id: number;
  name: string;
  iat?: number;
  exp?: number;
}

export interface LabelRef {
  id: number;
  name: string;
}

/** moment 表 */
export interface MomentRow {
  id: number;
  content: string;
  user_id: number;
  creatAt: Date;
  updateAt: Date;
}

/** 动态详情（SQL 聚合后的结构） */
export interface MomentDetail {
  id: number;
  content: string;
  createTime: Date;
  updateTime: Date;
  author: { id: number; name: string } | null;
  comments: CommentItem[] | null;
  labels: LabelRef[] | null;
  images: string[] | null;
}

/** 动态列表项 */
export interface MomentListItem {
  id: number;
  content: string;
  createTime: Date;
  updateTime: Date;
  users: { id: number; name: string } | null;
  commentCounts: number;
  labelCounts: number;
  images: string[] | null;
}

/** 评论列表项 */
export interface CommentItem {
  id: number;
  content: string;
  commentId: number | null;
  createTime: Date;
  user: { id: number; name: string } | null;
}

/** label 表 */
export interface LabelRow {
  id: number;
  name: string;
  createAt: Date;
  updateAt: Date;
}

/** avatar 表 */
export interface AvatarRow {
  id: number;
  filename: string;
  mimtype: string;
  size: number;
  user_id: number;
}

/** file 表 */
export interface FileRow {
  id: number;
  filename: string;
  mimtype: string;
  size: number;
  user_id: number;
  moment_id: number;
}

/** 请求体 DTO */
export interface RegisterBody {
  name?: string;
  password?: string;
}

export interface LoginBody {
  name?: string;
  password?: string;
}

export interface MomentBody {
  content?: string;
}

export interface CommentBody {
  content?: string;
  momentId?: number | string;
}

export interface LabelBody {
  name?: string;
}

export interface AddLabelBody {
  labels?: unknown;
}