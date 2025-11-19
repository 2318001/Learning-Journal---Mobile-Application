import json
import datetime
import os

def save_reflection():
    """
    Python script to save reflection entries to JSON file
    This demonstrates file-based storage beyond browser storage
    """
    
    print("=== Learning Journal - Python JSON Entry ===")
    print("Type your reflection below (press Enter when done):")
    
    # Get user input for reflection
    title = input("Enter reflection title: ").strip()
    
    # Validate title
    while not title:
        print("Title cannot be empty!")
        title = input("Enter reflection title: ").strip()
    
    content = input("Enter your reflection content: ").strip()
    
    # Validate content
    while not content:
        print("Content cannot be empty!")
        content = input("Enter your reflection content: ").strip()
    
    # Create entry with metadata
    entry = {
        "id": int(datetime.datetime.now().timestamp()),  # Unique ID based on timestamp
        "title": title,
        "content": content,
        "date": datetime.datetime.now().isoformat(),  # ISO format for easy parsing
        "dateString": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),  # Human readable
        "wordCount": len(content.split()),  # Word count for statistics
        "source": "python"  # Track that this came from Python script
    }
    
    # Read existing data from JSON file
    try:
        with open('reflections.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        # If file doesn't exist or is invalid, start with empty array
        data = []
        print("Creating new reflections.json file...")
    
    # Append new entry to the data
    data.append(entry)
    
    # Write updated data back to JSON file
    with open('reflections.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    
    # Success message
    print(f"\n✅ Reflection saved successfully!")
    print(f"📝 Title: {title}")
    print(f"📊 Word Count: {entry['wordCount']}")
    print(f"🆔 Entry ID: {entry['id']}")
    print(f"💾 Saved to: reflections.json")
    print(f"📂 Total entries: {len(data)}")
    
    return entry

# Run the function when script is executed directly
if __name__ == "__main__":
    save_reflection()