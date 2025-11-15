# Available Fireworks AI Vision Models

## ✅ Qwen2.5-VL Series (AVAILABLE on Serverless)

These are the **actual available models** on Fireworks AI for vision analysis:

### 1. qwen2p5-vl-3b-instruct (3B parameters) ⭐ PRIMARY
- **Model Path**: `accounts/fireworks/models/qwen2p5-vl-3b-instruct`
- **Serverless**: ✅ Available
- **Fine-tuning**: ✅ Available
- **Context Length**: 128K tokens
- **Pricing**: $0.2 per 1M tokens
- **Best for**: Fast, efficient analysis with good quality
- **Use case**: Real-time muscle analysis, quick responses

### 2. qwen2p5-vl-32b-instruct (32B parameters) 🎯 FALLBACK
- **Model Path**: `accounts/fireworks/models/qwen2p5-vl-32b-instruct`
- **Serverless**: ✅ Available
- **Fine-tuning**: ✅ Available  
- **Context Length**: 128K tokens
- **Pricing**: $0.9 per 1M tokens
- **Best for**: More accurate, detailed analysis
- **Use case**: Fallback when 3B model fails or needs higher accuracy

### 3. qwen2p5-vl-72b-instruct (72B parameters) 🔝 OPTIONAL
- **Model Path**: `accounts/fireworks/models/qwen2p5-vl-72b-instruct`
- **Serverless**: ✅ Available
- **Context Length**: 128K tokens
- **Pricing**: Higher cost
- **Best for**: Maximum accuracy (not currently used)

## ❌ Models That DON'T Exist

### qwen2p5-vl-7b-instruct ❌
- **Status**: Does NOT exist on Fireworks
- **Error**: 404 NOT_FOUND
- **Reason**: Qwen2.5-VL series only comes in 3B, 32B, and 72B sizes

### llama-v3p2-11b-vision-instruct ❌
- **Status**: Not available on Fireworks serverless
- **Correct name**: `llama-v3p2-11b-vision-instruct` may not be the right path
- **Alternative**: Use Llama 3.2 Vision models if available

## 🔧 Current Configuration

Our app now uses:
- **Primary**: `qwen2p5-vl-3b-instruct` (fast, efficient)
- **Fallback**: `qwen2p5-vl-32b-instruct` (accurate, robust)

## 📊 Performance Comparison

| Model | Speed | Accuracy | Cost | Best Use Case |
|-------|-------|----------|------|---------------|
| 3B | ⚡⚡⚡ | ⭐⭐⭐ | $ | Real-time analysis |
| 32B | ⚡⚡ | ⭐⭐⭐⭐⭐ | $$$ | Detailed/complex cases |
| 72B | ⚡ | ⭐⭐⭐⭐⭐ | $$$$ | Maximum accuracy |

## 🔗 References

- [Fireworks Model Library](https://fireworks.ai/models)
- [Qwen2.5-VL 3B](https://fireworks.ai/models/fireworks/qwen2p5-vl-3b-instruct)
- [Qwen2.5-VL 32B](https://fireworks.ai/models/fireworks/qwen2p5-vl-32b-instruct)
- [Qwen2.5-VL 72B](https://fireworks.ai/models/fireworks/qwen2p5-vl-72b-instruct)
- [Fireworks Docs - Vision Models](https://docs.fireworks.ai/guides/querying-vision-language-models)
