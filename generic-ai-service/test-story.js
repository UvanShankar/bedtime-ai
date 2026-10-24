const http = require('http');

const PRESETS = {
  '1': {
    name: 'Bramble the Hedgehog (Lantern Workshop, Age 5)',
    payload: {
      childName: 'Aarav',
      childAge: 5,
      interests: 'Forest animals, tiny lanterns, bedtime coziness',
      genre: 'Bedtime',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'English',
      languageCode: 'en-US',
      targetDurationMinutes: 3,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: true,
      promptIdea: 'Bramble the little hedgehog crafts small moss-lined wicker lanterns for night creatures. Tonight a young firefly is too sleepy to flutter home to the Willow Grove, so Bramble gently carries him in a soft lantern, discovering how quiet the forest feels when everyone works together to rest.',
    },
  },
  '2': {
    name: 'Oliver the Clockmaker (Quietest Gear, Age 7)',
    payload: {
      childName: 'Kabir',
      childAge: 7,
      interests: 'Clocks, gears, evening bells, peaceful mysteries',
      genre: 'Bedtime Mystery',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'English',
      languageCode: 'en-US',
      targetDurationMinutes: 4,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: true,
      promptIdea: 'Oliver, an apprentice clockmaker in a sleepy valley town, discovers that the great tower clock has a slight clicking rattle in its night chime gear. Following the quiet rhythm, he lubricates the cedar cog with a drop of honeysuckle oil so the sunset bell rings out with a deep, soothing chime that lulls the town to sleep.',
    },
  },
  '3': {
    name: 'Barnaby Puppy (Lost Blanket, Age 2-3)',
    payload: {
      childName: 'Maya',
      childAge: 2,
      interests: 'Puppies, soft blankets, cozy naps',
      genre: 'Bedtime',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'English',
      languageCode: 'en-US',
      targetDurationMinutes: 2,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: false,
      promptIdea: 'Barnaby the sleepy puppy looks for his yellow blanket before curling into his basket for bedtime. A simple, short story with soft repetition for a 2-year-old.',
    },
  },
  '4': {
    name: 'Pip Series Continuity (Depot Signal Pinecone, Age 5)',
    payload: {
      childName: 'Aarav',
      childAge: 5,
      interests: 'Little blue trains, starry sky',
      genre: 'Bedtime',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'English',
      languageCode: 'en-US',
      targetDurationMinutes: 3,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: true,
      previousStoryContext: 'Pip previously returned to the railway depot after visiting Starlight Station. Rosie the red carriage and Gabe the green caboose welcomed him home on the sidings.',
      promptIdea: 'At the railway depot, Gabe notices a dry pinecone has rolled into the evening signal bell, muffling its soft chime. Pip and Rosie gently work together to clear the track and bell before all three engines settle onto their sidings for the night.',
    },
  },
  '5': {
    name: 'Tamil Bedtime (Vezhan the Elephant, Age 5)',
    payload: {
      childName: 'நிலா',
      childAge: 5,
      interests: 'குட்டி யானை, ஆறு, தூக்கப் பாட்டு',
      genre: 'Bedtime',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'Tamil (conversational spoken Tamil / எளிய பேச்சுத் தமிழ்)',
      languageCode: 'ta-IN',
      targetDurationMinutes: 3,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: true,
      promptIdea: 'ஆற்றங்கரையில் தூக்கம் வராமல் தவிக்கும் வேழன் என்ற குட்டி யானைக்கு, அம்மா யானை காற்றில் ஆடும் இலைகளின் சத்தத்தோடும் ஆற்று நீரோட்டத்தோடும் ஒரு மெல்லிய தாலாட்டு சொல்லி அமைதியாகத் தூங்க வைக்கும் கதை.',
    },
  },
};

const inputArg = process.argv.slice(2).join(' ').trim();
let chosen = PRESETS[inputArg] || PRESETS['1'];

if (inputArg && !PRESETS[inputArg]) {
  chosen = {
    name: `Custom Prompt: "${inputArg.slice(0, 40)}..."`,
    payload: {
      childName: 'Aarav',
      childAge: 5,
      interests: 'Bedtime adventures',
      genre: 'Bedtime',
      narrativeRole: 'STORYBOOK_CHARACTER',
      language: 'English',
      languageCode: 'en-US',
      targetDurationMinutes: 3,
      llmProvider: 'groq',
      ttsProvider: 'mock',
      enableQualityReview: true,
      promptIdea: inputArg,
    },
  };
}

console.log(`\n============================================================`);
console.log(`🌙 Generating Bedtime Story: ${chosen.name}`);
console.log(`============================================================\n`);

const postData = JSON.stringify({
  jobType: 'STORY_PIPELINE',
  ownerProject: 'nila',
  externalReferenceId: `story_cli_${Date.now()}`,
  payload: chosen.payload,
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 8082,
    path: '/api/v1/ai/jobs/pipeline',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345',
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (!json.success || !json.data || !json.data.result) {
          console.error('❌ Server error:', json.error || data);
          process.exit(1);
        }
        const story = json.data.result.storyScript || '';
        const words = story.split(/\s+/).filter(Boolean).length;
        const durationSec = json.data.result.durationSeconds || 0;

        console.log(story);
        console.log(`\n------------------------------------------------------------`);
        console.log(`📊 Word Count:     ${words} words`);
        console.log(`⏱️ Audio Duration: ~${durationSec}s (${(durationSec / 60).toFixed(1)} min)`);
        console.log(`Audio S3 Key:   ${json.data.result.audioS3Key || 'N/A'}`);
        console.log(`------------------------------------------------------------\n`);
      } catch (err) {
        console.error('❌ Response parse error:', err.message, data);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('❌ Failed to connect to service:', err.message);
  console.log('💡 Ensure generic-ai-service is running on port 8082: npm start');
});

req.write(postData);
req.end();
