import type { AxiosRequestConfig, AxiosResponse } from 'axios';

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

  protected parse<R>(response: AxiosResponse<R>) {
    return response.data;
  }

  async get(id: string | number) {
    const response = await this.api.get(this.path(`${id}`));
    return this.parse<T>(response);
  }

  async list(options?: ListOptions) {
    const response = await this.api.get(this.basePath, {
      params: { page: 1, rpp: 10, ...options },
    });
    return this.parse<T>(response);
  }

  async create(data: C, config?: AxiosRequestConfig<C>) {
    const response = await this.api.post(this.basePath, data, config);
    return this.parse<T>(response);
  }

  async delete(id: string | number) {
    return await this.api.delete(this.path(`${id}`)).then(() => {});
  }
}