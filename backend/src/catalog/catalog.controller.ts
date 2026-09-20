import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/auth.guards';
import {
  CategoryDto, CreateProductDto, InventoryQueryDto, ProductQueryDto, SetStockDto,
  UpdateCategoryDto, UpdateProductDto,
} from './catalog.dto';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  // ---- Public ----
  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  /** Every active product, including ones that are sold out (the storefront shows those separately). */
  @Get('products')
  products() {
    return this.catalog.listPublicProducts();
  }

  @Get('products/:slug')
  async product(@Param('slug') slug: string) {
    const product = await this.catalog.getPublicProduct(slug);
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  // ---- Admin: categories ----
  @Get('admin/categories')
  @UseGuards(AdminGuard)
  adminCategories() {
    return this.catalog.listCategoriesWithCounts();
  }

  @Post('admin/categories')
  @UseGuards(AdminGuard)
  createCategory(@Body() dto: CategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('admin/categories/:id')
  @UseGuards(AdminGuard)
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('admin/categories/:id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteCategory(id);
  }

  // ---- Admin: products ----
  @Get('admin/products')
  @UseGuards(AdminGuard)
  adminProducts(@Query() query: ProductQueryDto) {
    return this.catalog.listAdminProducts(query);
  }

  @Get('admin/products/:id')
  @UseGuards(AdminGuard)
  adminProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getAdminProduct(id);
  }

  @Post('admin/products')
  @UseGuards(AdminGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch('admin/products/:id')
  @UseGuards(AdminGuard)
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.updateProduct(id, dto);
  }

  @Delete('admin/products/:id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteProduct(id);
  }

  // ---- Admin: inventory ----
  @Get('admin/inventory')
  @UseGuards(AdminGuard)
  inventory(@Query() query: InventoryQueryDto) {
    return this.catalog.inventory(query);
  }

  @Patch('admin/variants/:id/stock')
  @UseGuards(AdminGuard)
  setStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetStockDto) {
    return this.catalog.setVariantStock(id, dto.stock);
  }
}
