import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
    console.error('Error: REPLICATE_API_TOKEN environment variable is not set.');
    console.error('Please set it in your .env.local file or export it in your shell.');
    process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images');
const STATES_DIR = path.join(OUTPUT_DIR, 'states');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(STATES_DIR)) {
    fs.mkdirSync(STATES_DIR, { recursive: true });
}

interface ImageConfig {
    name: string;
    prompt: string;
    aspect_ratio: string;
}

// Base images for the site
const IMAGES: ImageConfig[] = [
    {
        name: 'home-hero.png',
        prompt: 'A wide, cinematic shot of a modern, welcoming church interior. Warm lighting, rows of empty wooden pews leading to a simple stage. High ceiling, architectural details. Photorealistic, 8k, highly detailed, professional photography. 16:9 aspect ratio.',
        aspect_ratio: '16:9',
    },
    {
        name: 'state-hero.png',
        prompt: 'A wide, panoramic landscape of American suburbia at golden hour. Rolling green hills in the distance, soft sunlight, peaceful neighborhood atmosphere. Very subtle church steeple silhouette on the horizon. Cinematic, shallow depth of field, 8k. 21:9 aspect ratio.',
        aspect_ratio: '21:9',
    },
    {
        name: 'city-hero.png',
        prompt: 'A wide, abstract blurred cityscape at twilight. City lights bokeh, warm and cool tones. Urban atmosphere but peaceful. Suitable for a website background header. 21:9 aspect ratio.',
        aspect_ratio: '21:9',
    }
];

