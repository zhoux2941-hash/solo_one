import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { 
  AddLogisticsNodeRequest, 
  Product, 
  FilteredBlockData, 
  AddLogisticsNodeResponse,
  ActorRole,
  ActorIdentityDto
} from '../../models/product.model';

@Component({
  selector: 'app-logistics',
  template: `
    <div class="container">
      <div class="card">
        <h2>🚚 物流商视图 - 隐私溯源</h2>
        <p>基于零知识证明 (ZKP) 的隐私保护：您只能看到自己的运输段，其他物流商的敏感数据已被隐藏</p>
        
        <div class="alert alert-info">
          <strong>🔒 隐私保护说明：</strong><br>
          • 您可以查看和编辑<strong>自己</strong>添加的运输记录的完整信息<br>
          • 其他物流商的<strong>敏感数据</strong>（成本、内部订单号等）已被加密隐藏<br>
          • 您只能验证其他物流商的<strong> ZK 证明</strong>（数据存在性和完整性）
        </div>
      </div>

      <div class="card">
        <h3>物流商身份</h3>
        <div class="form-group">
          <label class="form-label">您的物流商名称 *</label>
          <input 
            type="text" 
            class="form-control" 
            [(ngModel)]="currentLogisticsName" 
            placeholder="请输入您的物流商名称（用于隐私过滤）"
            (ngModelChange)="onIdentityChange()">
          <small class="form-text text-muted">
            系统将根据此名称过滤您可见的数据。只有您添加的运输段才会显示完整信息。
          </small>
        </div>
      </div>

      <div class="card" *ngIf="currentLogisticsName">
        <h3>选择商品</h3>
        <div class="form-group">
          <label class="form-label">商品ID</label>
          <div style="display: flex; gap: 10px;">
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="searchProductId" 
              placeholder="输入商品ID搜索" 
              style="flex: 1;">
            <button 
              type="button" 
              class="btn btn-info" 
              (click)="searchProduct()" 
              [disabled]="!searchProductId">
              搜索
            </button>
            <button 
              type="button" 
              class="btn btn-success" 
              (click)="loadAllProducts()">
              加载所有商品
            </button>
          </div>
        </div>

        <div *ngIf="products.length > 0" class="form-group">
          <label class="form-label">选择商品</label>
          <select 
            class="form-control" 
            [(ngModel)]="selectedProductId" 
            (change)="onProductSelect()">
            <option value="">-- 请选择商品 --</option>
            <option *ngFor="let product of products" [value]="product.productId">
              {{ product.name }} ({{ product.productId }}) - 生产商: {{ product.producerName }}
            </option>
          </select>
        </div>

        <div *ngIf="selectedProduct" class="alert alert-info">
          <strong>已选择商品：</strong><br>
          商品ID: {{ selectedProduct.productId }}<br>
          商品名称: {{ selectedProduct.name }}<br>
          生产商: {{ selectedProduct.producerName }}
        </div>
      </div>

      <div *ngIf="traceabilityData" class="card">
        <h3>📊 商品流转历史（隐私过滤后）</h3>
        
        <div class="mb-3">
          <p><strong>当前角色：</strong> 物流商 ({{ currentLogisticsName }})</p>
          <p><strong>可见区块数：</strong> {{ traceabilityData.visibleBlocksCount }} / {{ traceabilityData.totalBlocksCount }}</p>
          <p><strong>链状态：</strong> 
            <span [ngClass]="{'text-success': traceabilityData.isValid, 'text-danger': !traceabilityData.isValid}">
              {{ traceabilityData.isValid ? '✅ 数据完整' : '❌ 数据异常' }}
            </span>
          </p>
        </div>

        <div class="timeline">
          <div *ngFor="let block of traceabilityData.chain; let i = index" 
               class="timeline-item" 
               [ngClass]="getBlockClass(block)">
            <div class="timeline-content" [ngClass]="{'opacity-50': !block.isVisible}">
              
              <div *ngIf="!block.isVisible" class="alert alert-warning mb-2">
                <strong>🔒 隐私保护</strong> - {{ block.visibilityReason }}
              </div>

              <h4>
                {{ getBlockTitle(block) }}
                <span *ngIf="isOwnBlock(block)" class="badge bg-success ms-2">我的记录</span>
              </h4>
              
              <p><strong>区块索引：</strong> #{{ block.index }}</p>
              <p><strong>操作时间：</strong> {{ block.timestamp * 1000 | date:'yyyy-MM-dd HH:mm:ss' }}</p>
              <p><strong>操作者：</strong> {{ block.publicData.actorName }} ({{ getActorTypeText(block.publicData.actorType) }})</p>
              <p><strong>操作：</strong> {{ getActionText(block.publicData.action) }}</p>
              <p *ngIf="block.publicData.location"><strong>位置：</strong> {{ block.publicData.location }}</p>

              <div *ngIf="block.isVisible && block.privateData" class="mt-2">
                <strong>📋 完整数据（仅您可见）：</strong>
                <div class="hash-display">
                  <div *ngIf="block.privateData.cost">
                    <strong>运输成本：</strong> ¥{{ block.privateData.cost }}
                  </div>
                  <div *ngIf="block.privateData.internalOrderId">
                    <strong>内部订单号：</strong> {{ block.privateData.internalOrderId }}
                  </div>
                  <div *ngIf="block.privateData.routeDetails">
                    <strong>路线详情：</strong> {{ block.privateData.routeDetails }}
                  </div>
                  <div *ngIf="block.privateData.price">
                    <strong>报价：</strong> ¥{{ block.privateData.price }}
                  </div>
                  <div *ngIf="block.privateData.commission">
                    <strong>佣金：</strong> ¥{{ block.privateData.commission }}
                  </div>
                </div>
              </div>

              <div *ngIf="block.zkProof" class="mt-2">
                <strong>🔐 ZK 零知识证明：</strong>
                <div class="hash-display">
                  <p><strong>证明声明：</strong> {{ block.zkProof.statement }}</p>
                  <p><strong>承诺值：</strong> {{ block.zkProof.commitment }}</p>
                  <p><strong>证明哈希：</strong> {{ block.zkProof.proofHash }}</p>
                  <p *ngIf="block.zkVerification">
                    <strong>验证状态：</strong>
                    <span [ngClass]="{'text-success': block.zkVerification.valid, 'text-danger': !block.zkVerification.valid}">
                      {{ block.zkVerification.valid ? '✅ 证明有效' : '❌ 证明无效' }}
                    </span>
                  </p>
                  <p class="text-muted mt-2">
                    <small>💡 零知识证明说明：您可以验证该区块数据的存在性和完整性，但无法获取其他物流商的敏感信息。</small>
                  </p>
                </div>
              </div>

              <div class="hash-display mt-2">
                <strong>区块哈希：</strong> {{ block.hash }}<br>
                <strong>前一区块哈希：</strong> {{ block.previousHash }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form [formGroup]="logisticsForm" (ngSubmit)="onSubmit()" *ngIf="selectedProduct && currentLogisticsName">
        <div class="card">
          <h3>➕ 添加新运输节点</h3>
          
          <div class="alert alert-info">
            <strong>📝 隐私数据说明：</strong><br>
            • <strong>公开数据</strong>（操作类型、位置、时间）- 所有角色可见<br>
            • <strong>隐私数据</strong>（成本、内部订单号等）- 加密存储，只有您和生产商可见
          </div>

          <h4 class="mt-3">📢 公开数据（所有角色可见）</h4>
          
          <div class="form-group">
            <label class="form-label">物流商名称 *</label>
            <input 
              type="text" 
              class="form-control" 
              formControlName="actorName" 
              [value]="currentLogisticsName"
              readonly>
            <small class="form-text text-muted">自动填充您的物流商名称</small>
          </div>

          <div class="form-group">
            <label class="form-label">操作类型 *</label>
            <select class="form-control" formControlName="action">
              <option value="">-- 请选择操作类型 --</option>
              <option value="pickup">取件</option>
              <option value="in_transit">运输中</option>
              <option value="arrival">到达</option>
              <option value="delivery">派送</option>
              <option value="signed">签收</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">当前位置</label>
            <input 
              type="text" 
              class="form-control" 
              formControlName="location" 
              placeholder="请输入当前位置">
          </div>

          <div class="form-group">
            <label class="form-label">备注信息</label>
            <textarea 
              class="form-control" 
              formControlName="remarks" 
              rows="2" 
              placeholder="请输入备注信息"></textarea>
          </div>

          <h4 class="mt-4">🔒 隐私数据（仅您和生产商可见）</h4>
          <p class="text-muted mb-3">
            这些数据将被加密存储，其他物流商和消费者无法看到。您可以通过 ZK 证明验证其存在性。
          </p>

          <div class="row" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 200px;">
              <label class="form-label">运输成本</label>
              <input 
                type="number" 
                class="form-control" 
                formControlName="cost" 
                placeholder="例如：500">
            </div>
            <div class="form-group" style="flex: 1; min-width: 200px;">
              <label class="form-label">内部订单号</label>
              <input 
                type="text" 
                class="form-control" 
                formControlName="internalOrderId" 
                placeholder="例如：ORD-2026-001">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">路线详情</label>
            <textarea 
              class="form-control" 
              formControlName="routeDetails" 
              rows="2" 
              placeholder="例如：北京仓库 → 上海转运中心 → 深圳配送站"></textarea>
          </div>

          <div class="row" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 200px;">
              <label class="form-label">报价</label>
              <input 
                type="number" 
                class="form-control" 
                formControlName="price" 
                placeholder="例如：1500">
            </div>
            <div class="form-group" style="flex: 1; min-width: 200px;">
              <label class="form-label">佣金</label>
              <input 
                type="number" 
                class="form-control" 
                formControlName="commission" 
                placeholder="例如：150">
            </div>
          </div>
        </div>

        <div class="card">
          <button 
            type="submit" 
            class="btn btn-success" 
            [disabled]="!logisticsForm.valid || isLoading">
            {{ isLoading ? '提交中...' : '添加运输节点（生成 ZK 证明）' }}
          </button>
        </div>
      </form>

      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="chainResponse" class="card">
        <h3>✅ 新区块已添加</h3>
        
        <div class="mb-3">
          <p><strong>区块索引：</strong> #{{ chainResponse.newBlock.index }}</p>
          <p><strong>ZKP 声明：</strong> {{ chainResponse.newBlock.zkProof?.statement }}</p>
          <p><strong>可见区块数：</strong> {{ chainResponse.visibleBlocksCount }} / {{ chainResponse.chainLength }}</p>
        </div>

        <div class="hash-display">
          <strong>新区块哈希：</strong> {{ chainResponse.newBlock.hash }}<br>
          <strong>前一区块哈希：</strong> {{ chainResponse.newBlock.previousHash }}<br>
          <strong>承诺值：</strong> {{ chainResponse.newBlock.zkProof?.commitment }}
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .opacity-50 {
      opacity: 0.6;
    }
    .badge {
      font-size: 0.75em;
      padding: 0.35em 0.65em;
      border-radius: 0.25rem;
    }
    .bg-success {
      background-color: #28a745 !important;
      color: white;
    }
  `]
})
export class LogisticsComponent implements OnInit {
  products: Product[] = [];
  searchProductId = '';
  selectedProductId = '';
  selectedProduct: Product | null = null;
  
