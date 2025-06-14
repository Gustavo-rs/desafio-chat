
import type { APIAuthUser, APIUser } from "../types/api";
import { BaseService } from "./base-service";

class AuthService extends BaseService<APIUser, APIAuthUser> {
  constructor() {
    super("/users");
  }

  async register(data: APIAuthUser) {
    return this.api.post(this.basePath + '/register', data);
  }

  async auth(data: APIAuthUser) {
    return this.api.post<APIUser>(this.basePath + '/login', data);
  }

  async verify() {
    return this.api.get<APIUser>(this.basePath + '/verify');
  }

  async logout() {
    return this.api.post(this.basePath + '/logout');
  }
}

export default new AuthService();
