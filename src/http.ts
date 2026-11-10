export type HttpErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: HttpErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, code: HttpErrorCode, message: string): never {
  throw new HttpError(status, code, message);
}
