import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../common/auth.guards';
import { StorageService } from './storage.service';

/** Identify the real file type from its first bytes, not from the name or the type the browser claims. */
function detectImage(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

/** MP4 files start with a box called "ftyp"; WebM files start with the EBML marker. Checked by content, never by file name. */
function detectVideo(buf: Buffer): 'mp4' | 'webm' | null {
  // QuickTime (.mov) files also use "ftyp" but most browsers cannot play them, so only real MP4 brands are accepted.
  if (buf.length > 12 && buf.subarray(4, 8).toString() === 'ftyp' && buf.subarray(8, 12).toString() !== 'qt  ') return 'mp4';
  if (buf.length > 12 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  return null;
}

const VIDEO_MAX_BYTES = 25 * 1024 * 1024;

@Controller('admin/uploads')
@UseGuards(AdminGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image to upload.');
    const type = detectImage(file.buffer);
    if (!type) throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed.');
    return this.storage.save(file.buffer, type);
  }

  /** Short clips for the home page social tiles (MP4 or WebM, up to 25 MB). */
  @Post('video')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: VIDEO_MAX_BYTES, files: 1 } }))
  async uploadVideo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose a video to upload.');
    const type = detectVideo(file.buffer);
    if (!type) throw new BadRequestException('Only MP4 or WebM videos are allowed.');
    return this.storage.save(file.buffer, type);
  }
}
