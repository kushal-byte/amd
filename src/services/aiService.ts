import { ConstraintSet, PlanResponse } from "../types";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function generateItinerary(constraints: ConstraintSet): Promise<PlanResponse> {
  const locationDesc = constraints.userLat && constraints.userLng 
    ? `coordinates (${constraints.userLat}, ${constraints.userLng})` 
    : constraints.collegeLocation;

  const prompt = `
    Generate a highly optimized campus micro-itinerary for a student at ${locationDesc}.
    
    USER CONSTRAINTS:
    - Time Window: ${constraints.timeRange || 'Not specified'}
    - Time Duration: ${constraints.timeDuration ? `${constraints.timeDuration} mins` : 'Not specified'}
    - End Time Limit: ${constraints.timeLimit || 'Not specified'}
    - Budget: ₹${constraints.budget}
    - Energy Level: ${constraints.energyLevel}
    - Max Walking Time: ${constraints.walkingTolerance} mins
    - Max Walking Distance: ${constraints.walkDistance} km
    - Travel Mode: ${constraints.travelMode}
    - Indoor Preference: ${constraints.indoorPreference ? 'Yes' : 'No'}
    - Accessibility: ${constraints.accessibilityNeeds?.join(', ') || 'None'}
    
    Return the response as a JSON object. 
    Include:
    - "summary": A definitive, clear daily plan summary.
    - "missingParameters": An array of strings representing any missing or ambiguous user inputs. If all are present, return an empty array.
    - "weather": A brief summary of current conditions (e.g., "28°C, Partly Cloudy").
    - "rainProbability": A number from 0 to 100 representing the chance of rain.
    - "forecast": An array of 3 objects for the next 3 days, each with:
      - "date": e.g., "Mon, Mar 1".
      - "temp": e.g., "28°C".
      - "condition": e.g., "Partly Cloudy".
      - "icon": one of ['sun', 'cloud', 'rain', 'wind'].
    - "overallScore": A number from 0 to 1 representing efficiency.
    - "items": An array of itinerary items, each with:
      - "id": Unique string.
      - "time": Time in 12-hour format with AM/PM in IST (e.g., "09:00 AM", "02:30 PM").
      - "activity": Name of activity.
      - "location": Name of building/spot.
      - "reasoning": Why this was chosen (Markdown supported).
      - "duration": e.g., "60 mins".
      - "travelTime": e.g., "15 mins" (MANDATORY for transit items).
      - "distance": e.g., "1.2 km" (MANDATORY for transit items).
      - "type": one of ['class', 'break', 'transit', 'meal'].
      - "coordinates": { "lat": number, "lng": number }.
      - "constraints": Array of { "label": string, "status": 'met'|'warning'|'failed', "detail": string }.
    
    IMPORTANT: All times must be in Indian Standard Time (IST) and use 12-hour format with AM/PM.
    
    CRITICAL: Return ONLY the JSON object. Do not include any other text.
  `;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  const result = await response.json();
  
  if (result.error) {
    console.error("OpenRouter error:", result.error);
    throw new Error(result.error.message || "Failed to generate itinerary");
  }

  const text = result.choices?.[0]?.message?.content || "{}";
  
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString);
  } catch {
    return JSON.parse(text);
  }
}
