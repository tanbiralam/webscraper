export interface Review {
  text: string;
  author?: string;
  rating?: number;
}

export interface AnalyzeResponse {
  success: boolean;
  reviewCount?: number;
  reviews?: Review[];
  error?: string;
}

export interface AnalyzeRequest {
  url: string;
}
