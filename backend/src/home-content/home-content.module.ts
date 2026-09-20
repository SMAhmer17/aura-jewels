import { Module } from '@nestjs/common';
import { HomeContentController } from './home-content.controller';

@Module({ controllers: [HomeContentController] })
export class HomeContentModule {}
