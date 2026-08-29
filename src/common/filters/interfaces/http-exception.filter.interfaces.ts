export interface NestHttpExceptionShape {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface ResolvedError {
  statusCode: number;
  message: string[];
  error?: string;
}

export interface ApiErrorResponse extends ResolvedError {
  timestamp: string;
  path: string;
}
