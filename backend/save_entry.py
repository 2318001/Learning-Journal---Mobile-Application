import json
import datetime
import os

def main():
    print("🎯 Learning Journal - Python Entry System")
    print("=" * 40)
    
    # Get user input
    title = input("\n📝 Enter reflection title: ")
    content = input("📖 Enter your reflection: ")
    
    # Create entry
    entry = {
        "id": datetime.datetime.now().strftime("%Y%m%d%H%M%S"),
        "title": title,
        "content": content,
        "timestamp": datetime.datetime.now().isoformat(),
        "dateString": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "python-cli"
    }
    
    # Load existing entries
    try:
        with open('reflections.json', 'r', encoding='utf-8') as f:
            entries = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        entries = []
    
    # Add new entry
    entries.append(entry)
    
    # Save back to file
    with open('reflections.json', 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2)
    
    print(f"✅ Reflection saved! Total entries: {len(entries)}")
    
    # Show recent entries
    if input("\n👀 View recent entries? (y/n): ").lower() == 'y':
        print(f"\n--- Last 3 Entries ---")
        for e in entries[-3:]:
            print(f"📅 {e['dateString']}: {e['title']}")

if __name__ == "__main__":
    main()