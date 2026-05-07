from collections.abc import AsyncGenerator
from openai import AsyncOpenAI
from app.core.config import settings


class AiClient:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def complete(self, system_prompt: str, user_prompt: str) -> tuple[str, dict[str, int]]:
        response = await self.client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        usage = response.usage
        content = response.choices[0].message.content or ""
        tokens = {
            "prompt_tokens": usage.prompt_tokens if usage else 0,
            "completion_tokens": usage.completion_tokens if usage else 0,
            "total_tokens": usage.total_tokens if usage else 0,
        }
        return content, tokens

    async def stream(self, system_prompt: str, user_prompt: str) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            stream=True,
        )
        async for event in stream:
            delta = event.choices[0].delta.content if event.choices else None
            if delta:
                yield delta


ai_client = AiClient()
