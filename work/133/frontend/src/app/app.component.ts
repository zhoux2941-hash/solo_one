import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <header class="header">
        <h1>🔗 供应链溯源系统</h1>
        <p>基于区块链技术的商品流转溯源平台</p>
      </header>

      <div class="container">
        <nav class="navigation">
          <button class="nav-btn" [class.active]="activeView === 'producer'" (click)="activeView = 'producer'">
            🏭 生产商视图
          </button>
          <button class="nav-btn" [class.active]="activeView === 'logistics'" (click)="activeView = 'logistics'">
            🚚 物流商视图
          </button>
          <button class="nav-btn" [class.active]="activeView === 'consumer'" (click)="activeView = 'consumer'">
            👤 消费者视图
          </button>
        </nav>
      </div>

      <app-producer *ngIf="activeView === 'producer'"></app-producer>
      <app-logistics *ngIf="activeView === 'logistics'"></app-logistics>
      <app-consumer *ngIf="activeView === 'consumer'"></app-consumer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  activeView = 'producer';
}
