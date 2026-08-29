import { HttpStatus } from '@nestjs/common';

export interface ResponseInterface<T> {
  status: HttpStatus;
  message: string;
  data?: T | [];
}
