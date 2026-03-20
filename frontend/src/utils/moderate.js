export const moderateContent = async (text) => {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.allowed !== false;
  } catch {
    return true;
  }
};
