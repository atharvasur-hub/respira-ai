from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

import ml_scanner
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# 1.Atharva ka kaam
# =====================================================================
client = genai.Client(api_key="AIzaSyDbTs2STf4cE0DnhY9ygQ6xWOVuBwGc7DI")

system_instructions = """
You are a senior medical consultant. 
1. Use a maximum of 3-4 bullet points. 
2. Start each point with a "-" character.
3. NEVER write a paragraph.
4. Use **double asterisks** around important words. 
5. Keep it crisp: Finding -> Meaning -> Action.
6. End with one line of medical disclaimer.
"""

class ChatRequest(BaseModel):
    patient_message: str
    scan_context: str # The frontend will secretly pass the scan results here

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    print(f"Chat question received: {request.patient_message}")
    
    # We combine the secret scan context with the user's question
    combined_prompt = f"Patient's Scan Results: {request.scan_context}. \n\nPatient asks: {request.patient_message}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=combined_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instructions,
        )
    )
    
    return {"reply": response.text}



@app.post("/scan")
async def scan_xray(file: UploadFile = File(...)):
    # 1. Read the image file sent from React
    image_bytes = await file.read()
    
    # 2. Hand it to your new PyTorch brain
    result = ml_scanner.analyze_image(image_bytes)
    
    # 3. Send the real AI prediction back to React!
    return result


# =====================================================================
# isko hath nahi laganeka
# =====================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
