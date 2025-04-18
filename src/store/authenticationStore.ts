import { makeAutoObservable } from "mobx";

class AuthenticationStore {
	token: string | null = null;
	isAuthenticated = false;

	constructor() {
		makeAutoObservable(this);
		this.checkAuth();
	}

	login(token: string) {
		this.token = token;
		this.isAuthenticated = true;
		this.saveTokenToLocalStorage(token);
	}

	logout() {
		this.token = null;
		this.isAuthenticated = false;
		this.clearTokenFromLocalStorage();
	}

	checkAuth() {
		const token = this.getTokenFromLocalStorage();
		if (token) {
			this.token = token;
			this.isAuthenticated = true;
		} else {
			this.logout();
		}
	}

	private getTokenFromLocalStorage() {
		return localStorage.getItem("authToken");
	}

	private saveTokenToLocalStorage(token: string) {
		localStorage.setItem("authToken", token);
	}

	private clearTokenFromLocalStorage() {
		localStorage.removeItem("authToken");
	}
}

const authenticationStore = new AuthenticationStore();

export function useAuthStore() {
	return authenticationStore;
}