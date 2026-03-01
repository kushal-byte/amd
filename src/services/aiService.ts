import { GoogleGenAI, Type } from "@google/genai";
import { ConstraintSet, PlanResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateItinerary(constraints: ConstraintSet): Promise<PlanResponse> {
  const locationDesc = constraints.userLat && constraints.userLng 
    ? `coordinates (${constraints.userLat}, ${constraints.userLng})` 
    : constraints.collegeLocation;

  const prompt = `
    Generate a highly optimized campus micro-itinerary for a student at ${locationDesc}.
    
    CURRENT CONTEXT:
    - Use Google Search to find the CURRENT weather at ${locationDesc}.
    - Use Google Search and Google Maps to find REAL-TIME information about buildings, cafes, and study spots at or near ${locationDesc} (e.g., check if they are currently open, busy, or if there are events).
    - Use Google Maps to analyze REAL-TIME TRAFFIC CONDITIONS for ${constraints.travelMode} travel.
    - For 'two-wheeler' and 'four-wheeler' modes, explicitly calculate travel time variations based on current congestion levels and suggest the most efficient routes (e.g., avoiding known bottlenecks or roadworks).
    - Use Google Maps to ensure the spatial flow is optimal and realistic for the current time.
    
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
    - Accessibility: ${constraints.accessibilityNeeds.join(', ') || 'None'}
    
    Return the response as a JSON object. 
    Include:
    - "summary": A definitive, clear daily plan summary.
    - "missingParameters": An array of strings representing any missing or ambiguous user inputs (e.g., "budget", "timeRange", "collegeLocation"). If all are present, return an empty array.
    - "weather": A brief summary of current conditions (as a string, e.g., "28°C, Partly Cloudy").
    - "rainProbability": A number from 0 to 100 representing the chance of rain in the next few hours.
    - "forecast": An array of 3 objects for the next 3 days, each with:
      - "date": e.g., "Mon, Mar 1".
      - "temp": e.g., "28°C".
      - "condition": e.g., "Partly Cloudy".
      - "icon": one of ['sun', 'cloud', 'rain', 'wind'].
    - "overallScore": A number from 0 to 1 representing efficiency.
    - "items": An array of itinerary items, each with:
      - "id": Unique string.
      - "time": e.g., "09:00".
      - "activity": Name of activity.
      - "location": Name of building/spot.
      - "reasoning": Why this was chosen (Markdown supported). For motorized travel, include specific route suggestions, traffic warnings, and estimated congestion delays.
      - "duration": e.g., "60 mins".
      - "travelTime": e.g., "15 mins" (MANDATORY for transit items, representing the time to reach this location from the previous one).
      - "distance": e.g., "1.2 km" (MANDATORY for transit items).
      - "type": one of ['class', 'break', 'transit', 'meal'].
      - "coordinates": { "lat": number, "lng": number }.
      - "constraints": Array of { "label": string, "status": 'met'|'warning'|'failed', "detail": string } validating EVERY user constraint.
    
    CRITICAL: Return ONLY the JSON object. Do not include any other text.
    When travel mode is 'two-wheeler' or 'four-wheeler', consider parking and traffic conditions around ${constraints.collegeLocation}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      // responseMimeType and responseSchema are NOT supported when using googleMaps tool
    }
  });

  const text = response.text || "{}";
  try {
    // Attempt to find JSON in markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("Invalid response format from AI");
  }
}
