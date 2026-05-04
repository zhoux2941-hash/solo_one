import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  TraceabilityResult, 
  CreateProductRequest, 
  AddLogisticsNodeRequest, 
  ApiResponse,
  PrivacyFilterResult,
  ActorRole,
  ZKVerifyResult,
  CreateProductResponse,
  AddLogisticsNodeResponse
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3001/api/products';

  constructor(private http: HttpClient) { }

  createProduct(productData: CreateProductRequest): Observable<ApiResponse<CreateProductResponse>> {
    return this.http.post<ApiResponse<CreateProductResponse>>(this.apiUrl, productData);
  }

  addLogisticsNode(logisticsData: AddLogisticsNodeRequest): Observable<ApiResponse<AddLogisticsNodeResponse>> {
    return this.http.post<ApiResponse<AddLogisticsNodeResponse>>(`${this.apiUrl}/logistics`, logisticsData);
  }

  getTraceability(productId: string): Observable<ApiResponse<TraceabilityResult>> {
    return this.http.get<ApiResponse<TraceabilityResult>>(`${this.apiUrl}/traceability/${productId}`);
  }

  getTraceabilityWithRole(
    productId: string,
    role: ActorRole,
    actorName?: string
  ): Observable<ApiResponse<PrivacyFilterResult>> {
    let params = new HttpParams();
    if (actorName) {
      params = params.set('actorName', actorName);
    }

    const rolePath = this.getRolePath(role);
    return this.http.get<ApiResponse<PrivacyFilterResult>>(
      `${this.apiUrl}/traceability/${productId}/${rolePath}`,
      { params }
    );
  }

  getTraceabilityAsProducer(
    productId: string,
    actorName?: string
  ): Observable<ApiResponse<PrivacyFilterResult>> {
    return this.getTraceabilityWithRole(productId, ActorRole.PRODUCER, actorName);
  }

  getTraceabilityAsLogistics(
    productId: string,
    actorName: string
  ): Observable<ApiResponse<PrivacyFilterResult>> {
    return this.getTraceabilityWithRole(productId, ActorRole.LOGISTICS, actorName);
  }

  getTraceabilityAsConsumer(
    productId: string
  ): Observable<ApiResponse<PrivacyFilterResult>> {
    return this.getTraceabilityWithRole(productId, ActorRole.CONSUMER);
  }

  verifyZKProof(
    productId: string,
    blockIndex: number
  ): Observable<ApiResponse<ZKVerifyResult>> {
    return this.http.get<ApiResponse<ZKVerifyResult>>(
      `${this.apiUrl}/zkp-verify/${productId}/${blockIndex}`
    );
  }

  getProductById(productId: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${productId}`);
  }

  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl);
  }

  private getRolePath(role: ActorRole): string {
    const roleMap: Record<ActorRole, string> = {
      [ActorRole.PRODUCER]: 'producer',
      [ActorRole.LOGISTICS]: 'logistics',
      [ActorRole.CONSUMER]: 'consumer',
    };
    return roleMap[role] || 'consumer';
  }
}
