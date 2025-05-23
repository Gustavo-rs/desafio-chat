import type { APICreateRoom, APIRoom, UnreadCount } from "../types/api";
import { BaseService } from "./base-service";

class RoomsService extends BaseService<APIRoom,APICreateRoom> {
  constructor() {
    super("/rooms");
  }

  async getUnreadCounts() {
    return this.api.get<UnreadCount[]>(`${this.basePath}/unread-counts`);
  }
}

export default new RoomsService();
