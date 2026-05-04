import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CreateProductRequest } from '../../models/product.model';

@Component({
  selector: 'app-producer',
  template: `
    <div class="container">
      <div class="card">
        <h2>生产商视图 - 商品信息录入</h2>
        <p>请填写商品详细信息，提交后将生成创世区块</p>
      </div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
        <div class="card">
          <h3>基本信息</h3>
          <div class="form-group">
            <label class="form-label">商品ID *</label>
            <input type="text" class="form-control" formControlName="productId" placeholder="请输入唯一的商品ID">
            <div *ngIf="productForm.get('productId')?.invalid && productForm.get('productId')?.touched" class="text-danger">
              商品ID为必填项
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">商品名称 *</label>
            <input type="text" class="form-control" formControlName="name" placeholder="请输入商品名称">
            <div *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" class="text-danger">
              商品名称为必填项
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">商品描述</label>
            <textarea class="form-control" formControlName="description" rows="3" placeholder="请输入商品描述"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">商品分类</label>
            <input type="text" class="form-control" formControlName="category" placeholder="请输入商品分类">
          </div>
        </div>

        <div class="card">
          <h3>生产商信息</h3>
          <div class="form-group">
            <label class="form-label">生产商名称 *</label>
            <input type="text" class="form-control" formControlName="producerName" placeholder="请输入生产商名称">
            <div *ngIf="productForm.get('producerName')?.invalid && productForm.get('producerName')?.touched" class="text-danger">
              生产商名称为必填项
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">生产商地址</label>
            <input type="text" class="form-control" formControlName="producerAddress" placeholder="请输入生产商地址">
          </div>

          <div class="form-group">
            <label class="form-label">生产日期</label>
            <input type="date" class="form-control" formControlName="productionDate">
          </div>

          <div class="form-group">
            <label class="form-label">批次号</label>
            <input type="text" class="form-control" formControlName="batchNumber" placeholder="请输入批次号">
          </div>
        </div>

        <div class="card">
          <button type="submit" class="btn btn-primary" [disabled]="!productForm.valid || isLoading">
            {{ isLoading ? '提交中...' : '提交商品信息' }}
          </button>
        </div>
      </form>

      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
        <div *ngIf="genesisBlock" class="mt-3">
          <h4>创世区块信息：</h4>
          <div class="hash-display">
            <strong>区块索引：</strong> {{ genesisBlock.index }}<br>
            <strong>区块哈希：</strong> {{ genesisBlock.hash }}<br>
            <strong>时间戳：</strong> {{ genesisBlock.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}
          </div>
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: []
})
export class ProducerComponent {
  productForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  genesisBlock: any = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      productId: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      category: [''],
      producerName: ['', Validators.required],
      producerAddress: [''],
      productionDate: [''],
      batchNumber: ['']
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.genesisBlock = null;

    const productData: CreateProductRequest = {
      ...this.productForm.value,
      specifications: {}
    };

    this.productService.createProduct(productData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.genesisBlock = response.data.genesisBlock;
          this.productForm.reset();
        } else {
          this.errorMessage = response.message;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || '创建商品失败，请稍后重试';
        this.isLoading = false;
      }
    });
  }
}
