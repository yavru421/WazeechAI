def test_all_models():
    """Test all available Llama models with the SAME prompts for fair comparison"""
    print("\n=== Comparative Model Testing ===")
    
    models = [
        "Llama-4-Maverick-17B-128E-Instruct-FP8",
        "Llama-4-Scout-17B-16E-Instruct-FP8", 
        "Llama-3.3-70B-Instruct",
        "Llama-3.3-8B-Instruct"
    ]
    
    test_prompts = [
        "Write a haiku about artificial intelligence.",
        "Explain quantum computing in simple terms.",
        "Write a Python function to calculate fibonacci numbers.",
        "List 3 creative uses for a paperclip.",
        "Summarize the plot of 'The Matrix' in two sentences."
    ]
    
    client = LlamaAPIClient()
    model_scores = {model: {"total_length": 0, "error_count": 0, "responses": []} for model in models}
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{'='*60}")
        print(f"TEST {i}: {prompt}")
        print(f"{'='*60}")
        
        for model in models:
            print(f"\n--- {model} ---")
            try:
                import time
                start_time = time.time()
                
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_completion_tokens=300,
                    temperature=0.7,
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                
                # Extract content
                content = getattr(response.completion_message, 'content', None)
                if content is None:
                    content = str(response.completion_message)
                
                # Clean content if it's a MessageTextContentItem
                if hasattr(content, 'text'):
                    content = content.text
                elif str(type(content)) == "<class 'llama_api_client._types.MessageTextContentItem'>":
                    content = str(content).replace("MessageTextContentItem(text=", "").replace(", type='text')", "").strip("'\"")
                
                print(f"Response ({len(str(content))} chars, {response_time:.2f}s):")
                print(content)
                print("-" * 40)
                
                # Track metrics
                model_scores[model]["total_length"] += len(str(content))
                model_scores[model]["responses"].append({
                    "prompt": prompt,
                    "content": str(content),
                    "length": len(str(content)),
                    "time": response_time
                })
                
            except Exception as e:
                print(f"❌ ERROR: {e}")
                model_scores[model]["error_count"] += 1
    
    # Calculate and display rankings
    print("\n" + "="*80)
    print("MODEL PERFORMANCE RANKINGS")
    print("="*80)
    
    # Calculate average response length
    avg_lengths = {}
    avg_times = {}
    for model, data in model_scores.items():
        if data["responses"]:
            avg_lengths[model] = data["total_length"] / len(data["responses"])
            avg_times[model] = sum(r["time"] for r in data["responses"]) / len(data["responses"])
        else:
            avg_lengths[model] = 0
            avg_times[model] = 999
    
    # Rank by average response length (detail)
    length_ranking = sorted(avg_lengths.items(), key=lambda x: x[1], reverse=True)
    
    # Rank by speed
    speed_ranking = sorted(avg_times.items(), key=lambda x: x[1])
    
    # Rank by error count (lower is better)
    error_ranking = sorted([(m, d["error_count"]) for m, d in model_scores.items()], key=lambda x: x[1])
    
    print("\n📊 RANKINGS BY RESPONSE DETAIL (Average Length):")
    for i, (model, length) in enumerate(length_ranking, 1):
        print(f"{i}. {model}: {length:.0f} characters avg")
    
    print("\n⚡ RANKINGS BY SPEED (Average Response Time):")
    for i, (model, time_avg) in enumerate(speed_ranking, 1):
        print(f"{i}. {model}: {time_avg:.2f} seconds avg")
    
    print("\n🔧 RANKINGS BY RELIABILITY (Error Count):")
    for i, (model, errors) in enumerate(error_ranking, 1):
        status = "✅ Perfect" if errors == 0 else f"❌ {errors} errors"
        print(f"{i}. {model}: {status}")
    
    # Overall recommendation
    print("\n🏆 OVERALL RECOMMENDATIONS:")
    
    best_detail = length_ranking[0][0]
    best_speed = speed_ranking[0][0]
    best_reliability = error_ranking[0][0]
    
    print(f"• Most Detailed Responses: {best_detail}")
    print(f"• Fastest Response: {best_speed}")
    print(f"• Most Reliable: {best_reliability}")
    
    # Calculate overall score (detail + speed + reliability)
    overall_scores = {}
    for model in models:
        detail_score = 5 - next(i for i, (m, _) in enumerate(length_ranking) if m == model)
        speed_score = 5 - next(i for i, (m, _) in enumerate(speed_ranking) if m == model)
        reliability_score = 5 - next(i for i, (m, _) in enumerate(error_ranking) if m == model)
        overall_scores[model] = detail_score + speed_score + reliability_score
    
    overall_ranking = sorted(overall_scores.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\n🥇 OVERALL BEST MODEL: {overall_ranking[0][0]}")
    print("Full ranking:")
    for i, (model, score) in enumerate(overall_ranking, 1):
        print(f"{i}. {model} (Score: {score}/12)")
    
    return model_scores
"""
Llama API Client - Complete Usage Example
=========================================

This example demonstrates how to use the Llama API Client with your environment's API key.
Make sure you have set the LLAMA_API_KEY environment variable before running this script.

To set the environment variable:
Windows PowerShell: $env:LLAMA_API_KEY = "your-api-key-here"
Windows CMD: set LLAMA_API_KEY=your-api-key-here

Or create a .env file with: LLAMA_API_KEY=your-api-key-here
"""

import os
import asyncio
from llama_api_client import LlamaAPIClient, AsyncLlamaAPIClient


def basic_chat_example():
    """Basic synchronous chat completion example"""
    print("=== Basic Chat Example ===")
    
    # Initialize client (automatically uses LLAMA_API_KEY from environment)
    client = LlamaAPIClient()
    
    try:
        response = client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",  # Changed from Llama-3.3-70B-Instruct
            messages=[
                {
                    "role": "user",
                    "content": "Hello! Can you explain what you are and what you can help me with?"
                }
            ],
            max_completion_tokens=512,
            temperature=0.7,
        )
        
        print("Response:", response.completion_message.content)
        print("Model used:", response.model)
        print("Tokens used:", response.usage.total_tokens if hasattr(response, 'usage') else "N/A")
        
    except Exception as e:
        print(f"Error: {e}")


