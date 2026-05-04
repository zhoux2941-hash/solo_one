import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { 
  PrivacyFilterResult, 
  FilteredBlockData, 
  Block, 
  ZKVerifyResult 
} from '../../models/product.model';

@Component({
  selector: 'app-consumer',
  template: `
    <div class="container">
      <div class="card">
        <h2>👤 消费者视图 - 隐私溯源查询</h2>
        <p>基于零知识证明 (ZKP) 的隐私保护：您可以验证商品流转的真实性和完整性，但无法看到中间物流商的敏感成本信息</p>
        
        <div class="alert alert-info">
          <strong>🔒 零知识证明说明：</strong><br>
          • 您可以验证商品是否经过了必要的物流环节（<strong>存在性证明</strong>）<br>
          • 您可以验证区块链数据是否被篡改（<strong>完整性证明</strong>）<br>
          • 您<strong>无法</strong>看到物流商的敏感数据（成本、内部订单号、佣金等）<br>
          • 所有敏感数据已通过<strong> ZK 承诺</strong>保护，您只能验证其存在性
        </div>
      </div>

      <div class="card">
        <form [formGroup]="traceabilityForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">商品ID</label>
            <input 
              type="text" 
              class="form-control" 
              formControlName="productId" 
              placeholder="请输入商品ID进行溯源查询">
            <div *ngIf="traceabilityForm.get('productId')?.invalid && traceabilityForm.get('productId')?.touched" class="text-danger">
              请输入商品ID
            </div>
          </div>
          <button 
            type="submit" 
            class="btn btn-info" 
            [disabled]="!traceabilityForm.valid || isLoading">
            {{ isLoading ? '查询中...' : '查询商品流转历史（ZKP 验证）' }}
          </button>
        </form>
      </div>

      <div *ngIf="traceabilityResult" class="card">
        <h3>📋 商品基本信息</h3>
        <div class="row" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="col" style="flex: 1; min-width: 200px;">
            <p><strong>商品ID：</strong> {{ traceabilityResult.product.productId }}</p>
            <p><strong>商品名称：</strong> {{ traceabilityResult.product.name }}</p>
            <p><strong>商品分类：</strong> {{ traceabilityResult.product.category || '未分类' }}</p>
          </div>
          <div class="col" style="flex: 1; min-width: 200px;">
            <p><strong>生产商：</strong> {{ traceabilityResult.product.producerName }}</p>
            <p><strong>生产商地址：</strong> {{ traceabilityResult.product.producerAddress || '未填写' }}</p>
            <p><strong>批次号：</strong> {{ traceabilityResult.product.batchNumber || '未填写' }}</p>
          </div>
        </div>

        <div class="mt-3 p-3 bg-light rounded">
          <h4>🔐 区块链与 ZKP 验证状态</h4>
          
          <div class="row mt-2" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div class="col" style="flex: 1; min-width: 200px;">
              <p>
                <strong>区块链完整性：</strong>
                <span [ngClass]="{'text-success': traceabilityResult.isValid, 'text-danger': !traceabilityResult.isValid}">
                  {{ traceabilityResult.isValid ? '✅ 数据完整，未被篡改' : '❌ 数据异常，可能被篡改' }}
                </span>
              </p>
              <p><strong>总区块数：</strong> {{ traceabilityResult.totalBlocksCount }}</p>
              <p><strong>可见区块数：</strong> {{ traceabilityResult.visibleBlocksCount }}</p>
            </div>
            <div class="col" style="flex: 1; min-width: 200px;">
              <p>
                <strong>ZKP 证明验证：</strong>
                <span [ngClass]="{'text-success': allZKProofsValid, 'text-warning': !allZKProofsValid}">
                  {{ allZKProofsValid ? '✅ 所有证明有效' : '⚠️ 部分证明待验证' }}
                </span>
              </p>
              <p><strong>当前角色：</strong> 消费者</p>
              <p><strong>隐私保护等级：</strong> 高（敏感数据已隐藏）</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="traceabilityResult && traceabilityResult.chain.length > 0" class="card">
        <h3>📦 商品流转历史（隐私保护模式）</h3>
        
        <div class="alert alert-warning">
          <strong>💡 消费者视角说明：</strong><br>
          • 您可以看到<strong>公开数据</strong>（操作类型、时间、位置、区块哈希）<br>
          • 您可以验证<strong> ZK 证明</strong>（确认数据存在且未被篡改）<br>
          • 您<strong>无法</strong>看到其他物流商的<strong>敏感商业数据</strong>（已加密隐藏）<br>
          • 即使数据被隐藏，您仍可以通过 ZK 证明确认其真实性
        </div>

        <div class="timeline">
          <div *ngFor="let block of traceabilityResult.chain; let i = index" 
               class="timeline-item" 
               [ngClass]="getBlockClass(block)">
            <div class="timeline-content">
              
              <div *ngIf="!block.isVisible" class="alert alert-secondary mb-2">
                <strong>🔒 隐私保护</strong> - {{ block.visibilityReason }}
              </div>

              <h4>
                {{ getBlockTitle(block) }}
              </h4>
              
              <p><strong>区块索引：</strong> #{{ block.index }}</p>
              <p><strong>操作时间：</strong> {{ block.timestamp * 1000 | date:'yyyy-MM-dd HH:mm:ss' }}</p>
              <p><strong>操作者：</strong> {{ block.publicData.actorName }} ({{ getActorTypeText(block.publicData.actorType) }})</p>
              <p><strong>操作：</strong> {{ getActionText(block.publicData.action) }}</p>
              <p *ngIf="block.publicData.location"><strong>位置：</strong> {{ block.publicData.location }}</p>

              <div *ngIf="block.privateData && block.isVisible" class="mt-2">
                <strong>📋 附加数据：</strong>
                <div class="hash-display">
                  <div *ngFor="let item of getPrivateDataEntries(block.privateData)">
                    <strong>{{ item.key }}：</strong> {{ item.value }}
                  </div>
                </div>
              </div>

              <div *ngIf="!block.isVisible" class="mt-2 alert alert-secondary">
                <strong>🔒 敏感数据已隐藏</strong><br>
                <small class="text-muted">
                  作为消费者，您无法看到该区块的敏感商业数据（如运输成本、内部订单号等）。
                  但您可以通过下方的 ZK 证明验证这些数据的存在性和完整性。
                </small>
              </div>

              <div *ngIf="block.zkProof" class="mt-3">
                <h5>🔐 ZK 零知识证明</h5>
                
                <div class="hash-display">
                  <p><strong>证明声明：</strong> {{ block.zkProof.statement }}</p>
                  <p><strong>承诺值 (Commitment)：</strong> {{ block.zkProof.commitment }}</p>
                  <p><strong>证明哈希：</strong> {{ block.zkProof.proofHash }}</p>
                  
                  <div *ngIf="block.zkVerification" class="mt-2 pt-2 border-top">
                    <p>
                      <strong>验证状态：</strong>
                      <span [ngClass]="{'text-success': block.zkVerification.valid, 'text-danger': !block.zkVerification.valid}">
                        {{ block.zkVerification.valid ? '✅ 证明有效 - 数据真实存在且未被篡改' : '❌ 证明无效 - 数据可能被篡改' }}
                      </span>
                    </p>
                    <p><strong>验证时间：</strong> {{ block.zkVerification.verifiedAt * 1000 | date:'yyyy-MM-dd HH:mm:ss' }}</p>
                  </div>
                </div>

                <div class="alert alert-info mt-2">
                  <strong>💡 零知识证明原理：</strong><br>
                  • <strong>承诺值 (Commitment)</strong>：基于敏感数据生成的哈希值，无法反推原始数据<br>
                  • <strong>证明验证</strong>：无需知道原始数据，即可验证承诺值是由合法数据生成的<br>
                  • 这意味着：您<strong>不需要</strong>看到物流商的成本，就可以确认他们确实完成了运输操作！
                </div>
              </div>

              <div class="hash-display mt-3">
                <strong>区块哈希：</strong> {{ block.hash }}<br>
                <strong>前一区块哈希：</strong> {{ block.previousHash }}
              </div>

              <div *ngIf="!block.isVisible && block.zkProof" class="mt-3">
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-info"
                  (click)="verifyBlockZKProof(block)">
                  🔍 手动验证 ZK 证明
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="traceabilityResult" class="card">
        <h3>📊 验证总结</h3>
        
        <div class="row" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="col card" style="flex: 1; min-width: 250px;">
            <h5>✅ 您可以确认的信息</h5>
            <ul>
              <li>商品确实由指定生产商创建</li>
              <li>商品经过了完整的物流环节</li>
              <li>所有区块数据未被篡改</li>
              <li>每个物流操作都有 ZK 证明</li>
              <li>区块链链结构完整有效</li>
            </ul>
          </div>
          
          <div class="col card" style="flex: 1; min-width: 250px;">
            <h5>🔒 您无法看到的信息</h5>
            <ul>
              <li>物流商的运输成本</li>
              <li>物流商的内部订单号</li>
              <li>物流商的报价和佣金</li>
              <li>物流商的路线详情</li>
              <li>其他商业敏感数据</li>
            </ul>
          </div>
        </div>

        <div class="alert alert-success mt-3">
          <strong>🎯 隐私溯源实现了：</strong><br>
          • <strong>数据隐私</strong>：中间商的敏感成本信息被保护<br>
          • <strong>可验证性</strong>：消费者仍可验证商品流转的真实性<br>
          • <strong>不可篡改</strong>：区块链确保所有记录无法被修改<br>
          • <strong>零知识</strong>：验证过程不需要暴露任何敏感信息
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: []
})
export class ConsumerComponent {
  traceabilityForm: FormGroup;
  isLoading = false;
  traceabilityResult: PrivacyFilterResult | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.traceabilityForm = this.fb.group({
      productId: ['', Validators.required]
    });
  }

  get allZKProofsValid(): boolean {
    if (!this.traceabilityResult) {
      return false;
    }
    return this.traceabilityResult.chain.every(block => 
      !block.zkProof || (block.zkVerification?.valid ?? true)
    );
  }

  getPrivateDataEntries(data: any): { key: string; value: any }[] {
    if (!data) {
      return [];
    }
    return Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }

  onSubmit(): void {
    if (this.traceabilityForm.invalid) {
      return;
    }

    const productId = this.traceabilityForm.value.productId;
    this.isLoading = true;
    this.traceabilityResult = null;
    this.errorMessage = '';

    this.productService.getTraceabilityAsConsumer(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.traceabilityResult = response.data;
          this.logTraceability(response.data);
        } else {
          this.errorMessage = response.message;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || '查询失败，请稍后重试';
        this.isLoading = false;
      }
    });
  }

  private logTraceability(data: PrivacyFilterResult): void {
    console.log('📊 隐私溯源数据（消费者视角）:');
    console.log(`  - 商品ID: ${data.product.productId}`);
    console.log(`  - 商品名称: ${data.product.name}`);
    console.log(`  - 链状态: ${data.isValid ? '有效' : '无效'}`);
    console.log(`  - 总区块数: ${data.totalBlocksCount}`);
    console.log(`  - 可见区块数: ${data.visibleBlocksCount}`);
    console.log(`  - 请求角色: ${data.requesterRole}`);
    
    data.chain.forEach((block, index) => {
      console.log(`\n  区块 #${block.index}:`);
      console.log(`    - 可见: ${block.isVisible}`);
      console.log(`    - 原因: ${block.visibilityReason}`);
      console.log(`    - 操作者: ${block.publicData.actorName}`);
      console.log(`    - 操作: ${block.publicData.action}`);
      if (block.zkProof) {
        console.log(`    - ZKP声明: ${block.zkProof.statement}`);
        console.log(`    - ZKP验证: ${block.zkVerification?.valid ? '通过' : '未验证'}`);
      }
    });
  }

  verifyBlockZKProof(block: FilteredBlockData): void {
    if (!this.traceabilityResult) {
      return;
    }

    this.productService.verifyZKProof(
      this.traceabilityResult.product.productId,
      block.index
    ).subscribe({
      next: (response) => {
        if (response.success && block.zkVerification) {
          block.zkVerification = response.data;
        }
      },
      error: (error) => {
        console.error('ZKP 验证失败', error);
      }
    });
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
