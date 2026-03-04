import sys
import json
import stable_whisper

def transcribe(audio_path):
    # Load model (using 'tiny' for speed on CPU VPS)
    model = stable_whisper.load_model('tiny')
    
    # Transcribe with word-level timestamps
    # language="pt" to ensure Portuguese detection
    result = model.transcribe(audio_path, language='pt')
    
    # Extract word data
    output = {
        "text": result.text,
        "words": []
    }
    
    for segment in result.segments:
        for word in segment.words:
            output["words"].append({
                "word": word.word.strip(),
                "start": word.start,
                "end": word.end,
                "probability": word.probability
            })
            
    return output

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe_with_words.py <audio_path>")
        sys.exit(1)
        
    try:
        data = transcribe(sys.argv[1])
        print(json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