// State-specific image configurations with regional landmarks/characteristics
const STATE_PROMPTS: Record<string, string> = {
    'alabama': 'A serene Southern landscape at golden hour, rolling hills, historic church steeple in the distance, oak trees with Spanish moss, warm Alabama countryside. Photorealistic, 8k.',
    'alaska': 'A majestic Alaskan landscape with snow-capped mountains, northern lights subtle glow, small wooden church with steeple against dramatic wilderness. Photorealistic, 8k.',
    'arizona': 'A stunning Arizona desert landscape at sunset, red rock formations in the distance, desert wildflowers, mission-style church silhouette. Warm southwestern colors. Photorealistic, 8k.',
    'arkansas': 'A peaceful Arkansas Ozark mountain vista, rolling forested hills, country church with white steeple nestled in the valley. Golden hour lighting. Photorealistic, 8k.',
    'california': 'A California coastal scene at golden hour, rolling hills meeting the Pacific Ocean, mission-style bell tower silhouette, palm trees. Warm cinematic lighting. Photorealistic, 8k.',
    'colorado': 'A majestic Colorado Rocky Mountain landscape, snow-capped peaks in the distance, aspen trees, small mountain chapel with steeple. Golden hour. Photorealistic, 8k.',
    'connecticut': 'A classic New England Connecticut village scene, autumn foliage, white church steeple rising above colonial architecture. Warm fall colors. Photorealistic, 8k.',
    'delaware': 'A peaceful Delaware coastal scene, marshlands meeting the bay, historic church steeple in a small colonial town. Soft morning light. Photorealistic, 8k.',
    'florida': 'A tropical Florida scene at sunset, palm trees, Spanish moss, historic white church with steeple against vibrant sunset sky. Photorealistic, 8k.',
    'georgia': 'A quintessential Georgia Southern landscape, magnolia trees, rolling peach orchards, white church steeple in the distance. Golden hour warmth. Photorealistic, 8k.',
    'hawaii': 'A tropical Hawaiian landscape, lush green mountains meeting the ocean, historic church with steeple among tropical flowers. Paradise lighting. Photorealistic, 8k.',
    'idaho': 'A pristine Idaho mountain landscape, rolling farmland, distant Sawtooth mountains, rural church steeple. Golden hour prairie light. Photorealistic, 8k.',
    'illinois': 'A Midwest Illinois prairie landscape at golden hour, farmland stretching to the horizon, white church steeple in a small town. Warm heartland scene. Photorealistic, 8k.',
    'indiana': 'A peaceful Indiana countryside, rolling farmland, autumn colors, white church steeple rising from a small Hoosier town. Golden hour. Photorealistic, 8k.',
    'iowa': 'A serene Iowa prairie landscape, corn fields at golden hour, small town church steeple on the horizon. Heartland of America scene. Photorealistic, 8k.',
    'kansas': 'A vast Kansas prairie at sunset, wheat fields stretching to the horizon, church steeple in a small prairie town. Dramatic sky. Photorealistic, 8k.',
    'kentucky': 'A pastoral Kentucky bluegrass landscape, rolling green hills, horse farms, white church steeple in the countryside. Golden hour warmth. Photorealistic, 8k.',
    'louisiana': 'A mystical Louisiana bayou scene, cypress trees with Spanish moss, historic church in the distance. Warm humid atmosphere. Photorealistic, 8k.',
    'maine': 'A rugged Maine coastline at sunrise, rocky shores, lighthouse in the distance, New England church steeple. Crisp morning light. Photorealistic, 8k.',
    'maryland': 'A Chesapeake Bay Maryland scene, waterfront with historic buildings, colonial church steeple. Soft eastern shore light. Photorealistic, 8k.',
    'massachusetts': 'A historic Massachusetts scene, colonial architecture, autumn foliage, iconic white church steeple. New England charm. Photorealistic, 8k.',
    'michigan': 'A beautiful Michigan Great Lakes scene, sandy dunes, blue water, church steeple in a lakeside town. Summer golden hour. Photorealistic, 8k.',
    'minnesota': 'A serene Minnesota landscape, lakes reflecting the sky, pine forests, white church steeple in a small town. Northern light. Photorealistic, 8k.',
    'mississippi': 'A peaceful Mississippi Delta scene, cotton fields, oak trees with Spanish moss, historic church steeple. Southern golden hour. Photorealistic, 8k.',
    'missouri': 'A Missouri Ozark landscape, rolling hills meeting rivers, church steeple in a riverside town. Heartland sunset. Photorealistic, 8k.',
    'montana': 'A majestic Montana Big Sky landscape, snow-capped Rockies, vast prairie, small chapel silhouette. Epic western light. Photorealistic, 8k.',
    'nebraska': 'A vast Nebraska prairie at sunset, sandhills landscape, church steeple in a small plains town. Dramatic big sky. Photorealistic, 8k.',
    'nevada': 'A Nevada high desert landscape at golden hour, distant mountains, small desert town with church steeple. Western atmosphere. Photorealistic, 8k.',
    'new-hampshire': 'A classic New Hampshire mountain scene, White Mountains in fall colors, covered bridge, church steeple. Autumn splendor. Photorealistic, 8k.',
    'new-jersey': 'A New Jersey shore scene at golden hour, coastal town, historic church steeple against the sky. Eastern seaboard charm. Photorealistic, 8k.',
    'new-mexico': 'A New Mexico desert landscape, adobe architecture, distant mountains, mission church silhouette. Southwestern sunset colors. Photorealistic, 8k.',
    'new-york': 'A scenic New York Hudson Valley landscape, rolling hills, autumn foliage, historic church steeple. Empire State beauty. Photorealistic, 8k.',
    'north-carolina': 'A North Carolina Blue Ridge mountain scene, misty peaks, autumn colors, church steeple in a mountain village. Appalachian beauty. Photorealistic, 8k.',
    'north-dakota': 'A vast North Dakota prairie landscape, rolling plains at sunset, church steeple in a small farming town. Big sky country. Photorealistic, 8k.',
    'ohio': 'A peaceful Ohio countryside, rolling farmland, autumn colors, white church steeple in a Midwestern town. Golden hour warmth. Photorealistic, 8k.',
    'oklahoma': 'An Oklahoma prairie landscape at sunset, rolling grasslands, distant hills, church steeple silhouette. Western sky colors. Photorealistic, 8k.',
    'oregon': 'A lush Oregon landscape, evergreen forests, distant Mount Hood, church steeple in a Pacific Northwest town. Misty morning light. Photorealistic, 8k.',
    'pennsylvania': 'A Pennsylvania countryside scene, rolling farmland, autumn woods, historic church steeple. Colonial heritage. Photorealistic, 8k.',
    'rhode-island': 'A Rhode Island coastal scene, Newport mansions in distance, historic church steeple, sailboats on the bay. Ocean State charm. Photorealistic, 8k.',
    'south-carolina': 'A South Carolina Low Country scene, live oaks with Spanish moss, historic church steeple. Southern plantation atmosphere. Photorealistic, 8k.',
    'south-dakota': 'A South Dakota Badlands landscape, dramatic rock formations, prairie, church steeple in a small town. Western frontier. Photorealistic, 8k.',
    'tennessee': 'A Tennessee Smoky Mountains scene, misty blue ridges, autumn colors, church steeple in a mountain village. Appalachian beauty. Photorealistic, 8k.',
    'texas': 'A vast Texas Hill Country landscape at golden hour, rolling hills, wildflowers, church steeple in a small town. Lone Star beauty. Photorealistic, 8k.',
    'utah': 'A dramatic Utah landscape, red rock canyons, distant mountains, small chapel silhouette. Desert southwest beauty. Photorealistic, 8k.',
    'vermont': 'A quintessential Vermont scene, covered bridges, autumn foliage, white church steeple. Peak fall colors. New England perfection. Photorealistic, 8k.',
    'virginia': 'A historic Virginia countryside, Shenandoah Valley, rolling hills, colonial church steeple. Old Dominion beauty. Photorealistic, 8k.',
    'washington': 'A Pacific Northwest Washington scene, evergreen forests, Mount Rainier in distance, church steeple. Misty morning beauty. Photorealistic, 8k.',
    'west-virginia': 'A West Virginia Appalachian scene, forested mountains, winding river, church steeple in a mountain town. Wild and wonderful. Photorealistic, 8k.',
    'wisconsin': 'A Wisconsin Dairyland scene, rolling farmland, lakes, church steeple in a small Midwest town. Pastoral heartland. Photorealistic, 8k.',
    'wyoming': 'A majestic Wyoming landscape, Grand Teton peaks, vast prairie, small chapel silhouette. Wild West grandeur. Photorealistic, 8k.',
    'district-of-columbia': 'A Washington DC scene at golden hour, historic architecture, cherry blossoms, church dome and steeple. Capital city elegance. Photorealistic, 8k.',
};

