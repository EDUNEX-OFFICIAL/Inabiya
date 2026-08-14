import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { CsrfHeaderInterceptor } from './interceptors/csrf-header.interceptor';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CsrfHeaderInterceptor },
  ],
})
export class CommonModule {}
