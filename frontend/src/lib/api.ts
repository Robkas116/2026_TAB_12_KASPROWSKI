import { WorkerPublic } from "@/types/worker_types";
import { VehiclesPublic } from "@/types/vehicle_types";
import { ReservationCreate, ReservationPublic } from "@/types/reservation_types";
import {
  PasswordResetConfirm,
  PasswordResetRequest,
  PasswordResetRequestResponse,
} from "@/types/password_reset_types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthListener = () => void;

const authListeners = new Set<AuthListener>();

function emitAuthChange() {
  for (const listener of authListeners) {
    listener();
  }
}

export function subscribeToAuthChanges(listener: AuthListener) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

class ApiService {
  private get token(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private set token(value: string | null) {
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("token", value);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  hasToken(): boolean {
    return this.token !== null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.token = null;
      emitAuthChange();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Something went wrong");
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append("username", normalizeEmail(email));
    formData.append("password", password);

    const data = await this.request<{ access_token: string; token_type: string }>("/api/v1/login/access-token", {
      method: "POST",
      body: formData,
    });

    this.token = data.access_token;
    emitAuthChange();
    return data;
  }

  async logout() {
    this.token = null;
    emitAuthChange();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  async register(name: string, email: string, password: string): Promise<WorkerPublic> {
    return this.request<WorkerPublic>("/api/v1/login/register", {
      method: "POST",
      body: JSON.stringify({ name, email: normalizeEmail(email), password }),
    });
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
	return this.request<PasswordResetRequestResponse>("/api/v1/login/forgot-password/request", {
	  method: "POST",
	  body: JSON.stringify({ email: normalizeEmail(email) } satisfies PasswordResetRequest),
	});
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
	return this.request<{ message: string }>("/api/v1/login/forgot-password/reset", {
	  method: "POST",
	  body: JSON.stringify({ token, password } satisfies PasswordResetConfirm),
	});
  }

  async getCurrentUser(): Promise<WorkerPublic> {
    return this.request<WorkerPublic>("/api/v1/login/users/me");
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/v1/worker/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async getVehicles(): Promise<VehiclesPublic> {
    return this.request<VehiclesPublic>("/api/v1/vehicle/");
  }

  async createReservation(reservation: ReservationCreate): Promise<ReservationPublic> {
    return this.request<ReservationPublic>("/api/v1/reservation/", {
      method: "POST",
      body: JSON.stringify(reservation),
    });
  }
}

export const api = new ApiService();
