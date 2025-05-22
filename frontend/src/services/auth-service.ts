
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
}

export default new AuthService();
