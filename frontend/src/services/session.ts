/** Временная идентификация пользователя: живёт в sessionStorage вкладки. */

const USER_ID_KEY = "whiteboard.userId";
const USER_NAME_KEY = "whiteboard.userName";

export function getUserId(): string {
  let userId = sessionStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID().slice(0, 8);
    sessionStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getUserName(): string {
  return sessionStorage.getItem(USER_NAME_KEY) || `Гость-${getUserId()}`;
}

export function setUserName(name: string): void {
  sessionStorage.setItem(USER_NAME_KEY, name);
}