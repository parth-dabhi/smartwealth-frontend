import { apiClient } from './client';
import { Goal, CreateGoalRequest, GoalRecommendation } from '@/types';
import { unwrapApiResponse } from './unwrap';

export const goalsApi = {
  createGoal: async (data: CreateGoalRequest): Promise<Goal> => {
    const response = await apiClient.post('/goals', data);
    return unwrapApiResponse<Goal>(response.data);
  },

  getGoals: async (): Promise<Goal[]> => {
    const response = await apiClient.get('/goals');
    return unwrapApiResponse<Goal[]>(response.data);
  },

  getGoal: async (goalId: number): Promise<Goal> => {
    const response = await apiClient.get(`/goals/${goalId}`);
    return unwrapApiResponse<Goal>(response.data);
  },

  updateGoal: async (goalId: number, data: Partial<CreateGoalRequest>): Promise<Goal> => {
    const response = await apiClient.put(`/goals/${goalId}`, data);
    return unwrapApiResponse<Goal>(response.data);
  },

  deleteGoal: async (goalId: number): Promise<void> => {
    await apiClient.delete(`/goals/${goalId}`);
  },

  getRecommendations: async (goalId: number): Promise<GoalRecommendation> => {
    const response = await apiClient.get(`/goals/${goalId}/recommendations`);
    return unwrapApiResponse<GoalRecommendation>(response.data);
  },

  investInGoal: async (goalId: number, schemes: any[]) => {
    const response = await apiClient.post('/goals/invest', 
      { schemes },
      { params: { goalId } }
    );
    return unwrapApiResponse(response.data);
  },
};
