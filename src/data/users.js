// Preset users and dynamic user store
export const users = [
  { id: "sin", username: "Sincere", displayName: "Tej ⚡", pfp: "/pfp/sin.svg", house: "Slytherin" },
  { id: "guest", username: "Guest", displayName: "Guest", pfp: "/pfp/guest.svg", house: "Observer" },
];

const dynamicUsers = new Map();

export const registerDynamicUser = (user) => {
  if (user && (user.id || user.username)) {
    if (user.id) dynamicUsers.set(user.id, user);
    if (user.username) dynamicUsers.set(user.username.toLowerCase(), user);
  }
};

export const getUser = (id) => {
  if (!id) return users[1];
  if (dynamicUsers.has(id)) return dynamicUsers.get(id);
  const lower = typeof id === "string" ? id.toLowerCase() : "";
  if (dynamicUsers.has(lower)) return dynamicUsers.get(lower);

  const found = users.find((u) => u.id === id || u.username.toLowerCase() === lower);
  if (found) return found;

  return {
    id: id,
    username: id,
    displayName: id,
    pfp: "/pfp/guest.svg",
    house: "Gryffindor",
  };
};
