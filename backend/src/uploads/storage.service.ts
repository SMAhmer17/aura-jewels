import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CONTENT_TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Where uploaded images live.
 *
 * - With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set, files go to a public Supabase Storage bucket and
 *   the returned link points straight at Supabase's CDN. This is what production uses, because Railway's
 *   disk is wiped on every deploy.
 * - Without them, files are written to this server's own disk (UPLOAD_DIR) and served from /uploads.
 *   Fine for local development.
 *
 * The service role key is a server secret. It never leaves the API and must not be put in the frontend.
 */
@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name);
  private readonly dir = resolve(process.env.UPLOAD_DIR ?? './uploads');
  private readonly baseUrl = (process.env.PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  private readonly supabaseUrl = (process.env.SUPABASE_URL ?? '').trim().replace(/\/$/, '');
  private readonly supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  private readonly bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images').trim();
  private bucketReady?: Promise<void>;

  get driver(): 'supabase' | 'local' {
    return this.supabaseUrl && this.supabaseKey ? 'supabase' : 'local';
  }

  async save(buffer: Buffer, extension: string): Promise<{ path: string; url: string }> {
    const name = `${randomUUID()}.${extension}`;
    return this.driver === 'supabase' ? this.saveToSupabase(buffer, name, extension) : this.saveToDisk(buffer, name);
  }

  private async saveToDisk(buffer: Buffer, name: string) {
    await mkdir(this.dir, { recursive: true });
    await writeFile(resolve(this.dir, name), buffer);
    const path = `/uploads/${name}`;
    return { path, url: `${this.baseUrl}${path}` };
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.supabaseKey}`, apikey: this.supabaseKey, ...extra };
  }

  /** Creates the public bucket the first time it is needed, so there is no manual setup step. */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= (async () => {
      const res = await fetch(`${this.supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: this.bucket,
          name: this.bucket,
          public: true,
          file_size_limit: MAX_BYTES,
          allowed_mime_types: Object.values(CONTENT_TYPES),
        }),
      });
      if (res.ok) return;
      const detail = await res.text();
      // Supabase answers 400/409 with "already exists" when the bucket is there, which is the normal case.
      if (/already exists|Duplicate/i.test(detail)) return;
      throw new Error(`Could not create storage bucket (${res.status}): ${detail}`);
    })().catch((error) => {
      this.bucketReady = undefined; // try again on the next upload
      throw error;
    });
    return this.bucketReady;
  }

  private async saveToSupabase(buffer: Buffer, name: string, extension: string) {
    try {
      await this.ensureBucket();
      const res = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${name}`, {
        method: 'POST',
        headers: this.headers({ 'Content-Type': CONTENT_TYPES[extension], 'Cache-Control': 'public, max-age=31536000, immutable' }),
        body: new Uint8Array(buffer),
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
    } catch (error) {
      this.log.error(error instanceof Error ? error.message : String(error));
      throw new BadGatewayException('Image storage is not available right now. Please try again.');
    }
    return { path: name, url: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${name}` };
  }
}
