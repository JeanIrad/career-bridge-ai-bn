import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    return request.user;
  },
);

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ sessionId?: string }>();
    return request.sessionId;
  },
);
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    return request.user?.id;
  },
);
export const CurrentUserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    return request.user?.email;
  },
);

export const CurrentUserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    return request.user?.role;
  },
);
