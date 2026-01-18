export const cleanToken = (token: string) => {
    if (!token) return "";
    const prefixesToRemove = ["Token :", "Token:", "TOKEN :", "TOKEN:"];
    let cleaned = token;
    for (const prefix of prefixesToRemove) {
        if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.replace(prefix, "").trim();
        }
    }
    return cleaned;
};