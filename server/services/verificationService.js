import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

export const extractGithubDetails = (url) => {
    try {
        const u = new URL(url);
        if (u.hostname !== 'github.com') return null;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
        return null;
    } catch {
        return null;
    }
};

const WEB_FILES = [
    'index.html', 'package.json', 'vite.config.js', 'webpack.config.js',
    'vercel.json', 'netlify.toml', 'Dockerfile'
];

export const verifyWebDomain = (languages, contents) => {
    let hasWebTech = false;

    const langs = Object.keys(languages || {}).map(l => l.toLowerCase());
    if (langs.some(l => ['javascript', 'typescript', 'html', 'css', 'python', 'php', 'ruby'].includes(l))) {
        hasWebTech = true;
    }

    const fileNames = (contents || []).map(f => f.name);
    if (fileNames.some(f => WEB_FILES.includes(f))) {
        hasWebTech = true;
    }

    return hasWebTech;
};

export const fetchGithubData = async (owner, repo) => {
    const githubToken = process.env.GITHUB_TOKEN;
    const headers = githubToken ? { Authorization: `Bearer ${githubToken}` } : {};

    try {
        const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const [metaData, langsData, commitsData, contentsData] = await Promise.all([
            axios.get(baseUrl, { headers }),
            axios.get(`${baseUrl}/languages`, { headers }),
            axios.get(`${baseUrl}/commits`, { headers }),
            axios.get(`${baseUrl}/contents`, { headers }).catch(() => ({ data: [] }))
        ]);

        let readmeContent = "No README provided.";
        try {
            const readmeRes = await axios.get(`${baseUrl}/readme`, { headers });
            if (readmeRes.data.content) {
                readmeContent = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
            }
        } catch (e) {
            // ignore missing readme
        }

        return {
            metadata: metaData.data,
            languages: langsData.data,
            commitsCount: commitsData.data.length,
            contents: contentsData.data,
            readme: readmeContent
        };
    } catch (error) {
        console.error("fetchGithubData error:", error.response?.data || error.message);
        throw new Error("Unable to fetch Github data. Is the repo private or token invalid?");
    }
};

export const analyzeRepositoryAI = async (deliverables, githubData) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        console.error("GEMINI_API_KEY is missing!");
        return { domain_match: false, confidence_score: 0, summary: "AI verification failed: API Key missing." };
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Truncate README even more aggressively to ensure prompt stability
    const truncatedReadme = githubData.readme?.length > 8000
        ? githubData.readme.substring(0, 8000) + "... (truncated for analysis)"
        : (githubData.readme || "No README content found.");

    // Filter contents to just names to save tokens
    const fileNames = (githubData.contents || []).map(f => f.name).join(", ");

    const prompt = `
You are an AI verification agent for a programmable escrow platform.

Strict logic:
1. Compare the provided Contract Deliverables with the GitHub Repository data.
2. Determine if the repository contains the work described.
3. confidence_score: integer 0-100.
4. domain_match: boolean.

Return ONLY a JSON object. No extra text.
{
"domain_match": boolean,
"confidence_score": number,
"summary": "string"
}

--- DATA ---
Contract Deliverables: ${deliverables || 'N/A'}
Repo Description: ${githubData.metadata?.description || 'N/A'}
Languages: ${JSON.stringify(githubData.languages || {})}
Files in Root: ${fileNames}
README Snippet: ${truncatedReadme}
`;

    try {
        console.log("Analyzing repository with AI (Gemini 1.5 Flash)...");
        const result = await model.generateContent(prompt);
        let text = "";

        try {
            text = result.response.text();
        } catch (e) {
            console.error("Gemini Response Error:", e.message);
            throw new Error("Response blocked by safety filters.");
        }

        console.log("AI Response received.");

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI did not return JSON. Raw text:", text);
            throw new Error("Invalid response format from AI.");
        }

        const aiData = JSON.parse(jsonMatch[0]);

        aiData.confidence_score = (typeof aiData.confidence_score === 'number')
            ? (aiData.confidence_score <= 1 && aiData.confidence_score > 0 ? Math.round(aiData.confidence_score * 100) : Math.round(aiData.confidence_score))
            : 0;

        return aiData;
    } catch (aiError) {
        console.error("Verification Error Internal:", aiError.message);
        return {
            domain_match: false,
            confidence_score: 0,
            summary: `AI verification failed: ${aiError.message}`
        };
    }
};