async function generateImage(config: ImageConfig, outputDir: string = OUTPUT_DIR): Promise<boolean> {
    console.log(`Generating ${config.name}...`);
    console.log(`Prompt: ${config.prompt.substring(0, 100)}...`);

    try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "c846a69991daf4c0e5d016514849d14ee5b2e6846ce6b9d6f21369e564cfe51e", // flux-schnell latest
                input: {
                    prompt: config.prompt,
                    aspect_ratio: config.aspect_ratio,
                    output_format: "png",
                    output_quality: 90
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const prediction = await response.json();
        console.log(`Prediction created: ${prediction.id}`);

        // Poll for result
        let result = prediction;
        while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pollResponse = await fetch(result.urls.get, {
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                }
            });
            result = await pollResponse.json();
            process.stdout.write('.');
        }
        console.log(''); // Newline

        if (result.status !== 'succeeded') {
            throw new Error(`Generation failed with status: ${result.status}`);
        }

        const imageUrl = result.output[0];
        console.log(`Image generated: ${imageUrl}`);

        // Download image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.statusText}`);

        // Use arrayBuffer() to get the image data
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const outputPath = path.join(outputDir, config.name);
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved to ${outputPath}`);
        return true;

    } catch (error) {
        console.error(`Failed to generate ${config.name}:`, error);
        return false;
    }
}

async function generateStateImages(states?: string[]) {
    const statesToGenerate = states || Object.keys(STATE_PROMPTS);

    console.log(`\nGenerating images for ${statesToGenerate.length} states...`);

    let successful = 0;
    let failed = 0;

    for (const stateSlug of statesToGenerate) {
        const prompt = STATE_PROMPTS[stateSlug];
        if (!prompt) {
            console.warn(`No prompt found for state: ${stateSlug}`);
            continue;
        }

        const config: ImageConfig = {
            name: `${stateSlug}.png`,
            prompt: prompt + ' 21:9 aspect ratio.',
            aspect_ratio: '21:9',
        };

        const success = await generateImage(config, STATES_DIR);
        if (success) {
            successful++;
        } else {
            failed++;
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nState images complete: ${successful} successful, ${failed} failed`);
}

async function main() {
    const args = process.argv.slice(2);

    // Parse command line arguments
    const generateBase = args.includes('--base') || args.length === 0;
    const generateStates = args.includes('--states');
    const generateAll = args.includes('--all');
    const specificStates = args.filter(arg => !arg.startsWith('--'));

    console.log('Starting image generation with Replicate (flux-schnell)...\n');

    // Generate base images (home, state-hero, city-hero)
    if (generateBase || generateAll) {
        console.log('=== Generating base images ===');
        for (const config of IMAGES) {
            await generateImage(config);
        }
    }

    // Generate state-specific images
    if (generateStates || generateAll) {
        console.log('\n=== Generating state images ===');
        await generateStateImages();
    }

    // Generate specific state images if provided
    if (specificStates.length > 0 && !generateStates && !generateAll) {
        console.log('\n=== Generating specific state images ===');
        await generateStateImages(specificStates);
    }

    console.log('\nDone!');

    // Print usage if no args
    if (args.length === 0) {
        console.log('\nUsage:');
        console.log('  npx ts-node scripts/generate-images.ts          # Generate base images only');
        console.log('  npx ts-node scripts/generate-images.ts --states # Generate all state images');
        console.log('  npx ts-node scripts/generate-images.ts --all    # Generate everything');
        console.log('  npx ts-node scripts/generate-images.ts california texas # Generate specific states');
    }
}

main().catch(console.error);
