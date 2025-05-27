import http from './http';

interface ListOptions {
  page?: number;
  rpp?: number;
  [key: string]: unknown;
}

export abstract class BaseService<T, C = Partial<T>> {
  protected api = http;

  constructor(public readonly basePath: string) {}

  protected path(pathname: string) {
    return new URL(
      `${this.basePath}/${pathname}`.replace(/\/+/g, '/'),
      this.api.defaults.baseURL,
    ).toString();
  }

  protected parse(response: any) {
    return response.data;
  }

  async get(id: string | number) {
    const response = await this.api.get(this.path(`${id}`));
    return this.parse(response);
  }

  async list(options?: ListOptions) {
    const response = await this.api.get(this.basePath, {
      params: { page: 1, rpp: 10, ...options },
    });
    return this.parse(response);
  }

  async create(data: C, config?: any) {
    const response = await this.api.post(this.basePath, data, config);
    return this.parse(response);
  }

  async delete(id: string | number) {
    return await this.api.delete(this.path(`${id}`)).then(() => {});
  }
}