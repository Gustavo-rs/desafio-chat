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

  async createMessageWithMultipleFiles(content: string, roomId: string, files: File[]) {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('roomId', roomId);
    
    files.forEach(file => {
      formData.append('files', file);
    });

    return this.api.post<APIMessage>(`${this.basePath}/${roomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteMessage(messageId: string) {
    return this.api.delete(`${this.basePath}/${messageId}`);
  }

  async updateMessage(messageId: string, content: string) {
    return this.api.put(`${this.basePath}/${messageId}`, { content });
  }
}

export default new MessageService();
