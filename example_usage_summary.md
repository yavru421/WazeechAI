# Llama API Client Example Usage - Outline and Summary

## Outline

1. **Introduction**
    - Purpose of the example script
    - Environment setup instructions
2. **API Key Configuration**
    - How to set the `LLAMA_API_KEY` environment variable
3. **Test All Models**
    - Function: `test_all_models()`
    - Tests multiple Llama models with unique prompts
4. **Synchronous Examples**
    - `basic_chat_example()`: Basic chat completion
    - `streaming_chat_example()`: Streaming responses in real-time
    - `conversation_example()`: Multi-turn conversation
    - `error_handling_example()`: Demonstrates error handling with invalid model
5. **Asynchronous Examples**
    - `async_chat_example()`: Async chat completion
    - `async_streaming_example()`: Async streaming responses
6. **Main Function**
    - Runs all examples in sequence
    - Installs `llama-api-client` if missing

## Example Output Summary

When you run `example_usage.py`, you will see output similar to the following:

### 1. API Key Check
If not set:
```
❌ LLAMA_API_KEY environment variable is not set!
To set it:
PowerShell: $env:LLAMA_API_KEY = 'your-api-key-here'
CMD: set LLAMA_API_KEY=your-api-key-here
Or create a .env file with: LLAMA_API_KEY=your-api-key-here
```
If set:
```
✅ LLAMA_API_KEY is configured
   API Key: [first 10 chars]...[last 4 chars]
```

### 2. Test All Llama Models
For each model:
```
=== Test All Llama Models ===

--- Model: Llama-4-Maverick-17B-128E-Instruct-FP8 ---
Prompt: Write a haiku about the future of AI.
Response: [AI-generated haiku]

--- Model: Llama-4-Scout-17B-16E-Instruct-FP8 ---
Prompt: Describe a futuristic city in three sentences.
Response: [AI-generated description]

--- Model: Llama-3.3-70B-Instruct ---
Prompt: Summarize the plot of 'The Matrix' in two sentences.
Response: [AI-generated summary]

--- Model: Llama-3.3-8B-Instruct ---
Prompt: List three creative uses for a paperclip.
Response: [AI-generated list]
```

### 3. Basic Chat Example
```
=== Basic Chat Example ===
Response: [AI explains itself]
Model used: Llama-4-Maverick-17B-128E-Instruct-FP8
Tokens used: [number or N/A]
```

### 4. Streaming Chat Example
```
=== Streaming Chat Example ===
Streaming response: [AI-generated poem, streamed word by word]
```

### 5. Conversation Example
```
=== Conversation Example ===
AI: [AI suggests a first Python project]

AI: [AI gives a simple example of that project]
```

### 6. Error Handling Example
```
=== Error Handling Example ===
Expected error caught: [ExceptionType]: [error message about invalid model]
```

### 7. Async Chat Example
```
=== Async Chat Example ===
Async Response: [AI explains async programming]
```

### 8. Async Streaming Example
```
=== Async Streaming Example ===
Async streaming response: [AI lists 5 tips, streamed]
```

### 9. Completion
```
=== All examples completed! ===
```

## Detailed Model Performance Analysis

**BEST PERFORMER: Llama-3.3-70B-Instruct**
- **Response Quality**: Most comprehensive and detailed
- **The Matrix Summary**: Gave a full, accurate 2-sentence plot summary with character names, technical details, and narrative arc
- **Length**: Longest, most complete responses
- **Complexity**: Handled complex narrative summarization excellently

**SECOND BEST: Llama-4-Scout-17B-16E-Instruct-FP8**
- **Response Quality**: Very detailed and vivid
- **Futuristic City**: Created an immersive 3-sentence description with specific details (New Eden, EcoDome, flying cars, holographic ads)
- **Creativity**: High level of imaginative detail
- **Writing Style**: Descriptive and engaging

**THIRD: Llama-3.3-8B-Instruct**
- **Response Quality**: Practical and helpful
- **Paperclip Uses**: Gave 3 genuinely useful ideas with explanations (zipper fix, plant marker, photo holder)
- **Format**: Well-structured with numbered list and detailed explanations
- **Practicality**: Most useful real-world advice

**WORST: Llama-4-Maverick-17B-128E-Instruct-FP8**
- **Response Quality**: Shortest and most basic
- **Haiku**: Basic 3-line haiku, but simple and generic
- **Creativity**: Lowest level of detail
- **Length**: Very brief response

## Response Quality Breakdown

**Most Creative**: Scout (vivid city description)
**Most Informative**: 70B (comprehensive Matrix summary)
**Most Practical**: 8B (useful paperclip tips)
**Most Basic**: Maverick (simple haiku)

**Length Ranking**: 70B > Scout > 8B > Maverick
**Detail Ranking**: 70B > Scout > 8B > Maverick
**Usefulness Ranking**: 8B > 70B > Scout > Maverick
