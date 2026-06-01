import asyncio
import json
import time
from typing import Optional, Dict, Any, List, AsyncGenerator, Callable
from dataclasses import dataclass

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .metrics import RequestMetrics, ErrorType, CompletionType, parse_timestamp


@dataclass
class StreamChunk:
    content: str
    done: bool = False
    token_count: int = 0


class LLMClient:
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 120.0,
        max_retries: int = 3,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self._client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(
                max_keepalive_connections=100,
                max_connections=200,
                keepalive_expiry=90.0,
            ),
        )

    async def close(self) -> None:
        await self._client.aclose()

    def _build_chat_payload(self, request: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            "model": request.get("model", "gpt-4"),
            "messages": request.get("messages", []),
            "stream": request.get("stream", True),
        }
        for param in ["temperature", "max_tokens", "top_p", "frequency_penalty", "presence_penalty"]:
            if param in request and request[param] is not None:
                payload[param] = request[param]
        return payload

    def _build_text_payload(self, request: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            "model": request.get("model", "gpt-4"),
            "prompt": request.get("prompt", ""),
            "stream": request.get("stream", True),
        }
        for param in ["temperature", "max_tokens", "top_p"]:
            if param in request and request[param] is not None:
                payload[param] = request[param]
        return payload

    async def execute_request(
        self,
        request_log: Dict[str, Any],
        metrics: RequestMetrics,
    ) -> RequestMetrics:
        start_time = time.time()
        metrics.timestamp = start_time
        metrics.completion_type = request_log.get("completion_type")

        _ = parse_timestamp(request_log.get("timestamp"))

        completion_type = request_log.get("completion_type", CompletionType.CHAT_COMPLETION)

        try:
            if completion_type == CompletionType.CHAT_COMPLETION:
                url = f"{self.base_url}/v1/chat/completions"
                payload = self._build_chat_payload(request_log)
            else:
                url = f"{self.base_url}/v1/completions"
                payload = self._build_text_payload(request_log)

            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            for k, v in request_log.get("headers", {}).items():
                headers[k] = v

            stream = request_log.get("stream", True)

            if stream:
                return await self._execute_stream_request(url, payload, headers, metrics, start_time)
            else:
                return await self._execute_non_stream_request(url, payload, headers, metrics, start_time)

        except httpx.TimeoutException as e:
            metrics.success = False
            metrics.error_type = ErrorType.TIMEOUT
            metrics.error_message = str(e)
            metrics.total_latency_ms = (time.time() - start_time) * 1000
            return metrics
        except httpx.ConnectError as e:
            metrics.success = False
            metrics.error_type = ErrorType.CONNECTION_ERROR
            metrics.error_message = str(e)
            metrics.total_latency_ms = (time.time() - start_time) * 1000
            return metrics
        except Exception as e:
            metrics.success = False
            metrics.error_type = ErrorType.PAYLOAD_ERROR
            metrics.error_message = str(e)
            metrics.total_latency_ms = (time.time() - start_time) * 1000
            return metrics

    async def _execute_stream_request(
        self,
        url: str,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        metrics: RequestMetrics,
        start_time: float,
    ) -> RequestMetrics:
        first_token_time: Optional[float] = None
        last_token_time: Optional[float] = None
        token_count = 0
        full_response = ""

        try:
            async with self._client.stream("POST", url, json=payload, headers=headers) as response:
                metrics.status_code = response.status_code

                if response.status_code != 200:
                    body = await response.aread()
                    metrics.success = False
                    metrics.error_type = ErrorType.HTTP_ERROR
                    metrics.error_message = body.decode("utf-8", errors="replace")[:500]
                    metrics.total_latency_ms = (time.time() - start_time) * 1000
                    return metrics

                async for chunk in self._parse_sse_stream(response.aiter_bytes()):
                    chunk_time = time.time()
                    if chunk.content and first_token_time is None:
                        first_token_time = chunk_time
                        metrics.ttft_ms = (first_token_time - start_time) * 1000

                    if chunk.content:
                        token_count += chunk.token_count
                        last_token_time = chunk_time
                        full_response += chunk.content

                    if chunk.done:
                        break

            end_time = time.time()
            metrics.total_latency_ms = (end_time - start_time) * 1000

            if token_count > 1 and first_token_time and last_token_time:
                remaining_latency = last_token_time - first_token_time
                metrics.tpot_ms = (remaining_latency * 1000) / (token_count - 1)
            elif token_count == 1:
                metrics.tpot_ms = 0.0

            metrics.response_length = len(full_response)
            metrics.token_count = token_count
            metrics.output_tokens = token_count
            metrics.success = True

            return metrics

        except Exception as e:
            metrics.success = False
            metrics.error_type = ErrorType.STREAM_ERROR
            metrics.error_message = str(e)
            metrics.total_latency_ms = (time.time() - start_time) * 1000
            return metrics

    async def _execute_non_stream_request(
        self,
        url: str,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        metrics: RequestMetrics,
        start_time: float,
    ) -> RequestMetrics:
        try:
            response = await self._client.post(url, json=payload, headers=headers)
            metrics.status_code = response.status_code

            if response.status_code != 200:
                metrics.success = False
                metrics.error_type = ErrorType.HTTP_ERROR
                metrics.error_message = response.text[:500]
                metrics.total_latency_ms = (time.time() - start_time) * 1000
                return metrics

            data = response.json()
            end_time = time.time()
            metrics.total_latency_ms = (end_time - start_time) * 1000
            metrics.ttft_ms = metrics.total_latency_ms

            usage = data.get("usage", {})
            metrics.prompt_tokens = usage.get("prompt_tokens", 0)
            metrics.output_tokens = usage.get("completion_tokens", 0)
            metrics.token_count = usage.get("total_tokens", 0)

            response_text = ""
            choices = data.get("choices", [])
            for choice in choices:
                if "message" in choice and "content" in choice["message"]:
                    response_text += choice["message"]["content"]
                if "text" in choice:
                    response_text += choice["text"]

            metrics.response_length = len(response_text)
            metrics.success = True

            return metrics

        except Exception as e:
            metrics.success = False
            metrics.error_type = ErrorType.HTTP_ERROR
            metrics.error_message = str(e)
            metrics.total_latency_ms = (time.time() - start_time) * 1000
            return metrics

    async def _parse_sse_stream(
        self,
        byte_stream: AsyncGenerator[bytes, None],
    ) -> AsyncGenerator[StreamChunk, None]:
        buffer = b""
        async for chunk in byte_stream:
            buffer += chunk
            while b"\n\n" in buffer:
                event, buffer = buffer.split(b"\n\n", 1)
                for line in event.split(b"\n"):
                    line = line.strip()
                    if not line or not line.startswith(b"data:"):
                        continue
                    data = line[5:].strip()
                    if data == b"[DONE]":
                        yield StreamChunk(content="", done=True)
                        return
                    try:
                        parsed = json.loads(data.decode("utf-8"))
                        content = ""
                        done = False
                        choices = parsed.get("choices", [])
                        for choice in choices:
                            delta = choice.get("delta", {})
                            if "content" in delta and delta["content"] is not None:
                                content = delta["content"]
                            if "finish_reason" in choice and choice["finish_reason"] is not None:
                                done = True
                        token_count = len(content) if content else 0
                        yield StreamChunk(content=content, done=done, token_count=token_count)
                    except json.JSONDecodeError:
                        continue

    async def execute_with_retry(
        self,
        request_log: Dict[str, Any],
        metrics_creator: Callable[[], RequestMetrics],
    ) -> RequestMetrics:
        retry_count = 0

        for attempt in range(self.max_retries + 1):
            metrics = metrics_creator()
            metrics.retry_count = retry_count

            result = await self.execute_request(request_log, metrics)

            if result.success:
                return result

            retry_count += 1

            if retry_count <= self.max_retries:
                backoff = min(0.1 * (2 ** retry_count), 5.0)
                await asyncio.sleep(backoff)

        result = metrics_creator()
        result.retry_count = self.max_retries
        result.success = False
        result.error_type = ErrorType.MAX_RETRIES_EXCEEDED
        result.error_message = f"Max retries ({self.max_retries}) exceeded"
        return result
