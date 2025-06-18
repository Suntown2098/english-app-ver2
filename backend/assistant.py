from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import groq, silero
from livekit.plugins import deepgram, openai, silero
from dotenv import load_dotenv
import os
import requests

load_dotenv(dotenv_path=".env.local")



@function_tool
def google_search(context: RunContext, query: str):
    """Searches Google for the given query and returns the top result snippet."""
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return {"error": "SerpAPI key not found in environment variables."}
    params = {
        "q": query,
        "api_key": api_key,
        "engine": "google",
        "num": 1
    }
    response = requests.get("https://serpapi.com/search", params=params)
    if response.status_code != 200:
        return {"error": f"SerpAPI request failed: {response.text}"}
    data = response.json()
    answer = None
    if "answer_box" in data and "answer" in data["answer_box"]:
        answer = data["answer_box"]["answer"]
    elif "organic_results" in data and len(data["organic_results"]) > 0:
        answer = data["organic_results"][0].get("snippet")
    else:
        answer = "No results found."
    return {"result": answer}


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    agent = Agent(
        instructions="""
            You’re my best friend who speaks English with me every day. Talk to me like a real person — chill, natural, and caring.
            Ask me how I’ve been, what’s going on in life, what I’m thinking about. Let me share anything — stress, dreams, random stuff — and respond like a friend would.
            If I ask you something, give me a thoughtful answer. If I ask for help, be supportive and helpful.
            Correct me only if I want, but don’t make it feel like a class.
            Use a friendly, casual tone, like we’re just hanging out, chatting about life. Keep the conversation short and fun. Don’t be too formal or robotic.
            Pretend you’re a real person, not a robot. Do not say you are an AI or a bot.
            If I ask you to do something physical, like "pick up that book," just say things like "Don't be lazy, I'm busy, go get it yourself!"
            If I ask you to search for something, use the Google search tool to find the answer and share it with me.
            Be curious, funny, supportive — like someone who really wants to hear me.
            RULES: No icons, no emojis.
        """,
        tools=[google_search],
    )
    # session = AgentSession(
    #     vad=silero.VAD.load(),
    #     # any combination of STT, LLM, TTS, or realtime API can be used
    #     stt=groq.STT(),  
    #     llm=groq.LLM(model="llama-3.3-70b-versatile"),
    #     tts=groq.TTS(model="playai-tts", voice="Arista-PlayAI"), 
    # )

    session = AgentSession(
        vad=silero.VAD.load(),
        # stt=groq.STT(),  
        stt=openai.STT(model="gpt-4o-transcribe", detect_language=True, turn_detection=True),
        llm=openai.LLM(model="gpt-4", ),
        tts=openai.TTS(
            model="tts-1",
            voice="ash",
            instructions="Speak with a friendly, casual tone, like a close friend talking to another friend.",
        ),
    )

    await session.start(agent=agent, room=ctx.room)
    await session.generate_reply(instructions="Say hello, then ask the user how their day is going and how you can help as a close friend.")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))