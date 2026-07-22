import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { mediaListQuerySchema } from '@inabiya/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../identity/current-user.decorator';
import { JwtAuthGuard, type AuthedRequest } from '../identity/jwt-auth.guard';
import { Roles } from '../identity/roles.decorator';
import { RolesGuard } from '../identity/roles.guard';
import { MediaService } from './media.service';
import { MAX_MEDIA_BYTES } from './media-mime';

/** Public image bytes for Soft Gift / CMS `<img src="/api/v1/media/:id/content">`. */
@Controller('media')
export class MediaPublicController {
  constructor(private readonly media: MediaService) {}

  @Get(':id/content')
  @Header('Cache-Control', 'public, max-age=86400')
  async content(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, mimeType, originalName } = await this.media.getPublicContent(id);
    res.setHeader('Content-Type', mimeType);
    if (originalName) {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${originalName.replace(/"/g, '')}"`,
      );
    }
    return new StreamableFile(buffer);
  }
}

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @Roles('COMMERCE_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MEDIA_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: 'MEDIA_FILE_REQUIRED',
        message: 'Multipart field "file" is required.',
      });
    }
    return this.media.upload({
      file,
      actorId: user.id,
      requestId: String(req.id ?? ''),
    });
  }

  @Get()
  @Roles('COMMERCE_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  async list(
    @Query(new ZodValidationPipe(mediaListQuerySchema))
    query: { cursor?: string; limit: number },
  ) {
    return this.media.list(query);
  }

  @Get(':id')
  @Roles('COMMERCE_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.getById(id);
  }

  @Delete(':id')
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.media.delete({
      id,
      actorId: user.id,
      requestId: String(req.id ?? ''),
    });
  }
}
