import json
import datetime

def add_sample_data():
    """Add sample entries for testing the JSON functionality"""
    
    sample_entries = [
        {
            "title": "First Python Reflection",
            "content": "This is my first reflection added via Python script. The JSON integration is working perfectly!"
        },
        {
            "title": "Learning Web Development", 
            "content": "Today I worked on integrating Python with JavaScript. The JSON file acts as a bridge between the two languages."
        },
        {
            "title": "PWA Progress",
            "content": "The Progressive Web App is coming along nicely. Adding file-based storage opens up new possibilities for data persistence."
        }
    ]
    
    try:
        with open('reflections.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    
    # Add sample entries with proper metadata
    for i, sample in enumerate(sample_entries):
        entry = {
            "id": int(datetime.datetime.now().timestamp()) + i,
            "title": sample["title"],
            "content": sample["content"], 
            "date": datetime.datetime.now().isoformat(),
            "dateString": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "wordCount": len(sample["content"].split()),
            "source": "sample"
        }
        data.append(entry)
    
    # Save to file
    with open('reflections.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    
    print(f"✅ Added {len(sample_entries)} sample entries to reflections.json!")
    print(f"📂 Total entries now: {len(data)}")

if __name__ == "__main__":
    add_sample_data()