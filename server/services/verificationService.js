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
        throw new Error("GEMINI_API_KEY is missing. Cannot perform AI Verification.");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI verification agent for a programmable escrow platform.

Strict rules:

1. Only analyze the provided GitHub repository information.
2. Only compare it with the contract deliverables.
3. Do NOT infer external information.
4. "confidence_score" must be an integer between 0 and 100.

Return ONLY JSON.

{
"domain_match": true or false,
"confidence_score": number,
"summary": "short explanation of whether repo satisfies deliverables"
}

Contract Deliverables:
${deliverables}

Repository Description:
${githubData.metadata.description || 'None'}

Languages:
${JSON.stringify(githubData.languages)}

README:
${githubData.readme}
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log("AI RAW RESPONSE:", text);

        const cleaned = text.replace(/`json/g,"").replace(/`/g,"").trim();
        const aiData = JSON.parse(cleaned);

        // Normalize confidence score to 0-100 integer to prevent DB cast errors
        if (typeof aiData.confidence_score === 'number') {
            if (aiData.confidence_score <= 1 && aiData.confidence_score > 0) {
                aiData.confidence_score = Math.round(aiData.confidence_score * 100);
            } else {
                aiData.confidence_score = Math.round(aiData.confidence_score);
            }
        } else {
            aiData.confidence_score = 0;
        }

        console.log("AI PARSED:", aiData);
        
        return aiData;
    } catch (aiError) {
        console.error("Gemini AI Error:", aiError.message);
        // Safe fallback as per spec
        return {
            domain_match: false,
            confidence_score: 0,
            summary: "AI verification failed."
        };
    }
};
