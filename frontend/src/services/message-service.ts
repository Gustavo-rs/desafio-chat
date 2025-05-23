import type { APICreateMessage, APIMessage } from "../types/api";
import { BaseService } from "./base-service";

class MessageService extends BaseService<APIMessage, APICreateMessage> {
  constructor() {
    super("/messages");
  }

  async listMessagesFromRoom(roomId: string, page: number = 1, limit: number = 20) {
    return this.api.get<APIMessage>(`${this.basePath}/${roomId}?page=${page}&limit=${limit}`);
  }
}

export default new MessageService();
