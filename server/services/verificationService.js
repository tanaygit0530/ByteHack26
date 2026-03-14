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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a strict verification agent for a programmable escrow platform.
You must ONLY compare the submitted GitHub repository against the specific deliverables defined in the database.
Do not infer outside information.
You must output structured JSON only.
Binary verification answers must be YES or NO.
You must produce a confidence score between 0 and 100.
CONFIDENCE SCORE RULES:
95-100: All deliverables satisfied
85-94: Minor issues
70-84: Missing important elements
Below 70: Likely invalid submission

Contract Deliverables:
${deliverables}

Repository Information:
Description: ${githubData.metadata.description || 'None'}
Languages: ${JSON.stringify(githubData.languages)}
Commits Count: ${githubData.commitsCount}+
File Structure (root): ${githubData.contents.map(c => c.name).join(', ')}

README Extract (first 1000 chars):
${githubData.readme.substring(0, 1000)}

Analyze if the repo matches the deliverables and return ONLY valid JSON in this format:
{
  "domain_match": true,
  "binary_checks": {
    "repo_public": "YES",
    "has_web_framework": "YES",
    "has_deployment_config": "YES"
  },
  "confidence_score": 90,
  "summary": "Short explanation of the verifications"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let output = response.text();

        // Strip markdown code fences if Gemini included them
        output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const resultJson = JSON.parse(output);
        return resultJson;
    } catch (aiError) {
        console.error("Gemini AI Error:", aiError.message);
        // Safe fallback as per spec
        return {
            domain_match: false,
            binary_checks: {
                repo_public: "NO",
                has_web_framework: "NO",
                has_deployment_config: "NO"
            },
            confidence_score: 0,
            summary: "AI verification failed."
        };
    }
};
