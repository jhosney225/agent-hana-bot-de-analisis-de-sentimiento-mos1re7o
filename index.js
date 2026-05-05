
```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Sample financial news articles for sentiment analysis
const financialNews = [
  {
    id: 1,
    title: "Tech stocks surge as AI company beats earnings expectations",
    content:
      "Leading technology companies reported exceptional quarterly results today, with AI-focused firms showing particularly strong growth. Investors responded positively to the announcements, driving major indices higher.",
  },
  {
    id: 2,
    title: "Federal Reserve hints at potential rate cuts amid inflation concerns",
    content:
      "Central bank officials signaled potential monetary policy adjustments in response to changing economic conditions. Market analysts debate the implications for bond yields and stock valuations.",
  },
  {
    id: 3,
    title: "Oil prices plummet on recession fears and supply surge",
    content:
      "Energy sector stocks declined significantly as crude oil prices fell sharply. Analysts attribute the drop to weakening global demand signals and unexpected supply increases from major producers.",
  },
  {
    id: 4,
    title: "Banks announce record profits despite economic headwinds",
    content:
      "Major financial institutions reported exceptional profitability metrics this quarter. Strong lending growth and favorable interest rate spreads contributed to the positive results that exceeded market expectations.",
  },
  {
    id: 5,
    title: "Manufacturing sector shows signs of slowdown in key markets",
    content:
      "Factory output declined in several developed economies this month. Economists express concern about the implications for overall economic growth and corporate earnings in coming quarters.",
  },
];

interface SentimentAnalysis {
  articleId: number;
  title: string;
  sentiment: string;
  confidence: number;
  keyPoints: string[];
  impact: string;
}

async function analyzeNewsArticle(article: {
  id: number;
  title: string;
  content: string;
}): Promise<SentimentAnalysis> {
  const prompt = `Analyze the sentiment of the following financial news article and provide a structured analysis in JSON format.

Article:
Title: ${article.title}
Content: ${article.content}

Please respond with a JSON object containing:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": <0-100>,
  "keyPoints": [list of 2-3 key financial factors mentioned],
  "impact": "brief description of potential market impact"
}

Respond ONLY with the JSON object, no additional text.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsedResponse;
  try {
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  } catch (e) {
    console.error("Error parsing response:", e);
    // Provide a default response structure if parsing fails
    parsedResponse = {
      sentiment: "neutral",
      confidence: 0,
      keyPoints: [],
      impact: "Unable to determine impact",
    };
  }

  return {
    articleId: article.id,
    title: article.title,
    sentiment: parsedResponse.sentiment,
    confidence: parsedResponse.confidence,
    keyPoints: parsedResponse.keyPoints || [],
    impact: parsedResponse.impact,
  };
}

async function generateMarketSummary(
  analyses: SentimentAnalysis[]
): Promise<string> {
  const sentimentSummary = {
    positive: analyses.filter((a) => a.sentiment === "positive").length,
    negative: analyses.filter((a) => a.sentiment === "negative").length,
    neutral: analyses.filter((a) => a.sentiment === "neutral").length,
  };

  const averageConfidence =
    analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

  const prompt = `Based on the following sentiment analysis of financial news, provide a brief market outlook summary.

Sentiment Distribution:
- Positive: ${sentimentSummary.positive} articles
- Negative: ${sentimentSummary.negative} articles  
- Neutral: ${sentimentSummary.neutral} articles
Average Confidence: ${averageConfidence.toFixed(1)}%

Articles analyzed:
${analyses.map((a) => `- ${a.title} (${a.sentiment}, confidence: ${a.confidence}%)`).join("\n")}

Please provide a 2-3 sentence market outlook based on this sentiment analysis.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function main() {
  console.log("🤖 Financial News Sentiment Analysis Bot\n");
  console.log("=".repeat(60));
  console.log(`Analyzing ${financialNews.length} financial news articles...\n`);

  const analyses: SentimentAnalysis[] = [];

  // Analyze each article
  for (const article of financialNews) {
    console.log(`📰 Analyzing: "${article.title}"...`);
    const analysis = await analyzeNewsArticle(article);
    analyses.push(analysis);

    // Display results for this article
    console.log(`   Sentiment: ${analysis.sentiment.toUpperCase()}`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Key Points: ${analysis.keyPoints