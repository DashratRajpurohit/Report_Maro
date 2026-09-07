import axios, { type AxiosInstance } from 'axios';
import {
  INTERNAL_API_KEY_HEADER,
  type AnalysisCallbackRequest,
  type AnalysisFailureRequest,
  type SimilaritySearchRequest,
  type SimilaritySearchResponse,
  type ApiSuccessResponse,
} from '@sih/shared-types';
import { env } from '../config/env.js';

/**
 * Typed client for /api/v1/internal/* on apps/api — the only surface this
 * worker is allowed to write through. Auth is a static header, not a JWT.
 * See docs/API_CONTRACT.md#the-internal-api-ai--backend-seam.
 */
class InternalApiClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.API_INTERNAL_BASE_URL,
      timeout: 10_000,
      headers: { [INTERNAL_API_KEY_HEADER]: env.INTERNAL_API_SECRET },
    });
  }

  async searchSimilar(payload: SimilaritySearchRequest): Promise<SimilaritySearchResponse> {
    const res = await this.http.post<ApiSuccessResponse<SimilaritySearchResponse>>(
      '/problems/search-similar',
      payload,
    );
    return res.data.data;
  }

  async postAnalysis(problemId: string, payload: AnalysisCallbackRequest): Promise<void> {
    await this.http.post(`/problems/${problemId}/analysis`, payload);
  }

  async postFailure(problemId: string, payload: AnalysisFailureRequest): Promise<void> {
    await this.http.post(`/problems/${problemId}/failure`, payload);
  }
}

export const internalApiClient = new InternalApiClient();
