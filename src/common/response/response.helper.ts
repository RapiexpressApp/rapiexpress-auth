import { HttpStatus } from '@nestjs/common';
import { ResponseInterface } from './interfaces/response.interfaces.js';

export class ResponseHelper<T> implements ResponseInterface<T> {
  status: HttpStatus;
  message: string;
  data?: T | [];

  constructor(message: string, data?: T | [], status: HttpStatus = HttpStatus.OK) {
    this.message = message;
    this.data = data;
    this.status = status;
  }
}