def streaming_chat_example():
    """Streaming chat example - responses come in real-time"""
    print("\n=== Streaming Chat Example ===")
    
    client = LlamaAPIClient()
    
    try:
        stream = client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "user",
                    "content": "Write a short poem about artificial intelligence and the future."
                }
            ],
            max_completion_tokens=256,
            temperature=0.8,
            stream=True,
        )
        
        print("Streaming response: ", end="")
        for chunk in stream:
            if hasattr(chunk.event, 'delta') and hasattr(chunk.event.delta, 'text'):
                print(chunk.event.delta.text, end="", flush=True)
        print()  # New line at the end
        
    except Exception as e:
        print(f"Error: {e}")


def conversation_example():
    """Multi-turn conversation example"""
    print("\n=== Conversation Example ===")
    
    client = LlamaAPIClient()
    
    messages = [
        {"role": "user", "content": "I'm learning Python. What's a good first project?"}
    ]
    
    try:
        # First response
        response1 = client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=messages,
            max_completion_tokens=256,
            temperature=0.7,
        )
        
        print("AI:", response1.completion_message.content)
        
        # Add AI response to conversation history
        messages.append(response1.completion_message.to_dict())
        messages.append({
            "role": "user", 
            "content": "That sounds great! Can you give me a simple example of that project?"
        })
        
        # Second response with conversation context
        response2 = client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=messages,
            max_completion_tokens=512,
            temperature=0.7,
        )
        
        print("\nAI:", response2.completion_message.content)
        
    except Exception as e:
        print(f"Error: {e}")


async def async_chat_example():
    """Asynchronous chat example"""
    print("\n=== Async Chat Example ===")
    
    client = AsyncLlamaAPIClient()
    
    try:
        response = await client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "user",
                    "content": "Explain the benefits of asynchronous programming in Python."
                }
            ],
            max_completion_tokens=256,
            temperature=0.7,
        )
        
        print("Async Response:", response.completion_message.content)
        
    except Exception as e:
        print(f"Error: {e}")


async def async_streaming_example():
    """Asynchronous streaming example"""
    print("\n=== Async Streaming Example ===")
    
    client = AsyncLlamaAPIClient()
    
    try:
        stream = await client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "user",
                    "content": "List 5 tips for writing clean, maintainable code."
                }
            ],
            max_completion_tokens=256,
            temperature=0.7,
            stream=True,
        )
        
        print("Async streaming response: ", end="")
        async for chunk in stream:
            if hasattr(chunk.event, 'delta') and hasattr(chunk.event.delta, 'text'):
                print(chunk.event.delta.text, end="", flush=True)
        print()  # New line at the end
        
    except Exception as e:
        print(f"Error: {e}")


def error_handling_example():
    """Example of proper error handling"""
    print("\n=== Error Handling Example ===")
    
    # Try with invalid model to demonstrate error handling
    client = LlamaAPIClient()
    
    try:
        response = client.chat.completions.create(
            model="invalid-model-name",
            messages=[{"role": "user", "content": "Hello"}],
        )
    except Exception as e:
        print(f"Expected error caught: {type(e).__name__}: {e}")


def check_api_key():
    """Check if API key is properly configured"""
    api_key = os.environ.get("LLAMA_API_KEY")
    if not api_key:
        print("❌ LLAMA_API_KEY environment variable is not set!")
        print("\nTo set it:")
        print("PowerShell: $env:LLAMA_API_KEY = 'your-api-key-here'")
        print("CMD: set LLAMA_API_KEY=your-api-key-here")
        print("Or create a .env file with: LLAMA_API_KEY=your-api-key-here")
        return False
    else:
        print("✅ LLAMA_API_KEY is configured")
        print(f"   API Key: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '****'}")
        return True


async def main():
    """Main function to run all examples"""
    print("Llama API Client - Complete Usage Examples")
    print("=" * 45)
    
    # Check API key first
    if not check_api_key():
        return
    
    # Test all available models with unique prompts
    test_all_models()

    # Run synchronous examples
    basic_chat_example()
    streaming_chat_example()
    conversation_example()
    error_handling_example()

    # Run asynchronous examples
    await async_chat_example()
    await async_streaming_example()

    print("\n=== All examples completed! ===")


if __name__ == "__main__":
    # Install required package first if not installed
    try:
        import llama_api_client
    except ImportError:
        print("Installing llama-api-client...")
        os.system("pip install llama-api-client")
        import llama_api_client
    
    # Run the examples
    asyncio.run(main())
