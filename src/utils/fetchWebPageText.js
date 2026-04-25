import axios from "axios";
import * as cheerio from "cheerio";

export const fetchWebPageText = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        if (typeof response.data !== "string")
            return "";

        const $ = cheerio.load(response.data);
        $("script, style, noscript").remove();

        return $("body").text().replace(/\s+/g, " ").trim();
    } catch {
        return "";
    }
};
