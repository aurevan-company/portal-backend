import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Reads the organization id validated by OrganizationAccessGuard.
export const CurrentOrganizationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context
      .switchToHttp()
      .getRequest<{ organization_id: number }>();

    return request.organization_id;
  },
);
