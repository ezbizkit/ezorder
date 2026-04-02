export const getData = async (key, apiUrl, save) => {
    let data = getCookie(key);

    if (data) {
        return JSON.parse(data);
    }
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }

        const data = await response.json();

        if (data && save) setCookie(key, JSON.stringify(data), 15);
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = date.toUTCString();
    }
    let ezorderProducts = {
        value,
        expires: expires
    }
    localStorage.setItem(name, JSON.stringify(ezorderProducts));
}

const getCookie = (name) => {
    const data = JSON.parse(localStorage.getItem(name), "{}");
    if (data && data.value) {
        const isExpired = new Date().getTime() > new Date(data.expires).getTime();
        if (isExpired) return null;
        return data.value;
    }
    return null;
}

export const removeCookie = (name) => {
    const cookies = document.cookie.split(';');

    cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim();
        const pattern = new RegExp(`^${name}-\\d+-\\d+$`);
        if (pattern.test(cookieName)) {
            document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
    });
}