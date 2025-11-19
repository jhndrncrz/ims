#!/usr/bin/env tsx
import OpenAI from "openai";

async function testAlibabaAPI() {
  console.log("\n🧪 Testing Alibaba Cloud Model Studio API via OpenAI SDK\n");

  // Test 1: Check API Key
  console.log("1️⃣ Checking API Key...");
  const apiKey = process.env.ALIBABA_DASHSCOPE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ ALIBABA_DASHSCOPE_API_KEY not found in environment");
    console.log("   Please set it in .env file or export it:");
    console.log("   export ALIBABA_DASHSCOPE_API_KEY=your_key");
    process.exit(1);
  }
  console.log("✅ API Key found:", apiKey.slice(0, 8) + "...");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  });

  // Test 2: Test Embeddings
  console.log("\n2️⃣ Testing Embeddings API (text-embedding-v3)...");
  try {
    const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-v3",
    input: "Hello, this is a test message for embeddings.",
    encoding_format: "float"
  });

  const embedding = embeddingResponse.data[0]?.embedding;
  
  if (embedding && Array.isArray(embedding)) {
    console.log("✅ Embeddings API working!");
    console.log("   Dimensions:", embedding.length);
    console.log("   Sample values:", embedding.slice(0, 5));
    console.log("   Model:", embeddingResponse.model);
  } else {
    console.error("❌ Invalid embedding response:", embeddingResponse.data[0]);
  }
} catch (error) {
  console.error("❌ Embeddings API failed:");
  if (error instanceof Error) {
    console.error("   Message:", error.message);
  }
  console.error("   Details:", error);
}

// Test 3: Test Chat Completions
console.log("\n3️⃣ Testing Chat Completions API (qwen-plus)...");
try {
  const completion = await client.chat.completions.create({
    model: "qwen-plus",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say 'Hello, API test successful!' in exactly those words." }
    ],
    temperature: 0.7,
    max_tokens: 50
  });

  const answer = completion.choices[0]?.message?.content;
  
  if (answer) {
    console.log("✅ Chat Completions API working!");
    console.log("   Model:", completion.model);
    console.log("   Response:", answer);
    console.log("   Tokens used:", completion.usage?.total_tokens);
  } else {
    console.error("❌ No response from chat API:", completion.choices[0]);
  }
} catch (error) {
  console.error("❌ Chat Completions API failed:");
  if (error instanceof Error) {
    console.error("   Message:", error.message);
  }
  console.error("   Details:", error);
}

  console.log("\n✨ Test complete!\n");
}

testAlibabaAPI().catch(console.error);
