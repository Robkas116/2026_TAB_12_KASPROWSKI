import { API_URL } from "./config";
import { ActionPublic, ActionsPublic, ActionUpdate, ActionCreate } from "@/types/action_types";

export const actionApi = {
  getAll: async (skip = 0, limit = 100): Promise<ActionsPublic> => {
    const response = await fetch(`${API_URL}/action/?skip=${skip}&limit=${limit}`);
    if (!response.ok) throw new Error(`Action GET Error: ${response.status}`);
    return response.json();
  },

    
  create: async (data: ActionCreate): Promise<ActionPublic> => {
    const response = await fetch(`${API_URL}/action/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
      if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 422 && errorData.detail) {
              const ValidationMessage = errorData.detail[0].msg;
              throw new Error(`Validation Error: ${ValidationMessage}`);
          }
          throw new Error(`Failed to create Action: ${response.status}`);
    } 
    return response.json();
  },


  update: async (id: number, data: ActionUpdate): Promise<ActionPublic> => {
    const response = await fetch(`${API_URL}/action/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
      if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 422 && errorData.detail) {
              const ValidationMessage = errorData.detail[0].msg;
              throw new Error(`Validation Error: ${ValidationMessage}`);
          }
          throw new Error(`Failed to update Action: ${response.status}`);
    } 
    return response.json();
  },


  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/action/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json();
      if(response.status === 409) {
        const conflictMessage = errorData.detail || "Database integration error";
        throw new Error(`${conflictMessage}`);
      }
      throw new Error(`Action DELETE Error: ${response.status}`);
    }
    return response.json();
  }
};
