import json
import datetime

def save_reflection():
    print("=== Learning Journal - Python JSON Entry ===")
    print("Type your reflection below:")
    
    title = input("Enter reflection title: ").strip()
    while not title:
        print("Title cannot be empty!")
        title = input("Enter reflection title: ").strip()
    
    content = input("Enter your reflection content: ").strip()
    while not content:
        print("Content cannot be empty!")
        content = input("Enter your reflection content: ").strip()
    
    entry = {
        "id": int(datetime.datetime.now().timestamp()),
        "title": title,
        "content": content,
        "date": datetime.datetime.now().isoformat(),
        "dateString": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "wordCount": len(content.split()),
        "source": "python"
    }
    
    try:
        with open('reflections.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    
    data.append(entry)
    
    with open('reflections.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Reflection saved successfully!")
    print(f"📝 Title: {title}")
    print(f"📊 Word Count: {entry['wordCount']}")
    return entry

if __name__ == "__main__":
    save_reflection()