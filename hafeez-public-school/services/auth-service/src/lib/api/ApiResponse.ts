/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Response } from 'express';

// Helper code for the API consumer to understand the error and handle is accordingly
enum StatusCode {
  SUCCESS = '10000',
  FAILURE = '10001',
  RETRY = '10002',
  INVALID_ACCESS_TOKEN = '10003',
}

enum ResponseStatus {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
  DUPLICATE_KEY = 409,
}

abstract class ApiResponse {
  constructor(
    protected statusCode: StatusCode,
    protected status: ResponseStatus,
    protected message: string
  ) {}

  protected prepare<T extends ApiResponse>(
    res: Response,
    response: T,
    headers: { [key: string]: string }
  ): Response {
    for (const [key, value] of Object.entries(headers)) res.append(key, value);
    return res.status(this.status).json(ApiResponse.sanitize(response));
  }

  public send(
    res: Response,
    headers: { [key: string]: string } = {}
  ): Response {
    return this.prepare<ApiResponse>(res, this, headers);
  }

  private static sanitize<T extends ApiResponse>(response: T): T {
    const clone: T = {} as T;
    Object.assign(clone, response);
    // eslint-disable-next-line
    //@ts-ignore
    delete clone.status;

    for (const i in clone) if (typeof clone[i] === 'undefined') delete clone[i];
    return clone;
  }
}

export class AuthFailureResponse extends ApiResponse {
  constructor(message = 'Authentication Failure') {
    super(StatusCode.FAILURE, ResponseStatus.UNAUTHORIZED, message);
  }
}

export class NotFoundResponse extends ApiResponse {
  constructor(message = 'Not Found') {
    super(StatusCode.FAILURE, ResponseStatus.NOT_FOUND, message);
  }

  send(res: Response, headers: { [key: string]: string } = {}): Response {
    return super.prepare<NotFoundResponse>(res, this, headers);
  }
}

export class ForbiddenResponse extends ApiResponse {
  constructor(message = 'Forbidden') {
    super(StatusCode.FAILURE, ResponseStatus.FORBIDDEN, message);
  }
}

export class BadRequestResponse extends ApiResponse {
  constructor(message = 'Bad Parameters') {
    super(StatusCode.FAILURE, ResponseStatus.BAD_REQUEST, message);
  }
}

export class InternalErrorResponse extends ApiResponse {
  constructor(message = 'Internal Error') {
    super(StatusCode.FAILURE, ResponseStatus.INTERNAL_ERROR, message);
  }
}

export class SuccessMsgResponse extends ApiResponse {
  constructor(message: string) {
    super(StatusCode.SUCCESS, ResponseStatus.SUCCESS, message);
  }
}

export class FailureMsgResponse extends ApiResponse {
  constructor(message: string) {
    super(StatusCode.FAILURE, ResponseStatus.SUCCESS, message);
  }
}

// export class SuccessResponse<T> extends ApiResponse {
// 	constructor(
// 		message: string,
// 		private data: T
// 	) {
// 		super(StatusCode.SUCCESS, ResponseStatus.SUCCESS, message);
// 	}

// 	send(res: Response, headers: { [key: string]: string } = {}): Response {
// 		return super.prepare<SuccessResponse<T>>(res, this, headers);
// 	}
// }
export class SuccessResponse<T> extends ApiResponse {
  constructor(
    message: string,
    private data: T
  ) {
    super(StatusCode.SUCCESS, ResponseStatus.SUCCESS, message);
  }

  send(res: Response, headers: { [key: string]: string } = {}): Response {
    // Include the data in the prepared response, so it's used somewhere
    return super.prepare<SuccessResponse<T>>(
      res,
      { ...this, data: this.data },
      headers
    );
  }
}
export class AccessTokenErrorResponse extends ApiResponse {
  private instruction = 'refresh_token';

  constructor(message = 'Access token invalid') {
    super(
      StatusCode.INVALID_ACCESS_TOKEN,
      ResponseStatus.UNAUTHORIZED,
      message
    );
  }

  send(res: Response, headers: { [key: string]: string } = {}): Response {
    headers.instruction = this.instruction;
    return super.prepare<AccessTokenErrorResponse>(res, this, headers);
  }
}

export class TokenRefreshResponse extends ApiResponse {
  constructor(message: string) {
    super(StatusCode.SUCCESS, ResponseStatus.SUCCESS, message);
  }

  send(res: Response, headers: { [key: string]: string } = {}): Response {
    return super.prepare<TokenRefreshResponse>(res, this, headers);
  }
}

export class DuplicateKeyResponse extends ApiResponse {
  constructor(message: string) {
    super(StatusCode.FAILURE, ResponseStatus.DUPLICATE_KEY, message);
  }
}

export class DocumentResponse extends ApiResponse {
  constructor(
    private readonly data: Buffer,
    private readonly filename: string,
    private readonly mimeType: string
  ) {
    super(
      StatusCode.SUCCESS,
      ResponseStatus.SUCCESS,
      'Document generated successfully'
    );
  }

  send(res: Response, headers: { [key: string]: string } = {}): Response {
    // Set content disposition and type headers
    headers['Content-Disposition'] = `attachment; filename="${this.filename}"`;
    headers['Content-Type'] = this.mimeType;
    headers['Content-Length'] = this.data.length.toString();

    // Send the buffer directly instead of JSON
    return res.status(this.status).set(headers).send(this.data);
  }
}
