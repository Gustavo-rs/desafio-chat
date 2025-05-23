import type { APICreateMessage, APIMessage, MessageResponse } from "../types/api";
import { BaseService } from "./base-service";

class MessageService extends BaseService<MessageResponse, APICreateMessage> {
  constructor() {
    super("/messages");
  }

  async listMessagesFromRoom(roomId: string, page: number = 1, limit: number = 20) {
    return this.api.get<MessageResponse>(`${this.basePath}/${roomId}?page=${page}&limit=${limit}`);
  }

  async createMessage(formData: FormData) {
    return this.api.post<APIMessage>(`${this.basePath}/${formData.get('roomId')}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default new MessageService();
