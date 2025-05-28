import fs from 'fs';
import path from 'path';

export class FileUtils {
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const filePath = path.join(__dirname, '../../uploads', relativePath);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteFiles(fileUrls: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const fileUrl of fileUrls) {
      const success = await this.deleteFile(fileUrl);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    }

    return { deleted, failed };
  }
}