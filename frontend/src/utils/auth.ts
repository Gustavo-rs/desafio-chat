export function isAuthenticated(): boolean {
    const user = localStorage.getItem("user");
    return !!user;
  }
  