  currentLogisticsName = '';
  
  logisticsForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  chainResponse: AddLogisticsNodeResponse | null = null;
  traceabilityData: any = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.logisticsForm = this.fb.group({
      actorName: ['', Validators.required],
      action: ['', Validators.required],
      location: [''],
      remarks: [''],
      cost: [''],
      internalOrderId: [''],
      routeDetails: [''],
      price: [''],
      commission: [''],
    });
  }

  ngOnInit(): void {
    this.loadAllProducts();
  }

  onIdentityChange(): void {
    if (this.currentLogisticsName) {
      this.logisticsForm.patchValue({ actorName: this.currentLogisticsName });
    }
    this.traceabilityData = null;
    if (this.selectedProductId) {
      this.loadTraceability();
    }
  }

  loadAllProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
        }
      },
      error: (error) => {
        console.error('加载商品列表失败', error);
      }
    });
  }

  searchProduct(): void {
    if (!this.searchProductId) {
      return;
    }

    this.productService.getProductById(this.searchProductId).subscribe({
      next: (response) => {
        if (response.success) {
          this.products = [response.data];
          this.selectedProductId = response.data.productId;
          this.onProductSelect();
        }
      },
      error: (error) => {
        this.errorMessage = '未找到该商品，请检查商品ID是否正确';
        this.products = [];
        this.selectedProduct = null;
        this.traceabilityData = null;
      }
    });
  }

  onProductSelect(): void {
    if (!this.selectedProductId) {
      this.selectedProduct = null;
      this.traceabilityData = null;
      return;
    }

    const product = this.products.find(p => p.productId === this.selectedProductId);
    if (product) {
      this.selectedProduct = product;
      this.errorMessage = '';
      this.chainResponse = null;
      this.loadTraceability();
    }
  }

  loadTraceability(): void {
    if (!this.selectedProductId || !this.currentLogisticsName) {
      return;
    }

    this.productService.getTraceabilityAsLogistics(
      this.selectedProductId,
      this.currentLogisticsName
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.traceabilityData = response.data;
          this.loggerTraceability(response.data);
        }
      },
      error: (error) => {
        console.error('加载溯源数据失败', error);
      }
    });
  }

  private loggerTraceability(data: any): void {
    console.log('📊 隐私溯源数据（物流商视角）:');
    console.log(`  - 总区块数: ${data.totalBlocksCount}`);
    console.log(`  - 可见区块数: ${data.visibleBlocksCount}`);
    console.log(`  - 链状态: ${data.isValid ? '有效' : '无效'}`);
    
    data.chain.forEach((block: any, index: number) => {
      console.log(`  区块 #${block.index}:`);
      console.log(`    - 可见: ${block.isVisible}`);
      console.log(`    - 原因: ${block.visibilityReason}`);
      console.log(`    - 操作者: ${block.publicData.actorName}`);
      if (block.zkVerification) {
        console.log(`    - ZKP验证: ${block.zkVerification.valid ? '通过' : '失败'}`);
      }
    });
  }

  onSubmit(): void {
    if (this.logisticsForm.invalid || !this.selectedProduct || !this.currentLogisticsName) {
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.chainResponse = null;

    const formValue = this.logisticsForm.value;

    const privateData: any = {};
    if (formValue.cost) privateData.cost = Number(formValue.cost);
    if (formValue.internalOrderId) privateData.internalOrderId = formValue.internalOrderId;
    if (formValue.routeDetails) privateData.routeDetails = formValue.routeDetails;
    if (formValue.price) privateData.price = Number(formValue.price);
    if (formValue.commission) privateData.commission = Number(formValue.commission);

    const logisticsData: AddLogisticsNodeRequest = {
      productId: this.selectedProduct.productId,
      actorName: this.currentLogisticsName,
      action: formValue.action,
      location: formValue.location,
      additionalData: {
        remarks: formValue.remarks
      },
      privateData: Object.keys(privateData).length > 0 ? privateData : undefined,
      requesterIdentity: {
        actorName: this.currentLogisticsName
      }
    };

    this.productService.addLogisticsNode(logisticsData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.chainResponse = response.data;
          this.logisticsForm.patchValue({
            action: '',
            location: '',
            remarks: '',
            cost: '',
            internalOrderId: '',
            routeDetails: '',
            price: '',
            commission: '',
          });
          this.loadTraceability();
        } else {
          this.errorMessage = response.message;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || '添加运输节点失败，请稍后重试';
        this.isLoading = false;
      }
    });
  }

  isOwnBlock(block: FilteredBlockData): boolean {
    return block.publicData.actorName === this.currentLogisticsName;
  }

  getBlockClass(block: FilteredBlockData): string {
    return block.publicData.actorType;
  }

  getBlockTitle(block: FilteredBlockData): string {
    if (block.index === 0) {
      return '🏭 商品创建（创世区块）';
    }
    return '📦 运输节点';
  }

  getActorTypeText(actorType: string): string {
    const map: Record<string, string> = {
      'producer': '生产商',
      'logistics': '物流商'
    };
    return map[actorType] || actorType;
  }

  getActionText(action: string): string {
    const map: Record<string, string> = {
      'product_creation': '商品创建',
      'pickup': '取件',
      'in_transit': '运输中',
      'arrival': '到达',
      'delivery': '派送',
      'signed': '签收'
    };
    return map[action] || action;
  }
}
