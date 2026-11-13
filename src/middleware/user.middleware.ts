import type { Next } from 'koa';
import type { RouterContext } from '@koa/router';
import { errorTypes } from '../constants/errorTypes';
import userService from '../service/user.service';
import type { RegisterBody } from '../types/models';
import md5password from '../utils/passwordHandle';
import { emitError, getBody } from '../utils/request';

/** 注册校验：用户名密码非空 + 用户名未被占用 */
export async function verifyUser(ctx: RouterContext, next: Next): Promise<void> {
  const { name, password } = getBody<RegisterBody>(ctx);

  if (!name || !password) {
    emitError(ctx, errorTypes.NAME_OR_PASSWORD_IS_REQUIRED);
    return;
  }

  const users = await userService.getUserName(name);
  if (users.length) {
    emitError(ctx, errorTypes.USER_ALREADY_EXISTS);
    return;
  }

  await next();
}

/** 密码摘要（MD5，历史方案） */
export async function handlePassword(ctx: RouterContext, next: Next): Promise<void> {
  const request = ctx.request as unknown as { body: RegisterBody };
  if (request.body.password) {
    request.body.password = md5password(request.body.password);
  }
  await next();
}