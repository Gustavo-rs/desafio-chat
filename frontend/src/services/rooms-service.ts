
import type { APICreateRoom, APIRoom } from "../types/api";
import { BaseService } from "./base-service";

class RoomsService extends BaseService<APIRoom,APICreateRoom> {
  constructor() {
    super("/rooms");
  }
}

export default new RoomsService();
